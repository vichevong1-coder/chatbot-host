"""
File: orchestrator/app/services/nlu/schema.py
Description: Pydantic schemas and Enums for the Natural Language Understanding (NLU) pipeline.
             Defines the golden data contract between NLU and the Socratic guidance engine.
"""

from __future__ import annotations
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class StudentIntent(str, Enum):
    """
    Classified intention of the student's message.
    """
    INITIAL_QUESTION = "INITIAL_QUESTION"           # Student asks a new homework problem
    STEP_ANSWER_ATTEMPT = "STEP_ANSWER_ATTEMPT"     # Student answers active step's "Your Turn" question
    REQUEST_HINT = "REQUEST_HINT"                   # Student asks for a clue / says "I'm stuck"
    REQUEST_CLARIFICATION = "REQUEST_CLARIFICATION" # Student asks what a concept or term means
    OFF_TOPIC = "OFF_TOPIC"                         # Non-academic question (games, movies, chat)
    CHITCHAT = "CHITCHAT"                           # Greetings, thanks, polite banter


class SubjectArea(str, Enum):
    """
    Broad academic domain.
    """
    MATH = "math"
    SCIENCE = "science"
    GENERAL = "general"


class GradeTier(str, Enum):
    """
    Target elementary education tier.
    """
    GRADE_1_3 = "grade_1_3"  # Early elementary (visual analogies, simple vocab)
    GRADE_4_6 = "grade_4_6"  # Upper elementary (more formal rules & step breakdown)


class NLUResult(BaseModel):
    """
    Standardized result contract emitted by the NLU pipeline.
    Consumed by Socratic State Machine and Guardrails.
    """
    raw_query: str = Field(..., description="Original raw string entered by student")
    cleaned_text: str = Field(..., description="Normalized string with typos and math symbols corrected")
    intent: StudentIntent = Field(..., description="Classified intent of the student")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Model confidence score (0.0 to 1.0)")

    # Domain & Educational Metadata
    subject: SubjectArea = Field(default=SubjectArea.GENERAL, description="Detected academic domain")
    subtopic: str = Field(default="general", description="Granular subtopic (e.g., arithmetic, photosynthesis)")
    grade_level: GradeTier = Field(default=GradeTier.GRADE_4_6, description="Elementary school grade tier")

    # Extracted Values & Context
    extracted_answer: Optional[str] = Field(
        default=None,
        description="Core extracted answer value if intent is STEP_ANSWER_ATTEMPT (e.g. '5', 'leaves')"
    )


    # Ambiguity & Clarification
    is_ambiguous: bool = Field(
        default=False,
        description="True if input is gibberish or cannot be confidently parsed"
    )
    clarification_prompt: Optional[str] = Field(
        default=None,
        description="Kid-friendly clarification question to ask the student when is_ambiguous is True"
    )

    @classmethod
    def create_fallback(cls, raw_query: str, cleaned_text: Optional[str] = None) -> "NLUResult":
        """
        Creates a safe, non-crashing fallback NLU result when an error occurs during processing.
        """
        text = cleaned_text or raw_query.strip()
        return cls(
            raw_query=raw_query,
            cleaned_text=text,
            intent=StudentIntent.INITIAL_QUESTION if len(text) > 3 else StudentIntent.CHITCHAT,
            confidence=0.5,
            subject=SubjectArea.GENERAL,
            subtopic="general",
            grade_level=GradeTier.GRADE_4_6,
            is_ambiguous=len(text) <= 3
        )
