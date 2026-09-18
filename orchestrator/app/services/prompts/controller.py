"""
File: orchestrator/app/services/prompts/controller.py
Description: Dynamic Central Prompt Controller class implementation for compiling and managing prompts.
             Loads templates dynamically from templates.yml with local Python fallback dictionary.
             Supports grade-level adaptive instructions, Socratic hinting, translation, and NLU text normalization.
"""

import os
import yaml
from typing import Dict, Any, Optional

# Grade level guidelines map (Elementary School: Grades 1-6)
GRADE_LEVELS = {
    "grade_1_3": {
        "group": "Grade 1-3 (Early Elementary / Primary)",
        "guidelines": (
            "Use extremely simple words and numbers. Avoid algebraic variables (like x, y) or formulas. "
            "Explain using basic counting, simple addition/subtraction, and everyday physical objects (e.g. apples, balls)."
        )
    },
    "grade_4_6": {
        "group": "Grade 4-6 (Upper Elementary / Primary)",
        "guidelines": (
            "Use clear, friendly explanations. Introduce simple single-step variables (e.g., x) gently. "
            "Focus on fractions, basic arithmetic equations, and observable science concepts (plants, animals, weather, simple machines). Avoid complex academic jargon."
        )
    }
}

# Local fallback templates in case templates.yml fails to load or is missing
DEFAULT_TEMPLATES = {
    "classification": {
        "system": (
            "Classify the following query into one of these categories: "
            "MATH, SCIENCE, or GENERAL. "
            "(Topics relating to physics, chemistry, biology, nature, plants, animals, or forces should all be classified as SCIENCE). "
            "Return ONLY the category name as a single word in uppercase. "
            "Do not include formatting, quotes, or markdown."
        ),
        "user": "Query: {query}"
    },
    "intent_classification": {
        "system": (
            "Analyze the user's latest query in the context of the conversation and classify their intent into exactly ONE of the following options:\n"
            "- 'INITIAL_SOLVE': Starting a new science or math question.\n"
            "- 'STEP_ATTEMPT': Submitting an attempt for an ongoing exercise.\n"
            "- 'CLARIFY': Asking a conceptual question or 'why/how'.\n"
            "- 'REQUEST_PRACTICE': Asking for another practice example.\n"
            "- 'CHITCHAT': Greetings or casual chatter.\n"
            "- 'OFF_TOPIC': Video games, pop culture, personal AI questions, or non-academic topics.\n\n"
            "Return ONLY the intent label as a single word in uppercase."
        ),
        "user": "Chat History:\n{chat_history}\n\nLatest Query: '{query}'"
    },
    "coreference_resolution": {
        "system": (
            "Examine the conversation history and rewrite the user's latest query to resolve pronouns (it, this, that) with their original nouns.\n"
            "Return ONLY the rewritten query text."
        ),
        "user": "Chat History:\n{chat_history}\n\nLatest Query: '{query}'"
    },
    "concept_extraction": {
        "system": (
            "Extract the core scientific concepts, keywords, and equations from the query. Filter filler words.\n"
            "Return ONLY the space-separated list of keywords."
        ),
        "user": "Query: '{query}'"
    },
    "translate_khmer_to_english": {
        "system": (
            "Translate the following Khmer text to English. Keep math formulas/equations exactly as-is. "
            "Return ONLY the English text."
        ),
        "user": "Text to translate: '{text}'"
    },
    "translate_english_to_khmer": {
        "system": (
            "Translate the following English text to Khmer. Keep math equations, variables, and LaTeX symbols exactly as-is. "
            "Return ONLY the Khmer text."
        ),
        "user": "Text to translate: '{text}'"
    },
    "rolling_summary": {
        "system": (
            "You are a summarization assistant. Update the following running summary of a tutoring conversation "
            "with these newly evicted turns. Keep the summary concise and focused on the student's progress and active task.\n"
            "Return ONLY the updated summary text. No preamble, no labels, no markdown."
        ),
        "user": "Current Summary: '{rolling_summary}'\n\nNew Turns:\n{evicted_turns}\n\nUpdated summary (under 400 characters):"
    },
    "socratic_tutor": {
        "system": (
            "You are a friendly Socratic science tutor specializing in {subject}.\n"
            "Your absolute core objective is to guide students step-by-step. NEVER reveal the final answer or next formula solution directly.\n"
            "Tutor Persona: {persona_style}\n\n"
            "Target Student Group: {grade_level_group}\n"
            "Tutor Language & Detail Level Guidelines: {grade_level_guidelines}\n\n"
            "--- CURRENT STEP CONTEXT ---\n"
            "Step Index: {step_num} of {total_steps}\n"
            "Expected Math/Science formulation: '{expected_expression}'\n"
            "Hint Count (consecutive errors): {hint_count}\n"
            "Hint Level Guidance: {hint_guidance}\n"
            "----------------------------\n\n"
            "Instructions:\n"
            "1. Be extremely supportive. Praise correct logic, but nudge them gently for mistakes.\n"
            "2. Keep your responses short (2-3 sentences max) to maintain high engagement.\n"
            "3. Use LaTeX formatting for mathematical expressions (e.g., $2x + 4 = 10$).\n"
            "4. Do not include markdown code blocks or tell the student about the 'expected steps' context variables.\n"
            "Output ONLY the tutor's response text. No preamble, no labels, no headers."
        ),
        "user": "Student's latest step attempt: '{student_attempt}'"
    },
    "general_tutor_explanation": {
        "system": (
            "You are a friendly Socratic science tutor for elementary and primary students.\n"
            "The student has asked a general science or math question. Provide a helpful, educational, and "
            "age-appropriate explanation. Break it down step-by-step so it is easy to read.\n"
            "Encourage the student to ask follow-up questions.\n"
            "Constraints: Keep the response under 5 sentences. If you are unsure about a fact, say so rather than guessing.\n"
            "Output ONLY the tutor's explanation. Do not include headers, labels, preamble, or markdown wrappers."
        ),
        "user": "Student's question: '{query}'"
    },
    "practice_generator": {
        "system": (
            "You are an educational curriculum creator for elementary students (Grades 1-6).\n"
            "The student has just successfully solved a problem. Generate a SIMILAR practice exercise "
            "at the same difficulty level and on the same subject.\n"
            "Return ONLY the new exercise text as a single plain-text question. "
            "Do not include answers, explanations, greetings, or markdown formatting. Just the raw question."
        ),
        "user": "Original solved problem: '{original_query}'\nSubject: '{subject}'"
    },
    "normalizer_fallback": {
        "system": (
            "You are an elementary school STEM text normalizer (Grades 1-6).\n"
            "The student language is {lang}.\n"
            "Correct spelling, grammatical errors, and transcribed OCR glitches while PRESERVING ALL numbers and math operators exactly as intended.\n"
            "Do NOT solve the problem. Do NOT add new numbers or explanations.\n"
            "Return ONLY the normalized text. No explanations, no labels, no preamble."
        ),
        "user": "Input text: \"{text}\""
    },
    "off_topic_redirection": {
        "system": (
            "You are a friendly Socratic AI math and science tutor for elementary students ({grade_level_group}).\n"
            "Tutor Language & Style Guidelines: {grade_level_guidelines}\n"
            "Context: {step_context}\n\n"
            "Instructions:\n"
            "1. Playfully and warmly acknowledge the student's comment in half a sentence.\n"
            "2. Enthusiastically redirect them back to their math or science problem in 1 sentence.\n"
            "3. Keep it under 25 words. Do not lecture. Be encouraging and fun!\n"
            "Output ONLY the tutor's response."
        ),
        "user": "Student comment: '{query}'"
    }
}

