from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    ORCHESTRATOR_PORT: int = 9000
    MATH_SERVICE_PORT: int = 9001
    SCIENCE_SERVICE_PORT: int = 9002
    
    MATH_SERVICE_URL: str = "http://math-service:9001"
    SCIENCE_SERVICE_URL: str = "http://science-service:9002"
    
    REDIS_URL: str = "redis://redis:6379/0"
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/science_chatbot"


    # Microservice monitoring & circuit breaker configuration 
    HEALTH_CHECK_INTERVAL_SEC: int = 60
    HEALTH_CHECK_TIMEOUT_SEC: int = 5
    CIRCUIT_FAILURE_THRESHOLD: int = 3
    CIRCUIT_RECOVERY_TIMEOUT_SEC: float = 30.0
    DEGRADED_LATENCY_THRESHOLD_MS: float = 1000.0
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
