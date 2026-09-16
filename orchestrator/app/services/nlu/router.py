"""
Subject & Subtopic Router for Elementary STEM Socratic Chatbot:
- Routes student queries into SubjectArea (MATH, SCIENCE, GENERAL).
- Tags granular subtopics (e.g. arithmetic, fractions, plants_biology, forces_physics).
- Note: Grade level is selected explicitly by the student in the UI/session context and
  preserved as the source of truth, avoiding erroneous text-based grade guessing.
- Integrates with prompt_controller.get_classification_prompt for Gemini Flash,
  with fast-path deterministic fallback (<1ms).
"""

import os
import re
import asyncio
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

from app.services.nlu.schema import SubjectArea
from app.services.prompts import prompt_controller
from app.services.nlu.normalizer import normalize_text_sync


class RoutingResult(BaseModel):
    """
    Structured domain and subtopic classification result.
    Grade tier is determined at the user profile / session state level.
    """
    subject: SubjectArea = Field(default=SubjectArea.GENERAL, description="Academic subject domain")
    subtopic: str = Field(default="general", description="Granular subtopic")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Classification confidence")
    raw_response: Optional[str] = Field(default=None, description="Raw model response if LLM was called")


# Regex patterns for Math detection
_MATH_OPERATORS_RE = re.compile(r'[+\-*/=^<>]')
_MATH_TERMS_RE = re.compile(
    r'\b(?:calculate|solve|plus|minus|times|multiplied|divided|divide|multiply|'
    r'fraction|fractions|numerator|denominator|half|halves|quarter|quarters|'
    r'perimeter|area|volume|triangle|rectangle|circle|square|polygon|'
    r'sum|product|quotient|difference|remainder|equation|math|algebra|'
    r'convert|conversion|meter|meters|centimeter|centimeters|kilometer|kilometers|'
    r'cm|km|kg|gram|grams|liter|liters|ml|inch|inches|foot|feet|length|width|height)\b',
    flags=re.IGNORECASE
)

# Regex patterns for Science detection
_SCIENCE_TERMS_RE = re.compile(
    r'\b(?:plant|plants|leaf|leaves|chlorophyll|chloroplast|photosynthesis|seed|flower|root|roots|'
    r'cell|cells|organelle|organism|animal|animals|mammal|bird|fish|insect|predator|prey|habitat|ecosystem|'
    r'matter|solid|liquid|gas|evaporation|condensation|precipitation|freeze|melting|'
    r'gravity|force|forces|motion|friction|magnet|magnetic|sound|light|energy|heat|'
    r'planet|planets|earth|moon|sun|solar|star|stars|space|weather|cloud|rain|rock|soil|'
    r'heart|lung|lungs|brain|stomach|skeleton|bone|muscle|organ|human\s+body)\b',
    flags=re.IGNORECASE
)

# Subtopic detection patterns
_WORD_PROBLEM_RE = re.compile(
    r'\b(?:how many|how much|altogether|in all|gave|gives|left|bought|buys|sold|sells|shared?|each|'
    r'apples?|cookies?|candies?|stickers?|pencils?|students?)\b',
    flags=re.IGNORECASE
)

_MATH_SUBTOPICS = [
    ("fractions", re.compile(r'\b(?:fraction|fractions|numerator|denominator|half|halves|quarter|quarters|\d+/\d+)\b', re.I)),
    ("geometry", re.compile(r'\b(?:perimeter|area|volume|triangle|rectangle|circle|square|polygon|shape|shapes|angle|angles)\b', re.I)),
    ("measurement", re.compile(r'\b(?:cm|km|kg|ml|mm|mg|meter|meters|centimeter|centimeters|kilometer|kilometers|gram|grams|liter|liters|inch|inches|feet|foot|length|width|height|convert|conversion)\b', re.I)),
    ("word_problem", _WORD_PROBLEM_RE),
]

