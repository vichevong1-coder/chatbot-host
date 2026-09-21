"""
Unit tests for NLU Schema and Data Contracts (Day 1 - Deth).
Tests Pydantic validation, serialization, deserialization, enums, and fallback builders.
"""

import sys
import os
import json
# pyrefly: ignore [missing-import]
import pytest
from pydantic import ValidationError

# Ensure orchestrator is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "orchestrator")))

# pyrefly: ignore [missing-import]
from app.services.nlu import (
    StudentIntent,
    SubjectArea,
    GradeTier,
    NLUResult,
)



def test_student_intent_enum_values():
    assert StudentIntent.INITIAL_QUESTION == "INITIAL_QUESTION"
    assert StudentIntent.STEP_ANSWER_ATTEMPT == "STEP_ANSWER_ATTEMPT"
    assert StudentIntent.REQUEST_HINT == "REQUEST_HINT"
    assert StudentIntent.REQUEST_CLARIFICATION == "REQUEST_CLARIFICATION"
    assert StudentIntent.OFF_TOPIC == "OFF_TOPIC"
    assert StudentIntent.CHITCHAT == "CHITCHAT"
    assert len(StudentIntent) == 6


def test_nlu_result_valid_instantiation():
    result = NLUResult(
        raw_query="i have 5 apls and give 2",
        cleaned_text="i have 5 apples and give 2",
        intent=StudentIntent.INITIAL_QUESTION,
        confidence=0.98,
        subject=SubjectArea.MATH,
        subtopic="arithmetic",
        grade_level=GradeTier.GRADE_1_3,
        extracted_answer=None,
        is_ambiguous=False,
    )
    assert result.raw_query == "i have 5 apls and give 2"
    assert result.cleaned_text == "i have 5 apples and give 2"
    assert result.intent == StudentIntent.INITIAL_QUESTION
    assert result.confidence == 0.98
    assert result.subject == SubjectArea.MATH
    assert result.grade_level == GradeTier.GRADE_1_3


def test_nlu_result_defaults():
    result = NLUResult(
        raw_query="hi",
        cleaned_text="hi",
        intent=StudentIntent.CHITCHAT,
    )
    assert result.confidence == 1.0
    assert result.subject == SubjectArea.GENERAL
    assert result.subtopic == "general"
    assert result.grade_level == GradeTier.GRADE_4_6
    assert result.extracted_answer is None
    assert result.is_ambiguous is False
    assert result.clarification_prompt is None


def test_nlu_result_serialization_and_deserialization():
    original = NLUResult(
        raw_query="i think the answer is 8 cookies",
        cleaned_text="i think the answer is 8 cookies",
        intent=StudentIntent.STEP_ANSWER_ATTEMPT,
        confidence=0.95,
        subject=SubjectArea.MATH,
        extracted_answer="8",
    )
    
    json_str = original.model_dump_json()
    assert '"intent":"STEP_ANSWER_ATTEMPT"' in json_str or '"intent": "STEP_ANSWER_ATTEMPT"' in json_str
    assert '"extracted_answer":"8"' in json_str or '"extracted_answer": "8"' in json_str

    parsed = NLUResult.model_validate_json(json_str)
    assert parsed.intent == StudentIntent.STEP_ANSWER_ATTEMPT
    assert parsed.extracted_answer == "8"
    assert parsed.subject == SubjectArea.MATH



def test_nlu_result_invalid_intent_rejected():
    with pytest.raises(ValidationError):
        NLUResult(
            raw_query="test",
            cleaned_text="test",
            intent="INVALID_NON_EXISTENT_INTENT",  # type: ignore
        )


def test_nlu_result_confidence_bounds():
    # Confidence > 1.0 should fail
    with pytest.raises(ValidationError):
        NLUResult(
            raw_query="test",
            cleaned_text="test",
            intent=StudentIntent.CHITCHAT,
            confidence=1.5,
        )

    # Confidence < 0.0 should fail
    with pytest.raises(ValidationError):
        NLUResult(
            raw_query="test",
            cleaned_text="test",
            intent=StudentIntent.CHITCHAT,
            confidence=-0.1,
        )


def test_create_fallback():
    fallback = NLUResult.create_fallback("how do plants breathe")
    assert fallback.raw_query == "how do plants breathe"
    assert fallback.cleaned_text == "how do plants breathe"
    assert fallback.intent == StudentIntent.INITIAL_QUESTION
    assert fallback.confidence == 0.5
    assert fallback.is_ambiguous is False

    short_fallback = NLUResult.create_fallback("??")
    assert short_fallback.intent == StudentIntent.CHITCHAT
    assert short_fallback.is_ambiguous is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

