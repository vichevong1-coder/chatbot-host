"""
Intent Classification & Structured Answer Extraction Engine for Elementary STEM Socratic Chatbot.
- Structured Gemini 2.5 Flash intent classifier returning JSON adhering to StudentIntent.
- Structured core answer extractor cleaning conversational filler ('I think 12' -> '12').
- High-speed deterministic fallback heuristic for offline/sub-millisecond evaluation (<1ms).
"""

import os
import re
import asyncio
from typing import Optional, Dict, Any, Union, List
from enum import Enum
from pydantic import BaseModel, Field
from app.services.prompts import prompt_controller
from app.services.nlu.normalizer import normalize_text_sync

class IntentType(str, Enum):
    INITIAL_SOLVE = "INITIAL_SOLVE"
    STEP_ATTEMPT = "STEP_ATTEMPT"
    CLARIFY = "CLARIFY"
    REQUEST_PRACTICE = "REQUEST_PRACTICE"
    CHITCHAT = "CHITCHAT"

class IntentResult(BaseModel):
    intent: IntentType = Field(..., description="Classified Intent Label")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence Score 0.0 - 1.0")
    extracted_answer: Optional[str] = Field(default=None, description="Cleaned core answer if intent is STEP_ATTEMPT (e.g. '12', 'chloroplast')")
    raw_response: Optional[str] = None

# Fast-path greeting and casual phrases
_CHITCHAT_RE = re.compile(
    r'^(?:hi|hello|hey|greetings|good\s+(?:morning|afternoon|evening)|'
    r'thanks(?:\s+(?:a\s+lot|so\s+much|very\s+much))?|'
    r'thank\s+you(?:\s+(?:so\s+much|very\s+much))?|'
    r'thx|ty|tysm|bye|goodbye|see\s+ya|cya)[\s!.]*$',
    flags=re.IGNORECASE
)

# Help & stuck expressions
_HELP_SEEKING_RE = re.compile(
    r'^(?:'
    r'idk|'
    r'i\s+don\'?t\s+know|'
    r'i\s+dont\s+know|'
    r'help(?:\s+me)?|'
    r'hint(?:\s+please)?|'
    r'give\s+me\s+a\s+hint|'
    r'can\s+i\s+have\s+a\s+hint|'
    r'clue(?:\s+please)?|'
    r'give\s+me\s+a\s+clue|'
    r'what\s+next|'
    r'what\s+do\s+i\s+do|'
    r'i\'?m\s+stuck|'
    r'im\s+stuck|'
    r'not\s+sure|'
    r'i\s+don\'?t\s+get\s+it|'
    r'i\s+dont\s+get\s+it|'
    r'i\s+need\s+help|'
    r'can\s+you\s+help(?:\s+me)?|'
    r'no\s+idea'
    r')[\s!.]*$',
    flags=re.IGNORECASE
)

# Clarification question patterns
_CLARIFY_RE = re.compile(
    r'^(?:what\s+(?:is|are|does)|why\s+(?:is|are|does|do)|how\s+(?:does|do|can)|explain|define)\b',
    flags=re.IGNORECASE
)

# Practice request patterns
_PRACTICE_RE = re.compile(
    r'\b(?:another\s+one|more\s+practice|practice\s+problem|give\s+me\s+another|next\s+question)\b',
    flags=re.IGNORECASE
)

# Conversational hedging and answer prefixes
_ANSWER_PREFIXES = re.compile(
    r'^(?:'
    r'i\s+(?:think|believe|guess)(?:\s+(?:that|the\s+answer\s+is|it\s+is|it\'?s))?|'
    r'the\s+answer\s+(?:is|might\s+be|could\s+be)|'
    r'it\s+(?:happens\s+in\s+the|happens\s+in|is\s+in\s+the|is\s+in|is|was|\'s)|'
    r'(?:could|might)\s+it\s+be|'
    r'is\s+it|'
    r'maybe\s+it\s+is|'
    r'maybe|'
    r'probably|'
    r'what\s+about|'
    r'how\s+about'
    r')\s+',
    flags=re.IGNORECASE
)


def is_step_active(current_step: Optional[Dict[str, Any]]) -> bool:
    """
    Checks whether current_step represents an active tutoring step in progress.
    Returns True if current_step is a non-empty dict and not flagged inactive.
    """
    if not current_step or not isinstance(current_step, dict):
        return False
    if current_step.get("active") is False:
        return False
    return any(v is not None and v != "" for v in current_step.values())


