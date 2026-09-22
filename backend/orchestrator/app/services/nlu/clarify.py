"""
Kid-Friendly Ambiguity and Gibberish Detection Engine for Socratic Chatbot.
File: orchestrator/app/services/nlu/clarify.py

Objective:
Detects keyboard smashes, punctuation spam, single filler non-answers, and 
unparseable student noise deterministically in <0.2ms.
Generates encouraging, developmentally appropriate Socratic re-prompts 
without crashing or triggering unnecessary LLM overhead.
"""

from __future__ import annotations
import re
from enum import Enum
from typing import Optional, Dict, Any, List, Set
from pydantic import BaseModel, Field


class AmbiguityType(str, Enum):
    """Specific categories of student input ambiguity or gibberish."""
    NONE = "NONE"
    EMPTY_INPUT = "EMPTY_INPUT"
    KEYBOARD_SMASH = "KEYBOARD_SMASH"
    PUNCTUATION_SPAM = "PUNCTUATION_SPAM"
    CONSONANT_CLUSTER = "CONSONANT_CLUSTER"
    REPEATED_CHARS = "REPEATED_CHARS"
    FILLER_NON_ANSWER = "FILLER_NON_ANSWER"


class AmbiguityResult(BaseModel):
    """Structured result of ambiguity detection and kid clarification prompt."""
    is_ambiguous: bool = Field(default=False, description="True if text is gibberish or unparseable")
    reason: AmbiguityType = Field(default=AmbiguityType.NONE, description="Detected ambiguity category")
    clarification_prompt: Optional[str] = Field(
        default=None,
        description="Kid-friendly Socratic re-prompt when is_ambiguous is True"
    )


# Common English words that contain only consonants or use 'y' as vowel
_VALID_NO_VOWEL_WORDS: Set[str] = {
    "rhythm", "rhythms", "fly", "fry", "dry", "cry", "shy", "sky", "spy", 
    "try", "why", "gym", "gyms", "myth", "myths", "lynx", "crypt", "cyst",
    "by", "my", "sync", "nymph", "pygmy", "glyph", "hymn", "tsk", "shh"
}

# Common English words with 4+ consonant clusters (e.g. "ngth", "str", "ght", "tch")
_VALID_CONSONANT_CLUSTER_WORDS: Set[str] = {
    "length", "lengths", "strength", "strengths", "eighth", "eighths", "twelfth", "twelfths",
    "scratch", "scratched", "spring", "springs", "splash", "splashed", "straight", "through",
    "thought", "thoughts", "bright", "knight", "knights", "night", "nights", "flight", "flights",
    "sight", "sights", "weight", "weights", "height", "heights", "bought", "brought", "caught",
    "taught", "match", "matches", "watch", "watches", "catch", "catches", "patch", "patches",
    "fetch", "fetched", "switch", "switches", "stitch", "stitches", "sphere", "spheres",
    "photosynthesis", "chloroplast", "chlorophyll", "respiration", "ecosystem", "ecosystems",
    "microscope", "microscopes", "telescope", "telescopes", "experiment", "experiments"
}

# Keyboard row sequences (length 4+)
_KEYBOARD_PATTERNS: List[re.Pattern] = [
    re.compile(r"asdf|sdfg|dfgh|fghj|ghjk|hjkl|jkl;", re.IGNORECASE),
    re.compile(r"qwer|wert|erty|rtyu|tyui|yuio|uiop", re.IGNORECASE),
    re.compile(r"zxcv|xcvb|cvbn|vbnm", re.IGNORECASE),
    re.compile(r"lkjh|kjhg|jhgf|hgfd|gfds|fdsa", re.IGNORECASE),
    re.compile(r"poiu|oiuy|iuyt|uytr|ytre|trew|rewq", re.IGNORECASE),
    re.compile(r"mnbv|nbvc|bvcx|vcxz", re.IGNORECASE),
]

# Filler utterances that contain no academic intent or answer
_FILLER_WORDS: Set[str] = {
    "um", "uh", "eh", "er", "erm", "huh", "hmm", "hmmm", "k", "kk", "blah", "meh"
}

# Punctuation only or spam patterns
_PUNCTUATION_ONLY_REGEX = re.compile(r"^[\s\W_]+$")
_REPEATED_CHAR_REGEX = re.compile(r"(.)\1{3,}", re.IGNORECASE)  # 4 or more same chars in a row
_CONSONANT_CLUSTER_REGEX = re.compile(r"[bcdfghjklmnpqrstvwxz]{5,}", re.IGNORECASE)  # 5+ consonants in a row


def is_step_active(current_step: Optional[Dict[str, Any]]) -> bool:
    """Helper to check if student is actively answering a step question."""
    if not current_step or not isinstance(current_step, dict):
        return False
    return bool(
        current_step.get("question")
        or current_step.get("step_number")
        or current_step.get("target_concept")
        or current_step.get("expected_answer")
    )


def get_kid_friendly_reprompt(
    reason: AmbiguityType,
    current_step: Optional[Dict[str, Any]] = None,
    grade_level: str = "grade_4_6",
) -> str:
    """
    Generates a gentle, encouraging Socratic re-prompt tailored for elementary students.
    """
    has_step = is_step_active(current_step)
    is_early_elementary = "1_3" in str(grade_level).lower()

    if has_step:
        if is_early_elementary:
            return "Oops! My robot ears didn't hear that. What number or word do you think is the answer?"
        return "I didn't quite catch that! What answer or step do you think comes next?"
    else:
        if is_early_elementary:
            return "Oops! I didn't understand that. What fun math or science question would you like to explore?"
        return "I didn't quite catch that! What math or science question would you like help with today?"


