"""
Pytest Suite for Day 11: Ambiguity & Gibberish Handler (clarify.py)
Tests keyboard smashes, punctuation spam, filler non-answers, false-positive protection,
Socratic re-prompt generation, and end-to-end pipeline integration.
"""

import os
import sys
import time
# pyrefly: ignore [missing-import]
import pytest

# Ensure orchestrator directory is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORCHESTRATOR_DIR = os.path.join(BASE_DIR, "orchestrator")
if ORCHESTRATOR_DIR not in sys.path:
    sys.path.insert(0, ORCHESTRATOR_DIR)

try:
    from app.services.nlu import (  # type: ignore
        AmbiguityType,
        AmbiguityResult,
        detect_ambiguity,
        is_gibberish_sync,
        get_kid_friendly_reprompt,
        process_nlu_sync,
        process_nlu,
        StudentIntent,
        SubjectArea,
        GradeTier,
    )
except ImportError:
    from orchestrator.app.services.nlu import (  # type: ignore
        AmbiguityType,
        AmbiguityResult,
        detect_ambiguity,
        is_gibberish_sync,
        get_kid_friendly_reprompt,
        process_nlu_sync,
        process_nlu,
        StudentIntent,
        SubjectArea,
        GradeTier,
    )


class TestAmbiguityDetection:
    """Tests deterministic ambiguity and gibberish classification heuristics."""

    def test_empty_and_whitespace(self):
        cases = ["", "   ", "\t\n", None]
        for query in cases:
            res = detect_ambiguity(query)
            assert res.is_ambiguous is True
            assert res.reason == AmbiguityType.EMPTY_INPUT
            assert res.clarification_prompt is not None

    def test_punctuation_spam(self):
        cases = ["???", "!!!!!", ".....", "?!?!?", "??????", "---", "...???"]
        for query in cases:
            res = detect_ambiguity(query)
            assert res.is_ambiguous is True
            assert res.reason == AmbiguityType.PUNCTUATION_SPAM
            assert res.clarification_prompt is not None

    def test_filler_non_answers(self):
        cases = ["um", "uh", "eh", "er", "erm", "huh", "hmm", "hmmm", "k", "kk", "blah", "meh"]
        for query in cases:
            res = detect_ambiguity(query)
            assert res.is_ambiguous is True
            assert res.reason == AmbiguityType.FILLER_NON_ANSWER
            assert res.clarification_prompt is not None

    def test_repeated_characters(self):
        cases = ["aaaaa", "zzzzzzzz", "ffffff", "hahahahaaaaaa", "noooooooo"]
        for query in cases:
            res = detect_ambiguity(query)
            assert res.is_ambiguous is True
            assert res.reason == AmbiguityType.REPEATED_CHARS
            assert res.clarification_prompt is not None

    def test_keyboard_smashes(self):
        cases = ["asdfghjkl", "qwertyuiop", "zxcvbnm", "poiuytrew", "lkjhgfdsa", "dfghjk"]
        for query in cases:
            res = detect_ambiguity(query)
            assert res.is_ambiguous is True
            assert res.reason == AmbiguityType.KEYBOARD_SMASH
            assert res.clarification_prompt is not None

    def test_consonant_clusters(self):
        cases = ["fghjkl", "qwrtyp", "bcdfg", "sdfsdf", "dsfdsf", "zxcvbn"]
        for query in cases:
            res = detect_ambiguity(query)
            assert res.is_ambiguous is True
            assert res.clarification_prompt is not None