def extract_core_answer(text: str) -> Optional[str]:
    """
    Cleans conversational hedging, intros, and trailing punctuation from student answer attempts:
    - 'I think the answer is 12 cookies' -> '12'
    - 'It happens in the chloroplast' -> 'chloroplast'
    - 'Maybe 3/4?' -> '3/4'
    - 'Is it 5?' -> '5'
    - 'Could it be 15 km/h?' -> '15 km/h'
    """
    if not text or not text.strip():
        return None

    cleaned = text.strip()

    # 1. Normalize numbers and units first (e.g. "5cm" -> "5 cm")
    cleaned = normalize_text_sync(cleaned)

    # 2. Strip leading hedging phrases iteratively
    for _ in range(2):
        cleaned = _ANSWER_PREFIXES.sub('', cleaned).strip()

    # 3. Strip trailing punctuation often used in hedging ('?', '!', '.')
    cleaned = re.sub(r'[\?!.]+$', '', cleaned).strip()

    # 4. If answer is numeric with unit words (e.g. "12 cookies" or "12 apples")
    match_num_units = re.match(
        r'^(\d+(?:\.\d+)?(?:/\d+)?)\s+(?:apples?|cookies?|candies?|students?|oranges?)$',
        cleaned,
        flags=re.IGNORECASE
    )
    if match_num_units:
        return match_num_units.group(1)

    return cleaned if cleaned else None


def disambiguate_step_input(
    query: str,
    current_step: Optional[Dict[str, Any]] = None,
    history: Optional[Union[str, List[Dict[str, Any]]]] = None,
    rolling_summary: Optional[str] = None
) -> Optional[IntentResult]:
    """
    Step Context Disambiguation Engine:
    Disambiguates short, single-token student answers and help-seeking phrases
    when an active tutoring step is in progress.
    Returns IntentResult if disambiguated, or None if outside step disambiguation.
    """
    if not is_step_active(current_step):
        return None

    q = (query or "").strip()
    if not q:
        return IntentResult(intent=IntentType.CHITCHAT, confidence=0.5)

    # 1. Greetings & Pleasantries during active step
    if _CHITCHAT_RE.match(q):
        return IntentResult(intent=IntentType.CHITCHAT, confidence=0.98)

    # 2. Help & Stuck expressions during active step -> CLARIFY
    if _HELP_SEEKING_RE.match(q):
        return IntentResult(intent=IntentType.CLARIFY, confidence=0.95)

    # 3. Practice Requests
    if _PRACTICE_RE.search(q):
        return IntentResult(intent=IntentType.REQUEST_PRACTICE, confidence=0.95)

    # 4. Clarification questions (e.g. 'What is a numerator?')
    if _CLARIFY_RE.match(q) and not any(op in q for op in ['+', '-', '*', '/', '=']):
        return IntentResult(intent=IntentType.CLARIFY, confidence=0.90)

    # 5. Short student answer attempt
    # Clean answer to remove conversational hedging (e.g. 'I think 12' -> '12')
    extracted = extract_core_answer(q)
    word_count = len(q.split())
    extracted_word_count = len(extracted.split()) if extracted else 0

    is_short = word_count <= 4 or (extracted and extracted_word_count <= 4)
    is_numeric_math = bool(re.match(r'^-?\d+(?:\.\d+)?(?:/\d+)?(?:\s*[a-zA-Z%°/]+)?$', q))

    if is_short or is_numeric_math:
        return IntentResult(
            intent=IntentType.STEP_ATTEMPT,
            confidence=0.95,
            extracted_answer=extracted
        )

    return None

    
