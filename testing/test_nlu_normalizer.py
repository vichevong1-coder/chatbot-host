"""
Unit Tests for NLU Bilingual Normalizer & OCR Text Cleaner (Day 2 Deliverable).
"""

import os
import sys
import time
# pyrefly: ignore [missing-import]
import pytest

# Ensure orchestrator is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORCHESTRATOR_DIR = os.path.join(BASE_DIR, "orchestrator")
if ORCHESTRATOR_DIR not in sys.path:
    sys.path.insert(0, ORCHESTRATOR_DIR)

# pyrefly: ignore [missing-import]
from app.services.nlu import (
    normalize_text_sync,
    detect_language,
    verify_invariants,
)


class TestNormalizerOCR:
    """Test OCR worksheet cleaning rules."""

    def test_ocr_number_l_to_one(self):
        raw = "Leo has l2 apples and l5 oranges"
        expected = "Leo has 12 apples and 15 oranges"
        assert normalize_text_sync(raw) == expected

    def test_ocr_capital_o_to_zero(self):
        raw = "There are 2O students and 1O0 books"
        expected = "There are 20 students and 100 books"
        assert normalize_text_sync(raw) == expected

    def test_ocr_multiplication_x(self):
        raw = "Calculate 4 x 5 and 6 X 7"
        assert normalize_text_sync(raw) == "Calculate 4 * 5 and 6 * 7"

    def test_ocr_letter_t_as_plus(self):
        raw = "What is 5t3"
        assert normalize_text_sync(raw) == "What is 5 + 3"

    def test_ocr_unit_exponents(self):
        raw = "Area is 25cm2 and volume is 50m3"
        assert normalize_text_sync(raw) == "Area is 25 cm^2 and volume is 50 m^3"

    def test_ocr_fraction_spacing(self):
        raw = "Fraction is 3 / 4"
        assert normalize_text_sync(raw) == "Fraction is 3/4"


class TestNormalizerBilingual:
    """Test language detection and Khmenglish transliterations."""

    def test_detect_khmer_script(self):
        text = "តើមានផ្លែប៉ោមក bao nhiêu?"
        assert detect_language(text) == "khmer"

    def test_detect_khmenglish(self):
        text = "som subtrak 4 pi 12"
        assert detect_language(text) == "khmenglish"

    def test_detect_english(self):
        text = "How do plants make food?"
        assert detect_language(text) == "english"

    def test_khmenglish_transliteration_replacement(self):
        raw = "som subtrak 4 pi 12"
        cleaned = normalize_text_sync(raw)
        assert "សូម" in cleaned
        assert "subtract" in cleaned

    def test_khmenglish_confused_phrase(self):
        raw = "knhom ot yol"
        cleaned = normalize_text_sync(raw)
        assert "ខ្ញុំ" in cleaned
        assert "អត់យល់" in cleaned


class TestNormalizerMathScienceTypos:
    """Test STEM typos and kid slang."""

    def test_math_typos(self):
        raw = "pluss subtrak multply divde fracton"
        assert normalize_text_sync(raw) == "plus subtract multiply divide fraction"

    def test_science_typos(self):
        raw = "how plantz mak enrgy with fotosynthesis and clorophyll"
        assert "photosynthesis" in normalize_text_sync(raw)
        assert "chlorophyll" in normalize_text_sync(raw)
        assert "energy" in normalize_text_sync(raw)
        assert "plants" in normalize_text_sync(raw)

    def test_kid_slang_and_contractions(self):
        raw = "idk plz gimme 8 cookiez"
        assert normalize_text_sync(raw) == "i do not know please give me 8 cookies"

    def test_voice_spoken_math(self):
        raw = "what is three fourths plus one half"
        assert normalize_text_sync(raw) == "what is 3/4 + 1/2"

    def test_repeated_characters_compression(self):
        raw = "pluuuse help meee"
        assert "please" in normalize_text_sync(raw) or "pluse" in normalize_text_sync(raw)


class TestInvariantSafety:
    """Test post-LLM number and operator safety verification."""

    def test_invariant_match_exact(self):
        raw = "Leo has 5 apples + 3 cookies"
        cleaned = "Leo has 5 apples + 3 cookies"
        assert verify_invariants(raw, cleaned) is True

    def test_invariant_ocr_normalized_match(self):
        raw = "Leo has l2 apples and 4 x 5 cookies"
        cleaned = "Leo has 12 apples and 4 * 5 cookies"
        assert verify_invariants(raw, cleaned) is True

    def test_invariant_rejects_altered_number(self):
        raw = "What is 10 + 5?"
        corrupted = "The answer is 15"  # Numbers don't match (10, 5 vs 15)
        assert verify_invariants(raw, corrupted) is False

    def test_invariant_rejects_altered_operator(self):
        raw = "What is 10 + 5?"
        corrupted = "What is 10 - 5?"  # Operator '+' changed to '-'
        assert verify_invariants(raw, corrupted) is False


class TestPerformanceBenchmark:
    """Ensure normalization runs in under 1ms for sub-millisecond latency."""

    def test_sub_millisecond_benchmark(self):
        query = "Leo has l2 apls and gives 4 to Maya. howmny left?"
        
        # Warm-up
        normalize_text_sync(query)

        # Benchmark 100 iterations
        start = time.perf_counter()
        for _ in range(100):
            normalize_text_sync(query)
        elapsed_total = time.perf_counter() - start
        avg_ms = (elapsed_total / 100) * 1000

        print(f"\n[BENCHMARK] Average normalization time: {avg_ms:.4f} ms")
        assert avg_ms < 1.0  # Must be under 1 millisecond


if __name__ == "__main__":
    pytest.main(["-v", __file__])
