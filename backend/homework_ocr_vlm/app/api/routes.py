"""
FastAPI route handlers.

POST /process-homework   — accepts image or PDF, returns HomeworkResponse JSON
GET  /health             — service health check
"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, Query
from fastapi.responses import JSONResponse

from app.schemas.homework import HomeworkResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# Lazily initialised processor (avoid loading models at import time)
_processor = None


def _get_processor():
    global _processor
    if _processor is None:
        from app.pipeline.processor import HomeworkProcessor
        logger.info("Initialising HomeworkProcessor …")
        _processor = HomeworkProcessor()
    return _processor


ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp", ".pdf"}
MAX_FILE_SIZE_MB = 50


@router.get("/health", tags=["system"])
async def health():
    """Quick service health check."""
    return {
        "status": "ok",
        "service": "homework-ocr-vlm",
        "version": "1.0.0",
    }


@router.post(
    "/process-homework",
    response_model=HomeworkResponse,
    tags=["processing"],
    summary="Process a homework image or PDF",
    description=(
        "Upload a photo or PDF of a student's homework worksheet. "
        "Returns a structured JSON representation preserving questions, "
        "answer areas, figures, and layout."
    ),
)
async def process_homework(
    file: UploadFile = File(..., description="JPEG/PNG/PDF homework image"),
    debug_crops: bool = Query(False, description="Save cropped regions to sample_outputs/"),
):
    """
    Main processing endpoint.

    Accepts multipart/form-data with a single file upload.
    """
    filename = file.filename or "upload"
    suffix = Path(filename).suffix.lower()

    # Validate file type
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed: {sorted(ALLOWED_SUFFIXES)}",
        )

    # Read bytes
    file_bytes = await file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Maximum is {MAX_FILE_SIZE_MB} MB.",
        )

    logger.info("Received '%s' (%.1f MB)", filename, size_mb)

    try:
        processor = _get_processor()
        result = processor.process(
            file_bytes=file_bytes,
            filename=filename,
            save_debug_crops=debug_crops,
        )
    except Exception as exc:
        logger.exception("Pipeline error for '%s': %s", filename, exc)
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}")

    return result
