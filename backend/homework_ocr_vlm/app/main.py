"""
FastAPI application entry point.

Run with:
    python -m uvicorn app.main:app --reload --port 9003

Or using the helper script:
    python run.py
"""
from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config import settings

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan: startup / shutdown hooks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== Homework OCR/VLM Service starting up ===")
    logger.info("VLM provider : %s / %s", settings.vlm_provider, settings.vlm_model)
    logger.info("Layout lang  : %s", settings.layout_lang)
    logger.info("Khmer OCR    : %s", settings.enable_khmer)
    yield
    logger.info("=== Service shutting down ===")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Homework OCR + VLM API",
    description=(
        "Multimodal homework processing pipeline. "
        "Accepts photos or PDFs of student worksheets and returns "
        "a structured JSON representation preserving questions, figures, "
        "answer areas, and layout."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow all origins for development (tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(router)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "detail": str(exc)},
    )
