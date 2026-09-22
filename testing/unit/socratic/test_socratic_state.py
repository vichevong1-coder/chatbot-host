"""
File: testing/test_socratic_state.py
Description: Unit and integration tests for Part 2 (LangGraph StateGraph, TutorState,
             and 3-Tier Progressive Hint Engine).
"""

# pyrefly: ignore [missing-import]
import pytest
import os
import sys

# Ensure repo root and orchestrator are on sys.path
def _find_repo_root():
    cur = os.path.abspath(os.path.dirname(__file__))
    while cur and not os.path.exists(os.path.join(cur, "orchestrator")):
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    return cur

BASE_DIR = _find_repo_root()
ORCHESTRATOR_DIR = os.path.join(BASE_DIR, "orchestrator")
for _p in (BASE_DIR, ORCHESTRATOR_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "orchestrator")))

# pyrefly: ignore [missing-import]
from app.services.socratic.card_schema import SocraticStep, StepWidgetPayload
# pyrefly: ignore [missing-import]
from app.services.socratic.state import TutorState
# pyrefly: ignore [missing-import]
from app.services.socratic.hint_engine import HintEngine
# pyrefly: ignore [missing-import]
from app.services.socratic.clarify import SocraticClarifier
# pyrefly: ignore [missing-import]
from app.services.socratic.graph import build_socratic_graph, _is_answer_equivalent
# pyrefly: ignore [missing-import]
from app.services.nlu.schema import StudentIntent
from langgraph.checkpoint.memory import MemorySaver


@pytest.fixture
def hint_engine():
    return HintEngine()


@pytest.fixture
def sample_step():
    return SocraticStep(
        step_number=1,
        title="Find how many apples were eaten",
        status="in_progress",
        mission="Find how many apples Leo ate.",
        clue="Subtract the eaten apples from the starting total.",
        helpful_example="Maya had 10 cookies and gave 3 to Sam. 10 - 3 = 7 cookies left.",
        your_turn="Leo had 12 apples and ate 4. How many apples are left?",
        expected_answer="8",
        concept="subtraction"
    )


def test_is_answer_equivalent():
    assert _is_answer_equivalent("8", "8") is True
    assert _is_answer_equivalent("8 apples", "8") is True
    assert _is_answer_equivalent("eight", "8") is True
    assert _is_answer_equivalent("9", "8") is False


def test_hint_engine_three_tiers(hint_engine, sample_step):
    # Tier 1: Guiding Nudge
    tier_1, hint_1 = hint_engine.escalate_hint(sample_step, grade_level="grade_1_3")
    assert tier_1 == 1
    assert "👀" in hint_1 or "clue" in hint_1.lower()
    assert "8" not in hint_1  # Zero answer leakage

    # Tier 2: Visual Scaffold
    tier_2, hint_2 = hint_engine.escalate_hint(sample_step, grade_level="grade_1_3")
    assert tier_2 == 2
    assert "🎨" in hint_2 or "🍎" in hint_2
    assert "8" not in hint_2  # Zero answer leakage

    # Tier 3: Micro-Breakdown
    tier_3, hint_3 = hint_engine.escalate_hint(sample_step, grade_level="grade_1_3")
    assert tier_3 == 3
    assert "🧩" in hint_3 or "micro-step" in hint_3.lower()

    # Capped at Tier 3
    tier_4, hint_4 = hint_engine.escalate_hint(sample_step, grade_level="grade_1_3")
    assert tier_4 == 3


def test_clarifier_preserves_context(sample_step):
    widget = StepWidgetPayload(
        total_steps=1,
        current_step_index=0,
        completed_steps=[],
        steps=[sample_step]
    )
    res = SocraticClarifier.build_clarification_response("huh?", widget=widget)
    assert res["clarification_needed"] is True
    assert "Step 1" in res["clarification_question"]


def test_graph_initial_problem():
    graph = build_socratic_graph(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": "test_session_1"}}

    state_input: TutorState = {
        "session_id": "test_session_1",
        "raw_user_input": "Leo had 12 apples and ate 4. How many apples are left?",
        "detected_intent": StudentIntent.INITIAL_QUESTION.value,
        "grade_level": "grade_1_3"
    }

    result = graph.invoke(state_input, config=config)
    assert "step_widget" in result
    assert result["current_step_index"] == 0
    assert result["total_steps_count"] >= 2
    assert "🌟 **Our Mission:**" in result["formatted_markdown"]


def test_graph_step_answer_and_advancement():
    graph = build_socratic_graph(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": "test_session_2"}}

    # 1. Start problem
    start_state: TutorState = {
        "session_id": "test_session_2",
        "raw_user_input": "Leo had 12 apples and ate 4. How many apples are left?",
        "detected_intent": StudentIntent.INITIAL_QUESTION.value
    }
    r1 = graph.invoke(start_state, config=config)

    # 2. Submit wrong answer
    wrong_state: TutorState = {
        **r1,
        "raw_user_input": "5",
        "student_attempt": "5",
        "detected_intent": StudentIntent.STEP_ANSWER_ATTEMPT.value
    }
    r2 = graph.invoke(wrong_state, config=config)
    assert r2["current_hint_tier"] == 1
    assert r2["active_hint"] is not None
    assert r2["is_problem_complete"] is False

    # 3. Submit correct answer for step 1
    widget = StepWidgetPayload.model_validate(r2["step_widget"])
    expected_ans = widget.get_active_step().expected_answer or "8"

    correct_state: TutorState = {
        **r2,
        "raw_user_input": expected_ans,
        "student_attempt": expected_ans,
        "detected_intent": StudentIntent.STEP_ANSWER_ATTEMPT.value
    }
    r3 = graph.invoke(correct_state, config=config)
    assert "Spot on!" in r3["feedback_message"]
    assert r3["current_step_index"] == 1


def test_graph_explicit_hint_request():
    graph = build_socratic_graph(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": "test_session_3"}}

    # Start problem
    r1 = graph.invoke({
        "session_id": "test_session_3",
        "raw_user_input": "How many states of matter are there?",
        "detected_intent": StudentIntent.INITIAL_QUESTION.value
    }, config=config)

    # Ask for hint
    r2 = graph.invoke({
        **r1,
        "raw_user_input": "give me a hint",
        "detected_intent": StudentIntent.REQUEST_HINT.value
    }, config=config)

    assert r2["current_hint_tier"] == 1
    assert r2["active_hint"] is not None


def test_graph_navigation_jump():
    graph = build_socratic_graph(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": "test_session_4"}}

    # Start problem
    r1 = graph.invoke({
        "session_id": "test_session_4",
        "raw_user_input": "Leo had 12 apples and ate 4. How many apples are left?",
        "detected_intent": StudentIntent.INITIAL_QUESTION.value
    }, config=config)

    # Jump to Step index 1
    r2 = graph.invoke({
        **r1,
        "raw_user_input": "goto step 2",
        "detected_intent": "NAVIGATION_JUMP",
        "target_nav_index": 1
    }, config=config)

    assert r2["current_step_index"] == 1
    assert "Navigated to Step 2" in r2["feedback_message"]
