"""
Unit Tests for Central Dynamic PromptController (orchestrator/app/services/prompts).
"""

import os
import sys
# pyrefly: ignore [missing-import]
import pytest

# Ensure orchestrator is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORCHESTRATOR_DIR = os.path.join(BASE_DIR, "orchestrator")
if ORCHESTRATOR_DIR not in sys.path:
    sys.path.insert(0, ORCHESTRATOR_DIR)

# pyrefly: ignore [missing-import]
from app.services.prompts import (
    prompt_controller,
    PromptController,
)


class TestPromptController:
    """Test all dynamic prompt getters and template formatting."""

    def test_classification_prompt(self):
        query = "What is photosynthesis?"
        prompt = prompt_controller.get_classification_prompt(query)
        assert "MATH, SCIENCE, or GENERAL" in prompt
        assert f"Query: {query}" in prompt

    def test_intent_prompt(self):
        query = "Can you help me?"
        history = "Student: Hi\nTutor: Hello!"
        prompt = prompt_controller.get_intent_prompt(query, history)
        assert "INITIAL_SOLVE" in prompt
        assert "STEP_ATTEMPT" in prompt
        assert query in prompt
        assert history in prompt

    def test_coreference_prompt(self):
        query = "How do they produce it?"
        history = "Student: I am studying green leaves."
        prompt = prompt_controller.get_coreference_prompt(query, history)
        assert "resolve pronouns" in prompt
        assert query in prompt
        assert history in prompt

    def test_concept_prompt(self):
        query = "coulomb law electrostatic force"
        prompt = prompt_controller.get_concept_prompt(query)
        assert "Extract the core scientific concepts" in prompt
        assert query in prompt

    def test_translation_prompts(self):
        khmer_text = "តើមានផ្លែប៉ោមប៉ុន្មាន?"
        english_text = "How many apples are there?"

        to_en = prompt_controller.get_translation_to_english_prompt(khmer_text)
        assert "Translate the following Khmer text to English" in to_en
        assert khmer_text in to_en

        to_kh = prompt_controller.get_translation_to_khmer_prompt(english_text)
        assert "Translate the following English text to Khmer" in to_kh
        assert english_text in to_kh

    def test_rolling_summary_prompt(self):
        summary = "Student was solving 2x + 4 = 10"
        evicted = "Student: I subtracted 4 | Tutor: Great job!"
        prompt = prompt_controller.get_rolling_summary_prompt(summary, evicted)
        assert "summarization assistant" in prompt
        assert summary in prompt
        assert evicted in prompt

    def test_socratic_tutor_prompt_grades_and_hints(self):
        solved_steps = [
            {"expression": "4 * 5 = 20", "hint": "Think about groups of 5"}
        ]
        
        # Test Grade 1-3 first attempt (hint_count=0)
        prompt_g1 = prompt_controller.get_tutor_prompt(
            subject="MATH",
            solved_steps=solved_steps,
            current_step_index=0,
            hint_count=0,
            student_attempt="25",
            grade_level="grade_1_3"
        )
        assert "Grade 1-3" in prompt_g1
        assert "first attempt" in prompt_g1
        assert "4 * 5 = 20" in prompt_g1
        assert "25" in prompt_g1

        # Test Grade 4-6 multiple attempts (hint_count=2)
        prompt_g4 = prompt_controller.get_tutor_prompt(
            subject="MATH",
            solved_steps=solved_steps,
            current_step_index=0,
            hint_count=2,
            student_attempt="15",
            grade_level="grade_4_6"
        )
        assert "Grade 4-6" in prompt_g4
        assert "failed multiple times" in prompt_g4

    def test_general_tutor_prompt(self):
        query = "Why is the ocean blue?"
        prompt = prompt_controller.get_general_tutor_prompt(query)
        assert "friendly Socratic science tutor" in prompt
        assert query in prompt

    def test_practice_generator_prompt(self):
        query = "solve 2*x = 10"
        prompt = prompt_controller.get_practice_prompt(query, "MATH")
        assert "SIMILAR practice exercise" in prompt
        assert query in prompt
        assert "MATH" in prompt

    def test_normalizer_fallback_prompt(self):
        text = "Leo haz l2 apls"
        prompt = prompt_controller.get_normalizer_prompt(text, "english")
        assert "elementary school STEM text normalizer" in prompt
        assert "english" in prompt
        assert text in prompt

    def test_custom_controller_fallback_resilience(self):
        """Ensure PromptController handles missing YAML by falling back to DEFAULT_TEMPLATES."""
        controller = PromptController(templates_path="/non/existent/path/templates.yml")
        prompt = controller.get_classification_prompt("What is gravity?")
        assert "MATH, SCIENCE, or GENERAL" in prompt
        assert "What is gravity?" in prompt


if __name__ == "__main__":
    pytest.main(["-v", __file__])
