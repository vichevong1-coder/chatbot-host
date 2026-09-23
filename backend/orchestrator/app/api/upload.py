from pathlib import Path
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from app.core.logging import logger
from app.services.ocr.extractor import ocr_extractor

upload_router = APIRouter(prefix="/upload", tags=["Upload & OCR"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}
MAX_FILE_SIZE_MB = 25


@upload_router.post(
    "/ocr",
    summary="Upload worksheet image/PDF for OCR & Vision extraction",
    description="Extracts clean question text and structured homework data from photos or PDFs.",
)
async def upload_and_ocr(
    file: UploadFile = File(..., description="Worksheet photo or PDF"),
    force_mock: bool = Query(False, description="Force zero-model simulated extraction"),
):
    filename = file.filename or "worksheet.png"
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Allowed types: {sorted(ALLOWED_EXTENSIONS)}",
        )

    file_bytes = await file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_MB}MB.",
        )

    logger.info(f"[OCR Upload] Received '{filename}' ({size_mb:.2f} MB)")

    result = await ocr_extractor.extract_from_bytes(
        file_bytes=file_bytes,
        filename=filename,
        force_mock=force_mock,
    )

    return result


@upload_router.get(
    "/mock",
    summary="Get hardcoded multi-exercise worksheet mock directly",
    description="Returns the deterministic multi-exercise worksheet (Q5, Q6, Q7) for frontend testing and offline development.",
)
async def get_mock_worksheet():
    return ocr_extractor._generate_mock_extraction("practice_worksheet.png")


class SelectExerciseRequest(BaseModel):
    session_id: Optional[str] = None
    exercise_id: str = Field(..., description="Selected exercise ID (e.g. ex_1, Q5)")
    prompt: str = Field(..., description="Prompt of the selected exercise")
    grade_level: str = Field(default="grade_1_3", description="Student grade level: grade_1_3 or grade_4_6")
    language: str = Field(default="en", description="Preferred tutor language: en or khmer")


@upload_router.post(
    "/select",
    summary="Select a specific exercise from an extracted worksheet",
    description="Hands off the chosen exercise to the Socratic tutoring workflow and initializes the problem stepper.",
)
async def select_exercise(
    request: SelectExerciseRequest,
):
    from app.api.endpoints import handle_query, QueryRequest
    from fastapi import BackgroundTasks

    query_req = QueryRequest(
        query=request.prompt,
        session_id=request.session_id,
        grade_level=request.grade_level,
        language=request.language,
    )
    bg = BackgroundTasks()
    response = await handle_query(query_req, bg)
    return {
        "status": "success",
        "selected_exercise_id": request.exercise_id,
        "query_response": response,
    }
