"""Convenience alias for run.py."""
import sys
from run import *

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=True,
        reload_dirs=["app"],
        log_level="debug" if settings.debug else "info",
    )
