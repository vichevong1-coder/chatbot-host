"""
Master NLU Pipeline Runner for Elementary STEM Socratic Chatbot.
Orchestrates:
1. Normalizer (typo fixing, OCR cleaning, math standardization)
2. Ambiguity & Gibberish Handler (detecting smashes, spam, empty fillers, and generating kid-friendly re-prompts)
3. Intent Classifier & Step Disambiguation (identifying student intention & extracting core answers)
4. Subject & Subtopic Router (math vs science and granular domain topics)
5. Golden Schema Assembly (validating and returning NLUResult)
"""

from typing import Optional, Dict, Any, Union, List
from app.services.nlu.schema import (
    NLUResult,
    StudentIntent,
    SubjectArea,
    GradeTier,
)
from app.services.nlu.normalizer import normalize_text_sync
from app.services.nlu.clarify import detect_ambiguity, get_kid_friendly_reprompt, AmbiguityType
from app.services.nlu.intent import (
    IntentType,
    classify_intent,
    classify_intent_sync,
)
from app.services.nlu.router import (
    route_subject_and_grade,
    route_subject_and_grade_sync,
)

# Mapping from internal IntentType to Golden Schema StudentIntent
_INTENT_MAP: Dict[IntentType, StudentIntent] = {
    IntentType.INITIAL_SOLVE: StudentIntent.INITIAL_QUESTION,
    IntentType.STEP_ATTEMPT: StudentIntent.STEP_ANSWER_ATTEMPT,
    IntentType.CLARIFY: StudentIntent.REQUEST_CLARIFICATION,
    IntentType.REQUEST_PRACTICE: StudentIntent.INITIAL_QUESTION,
    IntentType.CHITCHAT: StudentIntent.CHITCHAT,
    IntentType.OFF_TOPIC: StudentIntent.OFF_TOPIC,
}


def _map_intent(intent_type: IntentType) -> StudentIntent:
    """Safely maps internal intent enum to golden StudentIntent enum."""
    return _INTENT_MAP.get(intent_type, StudentIntent.INITIAL_QUESTION)


def _resolve_grade_tier(grade: Optional[Union[GradeTier, str]]) -> GradeTier:
    """Safely resolves grade tier to GradeTier enum (defaulting to GRADE_4_6)."""
    if isinstance(grade, GradeTier):
        return grade
    if isinstance(grade, str) and "1_3" in grade:
        return GradeTier.GRADE_1_3
    return GradeTier.GRADE_4_6


async def process_nlu(
    raw_query: str,
    current_context: Optional[Dict[str, Any]] = None,
    session_grade_level: Optional[Union[GradeTier, str]] = None,
    history: Optional[Union[str, List[Dict[str, Any]]]] = None,
    rolling_summary: Optional[str] = None,
) -> NLUResult:
    """
    Master Async NLU Pipeline entrypoint.
    Transforms raw student input into the standardized NLUResult object.
    """
    if not raw_query or not str(raw_query).strip():
        grade_tier = _resolve_grade_tier(session_grade_level)
        fallback = NLUResult.create_fallback(raw_query or "", cleaned_text="")
        fallback.grade_level = grade_tier
        fallback.clarification_prompt = get_kid_friendly_reprompt(
            AmbiguityType.EMPTY_INPUT, current_context, str(grade_tier)
        )
        return fallback

    try:
        grade_tier = _resolve_grade_tier(session_grade_level)

        # Step 1: Check raw query for smashes or repeated characters
        ambiguity_res = detect_ambiguity(
            text=raw_query,
            current_step=current_context,
            grade_level=str(grade_tier),
        )

        # Step 2: Deterministic fast normalizer (typos, kid slang, fractions, math symbols)
        cleaned = normalize_text_sync(raw_query)

        # Step 3: Check cleaned query if raw didn't trip ambiguity
        if not ambiguity_res.is_ambiguous:
            ambiguity_res = detect_ambiguity(
                text=cleaned,
                current_step=current_context,
                grade_level=str(grade_tier),
            )

        if ambiguity_res.is_ambiguous:
            return NLUResult(
                raw_query=raw_query,
                cleaned_text=cleaned,
                intent=StudentIntent.REQUEST_CLARIFICATION,
                confidence=0.0,
                subject=SubjectArea.GENERAL,
                subtopic="general",
                grade_level=grade_tier,
                extracted_answer=None,
                is_ambiguous=True,
                clarification_prompt=ambiguity_res.clarification_prompt,
            )

        # Step 4: Intent classification & answer extraction (with active step disambiguation)
        intent_res = await classify_intent(
            query=cleaned,
            history=history,
            rolling_summary=rolling_summary,
            current_step=current_context,
        )

        # Step 5: Subject & Subtopic routing
        route_res = await route_subject_and_grade(query=cleaned)

        # Step 6: Construct and return the Golden Schema
        return NLUResult(
            raw_query=raw_query,
            cleaned_text=cleaned,
            intent=_map_intent(intent_res.intent),
            confidence=intent_res.confidence,
            subject=route_res.subject,
            subtopic=route_res.subtopic,
            grade_level=grade_tier,
            extracted_answer=intent_res.extracted_answer,
            is_ambiguous=False,
            clarification_prompt=None,
        )

    except Exception:
        # Fail-safe fallback protection to ensure the tutor loop never crashes
        return NLUResult.create_fallback(raw_query=raw_query)


