"""
File: orchestrator/app/services/guardrails/safety_filter.py
Description: Child safety pre-filter for Grade 1–3 elementary STEM tutoring.
             Detects and redacts PII (phones, emails, addresses, real names)
             and blocks inappropriate content (profanity, bullying, self-harm, adult content)
             using gentle, non-punitive, child-safe boundary messages.
"""

import re
from enum import Enum
from typing import List, Tuple, Optional
from pydantic import BaseModel, Field


class SafetyCategory(str, Enum):
    SAFE = "SAFE"
    PII = "PII"   # Personal Identifiable Information 
    PROFANITY = "PROFANITY"
    BULLYING = "BULLYING"
    SELF_HARM = "SELF_HARM"
    VIOLENCE = "VIOLENCE"
    INAPPROPRIATE = "INAPPROPRIATE"


class SafetyResult(BaseModel):
    is_safe: bool = Field(..., description="True if content is safe to proceed")
    categories_detected: List[SafetyCategory] = Field(default_factory=list)
    has_pii: bool = Field(default=False, description="True if personal identifiable information was found")
    redacted_text: str = Field(..., description="Sanitized text with PII replaced by protective tokens")
    safe_response: Optional[str] = Field(default=None, description="Child-friendly redirection response if unsafe")
    pii_notice: Optional[str] = Field(default=None, description="Privacy reminder if PII was detected")


class SafetyFilter:
    """
    Early elementary safety filter:
    - Redacts PII so the student's problem can still proceed safely if valid.
    - Blocks inappropriate, abusive, or dangerous prompts with supportive redirection.
    """

    # --- PII Regex Patterns ---
    _PHONE_RE = re.compile(
        r'(?:\+?1[-.\s]?)?\(?\b[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
    )
    _EMAIL_RE = re.compile(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
    )
    _ADDRESS_RE = re.compile(
        r'\b\d{1,5}\s+[A-Za-z0-9\s.,]+?\b(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Terrace|Ter|Place|Pl|Circle|Cir)\b',
        re.IGNORECASE
    )
    _NAME_INTRO_RE = re.compile(
        r'\b(?:my\s+name\s+is|i\s+am|call\s+me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)',
        re.IGNORECASE
    )

    # --- Inappropriate Patterns (Elementary Kid-Filtered) ---
    _PROFANITY_RE = re.compile(
        r'\b(?:damn|hell|crap|shit|fuck|bitch|ass|asshole|bastard|dick|piss)\b',
        re.IGNORECASE
    )
    _BULLYING_RE = re.compile(
        r'\b(?:you(?:\'?re|\s+are)\s+(?:stupid|dumb|ugly|an\s+idiot|trash|worthless)|'
        r'shut\s+up|i\s+hate\s+you|loser|get\s+lost)\b',
        re.IGNORECASE
    )
    _SELF_HARM_RE = re.compile(
        r'\b(?:kill\s+myself|want\s+to\s+die|hurt\s+myself|suicide|cutting\s+myself)\b',
        re.IGNORECASE
    )
    _VIOLENCE_RE = re.compile(
        r'\b(?:shoot\s+(?:you|everyone|people|kids|school)|gun|bomb|murder|blood|knife|kill\s+you)\b',
        re.IGNORECASE
    )
    _ADULT_RE = re.compile(
        r'\b(?:sex|sexy|porn|nude|naked|penis|vagina|boobs)\b',
        re.IGNORECASE
    )

    def redact_pii(self, text: str) -> Tuple[str, bool]:
        """
        Redacts personal identifying data, preserving surrounding homework problem.
        Returns: (sanitized_text, pii_found)
        """
        redacted = text
        pii_found = False

        if self._PHONE_RE.search(redacted):
            redacted = self._PHONE_RE.sub("[PHONE_REDACTED]", redacted)
            pii_found = True

        if self._EMAIL_RE.search(redacted):
            redacted = self._EMAIL_RE.sub("[EMAIL_REDACTED]", redacted)
            pii_found = True

        if self._ADDRESS_RE.search(redacted):
            redacted = self._ADDRESS_RE.sub("[ADDRESS_REDACTED]", redacted)
            pii_found = True

        match_name = self._NAME_INTRO_RE.search(redacted)
        if match_name:
            full_name = match_name.group(1)
            redacted = redacted.replace(full_name, "[NAME_REDACTED]")
            pii_found = True

        return redacted, pii_found

    def evaluate(self, text: str) -> SafetyResult:
        """
        Full evaluation of child safety and PII.
        """
        if not text or not text.strip():
            return SafetyResult(is_safe=True, redacted_text="")

        categories: List[SafetyCategory] = []
        clean_text, has_pii = self.redact_pii(text)

        if has_pii:
            categories.append(SafetyCategory.PII)

        # 1. Critical Self-Harm Check (Highest Priority)
        if self._SELF_HARM_RE.search(text):
            categories.append(SafetyCategory.SELF_HARM)
            return SafetyResult(
                is_safe=False,
                categories_detected=categories,
                has_pii=has_pii,
                redacted_text=clean_text,
                safe_response=(
                    "💙 You are very important and special. If you are feeling sad or hurt, "
                    "please talk right away to a parent, teacher, or another trusted adult who cares about you."
                )
            )

        # 2. Violence / Threat Check
        if self._VIOLENCE_RE.search(text):
            categories.append(SafetyCategory.VIOLENCE)
            return SafetyResult(
                is_safe=False,
                categories_detected=categories,
                has_pii=has_pii,
                redacted_text=clean_text,
                safe_response=(
                    "🛡️ Let's keep our learning space safe and friendly for everyone! "
                    "What fun math puzzle or science experiment can we explore together?"
                )
            )

        # 3. Adult Content Check
        if self._ADULT_RE.search(text):
            categories.append(SafetyCategory.INAPPROPRIATE)
            return SafetyResult(
                is_safe=False,
                categories_detected=categories,
                has_pii=has_pii,
                redacted_text=clean_text,
                safe_response=(
                    "🌟 Let's focus on our school homework! What math or science question "
                    "would you like help with today?"
                )
            )

        # 4. Profanity Check
        if self._PROFANITY_RE.search(text):
            categories.append(SafetyCategory.PROFANITY)
            return SafetyResult(
                is_safe=False,
                categories_detected=categories,
                has_pii=has_pii,
                redacted_text=clean_text,
                safe_response=(
                    "✨ Oops! Let's use nice and kind words here. "
                    "Ready to solve your homework problem together?"
                )
            )

        # 5. Bullying Check
        if self._BULLYING_RE.search(text):
            categories.append(SafetyCategory.BULLYING)
            return SafetyResult(
                is_safe=False,
                categories_detected=categories,
                has_pii=has_pii,
                redacted_text=clean_text,
                safe_response=(
                    "💛 Kind words make learning fun! I'm here to help you do your best. "
                    "Let's work on our homework problem together!"
                )
            )

        # If only PII was detected, content is safe to proceed with a gentle privacy reminder
        pii_notice = None
        if has_pii:
            pii_notice = "🔒 *Privacy Tip: Keep your secret information safe! Never share real phone numbers or addresses online.*"

        return SafetyResult(
            is_safe=True,
            categories_detected=categories,
            has_pii=has_pii,
            redacted_text=clean_text,
            pii_notice=pii_notice
        )
