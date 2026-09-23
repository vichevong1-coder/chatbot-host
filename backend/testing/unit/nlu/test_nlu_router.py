"""
Unit Tests for NLU Subject & Subtopic Router and Answer Extractor (Option A Architecture).
Grade tier is managed at the student profile/session level and not guessed from query text.
"""

import os
import sys
# pyrefly: ignore [missing-import]
import pytest

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

# pyrefly: ignore [missing-import]
from app.services.nlu import (  # type: ignore
    SubjectArea,
    RoutingResult,
    route_subject,
    route_subject_sync,
    extract_core_answer,
)


class TestSubjectRouting:
    """Test classification into Math, Science, and General subjects."""

    def test_math_queries(self):
        math_queries = [
            "What is 4 x 5?",
            "Solve 4x + 5 = 25",
            "What is 10 divided by 2?",
            "Calculate the perimeter of a rectangle with length 5 and width 3",
            "What is 3/4 + 1/2?",
        ]
        for q in math_queries:
            res = route_subject_sync(q)
            assert res.subject == SubjectArea.MATH, f"Expected MATH for: '{q}', got '{res.subject}'"

    def test_science_queries(self):
        science_queries = [
            "Why do leaves change color in the fall?",
            "How do plants make food with photosynthesis and chlorophyll?",
            "What causes rain and evaporation in the water cycle?",
            "How does gravity make objects fall to earth?",
            "Which planet is closest to the sun in our solar system?",
        ]
        for q in science_queries:
            res = route_subject_sync(q)
            assert res.subject == SubjectArea.SCIENCE, f"Expected SCIENCE for: '{q}', got '{res.subject}'"

    def test_general_queries(self):
        res = route_subject_sync("Hello there, how are you?")
        assert res.subject == SubjectArea.GENERAL
        assert res.subtopic == "general"


class TestSubtopicTagging:
    """Test granular subtopic categorization within Math and Science."""

    def test_math_subtopics(self):
        assert route_subject_sync("What is 3/4 + 1/2?").subtopic == "fractions"
        assert route_subject_sync("Find the perimeter and area of this rectangle").subtopic == "geometry"
        assert route_subject_sync("Convert 5 meters to centimeters").subtopic == "measurement"
        assert route_subject_sync("Leo has 5 apples and gives 2 to Maya").subtopic == "word_problem"
        assert route_subject_sync("What is 10 + 20?").subtopic == "arithmetic"

    def test_science_subtopics(self):
        assert route_subject_sync("How does chlorophyll help leaves?").subtopic == "plants_biology"
        assert route_subject_sync("What is an apex predator in a food chain?").subtopic == "animals_ecosystem"
        assert route_subject_sync("How does water turn from liquid to gas during evaporation?").subtopic == "matter_chemistry"
        assert route_subject_sync("How do magnetic forces attract metals?").subtopic == "forces_physics"
        assert route_subject_sync("How many planets orbit the sun in our solar system?").subtopic == "earth_space"


class TestAnswerExtraction:
    """Test Day 7 answer extraction from student answer attempts."""

    def test_extract_core_values(self):
        assert extract_core_answer("I think the answer is 12 cookies") == "12"
        assert extract_core_answer("It happens in the chloroplast") == "chloroplast"
        assert extract_core_answer("Maybe 3/4?") == "3/4"
        assert extract_core_answer("Is it 5?") == "5"
        assert extract_core_answer("Could it be 15 km/h?") == "15 km/h"
        assert extract_core_answer("The answer is 50 m^3") == "50 m^3"

    def test_extract_pure_inputs(self):
        assert extract_core_answer("42") == "42"
        assert extract_core_answer("1/2") == "1/2"
        assert extract_core_answer("") is None
        assert extract_core_answer("   ") is None


@pytest.mark.asyncio
async def test_async_route_subject():
    """Verify master async entrypoint functions properly."""
    res = await route_subject("Why do leaves change color in the fall?")
    assert isinstance(res, RoutingResult)
    assert res.subject == SubjectArea.SCIENCE
    assert res.subtopic == "plants_biology"
    assert res.confidence >= 0.8


if __name__ == "__main__":
    pytest.main(["-v", __file__])
