"""
Day 13: 50-Case Comprehensive Integration Test Suite (test_nlu_suite.py)
End-to-End Evaluation Matrix for the Elementary STEM Socratic NLU Pipeline.

Validates 50 real elementary student queries across:
1. 10 Initial math/science problems
2. 15 Student answer attempts (numbers, words, full sentences)
3. 10 Hint/help requests
4. 5 Step navigation / practice requests
5. 5 Conceptual clarification questions
6. 5 Gibberish / off-topic queries
"""

import os
import sys
import time
# pyrefly: ignore [missing-import]
import pytest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORCHESTRATOR_DIR = os.path.join(BASE_DIR, "orchestrator")
if ORCHESTRATOR_DIR not in sys.path:
    sys.path.insert(0, ORCHESTRATOR_DIR)

try:
    from app.services.nlu import (  # type: ignore
        process_nlu_sync,
        process_nlu,
        StudentIntent,
        SubjectArea,
        GradeTier,
        NLUResult,
    )
except ImportError:
    from orchestrator.app.services.nlu import (  # type: ignore
        process_nlu_sync,
        process_nlu,
        StudentIntent,
        SubjectArea,
        GradeTier,
        NLUResult,
    )

# Active Step Context Mock for testing step answers
MOCK_STEP_CONTEXT = {
    "step_number": 2,
    "total_steps": 4,
    "question": "What is 4 multiplied by 3?",
    "target_concept": "multiplication",
    "expected_answer": "12",
}


# =========================================================================
# 50-CASE ELEMENTARY TEST MATRIX DEFINITION
# =========================================================================

INITIAL_QUESTIONS_DATA = [
    # Math
    ("what is 15 * 4?", StudentIntent.INITIAL_QUESTION, SubjectArea.MATH, "arithmetic"),
    ("Leo has 8 cookiez and givs 3 away, how mny left?", StudentIntent.INITIAL_QUESTION, SubjectArea.MATH, "word_problem"),
    ("calculate 3/4 + 1/2", StudentIntent.INITIAL_QUESTION, SubjectArea.MATH, "fractions"),
    ("find the area of rectangle with 5cm and 4cm", StudentIntent.INITIAL_QUESTION, SubjectArea.MATH, "geometry"),
    ("what is 100 / 25?", StudentIntent.INITIAL_QUESTION, SubjectArea.MATH, "arithmetic"),
    # Science
    ("how plantz mak food with fotosynthesis?", StudentIntent.INITIAL_QUESTION, SubjectArea.SCIENCE, "plants_biology"),
    ("why do objects fall to the ground?", StudentIntent.INITIAL_QUESTION, SubjectArea.SCIENCE, "forces_physics"),
    ("what are the three states of water and ice?", StudentIntent.INITIAL_QUESTION, SubjectArea.SCIENCE, "matter_chemistry"),
    ("how does the moon orbit the earth?", StudentIntent.INITIAL_QUESTION, SubjectArea.SCIENCE, "earth_space"),
    ("why do frogs live in water and land?", StudentIntent.INITIAL_QUESTION, SubjectArea.SCIENCE, "animals_ecosystem"),
]

STEP_ANSWERS_DATA = [
    ("4", StudentIntent.STEP_ANSWER_ATTEMPT, "4"),
    ("12", StudentIntent.STEP_ANSWER_ATTEMPT, "12"),
    ("3/4", StudentIntent.STEP_ANSWER_ATTEMPT, "3/4"),
    ("15 km/h", StudentIntent.STEP_ANSWER_ATTEMPT, "15 km/h"),
    ("chloroplast", StudentIntent.STEP_ANSWER_ATTEMPT, "chloroplast"),
    ("leaves", StudentIntent.STEP_ANSWER_ATTEMPT, "leaves"),
    ("I think the answer is 12 cookies", StudentIntent.STEP_ANSWER_ATTEMPT, "12"),
    ("maybe 5 cm?", StudentIntent.STEP_ANSWER_ATTEMPT, "5 cm"),
    ("is it 20?", StudentIntent.STEP_ANSWER_ATTEMPT, "20"),
    ("It happens in the stem", StudentIntent.STEP_ANSWER_ATTEMPT, "stem"),
    ("could it be 1/2?", StudentIntent.STEP_ANSWER_ATTEMPT, "1/2"),
    ("probably 100 kg", StudentIntent.STEP_ANSWER_ATTEMPT, "100 kg"),
    ("yes", StudentIntent.STEP_ANSWER_ATTEMPT, "yes"),
    ("gravity", StudentIntent.STEP_ANSWER_ATTEMPT, "gravity"),
    ("oxygen", StudentIntent.STEP_ANSWER_ATTEMPT, "oxygen"),
]