def process_nlu_sync(
    raw_query: str,
    current_context: Optional[Dict[str, Any]] = None,
    session_grade_level: Optional[Union[GradeTier, str]] = None,
    history: Optional[Union[str, List[Dict[str, Any]]]] = None,
    rolling_summary: Optional[str] = None,
) -> NLUResult:
    """
    Fast-path deterministic synchronous runner (<2ms).
    Used for offline evaluation, zero-latency caching, and unit tests.
    """
    if not raw_query or not str(raw_query).strip():
        grade_tier = _resolve_grade_tier(session_grade_level)
        fallback = NLUResult.create_fallback(raw_query or "", cleaned_text="")
        fallback.grade_level = grade_tier
        fallback.clarification_prompt = get_kid_friendly_reprompt(
            AmbiguityType.EMPTY_INPUT, current_context, str(grade_tier)
        )
        return fallback

    try:
        grade_tier = _resolve_grade_tier(session_grade_level)

        # Step 1: Check raw query
        ambiguity_res = detect_ambiguity(
            text=raw_query,
            current_step=current_context,
            grade_level=str(grade_tier),
        )

        # Step 2: Normalizer
        cleaned = normalize_text_sync(raw_query)

        # Step 3: Check cleaned query
        if not ambiguity_res.is_ambiguous:
            ambiguity_res = detect_ambiguity(
                text=cleaned,
                current_step=current_context,
                grade_level=str(grade_tier),
            )

        if ambiguity_res.is_ambiguous:
            return NLUResult(
                raw_query=raw_query,
                cleaned_text=cleaned,
                intent=StudentIntent.REQUEST_CLARIFICATION,
                confidence=0.0,
                subject=SubjectArea.GENERAL,
                subtopic="general",
                grade_level=grade_tier,
                extracted_answer=None,
                is_ambiguous=True,
                clarification_prompt=ambiguity_res.clarification_prompt,
            )

        # Step 4: Intent & Answer Extraction (Heuristic fast-path)
        intent_res = classify_intent_sync(
            query=cleaned,
            history=history,
            rolling_summary=rolling_summary,
            current_step=current_context,
        )

        # Step 5: Subject & Subtopic Routing (Heuristic fast-path)
        route_res = route_subject_and_grade_sync(query=cleaned)

        # Step 6: Assemble Golden Schema
        return NLUResult(
            raw_query=raw_query,
            cleaned_text=cleaned,
            intent=_map_intent(intent_res.intent),
            confidence=intent_res.confidence,
            subject=route_res.subject,
            subtopic=route_res.subtopic,
            grade_level=grade_tier,
            extracted_answer=intent_res.extracted_answer,
            is_ambiguous=False,
            clarification_prompt=None,
        )

    except Exception:
        return NLUResult.create_fallback(raw_query=raw_query)
