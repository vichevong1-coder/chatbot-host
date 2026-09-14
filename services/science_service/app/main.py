"""
File: services/science_service/app/main.py
Description: Unified Science Service API. Combines Physics, Chemistry, and Biology
             solvers into a single microservice with /solve, /validate, and /health endpoints.
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

from app.solvers.physics import solve_physics
from app.solvers.chemistry import solve_chemistry
from app.solvers.biology import solve_biology

app = FastAPI(
    title="Science Chatbot - Unified Science Service",
    description="Unified solver service for elementary & middle school physics, chemistry, and biology."
)

class SolveRequest(BaseModel):
    query: str = Field(..., description="The science query to solve")
    subject: Optional[str] = Field(None, description="Optional subject override: PHYSICS, CHEMISTRY, or BIOLOGY")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Grade level and additional context")

class SolveResponse(BaseModel):
    solution: Optional[str] = None
    steps: List[str] = Field(default_factory=list)
    success: bool
    error: Optional[str] = None

class ValidateRequest(BaseModel):
    student_attempt: str = Field(..., description="The student's submitted step")
    expected_step: str = Field(..., description="The target step answer or expression")
    subject: Optional[str] = Field(None, description="Subject domain for validation")

class ValidateResponse(BaseModel):
    equivalent: bool
    feedback: Optional[str] = None

@app.post("/solve", response_model=SolveResponse)
def solve(request: SolveRequest):
    query = request.query.strip()
    subject = (request.subject or "").upper()
    context = request.context or {}

    # If subject explicitly specified, route directly
    if subject == "PHYSICS":
        result = solve_physics(query, context)
        return SolveResponse(**result)
    elif subject == "CHEMISTRY":
        result = solve_chemistry(query, context)
        return SolveResponse(**result)
    elif subject == "BIOLOGY":
        result = solve_biology(query, context)
        return SolveResponse(**result)

    # Automatic topic detection based on keywords
    query_lower = query.lower()
    
    # Chemistry signals (balancing, molar mass, or chemical formulas)
    if (any(w in query_lower for w in ["->", "=", "molar mass", "reaction", "element", "molecule", "atom", "periodic", "acid", "base", "weight of", "formula"])
        or any(char.isupper() for char in query)):
        result = solve_chemistry(query, context)
        if result.get("success"):
            return SolveResponse(**result)

    # Biology signals
    if any(w in query_lower for w in ["dna", "rna", "plant", "animal", "cell", "mitosis", "organism", "photosynthesis", "codon"]):
        result = solve_biology(query, context)
        if result.get("success"):
            return SolveResponse(**result)

    # Physics signals
    if any(w in query_lower for w in ["force", "gravity", "speed", "velocity", "acceleration", "friction", "motion", "mass", "circuit"]):
        result = solve_physics(query, context)
        if result.get("success"):
            return SolveResponse(**result)

    # Default fallback: Physics AI (general science reasoning)
    result = solve_physics(query, context)
    return SolveResponse(**result)

@app.post("/validate", response_model=ValidateResponse)
def validate(request: ValidateRequest):
    attempt = request.student_attempt.strip().lower()
    expected = request.expected_step.strip().lower()

    # Elementary text comparison
    clean_attempt = "".join(attempt.split())
    clean_expected = "".join(expected.split())
    is_equivalent = (clean_attempt == clean_expected) or (clean_expected in clean_attempt)

    return ValidateResponse(equivalent=is_equivalent)

@app.get("/health")
def health():
    return {"status": "healthy", "service": "science_service"}
