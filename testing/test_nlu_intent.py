"""
Unit Tests for NLU Intent Classification Engine & History Formatter (Day 6 Deliverable).
"""

import os
import sys
# pyrefly: ignore [missing-import]
import pytest

# Ensure orchestrator directory is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORCHESTRATOR_DIR = os.path.join(BASE_DIR, "orchestrator")
if ORCHESTRATOR_DIR not in sys.path:
    sys.path.insert(0, ORCHESTRATOR_DIR)

# pyrefly: ignore [missing-import]
from app.services.nlu import (  # type: ignore
    IntentType,
    IntentResult,
    classify_intent,
    classify_intent_sync,
    format_chat_history,
)


class TestIntentImportsAndSchema:
    """Verify clean exports and Pydantic validation."""

    def test_imports_from_package(self):
        assert IntentType.INITIAL_SOLVE == "INITIAL_SOLVE"
        assert IntentType.STEP_ATTEMPT == "STEP_ATTEMPT"
        assert IntentType.CLARIFY == "CLARIFY"
        assert IntentType.REQUEST_PRACTICE == "REQUEST_PRACTICE"
        assert IntentType.CHITCHAT == "CHITCHAT"

    def test_intent_result_schema(self):
        res = IntentResult(intent=IntentType.INITIAL_SOLVE, confidence=0.95)
        assert res.intent == IntentType.INITIAL_SOLVE
        assert res.confidence == 0.95
        assert res.raw_response is None


class TestFormatChatHistory:
    """Verify conversational history formatting with rolling summary support."""

    def test_empty_history(self):
        assert format_chat_history(None) == "No previous conversation history."
        assert format_chat_history([]) == "No previous conversation history."

    def test_turns_with_role_content(self):
        history = [
            {"role": "user", "content": "What is 4 x 5?"},
            {"role": "assistant", "content": "Let's break it down. What is 4 added 5 times?"}
        ]
        formatted = format_chat_history(history)
        assert "Student: What is 4 x 5?" in formatted
        assert "Tutor: Let's break it down." in formatted

    def test_turns_with_user_bot_keys(self):
        history = [
            {"user": "How do plants eat?", "bot": "They make food using sunlight."}
        ]
        formatted = format_chat_history(history)
        assert "Student: How do plants eat?" in formatted
        assert "Tutor: They make food using sunlight." in formatted

    def test_rolling_summary_only(self):
        formatted = format_chat_history(rolling_summary="Student practiced fractions.")
        assert "Summary of earlier conversation: Student practiced fractions." in formatted

    def test_combined_rolling_summary_and_turns(self):
        history = [{"role": "user", "content": "Is it 1/2?"}]
        formatted = format_chat_history(history=history, rolling_summary="Covered basic halves.")
        assert "Summary of earlier conversation: Covered basic halves." in formatted
        assert "Student: Is it 1/2?" in formatted

    def test_history_fewer_than_six_turns_no_index_error(self):
        """Ensure slicing history[-6:] doesn't raise IndexError when turns < 6."""
        history = [{"role": "user", "content": "hello"}]
        formatted = format_chat_history(history=history)
        assert "Student: hello" in formatted

    def test_history_more_than_six_turns_limits_to_six(self):
        history = [{"role": "user", "content": f"msg {i}"} for i in range(10)]
        formatted = format_chat_history(history=history)
        assert "msg 0" not in formatted
        assert "msg 4" in formatted
        assert "msg 9" in formatted


class TestIntentClassification:
    """Verify deterministic intent classification logic."""

    def test_chitchat(self):
        queries = ["hi", "hello", "good morning", "thanks", "thank you so much", "bye"]
        for q in queries:
            res = classify_intent_sync(q)
            assert res.intent == IntentType.CHITCHAT, f"Failed for {q}"

    def test_request_practice(self):
        queries = [
            "give me another practice problem",
            "can we do more practice",
            "give me another one",
            "next question please"
        ]
        for q in queries:
            res = classify_intent_sync(q)
            assert res.intent == IntentType.REQUEST_PRACTICE, f"Failed for {q}"

    def test_initial_solve_without_history(self):
        queries = [
            "How do plants make food?",
            "Solve 4x + 5 = 25",
            "What is 10 divided by 2?",
        ]
        for q in queries:
            res = classify_intent_sync(q)
            assert res.intent == IntentType.INITIAL_SOLVE, f"Failed for {q}"

    def test_step_attempt_with_history(self):
        history = [{"role": "assistant", "content": "What is 4 times 5?"}]
        queries = ["20", "20 cm", "is it 20?", "the answer is 20", "maybe 3/4"]
        for q in queries:
            res = classify_intent_sync(q, history=history)
            assert res.intent == IntentType.STEP_ATTEMPT, f"Failed for {q}"

    def test_clarify_with_history(self):
        history = [{"role": "assistant", "content": "Plants produce glucose via photosynthesis."}]
        queries = [
            "Why does chlorophyll absorb red light?",
            "What is glucose?",
            "Explain what a chloroplast is",
            "How does sunlight reach the leaves?"
        ]
        for q in queries:
            res = classify_intent_sync(q, history=history)
            assert res.intent == IntentType.CLARIFY, f"Failed for {q}"

    def test_empty_query_fallback(self):
        res = classify_intent_sync("")
        assert res.intent == IntentType.CHITCHAT
        assert res.confidence == 0.5


@pytest.mark.asyncio
async def test_async_classify_intent_entrypoint():
    """Verify master async entrypoint functions and returns IntentResult."""
    res = await classify_intent("How do plants make food?")
    assert isinstance(res, IntentResult)
    assert res.intent == IntentType.INITIAL_SOLVE


if __name__ == "__main__":
    pytest.main(["-v", __file__])