HINT_REQUESTS_DATA = [
    ("hint please", StudentIntent.REQUEST_CLARIFICATION),
    ("i'm stuck", StudentIntent.REQUEST_CLARIFICATION),
    ("idk", StudentIntent.REQUEST_CLARIFICATION),
    ("give me a clue", StudentIntent.REQUEST_CLARIFICATION),
    ("what do i do next?", StudentIntent.REQUEST_CLARIFICATION),
    ("i dont understand this step", StudentIntent.REQUEST_CLARIFICATION),
    ("can you help me?", StudentIntent.REQUEST_CLARIFICATION),
    ("i don't get it", StudentIntent.REQUEST_CLARIFICATION),
    ("no idea", StudentIntent.REQUEST_CLARIFICATION),
    ("what should i calculate?", StudentIntent.REQUEST_CLARIFICATION),
]

PRACTICE_NAVIGATION_DATA = [
    ("can i have more practice?", StudentIntent.INITIAL_QUESTION),
    ("give me another problem", StudentIntent.INITIAL_QUESTION),
    ("another one please", StudentIntent.INITIAL_QUESTION),
    ("next question", StudentIntent.INITIAL_QUESTION),
    ("practice problem", StudentIntent.INITIAL_QUESTION),
]

CONCEPTUAL_CLARIFICATIONS_DATA = [
    ("what is a numerator?", StudentIntent.REQUEST_CLARIFICATION, SubjectArea.MATH),
    ("what does gravity mean?", StudentIntent.REQUEST_CLARIFICATION, SubjectArea.SCIENCE),
    ("what does friction mean?", StudentIntent.REQUEST_CLARIFICATION, SubjectArea.SCIENCE),
    ("how does evaporation work?", StudentIntent.REQUEST_CLARIFICATION, SubjectArea.SCIENCE),
    ("what is an ecosystem?", StudentIntent.REQUEST_CLARIFICATION, SubjectArea.SCIENCE),
]

GIBBERISH_AND_OFFTOPIC_DATA = [
    ("asdfghjkl", StudentIntent.REQUEST_CLARIFICATION, True),
    ("???????", StudentIntent.REQUEST_CLARIFICATION, True),
    ("do you play fortnite?", StudentIntent.OFF_TOPIC, False),
    ("what is your roblox username?", StudentIntent.OFF_TOPIC, False),
    ("are you a real human or robot?", StudentIntent.OFF_TOPIC, False),
]


# =========================================================================
# TEST SUITE IMPLEMENTATION
# =========================================================================

class TestGroup1InitialQuestions:
    """Group 1: Tests 10 Initial STEM Problems & Subtopic Tagging."""

    @pytest.mark.parametrize("query,expected_intent,expected_subject,expected_subtopic", INITIAL_QUESTIONS_DATA)
    def test_initial_question_sync(self, query, expected_intent, expected_subject, expected_subtopic):
        res = process_nlu_sync(query)
        assert isinstance(res, NLUResult)
        assert res.intent == expected_intent, f"Intent mismatch for '{query}'"
        assert res.subject == expected_subject, f"Subject mismatch for '{query}'"
        assert res.subtopic == expected_subtopic, f"Subtopic mismatch for '{query}'"
        assert res.is_ambiguous is False


class TestGroup2StepAnswerAttempts:
    """Group 2: Tests 15 Student Step Answer Attempts & Value Extraction."""

    @pytest.mark.parametrize("query,expected_intent,expected_extracted", STEP_ANSWERS_DATA)
    def test_step_answer_sync(self, query, expected_intent, expected_extracted):
        res = process_nlu_sync(query, current_context=MOCK_STEP_CONTEXT)
        assert isinstance(res, NLUResult)
        assert res.intent == expected_intent, f"Intent mismatch for '{query}'"
        assert res.extracted_answer == expected_extracted, f"Extracted answer mismatch for '{query}'"
        assert res.is_ambiguous is False


