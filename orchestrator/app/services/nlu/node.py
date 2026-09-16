"""
Day 14: LangGraph Node Integration Wrapper (node.py)
Entrypoint node for LangGraph Socratic Graph execution.
Transforms incoming graph state, runs the 4-stage NLU pipeline,
and outputs standard state updates for downstream Socratic tutoring nodes.
"""

from typing import Dict, Any, Optional, Union, List
from app.core.logging import logger
from app.services.nlu.schema import NLUResult, StudentIntent, SubjectArea, GradeTier
from app.services.nlu.pipeline import process_nlu, process_nlu_sync


def _extract_query(state: Dict[str, Any]) -> str:
    """Extract student input query from various possible state keys."""
    if not isinstance(state, dict):
        return ""
    # Check in priority order: user_input -> student_attempt -> query -> message
    return (
        state.get("user_input")
        or state.get("student_attempt")
        or state.get("query")
        or state.get("message")
        or ""
    ).strip()


def _extract_current_step(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Extract or reconstruct active step context from state."""
    if not isinstance(state, dict):
        return None

    # 1. Explicit current_step dict
    if "current_step" in state and isinstance(state["current_step"], dict):
        return state["current_step"]

    # 2. Reconstruct from solved_steps and current_step_index if present
    solved_steps = state.get("solved_steps")
    step_idx = state.get("current_step_index")
    if isinstance(solved_steps, list) and isinstance(step_idx, int):
        if 0 <= step_idx < len(solved_steps):
            step_data = solved_steps[step_idx]
            if isinstance(step_data, dict):
                return {
                    "step_number": step_data.get("step_num", step_idx + 1),
                    "total_steps": len(solved_steps),
                    "question": step_data.get("question") or step_data.get("hint") or "",
                    "expected_answer": str(step_data.get("expression") or step_data.get("answer") or ""),
                    "active": True,
                }
    return None


def _build_state_update(nlu_result: NLUResult) -> Dict[str, Any]:
    """Builds standard LangGraph state update dictionary from NLUResult."""
    intent_val = (
        nlu_result.intent.value
        if isinstance(nlu_result.intent, StudentIntent)
        else str(nlu_result.intent)
    )
    subject_val = (
        nlu_result.subject.value.upper()
        if isinstance(nlu_result.subject, SubjectArea)
        else str(nlu_result.subject).upper()
    )
    grade_val = (
        nlu_result.grade_level.value
        if isinstance(nlu_result.grade_level, GradeTier)
        else str(nlu_result.grade_level)
    )

    return {
        "nlu_result": nlu_result.model_dump(),
        # Standardized Intent fields (supports both new and existing schema)
        "intent": intent_val,
        "user_intent": intent_val,
        # Normalized Query text
        "cleaned_input": nlu_result.cleaned_text,
        "query": nlu_result.cleaned_text,
        "original_raw_query": nlu_result.raw_query,
        # Extracted student answer (e.g. '12', 'chloroplast', '3/4')
        "extracted_answer": nlu_result.extracted_answer,
        # Subject and Subtopic tagging
        "subject": subject_val,
        "subtopic": nlu_result.subtopic,
        "grade_level": grade_val,
        # Ambiguity / Clarification info
        "is_ambiguous": nlu_result.is_ambiguous,
        "clarification_prompt": nlu_result.clarification_prompt,
    }


async def nlu_node(state: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Asynchronous LangGraph Node entrypoint.
    Executes at the start of every student turn.
    """
    state_dict = state if isinstance(state, dict) else {}
    raw_query = _extract_query(state_dict)
    current_step = _extract_current_step(state_dict)
    grade_level = state_dict.get("grade_level", "grade_4_6")
    history = state_dict.get("history")
    rolling_summary = state_dict.get("rolling_summary")

    try:
        nlu_result = await process_nlu(
            raw_query=raw_query,
            current_context=current_step,
            session_grade_level=grade_level,
            history=history,
            rolling_summary=rolling_summary,
        )
        return _build_state_update(nlu_result)
    except Exception as e:
        logger.error(f"nlu_node execution failed: {e}", exc_info=True)
        fallback = NLUResult.create_fallback(raw_query=raw_query, cleaned_text=raw_query)
        return _build_state_update(fallback)


def nlu_node_sync(state: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Synchronous fast-path node wrapper (<1ms).
    Useful for unit testing, offline environments, or synchronous graphs.
    """
    state_dict = state if isinstance(state, dict) else {}
    raw_query = _extract_query(state_dict)
    current_step = _extract_current_step(state_dict)
    grade_level = state_dict.get("grade_level", "grade_4_6")
    history = state_dict.get("history")
    rolling_summary = state_dict.get("rolling_summary")

    try:
        nlu_result = process_nlu_sync(
            raw_query=raw_query,
            current_context=current_step,
            session_grade_level=grade_level,
            history=history,
            rolling_summary=rolling_summary,
        )
        return _build_state_update(nlu_result)
    except Exception as e:
        logger.error(f"nlu_node_sync execution failed: {e}", exc_info=True)
        fallback = NLUResult.create_fallback(raw_query=raw_query, cleaned_text=raw_query)
        return _build_state_update(fallback)
