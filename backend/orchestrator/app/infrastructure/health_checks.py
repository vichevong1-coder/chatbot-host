"""
Health Check Infrastructure
Manages microservice health monitoring, system readiness, and external dependency verification.
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("orchestrator.health_checks")


class ServiceHealthStatus(Enum):
    """Service health status enum."""
    UP = "up"
    DOWN = "down"
    DEGRADED = "degraded"
    UNKNOWN = "unknown"


class SystemReadiness(Enum):
    """System readiness status enum."""
    READY = "ready"
    NOT_READY = "not_ready"
    DEGRADED = "degraded"


@dataclass
class ServiceHealth:
    """Service health state information."""
    name: str
    status: ServiceHealthStatus
    response_time_ms: Optional[float] = None
    circuit_state: Optional[str] = None
    error_message: Optional[str] = None
    last_check_time: Optional[datetime] = None
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "status": self.status.value,
            "response_time_ms": round(self.response_time_ms, 2) if self.response_time_ms is not None else None,
            "circuit_state": self.circuit_state,
            "error": self.error_message,
            "last_check": self.last_check_time.isoformat() if self.last_check_time else None,
            "consecutive_failures": self.consecutive_failures,
            "consecutive_successes": self.consecutive_successes,
            "metadata": self.metadata,
        }


@dataclass
class SystemHealth:
    """Overall system health aggregate."""
    timestamp: datetime
    overall_status: ServiceHealthStatus
    readiness: SystemReadiness
    services: Dict[str, ServiceHealth]
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp.isoformat(),
            "status": self.overall_status.value,
            "readiness": self.readiness.value,
            "services": {name: health.to_dict() for name, health in self.services.items()},
            "metadata": self.metadata,
        }


class HealthCheckService:
    """
    Service health monitoring coordinator.
    Checks microservice clients, collects latencies, and computes system readiness.
    """

    def __init__(
        self,
        check_timeout_sec: int = 5,
        failure_threshold: int = 3,
        degraded_response_time_ms: float = 1000.0,
    ):
        self.check_timeout_sec = check_timeout_sec
        self.failure_threshold = failure_threshold
        self.degraded_response_time_ms = degraded_response_time_ms

        self.service_healths: Dict[str, ServiceHealth] = {}
        self.last_system_health: Optional[SystemHealth] = None
        self.last_check_time: Optional[datetime] = None
        self.check_count: int = 0
        self.error_history: List[Dict[str, Any]] = []
        self.max_error_history: int = 100

    async def check_service_health(self, service_name: str, client: Any) -> ServiceHealth:
        """Probe an individual microservice client's health."""
        previous = self.service_healths.get(service_name)
        health = ServiceHealth(
            name=service_name,
            status=ServiceHealthStatus.UNKNOWN,
            last_check_time=datetime.now(),
        )

        start_time = time.time()
        try:
            # Probe client's health() method
            if hasattr(client, "health"):
                response = await asyncio.wait_for(
                    client.health(),
                    timeout=self.check_timeout_sec,
                )
                elapsed_ms = (time.time() - start_time) * 1000
                health.response_time_ms = elapsed_ms

                if elapsed_ms > self.degraded_response_time_ms:
                    health.status = ServiceHealthStatus.DEGRADED
                else:
                    health.status = ServiceHealthStatus.UP

                health.metadata = response if isinstance(response, dict) else {}
            else:
                health.status = ServiceHealthStatus.UP

            if hasattr(client, "get_circuit_breaker_status"):
                cb_info = client.get_circuit_breaker_status()
                health.circuit_state = cb_info.get("state", "unknown")
                health.metadata["circuit_breaker"] = cb_info

            health.consecutive_successes = (previous.consecutive_successes + 1) if previous else 1
            health.consecutive_failures = 0

        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            health.response_time_ms = elapsed_ms
            health.status = ServiceHealthStatus.DOWN
            health.error_message = str(e)

            if hasattr(client, "get_circuit_breaker_status"):
                cb_info = client.get_circuit_breaker_status()
                health.circuit_state = cb_info.get("state", "unknown")
                health.metadata["circuit_breaker"] = cb_info

            health.consecutive_failures = (previous.consecutive_failures + 1) if previous else 1
            health.consecutive_successes = 0
            self._record_error(service_name, str(e))

        self.service_healths[service_name] = health
        return health

    def _record_error(self, service_name: str, error_message: str):
        """Append to the sliding error history."""
        self.error_history.append({
            "timestamp": datetime.now().isoformat(),
            "service": service_name,
            "error": error_message,
        })
        if len(self.error_history) > self.max_error_history:
            self.error_history = self.error_history[-self.max_error_history:]

    async def check_all_services(self, service_clients: Dict[str, Any]) -> SystemHealth:
        """Concurrently check all registered service clients."""
        self.check_count += 1
        self.last_check_time = datetime.now()

        check_tasks = [
            self.check_service_health(name, client)
            for name, client in service_clients.items()
        ]
        results = await asyncio.gather(*check_tasks, return_exceptions=False)

        system_health = SystemHealth(
            timestamp=datetime.now(),
            overall_status=self._compute_overall_status(),
            readiness=self._compute_readiness(),
            services={h.name: h for h in results},
            metadata={
                "check_count": self.check_count,
                "services_checked": len(service_clients),
                "healthy_services": sum(1 for h in results if h.status == ServiceHealthStatus.UP),
                "degraded_services": sum(1 for h in results if h.status == ServiceHealthStatus.DEGRADED),
                "down_services": sum(1 for h in results if h.status == ServiceHealthStatus.DOWN),
                "recent_errors": len(self.error_history),
            },
        )
        self.last_system_health = system_health
        return system_health

    def _compute_overall_status(self) -> ServiceHealthStatus:
        if not self.service_healths:
            return ServiceHealthStatus.UNKNOWN
        if any(h.status == ServiceHealthStatus.DOWN for h in self.service_healths.values()):
            return ServiceHealthStatus.DOWN
        if any(h.status == ServiceHealthStatus.DEGRADED for h in self.service_healths.values()):
            return ServiceHealthStatus.DEGRADED
        if all(h.status == ServiceHealthStatus.UP for h in self.service_healths.values()):
            return ServiceHealthStatus.UP
        return ServiceHealthStatus.DEGRADED

    def _compute_readiness(self) -> SystemReadiness:
        if not self.service_healths:
            return SystemReadiness.NOT_READY
        if any(h.status == ServiceHealthStatus.DOWN for h in self.service_healths.values()):
            return SystemReadiness.NOT_READY
        if any(h.status == ServiceHealthStatus.DEGRADED for h in self.service_healths.values()):
            return SystemReadiness.DEGRADED
        return SystemReadiness.READY

    def get_last_health(self) -> Optional[SystemHealth]:
        return self.last_system_health

    def get_service_health(self, service_name: str) -> Optional[ServiceHealth]:
        return self.service_healths.get(service_name)

    def get_all_services_health(self) -> Dict[str, ServiceHealth]:
        return self.service_healths.copy()

    def get_error_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.error_history[-limit:]


