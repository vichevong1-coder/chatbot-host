"""
Package: orchestrator/app/services/nlu
Description: Natural Language Understanding (NLU) Pipeline for elementary student queries.
"""

from app.services.nlu.schema import (
    StudentIntent,
    SubjectArea,
    GradeTier,
    NLUResult,
)
from app.services.nlu.normalizer import (
    normalize_text,
    normalize_text_sync,
    detect_language,
    verify_invariants,
)

__all__ = [
    "StudentIntent",
    "SubjectArea",
    "GradeTier",
    "NLUResult",
    "normalize_text",
    "normalize_text_sync",
    "detect_language",
    "verify_invariants",
]
