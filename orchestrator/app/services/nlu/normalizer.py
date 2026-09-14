"""
Bilingual Normalization & OCR Text Cleaning Engine for Elementary STEM Chatbot.
Handles kid typos, mobile slang, OCR worksheet artifacts, Khmenglish transliterations,
and provides a safe, invariant-preserving Tier-2 LLM fallback.
"""

import os
import re
import json
import asyncio
from functools import lru_cache
from typing import Dict, List, Set, Optional, Tuple

from app.services.prompts import prompt_controller

# Default dictionary path relative to this file
_DEFAULT_DICT_PATH = os.path.join(os.path.dirname(__file__), "typo_dictionary.json")

class NormalizerEngine:
    def __init__(self, dict_path: Optional[str] = None):
        self.dict_path = dict_path or _DEFAULT_DICT_PATH
        self.ocr_map: Dict[str, str] = {}
        self.math_map: Dict[str, str] = {}
        self.science_map: Dict[str, str] = {}
        self.slang_map: Dict[str, str] = {}
        self.khmenglish_map: Dict[str, str] = {}
        self.voice_map: Dict[str, str] = {}
        self.known_vocab: Set[str] = set()
        
        # Compiled master regex patterns
        self._compiled_regex: Optional[re.Pattern] = None
        self._replacement_map: Dict[str, str] = {}
        
        self.load_dictionary()

    def load_dictionary(self):
        """Loads typo dictionary and compiles longest-match-first regex."""
        if os.path.exists(self.dict_path):
            with open(self.dict_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = {}

        self.ocr_map = data.get("ocr_artifacts", {})
        self.math_map = data.get("english_math", {})
        self.science_map = data.get("english_science", {})
        self.slang_map = data.get("kid_slang_contractions", {})
        self.khmenglish_map = data.get("khmenglish_transliterations", {})
        self.voice_map = data.get("voice_speech_artifacts", {})
        self.known_vocab = set(data.get("known_stem_vocab", []))

        # Build master replacement map
        combined: Dict[str, str] = {}
        # Priority order: Voice phrases -> Slang -> Math/Science -> Khmenglish -> OCR
        for d in [self.voice_map, self.slang_map, self.math_map, self.science_map, self.khmenglish_map]:
            for k, v in d.items():
                combined[k.lower()] = v

        self._replacement_map = combined
        
        # Sort keys by length descending to prevent sub-word collisions
        sorted_keys = sorted(combined.keys(), key=lambda x: len(x), reverse=True)
        if sorted_keys:
            # Escape regex chars in keys
            pattern_parts = [r'\b' + re.escape(k) + r'\b' for k in sorted_keys]
            self._compiled_regex = re.compile("|".join(pattern_parts), flags=re.IGNORECASE)
        else:
            self._compiled_regex = None

    def detect_language(self, text: str) -> str:
        """
        Detects primary language/script.
        Returns: 'khmer', 'khmenglish', or 'english'.
        """
        if not text:
            return "english"
            
        # 1. Check for Khmer Unicode script (\u1780 to \u17FF)
        if re.search(r'[\u1780-\u17FF]', text):
            return "khmer"
            
        # 2. Check for Khmenglish terms
        lower = text.lower()
        khm_hits = sum(1 for k in self.khmenglish_map if re.search(r'\b' + re.escape(k) + r'\b', lower))
        if khm_hits > 0:
            return "khmenglish"
            
        return "english"

    def clean_ocr_artifacts(self, text: str) -> str:
        """
        Fixes common OCR character confusions from worksheet scans:
        - 'l' or 'I' as '1' when adjacent to numbers (l2 -> 12, I0 -> 10)
        - 'O' as '0' in number sequences (2O -> 20, 1O0 -> 100)
        - 't' as '+' in arithmetic (5t3 -> 5 + 3)
        - 'x' or 'X' as '*' between numbers (4 x 5 -> 4 * 5)
        - Exponents in handwriting (cm2 -> cm^2, m3 -> m^3)
        - Fraction spacing (3 / 4 -> 3/4)
        """
        cleaned = text

        # 1. Specific OCR single/double character replacements
        for k, v in self.ocr_map.items():
            pattern = r'\b' + re.escape(k) + r'\b'
            cleaned = re.sub(pattern, v, cleaned)

        # 2. Fix exponents attached to units/numbers: e.g. "25cm2" -> "25 cm^2", "50m3" -> "50 m^3"
        cleaned = re.sub(r'(\d+)\s*(cm|m|km|mm|ft|in)2\b', r'\1 \2^2', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'(\d+)\s*(cm|m|km|mm|ft|in)3\b', r'\1 \2^3', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\b(cm|m|km|mm|ft|in)2\b', r'\1^2', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\b(cm|m|km|mm|ft|in)3\b', r'\1^3', cleaned, flags=re.IGNORECASE)

        # 3. Fix 'l' or 'I' leading a number: e.g. "l2", "I5", "l00"
        cleaned = re.sub(r'\b[lI](\d+)\b', r'1\1', cleaned)
        # Fix 'l' or 'I' trailing a number: e.g. "2l" -> "21"
        cleaned = re.sub(r'\b(\d+)[lI]\b', r'\g<1>1', cleaned)

        # 4. Fix 'O' inside digits: e.g. "2O" -> "20", "1O0" -> "100"
        cleaned = re.sub(r'(?<=\d)[oO](?=\d)', '0', cleaned)
        cleaned = re.sub(r'(?<=\d)[oO]\b', '0', cleaned)
        cleaned = re.sub(r'\b[oO](?=\d)', '0', cleaned)

        # 5. Multiplication 'x' / 'X' between numbers: "4 x 5" or "4x5" -> "4 * 5"
        cleaned = re.sub(r'(?<=\d)\s*[xX]\s*(?=\d)', ' * ', cleaned)

        # 6. Letter 't' between digits as plus: "5t3" -> "5 + 3"
        cleaned = re.sub(r'(?<=\d)t(?=\d)', ' + ', cleaned)

        # 7. Spaced fractions standardizer: "3 / 4" -> "3/4"
        cleaned = re.sub(r'(?<=\d)\s*/\s*(?=\d)', '/', cleaned)

        # 8. Units with attached numbers spacing: "5cm" -> "5 cm", "10kg" -> "10 kg"
        cleaned = re.sub(r'(\d+)\s*(cm\^2|m\^2|cm\^3|m\^3|cm|km|kg|ml|mm|mg|g|l)\b', r'\1 \2', cleaned, flags=re.IGNORECASE)

        return cleaned

    def clean_voice_artifacts(self, text: str) -> str:
        """Fixes spoken math transcriptions into standard symbolic notation."""
        cleaned = text
        for phrase, replacement in self.voice_map.items():
            pattern = r'\b' + re.escape(phrase) + r'\b'
            cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

        # Spoken arithmetic operators between digits/fractions: e.g. "3/4 plus 1/2" -> "3/4 + 1/2"
        cleaned = re.sub(r'(?<=[\d\)])\s+plus\s+(?=[\d\(])', ' + ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'(?<=[\d\)])\s+minus\s+(?=[\d\(])', ' - ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'(?<=[\d\)])\s+times\s+(?=[\d\(])', ' * ', cleaned, flags=re.IGNORECASE)
        return cleaned

    def compress_repeated_characters(self, text: str) -> str:
        """Compresses 3 or more repeated characters: e.g. 'meee' -> 'me', 'sooo' -> 'so'."""
        return re.sub(r'([a-zA-Z])\1{2,}', r'\1', text)

    def normalize_tier1_regex(self, text: str) -> str:
        """
        Executes fast deterministic regex normalization (<1ms).
        """
        if not text or not text.strip():
            return ""

        cleaned = text.strip()

        # Step 1: Longest-match-first dictionary replacement (slang, typos, math words)
        if self._compiled_regex:
            def _replace_match(match):
                word = match.group(0).lower()
                return self._replacement_map.get(word, match.group(0))

            cleaned = self._compiled_regex.sub(_replace_match, cleaned)

        # Step 2: Compress leftover excess repeated letters (e.g. 'meee' -> 'me')
        cleaned = self.compress_repeated_characters(cleaned)

        # Step 3: OCR artifact cleaning (exponents, confusions)
        cleaned = self.clean_ocr_artifacts(cleaned)

        # Step 4: Spoken / voice artifact cleaning
        cleaned = self.clean_voice_artifacts(cleaned)

        # Step 5: Normalize multiple spaces
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        return cleaned
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        return cleaned

    def should_trigger_llm(self, raw_text: str, tier1_text: str) -> bool:
        """
        Heuristic check to determine if Tier-2 Gemini LLM fallback is needed:
        - Only triggered on multi-word sentences (>= 3 words)
        - Triggers if Out-Of-Vocabulary (OOV) ratio > 30%
        """
        words = re.findall(r'[a-zA-Z]+', tier1_text)
        if len(words) < 3:
            return False  # Short answers stay fast-path

        if not self.known_vocab:
            return False

        oov_count = sum(1 for w in words if w.lower() not in self.known_vocab and w.lower() not in self._replacement_map.values())
        oov_ratio = oov_count / len(words)
        
        return oov_ratio > 0.30

    def verify_invariants(self, raw_text: str, cleaned_text: str) -> bool:
        """
        Post-LLM Safety Verification:
        Ensures that cleaning never alters numerical values or arithmetic operators.
        """
        # Normalize equivalent representations for verification
        raw_digits = re.findall(r'\d+', self.clean_ocr_artifacts(raw_text))
        cleaned_digits = re.findall(r'\d+', cleaned_text)
        
        # Operators check (+, -, *, /, =, ^)
        raw_ops = re.findall(r'[+\-*/=^]', self.clean_ocr_artifacts(raw_text))
        cleaned_ops = re.findall(r'[+\-*/=^]', cleaned_text)
        
        return (raw_digits == cleaned_digits) and (raw_ops == cleaned_ops)

    async def _llm_normalize_fallback(self, text: str, lang: str) -> Optional[str]:
        """
        Tier 2: Async Gemini Flash fallback with 1.5s timeout.
        Returns None if offline, unconfigured, or timed out.
        """
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return None

        prompt = prompt_controller.get_normalizer_prompt(text=text, lang=lang)

        try:
            # We attempt to import and call google.genai or return None if not installed
            from google import genai
            client = genai.Client(api_key=api_key)
            
            async def _call_gemini():
                # Run synchronous call in thread pool for async compatibility
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt
                    )
                )
                return response.text.strip().strip('"')

            result = await asyncio.wait_for(_call_gemini(), timeout=1.5)
            return result
        except Exception:
            return None

    async def normalize_text(self, raw_text: str) -> str:
        """
        Master Async Normalizer:
        1. Fast Tier-1 Regex & OCR Normalization (<1ms)
        2. Heuristic check: triggers Tier-2 Gemini Fallback if needed
        3. Post-LLM Invariant Safety Verification
        """
        if not raw_text or not raw_text.strip():
            return ""

        tier1_result = self.normalize_tier1_regex(raw_text)
        
        if self.should_trigger_llm(raw_text, tier1_result):
            lang = self.detect_language(raw_text)
            llm_result = await self._llm_normalize_fallback(raw_text, lang)
            if llm_result and self.verify_invariants(raw_text, llm_result):
                return llm_result

        return tier1_result

    def normalize_text_sync(self, raw_text: str) -> str:
        """Synchronous deterministic normalization path (<1ms)."""
        return self.normalize_tier1_regex(raw_text)


# Global Singleton Instance for fast re-use and caching
_ENGINE = NormalizerEngine()

@lru_cache(maxsize=1024)
def normalize_text_sync(raw_text: str) -> str:
    """Cached synchronous normalizer entrypoint."""
    return _ENGINE.normalize_text_sync(raw_text)

async def normalize_text(raw_text: str) -> str:
    """Async hybrid normalizer entrypoint."""
    return await _ENGINE.normalize_text(raw_text)

def detect_language(text: str) -> str:
    """Detects language (khmer, khmenglish, english)."""
    return _ENGINE.detect_language(text)

def verify_invariants(raw_text: str, cleaned_text: str) -> bool:
    """Checks that numbers and math operators are preserved."""
    return _ENGINE.verify_invariants(raw_text, cleaned_text)
