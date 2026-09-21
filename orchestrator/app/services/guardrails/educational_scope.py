"""
File: orchestrator/app/services/guardrails/educational_scope.py
Description: Educational scope guardrail deflecting non-homework elementary distractions
             (video games, pop culture, streamers, AI persona chatter)
             back to the active homework step or STEM curriculum.
"""

from __future__ import annotations
import re
from enum import Enum
from typing import Optional, Any, TYPE_CHECKING
from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from app.services.socratic.card_schema import SocraticStep


class OffTopicCategory(str, Enum):
    GAMING = "GAMING"
    POP_CULTURE = "POP_CULTURE"
    AI_PERSONA = "AI_PERSONA"
    GENERAL_CHAT = "GENERAL_CHAT"


class ScopeCheckResult(BaseModel):
    is_off_topic: bool = Field(..., description="True if query is outside Grade 1-3 STEM homework scope")
    category: Optional[OffTopicCategory] = Field(default=None)
    deflection_message: Optional[str] = Field(default=None)


class EducationalScopeDeflector:
    """
    Detects off-topic queries and produces gentle, cheerful redirections.
    If an active SocraticStep exists, redirects right back to the student's homework question!
    """

    _GAMING_RE = re.compile(
        r'\b(?:fortnite|roblox|minecraft|brawl\s+stars|pok[eé]mon|fifa|gta|among\s+us|'
        r'playstation|ps5|xbox|nintendo|switch|v-?bucks|robux|skin|gamer|video\s+game|play\s+games)\b',
        re.IGNORECASE
    )

    _POP_CULTURE_RE = re.compile(
        r'\b(?:mrbeast|mr\s+beast|tik\s*tok|youtube|youtuber|streamer|skibidi|anime|'
        r'taylor\s+swift|disney|cartoons|peppa\s+pig|bluey)\b',
        re.IGNORECASE
    )

    _AI_PERSONA_RE = re.compile(
        r'\b(?:are\s+you\s+(?:a\s+)?(?:real|human|robot|ai|person)|'
        r'how\s+old\s+are\s+you|what\s+is\s+your\s+age|where\s+do\s+you\s+live|'
        r'who\s+(?:made|created)\s+you|do\s+you\s+have\s+(?:feelings|a\s+girlfriend|a\s+boyfriend)|'
        r'will\s+you\s+marry\s+me|tell\s+me\s+a\s+(?:bedtime\s+)?story|sing\s+(?:me\s+)?a\s+song)\b',
        re.IGNORECASE
    )

    def check_scope(self, text: str) -> ScopeCheckResult:
        """
        Classifies whether input is off-topic.
        """
        if not text or not text.strip():
            return ScopeCheckResult(is_off_topic=False)

        if self._GAMING_RE.search(text):
            return ScopeCheckResult(is_off_topic=True, category=OffTopicCategory.GAMING)

        if self._POP_CULTURE_RE.search(text):
            return ScopeCheckResult(is_off_topic=True, category=OffTopicCategory.POP_CULTURE)

        if self._AI_PERSONA_RE.search(text):
            return ScopeCheckResult(is_off_topic=True, category=OffTopicCategory.AI_PERSONA)

        return ScopeCheckResult(is_off_topic=False)

    def build_deflection(
        self,
        text: str,
        category: Optional[OffTopicCategory] = None,
        active_step: Optional[SocraticStep] = None
    ) -> str:
        """
        Constructs a kid-friendly deflection message.
        If active_step is present, bridges directly back to the homework question.
        """
        # Prefix based on detected category
        if category == OffTopicCategory.GAMING:
            reaction = "🎮 Video games are super exciting!"
        elif category == OffTopicCategory.POP_CULTURE:
            reaction = "⭐ That sounds really fun!"
        elif category == OffTopicCategory.AI_PERSONA:
            reaction = "🤖 I'm your friendly science and math buddy!"
        else:
            reaction = "🌟 That's nice to hear!"

        # Mid-problem bridge
        if active_step:
            step_num = active_step.step_number
            your_turn = active_step.your_turn or "What do you think is the next step?"
            return (
                f"{reaction} But right now, we have a mission to complete Step {step_num}! 🚀\n\n"
                f"👉 **Your Turn:** {your_turn}"
            )

        # No active problem welcome bridge
        return (
            f"{reaction} But I am your special Science and Math homework tutor! "
            f"I can't play games or chat about other things, but I love solving fun math puzzles "
            f"and science questions! 🚀\n\n"
            f"What homework problem should we work on together today? ✏️"
        )
