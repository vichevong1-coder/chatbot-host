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
from app.services.nlu.intent import (
    IntentType,
    IntentResult,
    classify_intent,
    classify_intent_sync,
    classify_intent_heuristic,
    format_chat_history,
    extract_core_answer,
    disambiguate_step_input,
    is_step_active,
)
from app.services.nlu.router import (
    RoutingResult,
    route_subject,
    route_subject_sync,
    route_subject_heuristic,
    route_subject_and_grade,
    route_subject_and_grade_sync,
    route_subject_and_grade_heuristic,
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
    "IntentType",
    "IntentResult",
    "classify_intent",
    "classify_intent_sync",
    "classify_intent_heuristic",
    "format_chat_history",
    "extract_core_answer",
    "disambiguate_step_input",
    "is_step_active",
    "RoutingResult",
    "route_subject",
    "route_subject_sync",
    "route_subject_heuristic",
    "route_subject_and_grade",
    "route_subject_and_grade_sync",
    "route_subject_and_grade_heuristic",
]