class TestGroup3HintRequests:
    """Group 3: Tests 10 Hint and Help Seeking Requests."""

    @pytest.mark.parametrize("query,expected_intent", HINT_REQUESTS_DATA)
    def test_hint_requests_sync(self, query, expected_intent):
        res = process_nlu_sync(query, current_context=MOCK_STEP_CONTEXT)
        assert isinstance(res, NLUResult)
        assert res.intent == expected_intent, f"Intent mismatch for '{query}'"
        assert res.is_ambiguous is False


class TestGroup4PracticeAndNavigation:
    """Group 4: Tests 5 Practice & Step Navigation Requests."""

    @pytest.mark.parametrize("query,expected_intent", PRACTICE_NAVIGATION_DATA)
    def test_practice_navigation_sync(self, query, expected_intent):
        res = process_nlu_sync(query)
        assert isinstance(res, NLUResult)
        assert res.intent == expected_intent, f"Intent mismatch for '{query}'"


class TestGroup5ConceptualClarifications:
    """Group 5: Tests 5 Conceptual Clarification Queries."""

    @pytest.mark.parametrize("query,expected_intent,expected_subject", CONCEPTUAL_CLARIFICATIONS_DATA)
    def test_conceptual_clarification_sync(self, query, expected_intent, expected_subject):
        res = process_nlu_sync(query)
        assert isinstance(res, NLUResult)
        assert res.intent == expected_intent, f"Intent mismatch for '{query}'"
        assert res.subject == expected_subject, f"Subject mismatch for '{query}'"


class TestGroup6GibberishAndOffTopic:
    """Group 6: Tests 5 Gibberish / Ambiguous and Off-Topic Deflections."""

    @pytest.mark.parametrize("query,expected_intent,expected_ambiguous", GIBBERISH_AND_OFFTOPIC_DATA)
    def test_gibberish_and_off_topic_sync(self, query, expected_intent, expected_ambiguous):
        res = process_nlu_sync(query)
        assert isinstance(res, NLUResult)
        assert res.intent == expected_intent, f"Intent mismatch for '{query}'"
        assert res.is_ambiguous is expected_ambiguous, f"Ambiguity mismatch for '{query}'"


class TestFull50CaseBenchmarkAndAsync:
    """Performance & Async Runner for all 50 real elementary test cases."""

    @pytest.mark.asyncio
    async def test_all_50_cases_async(self):
        # Validate async execution across combined sample of cases
        samples = [
            ("what is 15 * 4?", StudentIntent.INITIAL_QUESTION),
            ("12", StudentIntent.STEP_ANSWER_ATTEMPT),
            ("hint please", StudentIntent.REQUEST_CLARIFICATION),
            ("what is a numerator?", StudentIntent.REQUEST_CLARIFICATION),
            ("do you play fortnite?", StudentIntent.OFF_TOPIC),
            ("asdfghjkl", StudentIntent.REQUEST_CLARIFICATION),
        ]
        for q, expected in samples:
            step_ctx = MOCK_STEP_CONTEXT if expected == StudentIntent.STEP_ANSWER_ATTEMPT else None
            res = await process_nlu(q, current_context=step_ctx)
            assert res.intent == expected

    def test_50_case_performance_benchmark(self):
        all_queries = (
            [x[0] for x in INITIAL_QUESTIONS_DATA]
            + [x[0] for x in STEP_ANSWERS_DATA]
            + [x[0] for x in HINT_REQUESTS_DATA]
            + [x[0] for x in PRACTICE_NAVIGATION_DATA]
            + [x[0] for x in CONCEPTUAL_CLARIFICATIONS_DATA]
            + [x[0] for x in GIBBERISH_AND_OFFTOPIC_DATA]
        )
        assert len(all_queries) == 50, f"Expected exactly 50 test cases, found {len(all_queries)}"

        start_time = time.perf_counter()
        for q in all_queries:
            process_nlu_sync(q, current_context=MOCK_STEP_CONTEXT)
        total_time_ms = (time.perf_counter() - start_time) * 1000
        avg_time_ms = total_time_ms / len(all_queries)

        print(f"\n[BENCHMARK] 50 Cases Total Execution Time: {total_time_ms:.2f} ms")
        print(f"[BENCHMARK] Average Latency per Query: {avg_time_ms:.4f} ms")

        # Expect all 50 full pipeline passes in <50ms (<1ms avg)
        assert total_time_ms < 50.0, f"Full suite too slow: {total_time_ms:.2f} ms"
        assert avg_time_ms < 1.0, f"Per query latency too high: {avg_time_ms:.4f} ms"