def detect_ambiguity(
    text: Optional[str],
    current_step: Optional[Dict[str, Any]] = None,
    grade_level: str = "grade_4_6",
) -> AmbiguityResult:
    """
    Fast-path deterministic ambiguity and gibberish detector (<0.2ms).
    Returns an AmbiguityResult with kid-friendly clarification prompts.
    """
    if text is None or not str(text).strip():
        return AmbiguityResult(
            is_ambiguous=True,
            reason=AmbiguityType.EMPTY_INPUT,
            clarification_prompt=get_kid_friendly_reprompt(AmbiguityType.EMPTY_INPUT, current_step, grade_level),
        )

    raw = str(text).strip()
    cleaned_lower = raw.lower()

    # 1. Check for pure punctuation / symbol spam (e.g., "???", "!!!", "....", "!?!?")
    if _PUNCTUATION_ONLY_REGEX.match(raw):
        return AmbiguityResult(
            is_ambiguous=True,
            reason=AmbiguityType.PUNCTUATION_SPAM,
            clarification_prompt=get_kid_friendly_reprompt(AmbiguityType.PUNCTUATION_SPAM, current_step, grade_level),
        )

    # 2. Check for empty filler utterances (e.g. "um", "uh", "k", "eh", "huh")
    if cleaned_lower in _FILLER_WORDS:
        return AmbiguityResult(
            is_ambiguous=True,
            reason=AmbiguityType.FILLER_NON_ANSWER,
            clarification_prompt=get_kid_friendly_reprompt(AmbiguityType.FILLER_NON_ANSWER, current_step, grade_level),
        )

    # 3. Check for 4+ identical repeated characters (e.g., "aaaaa", "zzzzzzzz")
    if _REPEATED_CHAR_REGEX.search(cleaned_lower):
        match = _REPEATED_CHAR_REGEX.search(cleaned_lower)
        if match and match.group(1).isalpha():
            return AmbiguityResult(
                is_ambiguous=True,
                reason=AmbiguityType.REPEATED_CHARS,
                clarification_prompt=get_kid_friendly_reprompt(AmbiguityType.REPEATED_CHARS, current_step, grade_level),
            )

    # 4. Check for keyboard row smashes (e.g. "asdfghjkl", "qwertyuiop", "zxcvbn")
    for pattern in _KEYBOARD_PATTERNS:
        if pattern.search(cleaned_lower):
            words = cleaned_lower.split()
            if any(pattern.search(w) and len(w) >= 4 for w in words):
                return AmbiguityResult(
                    is_ambiguous=True,
                    reason=AmbiguityType.KEYBOARD_SMASH,
                    clarification_prompt=get_kid_friendly_reprompt(AmbiguityType.KEYBOARD_SMASH, current_step, grade_level),
                )

    # 5. Check for consonant clusters / words without standard vowels
    # Avoid Khmer script (which uses Unicode range \u1780-\u17FF)
    is_khmer = bool(re.search(r"[\u1780-\u17FF]", raw))
    if not is_khmer:
        words = re.findall(r"[a-zA-Z]+", cleaned_lower)
        all_letters = "".join(words)
        total_letters = len(all_letters)
        total_vowels = len(re.findall(r"[aeiouy]", all_letters))

        # If it's a multi-word sentence with healthy overall vowel ratio (>=20%), don't trigger cluster errors on valid vocab
        is_balanced_sentence = len(words) >= 3 and total_letters >= 8 and (total_vowels / max(total_letters, 1) >= 0.20)

        if not is_balanced_sentence:
            for w in words:
                if len(w) >= 4 and w not in _VALID_NO_VOWEL_WORDS and w not in _VALID_CONSONANT_CLUSTER_WORDS:
                    # Count traditional vowels
                    vowels = len(re.findall(r"[aeiou]", w))
                    if vowels == 0 and w not in _VALID_NO_VOWEL_WORDS:
                        return AmbiguityResult(
                            is_ambiguous=True,
                            reason=AmbiguityType.CONSONANT_CLUSTER,
                            clarification_prompt=get_kid_friendly_reprompt(AmbiguityType.CONSONANT_CLUSTER, current_step, grade_level),
                        )
                # Check 5+ consecutive consonants
                if _CONSONANT_CLUSTER_REGEX.search(w) and w not in _VALID_CONSONANT_CLUSTER_WORDS and w not in _VALID_NO_VOWEL_WORDS:
                    return AmbiguityResult(
                        is_ambiguous=True,
                        reason=AmbiguityType.CONSONANT_CLUSTER,
                        clarification_prompt=get_kid_friendly_reprompt(AmbiguityType.CONSONANT_CLUSTER, current_step, grade_level),
                    )

    # Passed all ambiguity tests -> Clean & Valid
    return AmbiguityResult(
        is_ambiguous=False,
        reason=AmbiguityType.NONE,
        clarification_prompt=None,
    )


def is_gibberish_sync(text: str) -> bool:
    """Fast boolean helper for quick gibberish checks."""
    return detect_ambiguity(text).is_ambiguous