def format_chat_history(
    history: Optional[Union[str, List[Dict[str, Any]]]] = None,
    rolling_summary: Optional[str] = None,
    current_step: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Combines rolling summary, current active step, and recent turns for the intent prompt.
    Accepts either raw turns list, a pre-formatted string, rolling summary, and active step.
    """
    parts = []

    # 1. Include rolling summary if present
    if rolling_summary and rolling_summary.strip():
        parts.append(f"Summary of earlier conversation: {rolling_summary.strip()}")

    # 2. Include active step context if present
    if is_step_active(current_step):
        parts.append(f"Current Active Step: {current_step}")

    # 3. If history is already a formatted string, append directly 
    if isinstance(history, str) and history.strip():
        parts.append(history.strip())
        
    # 4. If history is a list of turns, format the last 6 turns
    elif isinstance(history, list) and history:
        for turn in history[-6:]:
            if "role" in turn:
                speaker = "Student" if turn.get("role") == "user" else "Tutor"
                content = turn.get("content", "")
                parts.append(f"{speaker}: {content}")
            else:
                user_msg = turn.get("user", "")
                bot_msg = turn.get("bot", "")
                if user_msg:
                    parts.append(f"Student: {user_msg}")
                if bot_msg:
                    parts.append(f"Tutor: {bot_msg}")
    return "\n".join(parts) if parts else "No previous conversation history."


def classify_intent_heuristic(
    query: str,
    history: Optional[Union[str, List[Dict[str, Any]]]] = None,
    rolling_summary: Optional[str] = None,
    current_step: Optional[Dict[str, Any]] = None,
) -> IntentResult:
    """
    Fast-path deterministic rule-based fallback (<1ms).
    Used when Gemini API is offline, unconfigured, or times out.
    """
    q = (query or "").strip()
    if not q:
        return IntentResult(intent=IntentType.CHITCHAT, confidence=0.5)

    # 0. Active step disambiguation engine (<1ms)
    if current_step:
        disambiguated = disambiguate_step_input(
            query=q,
            current_step=current_step,
            history=history,
            rolling_summary=rolling_summary,
        )
        if disambiguated is not None:
            return disambiguated

    # 1. Greetings / Pleasantries
    if _CHITCHAT_RE.match(q):
        return IntentResult(intent=IntentType.CHITCHAT, confidence=0.98)

    # 2. Help & Stuck expressions -> CLARIFY
    if _HELP_SEEKING_RE.match(q):
        return IntentResult(intent=IntentType.CLARIFY, confidence=0.95)

    # 3. Practice requests
    if _PRACTICE_RE.search(q):
        return IntentResult(intent=IntentType.REQUEST_PRACTICE, confidence=0.95)

    has_history = bool(history or (rolling_summary and rolling_summary.strip()))
    # 4. If no conversation history exists yet, it's starting a new question
    if not has_history:
        return IntentResult(intent=IntentType.INITIAL_SOLVE, confidence=0.90)

    # 5. Short answer or pure number when history exists -> step attempt
    is_short = len(q.split()) <= 4 and not _CLARIFY_RE.match(q)
    is_numeric_math = bool(re.match(r'^-?\d+(?:\.\d+)?(?:/\d+)?(?:\s*[a-zA-Z]+)?$', q))
    if is_short or is_numeric_math:
        return IntentResult(
            intent=IntentType.STEP_ATTEMPT,
            confidence=0.88,
            extracted_answer=extract_core_answer(q)
        )

    # 6. Clarification questions
    if _CLARIFY_RE.match(q) and not any(op in q for op in ['+', '-', '*', '/', '=']):
        return IntentResult(intent=IntentType.CLARIFY, confidence=0.85)

    # Default fallback
    return IntentResult(intent=IntentType.INITIAL_SOLVE, confidence=0.75)


async def classify_intent(
    query: str,
    history: Optional[Union[str, List[Dict[str, Any]]]] = None,
    rolling_summary: Optional[str] = None,
    current_step: Optional[Dict[str, Any]] = None,
) -> IntentResult:
    """
    Classifies student intent using prompt_controller and Gemini Flash.
    Falls back gracefully to deterministic heuristics if offline or timed out.
    """
    # 0. Fast-path deterministic disambiguation (<1ms) if current_step is provided
    if current_step:
        disambiguated = disambiguate_step_input(
            query=query,
            current_step=current_step,
            history=history,
            rolling_summary=rolling_summary,
        )
        if disambiguated is not None:
            return disambiguated

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return classify_intent_heuristic(query, history, rolling_summary, current_step)

    formatted_history = format_chat_history(
        history=history,
        rolling_summary=rolling_summary,
        current_step=current_step,
    )
    prompt = prompt_controller.get_intent_prompt(query=query, chat_history=formatted_history)

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

        raw_label = await asyncio.wait_for(_call_gemini(), timeout=1.5)

        # Match response against valid IntentType categories
        for valid in IntentType:
            if valid.value in raw_label:
                extracted = extract_core_answer(query) if valid == IntentType.STEP_ATTEMPT else None
                return IntentResult(
                    intent=valid,
                    confidence=0.95,
                    extracted_answer=extracted,
                    raw_response=raw_label
                )

        return IntentResult(intent=IntentType.INITIAL_SOLVE, confidence=0.70, raw_response=raw_label)

    except Exception:
        # Graceful fallback on network error or timeout
        return classify_intent_heuristic(query, history, rolling_summary, current_step)


def classify_intent_sync(
    query: str,
    history: Optional[Union[str, List[Dict[str, Any]]]] = None,
    rolling_summary: Optional[str] = None,
    current_step: Optional[Dict[str, Any]] = None,
) -> IntentResult:
    """Synchronous entrypoint for fast-path intent classification."""
    return classify_intent_heuristic(
        query=query,
        history=history,
        rolling_summary=rolling_summary,
        current_step=current_step,
    )