class PromptController:
    """
    Central Dynamic Prompt Controller for the Socratic Tutor Orchestrator.
    Manages, compiles, and formats dynamic prompt templates with YAML override support.
    """
    def __init__(self, templates_path: Optional[str] = None):
        self.templates_path = templates_path
        self.templates = self._load_templates()

    def _load_templates(self) -> Dict[str, Any]:
        """
        Dynamically loads templates from templates.yml file with fallback merge.
        """
        if self.templates_path:
            yaml_path = self.templates_path
        else:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            yaml_path = os.path.join(current_dir, "templates.yml")

        if os.path.exists(yaml_path):
            try:
                with open(yaml_path, "r", encoding="utf-8") as f:
                    loaded = yaml.safe_load(f)
                    if loaded and isinstance(loaded, dict):
                        # Deep-merge loaded templates with defaults to ensure all keys exist
                        merged = DEFAULT_TEMPLATES.copy()
                        for k, v in loaded.items():
                            if isinstance(v, dict) and k in merged:
                                merged[k] = {**merged[k], **v}
                            else:
                                merged[k] = v
                        return merged
            except Exception as e:
                print(f"Warning: Failed to load templates.yml ({e}). Using in-code DEFAULT_TEMPLATES fallbacks.")
        return DEFAULT_TEMPLATES.copy()

    def reload_templates(self):
        """Forces reloading templates from YAML."""
        self.templates = self._load_templates()

    def get_classification_prompt(self, query: str) -> str:
        """Formats the subject classification prompt for Gemini."""
        system = self.templates["classification"]["system"]
        user = self.templates["classification"]["user"].format(query=query)
        return f"{system}\n\n{user}"

    def get_intent_prompt(self, query: str, chat_history: str) -> str:
        """Formats the intent classification prompt."""
        system = self.templates["intent_classification"]["system"]
        user = self.templates["intent_classification"]["user"].format(query=query, chat_history=chat_history)
        return f"{system}\n\n{user}"

    def get_coreference_prompt(self, query: str, chat_history: str) -> str:
        """Formats the contextual coreference resolution prompt."""
        system = self.templates["coreference_resolution"]["system"]
        user = self.templates["coreference_resolution"]["user"].format(query=query, chat_history=chat_history)
        return f"{system}\n\n{user}"

    def get_concept_prompt(self, query: str) -> str:
        """Formats the concept/keyword extraction prompt for RAG search."""
        system = self.templates["concept_extraction"]["system"]
        user = self.templates["concept_extraction"]["user"].format(query=query)
        return f"{system}\n\n{user}"

    def get_translation_to_english_prompt(self, text: str) -> str:
        """Formats the Khmer to English translation prompt."""
        system = self.templates["translate_khmer_to_english"]["system"]
        user = self.templates["translate_khmer_to_english"]["user"].format(text=text)
        return f"{system}\n\n{user}"

    def get_translation_to_khmer_prompt(self, text: str) -> str:
        """Formats the English to Khmer translation prompt."""
        system = self.templates["translate_english_to_khmer"]["system"]
        user = self.templates["translate_english_to_khmer"]["user"].format(text=text)
        return f"{system}\n\n{user}"

    def get_tutor_prompt(
        self,
        subject: str,
        solved_steps: list,
        current_step_index: int,
        hint_count: int,
        student_attempt: str,
        grade_level: str = "grade_4_6",
        persona_style: str = "Supportive & Engaging Socratic Coach"
    ) -> str:
        """
        Builds the system prompt for the tutor, adapting the hinting level based on mistake count
        and targeting the student's grade level.
        """
        expected_step = solved_steps[current_step_index] if current_step_index < len(solved_steps) else {}
        expected_expression = expected_step.get("expression", "N/A")
        predefined_hint = expected_step.get("hint", "N/A")
        
        grade_info = GRADE_LEVELS.get(grade_level, GRADE_LEVELS["grade_4_6"])
        grade_group = grade_info["group"]
        grade_guidelines = grade_info["guidelines"]

        if hint_count == 0:
            hint_guidance = (
                f"This is the student's first attempt. If their answer is wrong, "
                f"give them a very high-level conceptual hint or ask a leading question. "
                f"Predefined hint reference: '{predefined_hint}'"
            )
        elif hint_count == 1:
            hint_guidance = (
                f"This is the student's second attempt. If their answer is wrong, "
                f"provide a more direct hint highlighting the operation they need to execute. "
                f"Predefined hint reference: '{predefined_hint}'"
            )
        else:
            hint_guidance = (
                f"The student has failed multiple times (3+ attempts). If their answer is wrong, "
                f"break down the step into a simplified sub-step or an easy calculation. "
                f"Simplify the scope of the question so they can gain confidence, but do not state the final step answer directly."
            )
            
        system = self.templates["socratic_tutor"]["system"].format(
            subject=subject,
            persona_style=persona_style,
            grade_level_group=grade_group,
            grade_level_guidelines=grade_guidelines,
            step_num=current_step_index + 1,
            total_steps=len(solved_steps),
            expected_expression=expected_expression,
            hint_count=hint_count,
            hint_guidance=hint_guidance
        )
        user = self.templates["socratic_tutor"]["user"].format(student_attempt=student_attempt)
        
        return f"{system}\n\n{user}"

    def get_general_tutor_prompt(self, query: str) -> str:
        """Formats the general science question prompt for direct educational response."""
        template = self.templates.get("general_tutor_explanation", {})
        system = template.get("system", "")
        user = template.get("user", "Student's question: '{query}'").format(query=query)
        return f"{system}\n\n{user}"

    def get_practice_prompt(self, original_query: str, subject: str) -> str:
        """Formats the prompt to generate an analogous practice question."""
        template = self.templates.get("practice_generator", {})
        system = template.get("system", "")
        user = template.get("user", "Original solved problem: '{original_query}'\nSubject: '{subject}'").format(
            original_query=original_query,
            subject=subject
        )
        return f"{system}\n\n{user}"

    def get_rolling_summary_prompt(self, rolling_summary: str, evicted_turns: str) -> str:
        """Formats the rolling summary prompt for conversation history compaction."""
        system = self.templates["rolling_summary"]["system"]
        user = self.templates["rolling_summary"]["user"].format(
            rolling_summary=rolling_summary,
            evicted_turns=evicted_turns
        )
        return f"{system}\n\n{user}"

    def get_normalizer_prompt(self, text: str, lang: str = "english") -> str:
        """Formats the prompt for Tier-2 NLU bilingual/OCR text normalization fallback."""
        template = self.templates.get("normalizer_fallback", {})
        system = template.get("system", "").format(lang=lang)
        user = template.get("user", "Input text: \"{text}\"").format(text=text)
        return f"{system}\n\n{user}"

    def get_off_topic_redirection_prompt(
        self,
        query: str,
        current_step: Optional[Dict[str, Any]] = None,
        grade_level: str = "grade_4_6",
    ) -> str:
        """Formats the dynamic off-topic deflection and Socratic redirection prompt."""
        grade_info = GRADE_LEVELS.get(grade_level, GRADE_LEVELS["grade_4_6"])
        grade_group = grade_info["group"]
        grade_guidelines = grade_info["guidelines"]

        step_context = f"Current active problem step: {current_step}" if current_step else "No active step (on home screen)."

        system = self.templates["off_topic_redirection"]["system"].format(
            grade_level_group=grade_group,
            grade_level_guidelines=grade_guidelines,
            step_context=step_context,
        )
        user = self.templates["off_topic_redirection"]["user"].format(query=query)
        return f"{system}\n\n{user}"


# Global singleton instance of PromptController
prompt_controller = PromptController()
