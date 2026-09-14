"""
File: orchestrator/app/services/prompts/__init__.py
Description: Package initialization for dynamic central prompting service.
             Exposes the global prompt_controller, PromptController, GRADE_LEVELS, and DEFAULT_TEMPLATES.
"""

from app.services.prompts.controller import (
    prompt_controller,
    PromptController,
    GRADE_LEVELS,
    DEFAULT_TEMPLATES,
)

__all__ = [
    "prompt_controller",
    "PromptController",
    "GRADE_LEVELS",
    "DEFAULT_TEMPLATES",
]
