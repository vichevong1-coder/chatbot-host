"""
Day 14: LangGraph Node Integration Tests (test_nlu_node.py)
Validates nlu_node and nlu_node_sync state transitions, query extraction,
step reconstruction, downstream schema compatibility, and fault tolerance.
"""

import os
import sys
# pyrefly: ignore [missing-import]
import pytest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORCHESTRATOR_DIR = os.path.join(BASE_DIR, "orchestrator")
if ORCHESTRATOR_DIR not in sys.path:
    sys.path.insert(0, ORCHESTRATOR_DIR)

# pyrefly: ignore [missing-import]
from app.services.nlu import (
    nlu_node,
    nlu_node_sync,
    StudentIntent,
    SubjectArea,
    GradeTier,
)
# pyrefly: ignore [missing-import]
from app.services.nlu.node import _extract_query, _extract_current_step


class TestNodeExtractionHelpers:
    """Tests helper functions extracting query and step context from graph state."""

    def test_extract_query_priority(self):
        assert _extract_query({"user_input": " 12 "}) == "12"
        assert _extract_query({"student_attempt": "5 cm"}) == "5 cm"
        assert _extract_query({"query": "photosynthesis"}) == "photosynthesis"
        assert _extract_query({"message": "help please"}) == "help please"
        assert _extract_query({}) == ""
        assert _extract_query(None) == ""

    def test_extract_current_step_explicit(self):
        ctx = {"step_number": 1, "question": "What is 2+2?", "expected_answer": "4"}
        state = {"current_step": ctx}
        assert _extract_current_step(state) == ctx

    def test_extract_current_step_reconstructed_from_solved_steps(self):
        state = {
            "solved_steps": [
                {"step_num": 1, "expression": "2 * 3", "hint": "Multiply 2 by 3"},
                {"step_num": 2, "expression": "6 + 4", "hint": "Add 4 to 6"},
            ],
            "current_step_index": 1,
        }
        step = _extract_current_step(state)
        assert step is not None
        assert step["step_number"] == 2
        assert step["total_steps"] == 2
        assert step["expected_answer"] == "6 + 4"
        assert step["active"] is True

    def test_extract_current_step_invalid_index(self):
        state = {
            "solved_steps": [{"step_num": 1, "expression": "4"}],
            "current_step_index": 5,
        }
        assert _extract_current_step(state) is None


class TestNluNodeSyncExecution:
    """Tests synchronous fast-path execution of nlu_node_sync."""

    def test_initial_question_state_update(self):
        state = {
            "query": "Leo has 8 cookiez and givs 3 away, how mny left?",
            "grade_level": "grade_1_3",
        }
        result = nlu_node_sync(state)

        assert result["intent"] == StudentIntent.INITIAL_QUESTION.value
        assert result["user_intent"] == StudentIntent.INITIAL_QUESTION.value
        assert result["subject"] == SubjectArea.MATH.value.upper()
        assert result["subtopic"] == "word_problem"
        assert result["grade_level"] == GradeTier.GRADE_1_3.value
        assert result["is_ambiguous"] is False
        assert "cookies" in result["cleaned_input"]
        assert "nlu_result" in result

    def test_active_step_answer_attempt(self):
        state = {
            "student_attempt": "I think the answer is 12 cookies",
            "current_step": {
                "step_number": 2,
                "question": "What is 4 times 3?",
                "expected_answer": "12",
                "active": True,
            },
        }
        result = nlu_node_sync(state)

        assert result["intent"] == StudentIntent.STEP_ANSWER_ATTEMPT.value
        assert result["extracted_answer"] == "12"
        assert result["is_ambiguous"] is False

    def test_help_request_during_step(self):
        state = {
            "user_input": "i'm stuck",
            "current_step": {
                "step_number": 1,
                "question": "Find x",
                "active": True,
            },
        }
        result = nlu_node_sync(state)

        assert result["intent"] == StudentIntent.REQUEST_CLARIFICATION.value
        assert result["is_ambiguous"] is False

    def test_ambiguity_and_gibberish_deflection(self):
        state = {"query": "asdfghjkl"}
        result = nlu_node_sync(state)

        assert result["is_ambiguous"] is True
        assert result["intent"] == StudentIntent.REQUEST_CLARIFICATION.value
        assert result["clarification_prompt"] is not None
        assert len(result["clarification_prompt"]) > 0

    def test_off_topic_query(self):
        state = {"query": "do you play fortnite?"}
        result = nlu_node_sync(state)

        assert result["intent"] == StudentIntent.OFF_TOPIC.value
        assert result["is_ambiguous"] is False


class TestNluNodeAsyncExecution:
    """Tests asynchronous execution of nlu_node."""

    @pytest.mark.asyncio
    async def test_async_nlu_node_initial_solve(self):
        state = {
            "user_input": "how plantz mak food with fotosynthesis?",
            "grade_level": "grade_4_6",
        }
        result = await nlu_node(state)

        assert result["intent"] == StudentIntent.INITIAL_QUESTION.value
        assert result["subject"] == SubjectArea.SCIENCE.value.upper()
        assert result["subtopic"] == "plants_biology"
        assert result["grade_level"] == GradeTier.GRADE_4_6.value
        assert "photosynthesis" in result["cleaned_input"]

    @pytest.mark.asyncio
    async def test_async_nlu_node_step_attempt(self):
        state = {
            "student_attempt": "chloroplast",
            "current_step": {
                "step_number": 1,
                "question": "Where does photosynthesis occur?",
                "active": True,
            },
        }
        result = await nlu_node(state)

        assert result["intent"] == StudentIntent.STEP_ANSWER_ATTEMPT.value
        assert result["extracted_answer"] == "chloroplast"

    @pytest.mark.asyncio
    async def test_async_nlu_node_fallback_on_empty(self):
        state = {"user_input": ""}
        result = await nlu_node(state)

        assert result["is_ambiguous"] is True
        assert result["clarification_prompt"] is not None
        assert "cleaned_input" in result


class TestLangGraphParityAndRobustness:
    """Tests state parity between sync and async implementations and edge case handling."""

    @pytest.mark.asyncio
    async def test_sync_async_parity(self):
        state = {
            "user_input": "what is 3/4 + 1/2?",
            "grade_level": "grade_4_6",
        }
        sync_res = nlu_node_sync(state)
        async_res = await nlu_node(state)

        assert sync_res["intent"] == async_res["intent"]
        assert sync_res["subject"] == async_res["subject"]
        assert sync_res["subtopic"] == async_res["subtopic"]
        assert sync_res["cleaned_input"] == async_res["cleaned_input"]

    def test_nlu_node_handles_none_or_malformed_state(self):
        res1 = nlu_node_sync({})
        assert "intent" in res1
        assert "cleaned_input" in res1

        res2 = nlu_node_sync(None)
        assert "intent" in res2
        assert "cleaned_input" in res2