_SCIENCE_SUBTOPICS = [
    ("plants_biology", re.compile(r'\b(?:plant|plants|leaf|leaves|chlorophyll|photosynthesis|seed|flower|root|roots)\b', re.I)),
    ("animals_ecosystem", re.compile(r'\b(?:animal|animals|habitat|ecosystem|predator|prey|mammal|bird|fish|insect)\b', re.I)),
    ("matter_chemistry", re.compile(r'\b(?:solid|liquid|gas|matter|evaporation|condensation|precipitation|freeze|melting)\b', re.I)),
    ("forces_physics", re.compile(r'\b(?:gravity|force|forces|motion|friction|magnet|magnetic|energy|sound|light)\b', re.I)),
    ("earth_space", re.compile(r'\b(?:planet|planets|earth|moon|sun|solar|star|stars|space|weather|cloud|rain|rock|soil)\b', re.I)),
]


def _detect_subtopic(query: str, subject: SubjectArea) -> str:
    """Detects granular subtopic within Math or Science."""
    if subject == SubjectArea.MATH:
        for name, pattern in _MATH_SUBTOPICS:
            if pattern.search(query):
                return name
        return "arithmetic"

    if subject == SubjectArea.SCIENCE:
        for name, pattern in _SCIENCE_SUBTOPICS:
            if pattern.search(query):
                return name
        return "general_science"

    return "general"


def route_subject_heuristic(query: str) -> RoutingResult:
    """
    Deterministic fast-path classifier for subject and subtopic (<1ms).
    """
    q = normalize_text_sync(query or "").strip()
    if not q:
        return RoutingResult(subject=SubjectArea.GENERAL, subtopic="general", confidence=0.5)

    math_hits = len(_MATH_TERMS_RE.findall(q))
    if _MATH_OPERATORS_RE.search(q):
        math_hits += 2
    if _WORD_PROBLEM_RE.search(q) and re.search(r'\b\d+\b', q):
        math_hits += 2

    science_hits = len(_SCIENCE_TERMS_RE.findall(q))

    # Decide SubjectArea
    if math_hits > science_hits:
        subject = SubjectArea.MATH
    elif science_hits > math_hits:
        subject = SubjectArea.SCIENCE
    elif math_hits > 0 and science_hits > 0:
        subject = SubjectArea.MATH
    else:
        subject = SubjectArea.GENERAL

    subtopic = _detect_subtopic(q, subject)

    return RoutingResult(
        subject=subject,
        subtopic=subtopic,
        confidence=0.90
    )


async def route_subject(query: str) -> RoutingResult:
    """
    Master Async Subject & Subtopic Router:
    1. Attempts Gemini Flash classification using prompt_controller.get_classification_prompt.
    2. Enriches with granular subtopic.
    3. Falls back gracefully to deterministic rule-based router if offline or unconfigured.
    """
    q = (query or "").strip()
    if not q:
        return route_subject_heuristic(q)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return route_subject_heuristic(q)

    prompt = prompt_controller.get_classification_prompt(query=q)

    try:
        from google import genai
        client = genai.Client(api_key=api_key)

        async def _call_gemini():
            loop = asyncio.get_event_loop()
            resp = await loop.run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
            )
            return resp.text.strip().upper()

        raw_category = await asyncio.wait_for(_call_gemini(), timeout=1.5)

        # Map to SubjectArea
        if "MATH" in raw_category:
            subject = SubjectArea.MATH
        elif "SCIENCE" in raw_category:
            subject = SubjectArea.SCIENCE
        else:
            subject = SubjectArea.GENERAL

        subtopic = _detect_subtopic(q, subject)

        return RoutingResult(
            subject=subject,
            subtopic=subtopic,
            confidence=0.96,
            raw_response=raw_category
        )
    except Exception:
        return route_subject_heuristic(q)


def route_subject_sync(query: str) -> RoutingResult:
    """Synchronous entrypoint for fast-path subject routing."""
    return route_subject_heuristic(query)


# Backwards compatibility aliases
route_subject_and_grade = route_subject
route_subject_and_grade_sync = route_subject_sync
route_subject_and_grade_heuristic = route_subject_heuristic