# Global health check instance
_health_check_service: Optional[HealthCheckService] = None


def get_health_check_service() -> HealthCheckService:
    global _health_check_service
    if _health_check_service is None:
        _health_check_service = HealthCheckService()
    return _health_check_service


def initialize_health_check_service(
    check_timeout_sec: int = 5,
    failure_threshold: int = 3,
    degraded_response_time_ms: float = 1000.0,
) -> HealthCheckService:
    global _health_check_service
    _health_check_service = HealthCheckService(
        check_timeout_sec=check_timeout_sec,
        failure_threshold=failure_threshold,
        degraded_response_time_ms=degraded_response_time_ms,
    )
    return _health_check_service


# External Dependency Helpers
def check_redis_health(redis_client: Any) -> str:
    if redis_client is None:
        return "down"
    try:
        redis_client.ping()
        return "up"
    except Exception as e:
        logger.warning(f"Redis health check failed: {e}")
        return "down"


async def check_qdrant_health(qdrant_host: str, qdrant_port: int) -> str:
    url = f"http://{qdrant_host}:{qdrant_port}/readyz"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(url)
            return "up" if resp.status_code == 200 else "degraded"
    except Exception as e:
        logger.warning(f"Qdrant health check failed: {e}")
        return "down"


async def check_postgres_health(db_url: str) -> str:
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy import text
        temp_engine = create_async_engine(db_url, connect_args={"timeout": 3})
        async with temp_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        await temp_engine.dispose()
        return "up"
    except Exception as e:
        logger.warning(f"PostgreSQL health check failed: {e}")
        return "down"
