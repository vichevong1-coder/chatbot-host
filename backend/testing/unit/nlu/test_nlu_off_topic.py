"""
Pytest Suite for Day 12: Off-Topic Deflection Tagging & Socratic Redirection.
Validates video games, pop culture, internet memes, personal AI questions,
context preservation during active steps, false-positive protection, and prompt generation.
"""

import os
import sys
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
        classify_intent_sync,
        IntentType,
        StudentIntent,
        SubjectArea,
        get_off_topic_redirection_prompt,
    )
except ImportError:
    from orchestrator.app.services.nlu import (  # type: ignore
        process_nlu_sync,
        process_nlu,
        classify_intent_sync,
        IntentType,
        StudentIntent,
        SubjectArea,
        get_off_topic_redirection_prompt,
    )


class TestOffTopicClassification:
    """Tests detection of video games, pop culture, and personal AI queries."""

    def test_video_games(self):
        queries = [
            "do you play fortnite?",
            "what is your roblox username?",
            "i love playing minecraft",
            "can we play brawl stars together?",
            "do you like pokemon?",
            "have you played gta?",
            "are you an among us gamer?",
        ]
        for q in queries:
            res = classify_intent_sync(q)
            assert res.intent == IntentType.OFF_TOPIC, f"Failed on: {q}"

    def test_pop_culture_and_memes(self):
        queries = [
            "do you watch mrbeast?",
            "tell me about skibidi toilet",
            "do you like taylor swift?",
            "i saw this cool tiktok video",
            "what is your favorite anime?",
            "who is your favorite youtuber?",
        ]
        for q in queries:
            res = classify_intent_sync(q)
            assert res.intent == IntentType.OFF_TOPIC, f"Failed on: {q}"

    def test_personal_bot_inquiries(self):
        queries = [
            "are you real?",
            "how old are you?",
            "where do you live?",
            "are you human or a robot?",
            "do you have a girlfriend?",
            "who created you?",
            "tell me a bedtime story",
            "write me a poem about cats",
        ]
        for q in queries:
            res = classify_intent_sync(q)
            assert res.intent == IntentType.OFF_TOPIC, f"Failed on: {q}"


class TestActiveStepOffTopicDisambiguation:
    """Tests that off-topic queries during an active step are tagged as OFF_TOPIC, not STEP_ATTEMPT."""

    def test_off_topic_during_step(self):
        step = {"step_number": 2, "question": "What is 4 * 5?"}
        queries = [
            "do you like fortnite?",
            "can we play roblox?",
            "how old are you?",
        ]
        for q in queries:
            res = classify_intent_sync(q, current_step=step)
            assert res.intent == IntentType.OFF_TOPIC, f"Failed on: {q} with active step"
            assert res.extracted_answer is None


class TestOffTopicPipelineIntegration:
    """Tests end-to-end integration with process_nlu_sync and Golden Schema."""

    def test_pipeline_maps_off_topic_intent(self):
        queries = [
            "do you play fortnite?",
            "tell me about skibidi toilet",
            "are you a real human?",
        ]
        for q in queries:
            res = process_nlu_sync(q)
            assert res.intent == StudentIntent.OFF_TOPIC
            assert res.extracted_answer is None
            assert res.is_ambiguous is False

    @pytest.mark.asyncio
    async def test_pipeline_async_off_topic(self):
        res = await process_nlu("do you like roblox?")
        assert res.intent == StudentIntent.OFF_TOPIC


class TestOffTopicRedirectionPrompts:
    """Tests age-appropriate Socratic redirection prompts."""

    def test_active_step_redirection(self):
        step = {"step_number": 1, "question": "What is 5 * 5?"}
        prompt = get_off_topic_redirection_prompt(step, grade_level="grade_4_6")
        assert "focused" in prompt.lower() or "answer" in prompt.lower() or "step" in prompt.lower()

    def test_no_step_redirection(self):
        prompt = get_off_topic_redirection_prompt(None, grade_level="grade_4_6")
        assert "math" in prompt.lower() or "science" in prompt.lower()

    def test_early_elementary_redirection(self):
        prompt = get_off_topic_redirection_prompt(None, grade_level="grade_1_3")
        assert "superpower" in prompt.lower() or "fun" in prompt.lower()


class TestMathProblemWithGamingNamesNotOffTopic:
    """Ensures math word problems mentioning game names are NOT flagged as off-topic."""

    def test_word_problem_with_game_character(self):
        res = process_nlu_sync("Steve has 12 blocks of wood in Minecraft and uses 4, how many are left?")
        assert res.intent == StudentIntent.INITIAL_QUESTION
        assert res.subject == SubjectArea.MATH
