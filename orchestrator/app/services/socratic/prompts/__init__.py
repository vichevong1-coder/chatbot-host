"""
Prompts package for Socratic Step Cards & Hint generation.
"""

from app.services.socratic.prompts.controller import (
    SocraticPromptController,
    socratic_prompt_controller,
)

__all__ = ["SocraticPromptController", "socratic_prompt_controller"]
