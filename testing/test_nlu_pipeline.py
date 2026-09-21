"""
Unit Tests for Day 10: Master Pipeline Runner (process_nlu & process_nlu_sync).
Validates end-to-end integration across Normalizer, Intent Classifier, Subject Router, and Golden NLUResult schema.
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
    process_nlu,
    process_nlu_sync,
    NLUResult,
    StudentIntent,
    SubjectArea,
    GradeTier,
)


class TestMasterPipelineSync:
    """Verify synchronous fast-path pipeline execution across diverse queries."""

    def test_math_initial_question(self):
        res = process_nlu_sync("what is 3/4 + 1/2?")
        assert isinstance(res, NLUResult)
        assert res.intent == StudentIntent.INITIAL_QUESTION
        assert res.subject == SubjectArea.MATH
        assert res.subtopic == "fractions"
        assert res.cleaned_text == "what is 3/4 + 1/2?"
        assert res.confidence >= 0.85
        assert res.is_ambiguous is False

    def test_science_initial_question_with_typos(self):
        res = process_nlu_sync("how do leavs make enrgy for plantz?")
        assert isinstance(res, NLUResult)
        assert res.intent == StudentIntent.INITIAL_QUESTION
        assert res.subject == SubjectArea.SCIENCE
        assert res.subtopic == "plants_biology"
        assert "leaves" in res.cleaned_text
        assert "plants" in res.cleaned_text

    def test_step_answer_attempt_with_context(self):
        context = {"step_num": 1, "expression": "2 + 2"}
        res = process_nlu_sync("4", current_context=context)
        assert res.intent == StudentIntent.STEP_ANSWER_ATTEMPT
        assert res.extracted_answer == "4"
        assert res.confidence >= 0.95

    def test_step_hedged_answer_attempt(self):
        context = {"step_num": 1, "prompt": "How many cookies?"}
        res = process_nlu_sync("I think the answer is 12 cookies", current_context=context)
        assert res.intent == StudentIntent.STEP_ANSWER_ATTEMPT
        assert res.extracted_answer == "12"

    def test_scientific_vocab_step_answer(self):
        context = {"step_num": 2, "prompt": "Where does photosynthesis occur?"}
        res = process_nlu_sync("chloroplast", current_context=context)
        assert res.intent == StudentIntent.STEP_ANSWER_ATTEMPT
        assert res.extracted_answer == "chloroplast"
        assert res.subject == SubjectArea.SCIENCE

    def test_help_seeking_during_step(self):
        context = {"step_num": 2}
        res = process_nlu_sync("hint please", current_context=context)
        assert res.intent == StudentIntent.REQUEST_CLARIFICATION

    def test_chitchat_handling(self):
        res = process_nlu_sync("hello tutor!")
        assert res.intent == StudentIntent.CHITCHAT
        assert res.subject == SubjectArea.GENERAL

    def test_explicit_grade_level_preserved(self):
        res = process_nlu_sync("what is 5 x 5?", session_grade_level=GradeTier.GRADE_1_3)
        assert res.grade_level == GradeTier.GRADE_1_3

    def test_empty_query_fallback(self):
        res = process_nlu_sync("")
        assert res.confidence == 0.5
        assert res.intent == StudentIntent.CHITCHAT
        assert res.raw_query == ""


class TestMasterPipelineFallbackSafety:
    """Verify error resilience and fallback creation."""

    def test_none_query_fallback(self):
        res = process_nlu_sync(None)  # type: ignore
        assert isinstance(res, NLUResult)
        assert res.confidence == 0.5

    def test_whitespace_query_fallback(self):
        res = process_nlu_sync("   ")
        assert isinstance(res, NLUResult)
        assert res.intent == StudentIntent.CHITCHAT


@pytest.mark.asyncio
async def test_master_pipeline_async_math():
    """Verify master async entrypoint with math problem."""
    res = await process_nlu("solve 10 divided by 2")
    assert isinstance(res, NLUResult)
    assert res.subject == SubjectArea.MATH
    assert res.intent == StudentIntent.INITIAL_QUESTION
    assert res.is_ambiguous is False


@pytest.mark.asyncio
async def test_master_pipeline_async_with_step():
    """Verify master async entrypoint with active step context."""
    context = {"step_num": 1, "expression": "10 / 2"}
    res = await process_nlu("5", current_context=context)
    assert isinstance(res, NLUResult)
    assert res.intent == StudentIntent.STEP_ANSWER_ATTEMPT
    assert res.extracted_answer == "5"


if __name__ == "__main__":
    pytest.main(["-v", __file__])