class TestFalsePositiveProtection:
    """Ensures valid elementary words, math expressions, and short answers are NOT flagged as ambiguous."""

    def test_valid_words_without_standard_vowels(self):
        cases = ["rhythm", "why", "fly", "dry", "sky", "try", "gym", "myth", "by", "my"]
        for query in cases:
            res = detect_ambiguity(query)
            assert res.is_ambiguous is False, f"False positive on valid word: {query}"
            assert res.reason == AmbiguityType.NONE

    def test_valid_short_answers_and_numbers(self):
        cases = ["4", "12", "0", "3/4", "5 cm", "x", "yes", "no", "sun", "pie", "gas", "ice"]
        for query in cases:
            res = detect_ambiguity(query)
            assert res.is_ambiguous is False, f"False positive on short answer: {query}"

    def test_valid_math_and_science_questions(self):
        cases = [
            "what is 2 + 2?",
            "how do plants make food?",
            "what is photosynthesis?",
            "find the area of a rectangle with length 5 cm and width 4 cm",
            "why is the sky blue?",
        ]
        for query in cases:
            res = detect_ambiguity(query)
            assert res.is_ambiguous is False, f"False positive on question: {query}"


class TestKidClarificationPrompts:
    """Tests grade-tiered and context-aware Socratic re-prompt generation."""

    def test_active_step_reprompt(self):
        step_context = {"step_number": 2, "question": "What is 4 * 3?"}
        res = detect_ambiguity("asdfghjkl", current_step=step_context)
        assert res.is_ambiguous is True
        assert "answer" in res.clarification_prompt.lower() or "step" in res.clarification_prompt.lower()

    def test_initial_question_reprompt(self):
        res = detect_ambiguity("???????", current_step=None)
        assert res.is_ambiguous is True
        assert "math" in res.clarification_prompt.lower() or "science" in res.clarification_prompt.lower()

    def test_grade_1_3_early_elementary_prompt(self):
        prompt = get_kid_friendly_reprompt(
            reason=AmbiguityType.KEYBOARD_SMASH,
            current_step=None,
            grade_level="grade_1_3"
        )
        assert "robot ears" in prompt.lower() or "fun math" in prompt.lower()


class TestPipelineIntegration:
    """Tests end-to-end integration through process_nlu and process_nlu_sync."""

    def test_pipeline_gibberish_sync(self):
        res = process_nlu_sync("asdfghjkl")
        assert res.is_ambiguous is True
        assert res.intent == StudentIntent.REQUEST_CLARIFICATION
        assert res.confidence == 0.0
        assert res.clarification_prompt is not None

    def test_pipeline_punctuation_spam_sync(self):
        res = process_nlu_sync("?????")
        assert res.is_ambiguous is True
        assert res.intent == StudentIntent.REQUEST_CLARIFICATION
        assert res.confidence == 0.0
        assert res.clarification_prompt is not None

    def test_pipeline_empty_query_sync(self):
        res = process_nlu_sync("")
        assert res.is_ambiguous is True
        assert res.confidence == 0.5
        assert res.clarification_prompt is not None

    @pytest.mark.asyncio
    async def test_pipeline_gibberish_async(self):
        res = await process_nlu("zzzzzzzz")
        assert res.is_ambiguous is True
        assert res.intent == StudentIntent.REQUEST_CLARIFICATION
        assert res.confidence == 0.0
        assert res.clarification_prompt is not None

    def test_pipeline_valid_query_not_ambiguous(self):
        res = process_nlu_sync("what is 3 * 4?")
        assert res.is_ambiguous is False
        assert res.clarification_prompt is None
        assert res.intent == StudentIntent.INITIAL_QUESTION
        assert res.subject == SubjectArea.MATH


class TestPerformanceBenchmark:
    """Validates that ambiguity detection executes within strict sub-millisecond budgets."""

    def test_detection_speed(self):
        samples = [
            "asdfghjkl",
            "?????",
            "what is photosynthesis?",
            "4",
            "um",
            "rhythm",
            "zzzzzzzz",
            "how do plants make food?",
        ]
        start = time.perf_counter()
        iterations = 500
        for _ in range(iterations):
            for s in samples:
                detect_ambiguity(s)
        total_time = time.perf_counter() - start
        avg_time_ms = (total_time / (iterations * len(samples))) * 1000

        print(f"\n[BENCHMARK] Average ambiguity detection time: {avg_time_ms:.4f} ms")
        assert avg_time_ms < 0.5, f"Detection too slow: {avg_time_ms} ms"
