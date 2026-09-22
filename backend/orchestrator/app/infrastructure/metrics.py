"""
Observability Metrics for Orchestrator
Tracks query counts, duration, and microservice error statistics.
"""

import logging
from collections import defaultdict
from typing import Any, Dict

logger = logging.getLogger("orchestrator.metrics")

# In-memory metrics aggregator
_metrics_store = {
    "query_count": defaultdict(int),
    "service_errors": defaultdict(int),
    "circuit_trips": defaultdict(int),
    "total_queries": 0,
}


def record_query(subject: str, status: str, duration_sec: float):
    _metrics_store["total_queries"] += 1
    _metrics_store["query_count"][f"{subject}:{status}"] += 1


def record_service_error(service_name: str, error_type: str):
    _metrics_store["service_errors"][f"{service_name}:{error_type}"] += 1


def record_circuit_trip(service_name: str):
    _metrics_store["circuit_trips"][service_name] += 1


def get_metrics_snapshot() -> Dict[str, Any]:
    return {
        "total_queries": _metrics_store["total_queries"],
        "query_count": dict(_metrics_store["query_count"]),
        "service_errors": dict(_metrics_store["service_errors"]),
        "circuit_trips": dict(_metrics_store["circuit_trips"]),
    }
