"""
Phase 1 MVP test suite.

Tests:
  1. PDF → images conversion
  2. Image preprocessing (does not destroy image, returns both)
  3. Schema models validate correctly
  4. OCR context builder works
  5. API health endpoint returns 200
  6. Full pipeline on sample PDFs (integration test, requires models)
"""
from __future__ import annotations

import io
import os
import sys
from pathlib import Path

import numpy as np
import pytest

# Ensure repo root is on the path
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

# ---------------------------------------------------------------------------
# Unit tests — no models required
# ---------------------------------------------------------------------------

class TestSchemas:
    def test_homework_response_empty(self):
        from app.schemas.homework import HomeworkResponse, DocumentMeta
        resp = HomeworkResponse(
            status="success",
            document=DocumentMeta(title="Test HW", pages=1),
            pages=[],
            confidence=0.0,
        )
        assert resp.status == "success"

    def test_question_types_enum(self):
        from app.schemas.homework import QuestionType
        assert QuestionType.FILL_BLANK == "fill_blank"
        assert QuestionType.MATH_EQUATION == "math_equation"
        assert QuestionType.UNKNOWN == "unknown"

    def test_layout_region_model(self):
        from app.schemas.homework import LayoutRegion, RegionType
        region = LayoutRegion(
            region_id="p1_r000",
            region_type=RegionType.TEXT_BLOCK,
            bbox=[10.0, 20.0, 200.0, 50.0],
            page_number=1,
            confidence=0.85,
        )
        assert region.region_id == "p1_r000"
        assert region.bbox[0] == 10.0


class TestImageUtils:
    def test_resize_to_max_side(self):
        from app.utils.image_utils import resize_to_max_side
        img = np.zeros((3000, 2000, 3), dtype=np.uint8)
        resized = resize_to_max_side(img, max_side=2000)
        assert max(resized.shape[:2]) == 2000

    def test_resize_small_image_unchanged(self):
        from app.utils.image_utils import resize_to_max_side
        img = np.zeros((100, 200, 3), dtype=np.uint8)
        resized = resize_to_max_side(img, max_side=2000)
        assert resized.shape == img.shape

    def test_bbox_area(self):
        from app.utils.image_utils import bbox_area
        assert bbox_area([0, 0, 100, 50]) == 5000.0

    def test_crop_region_clamped(self):
        from app.utils.image_utils import crop_region
        img = np.ones((100, 100, 3), dtype=np.uint8) * 128
        crop = crop_region(img, [10, 10, 50, 50], padding=0)
        assert crop.shape == (40, 40, 3)

    def test_base64_roundtrip(self):
        from app.utils.image_utils import ndarray_to_base64, base64_to_ndarray
        img = np.random.randint(0, 255, (50, 50, 3), dtype=np.uint8)
        b64 = ndarray_to_base64(img)
        recovered = base64_to_ndarray(b64)
        assert recovered.shape == img.shape

    def test_reading_order_sort_1col(self):
        from app.utils.image_utils import sort_regions_reading_order
        regions = [
            {"bbox": [0, 200, 100, 250]},
            {"bbox": [0, 50, 100, 100]},
            {"bbox": [0, 120, 100, 150]},
        ]
        sorted_r = sort_regions_reading_order(regions, n_columns=1)
        tops = [r["bbox"][1] for r in sorted_r]
        assert tops == sorted(tops)


class TestPreprocessing:
    def test_returns_both_images(self):
        from app.preprocessing.image_prep import preprocess_image
        img = np.ones((500, 400, 3), dtype=np.uint8) * 200
        result = preprocess_image(img, max_long_side=400, denoise=False)
        assert result.original_image is not None
        assert result.processed_image is not None

    def test_original_image_preserved(self):
        from app.preprocessing.image_prep import preprocess_image
        img = np.ones((500, 400, 3), dtype=np.uint8) * 123
        result = preprocess_image(img, max_long_side=600, denoise=False)
        # Original must be unchanged
        assert result.original_image.shape == img.shape
        assert int(result.original_image[0, 0, 0]) == 123

    def test_resize_applied(self):
        from app.preprocessing.image_prep import preprocess_image
        img = np.ones((3000, 2000, 3), dtype=np.uint8)
        result = preprocess_image(img, max_long_side=1000, denoise=False)
        assert max(result.processed_image.shape[:2]) <= 1000


class TestValidator:
    def test_empty_pages_issues(self):
        from app.validation.validator import Validator
        from app.schemas.homework import HomeworkResponse, DocumentMeta, Page
        validator = Validator()
        resp = HomeworkResponse(
            status="success",
            document=DocumentMeta(pages=1),
            pages=[Page(page_number=1)],
            confidence=0.9,
        )
        result = validator.validate(resp)
        # Empty sections should generate an issue
        assert any("no sections" in issue for issue in result.issues)

    def test_math_validation_correct(self):
        from app.validation.validator import _evaluate_simple_math
        result = _evaluate_simple_math("2 + 3 = __")
        assert result == 5.0

    def test_math_validation_multiply(self):
        from app.validation.validator import _evaluate_simple_math
        result = _evaluate_simple_math("4 × 3 = __")
        assert result == 12.0


# ---------------------------------------------------------------------------
# Integration tests — require models to be downloaded
# ---------------------------------------------------------------------------

try:
    import fitz
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

SAMPLE_PDF = ROOT / "02_iP3-Maths-HW.pdf"
SKIP_INTEGRATION = not SAMPLE_PDF.exists() or not HAS_FITZ or os.getenv("SKIP_INTEGRATION") == "1"


@pytest.mark.skipif(SKIP_INTEGRATION, reason="Sample PDF not found, fitz not installed, or SKIP_INTEGRATION=1")
class TestPDFIntegration:
    def test_pdf_to_images(self):
        from app.utils.pdf_utils import pdf_to_images, page_count
        pages = pdf_to_images(SAMPLE_PDF)
        n = page_count(SAMPLE_PDF)
        assert len(pages) == n
        assert len(pages) > 0
        assert pages[0].ndim == 3

    def test_pdf_page_is_bgr(self):
        from app.utils.pdf_utils import pdf_to_images
        pages = pdf_to_images(SAMPLE_PDF)
        # Check shape: (H, W, 3)
        assert pages[0].shape[2] == 3


@pytest.mark.skipif(SKIP_INTEGRATION, reason="Sample PDF not found or SKIP_INTEGRATION=1")
class TestAPIIntegration:
    """Requires the FastAPI app to import cleanly."""

    def test_app_imports(self):
        from app.main import app
        assert app is not None

    def test_health_route_registered(self):
        from app.main import app
        from fastapi.routing import APIRoute

        # Walk the router's original_router if present (FastAPI ≥0.111 wraps in _IncludedRouter)
        def collect_paths(route_list):
            paths = []
            for r in route_list:
                if isinstance(r, APIRoute):
                    paths.append(r.path)
                elif hasattr(r, "original_router"):
                    paths.extend(collect_paths(r.original_router.routes))
            return paths

        all_paths = collect_paths(app.routes)
        assert "/health" in all_paths, f"Routes found: {all_paths}"
        assert "/process-homework" in all_paths, f"Routes found: {all_paths}"


# ---------------------------------------------------------------------------
# New tests — Items 3, 4
# ---------------------------------------------------------------------------

class TestBboxUtils:
    """Item 4 — validate_answer_area_bbox"""

    def test_valid_bbox(self):
        from app.utils.bbox_utils import validate_answer_area_bbox
        assert validate_answer_area_bbox([100, 200, 300, 400]) == []

    def test_none_bbox_is_allowed(self):
        from app.utils.bbox_utils import validate_answer_area_bbox
        assert validate_answer_area_bbox(None) == []

    def test_wrong_length(self):
        from app.utils.bbox_utils import validate_answer_area_bbox
        probs = validate_answer_area_bbox([10, 20, 30])
        assert any("4 elements" in p for p in probs)

    def test_non_integer_values(self):
        from app.utils.bbox_utils import validate_answer_area_bbox
        probs = validate_answer_area_bbox([10.5, 20, 30, 40])
        assert any("not an integer" in p for p in probs)

    def test_out_of_range_negative(self):
        from app.utils.bbox_utils import validate_answer_area_bbox
        probs = validate_answer_area_bbox([-1, 0, 100, 200])
        assert any("x1" in p for p in probs)

    def test_out_of_range_over_1000(self):
        from app.utils.bbox_utils import validate_answer_area_bbox
        probs = validate_answer_area_bbox([0, 0, 1001, 500])
        assert any("x2" in p for p in probs)

    def test_x1_not_less_than_x2(self):
        from app.utils.bbox_utils import validate_answer_area_bbox
        probs = validate_answer_area_bbox([500, 100, 400, 300])
        assert any("x1" in p and "x2" in p for p in probs)

    def test_y1_not_less_than_y2(self):
        from app.utils.bbox_utils import validate_answer_area_bbox
        probs = validate_answer_area_bbox([100, 400, 300, 200])
        assert any("y1" in p and "y2" in p for p in probs)

    def test_bbox_to_pixels(self):
        from app.utils.bbox_utils import convert_bboxes_to_pixels
        from app.schemas.homework import Page, Section, Question, AnswerAreaEntry
        area = AnswerAreaEntry(kind="blank_line", bbox=[500, 500, 750, 750])
        q = Question(question_no="1", answer_areas=[area])
        sec = Section(section_id="A", questions=[q])
        page = Page(page_number=1, sections=[sec])
        convert_bboxes_to_pixels(page, img_w=1000, img_h=2000)
        assert area.bbox == [500, 1000, 750, 1500]


class TestValidatorItems:
    """Item 4 — question_id uniqueness in Validator"""

    def _make_response(self, questions):
        from app.schemas.homework import (
            HomeworkResponse, DocumentMeta, Page, Section,
        )
        page = Page(page_number=1, sections=[Section(section_id="A", questions=questions)])
        return HomeworkResponse(
            document=DocumentMeta(pages=1),
            pages=[page],
        )

    def test_duplicate_question_id_is_issue(self):
        from app.schemas.homework import Question
        from app.validation.validator import Validator
        q1 = Question(question_id="A1", question_no="1")
        q2 = Question(question_id="A1", question_no="2")  # duplicate id
        resp = self._make_response([q1, q2])
        result = Validator().validate(resp)
        assert any("A1" in i for i in result.issues), f"Issues: {result.issues}"

    def test_unique_question_ids_pass(self):
        from app.schemas.homework import Question
        from app.validation.validator import Validator
        q1 = Question(question_id="A1", question_no="1")
        q2 = Question(question_id="A2", question_no="2")
        resp = self._make_response([q1, q2])
        result = Validator().validate(resp)
        dup_issues = [i for i in result.issues if "duplicate" in i.lower()]
        assert dup_issues == []

    def test_invalid_bbox_creates_warning(self):
        from app.schemas.homework import Question, AnswerAreaEntry
        from app.validation.validator import Validator
        area = AnswerAreaEntry(kind="blank_line", bbox=[-5, 0, 100, 200])
        q = Question(question_id="A1", answer_areas=[area])
        resp = self._make_response([q])
        result = Validator().validate(resp)
        assert any("bbox" in w.lower() for w in result.warnings), f"Warnings: {result.warnings}"


class TestConfidence:
    """Item 3 — nullable confidence, page confidence = min"""

    def test_question_confidence_none_when_absent(self):
        from app.vlm.prompt_parser import _parse_question
        q = _parse_question({
            "id": "A1", "number_printed": "1",
            "type": "equation", "prompt": "1+1=",
            "answer_areas": [],
            # no "confidence" key
        })
        assert q.confidence is None

    def test_question_confidence_set_from_model(self):
        from app.vlm.prompt_parser import _parse_question
        q = _parse_question({
            "id": "A1", "number_printed": "1",
            "type": "equation", "prompt": "1+1=",
            "answer_areas": [],
            "confidence": 0.73,
        })
        assert q.confidence == pytest.approx(0.73)

    def test_page_confidence_is_minimum(self):
        from app.vlm.prompt_parser import parse_vlm_response
        data = {
            "sections": [{"label": "A", "title": "Test", "questions": [
                {"id": "A1", "number_printed": "1", "type": "equation",
                 "prompt": "x", "answer_areas": [], "confidence": 0.9},
                {"id": "A2", "number_printed": "2", "type": "equation",
                 "prompt": "y", "answer_areas": [], "confidence": 0.4},
            ]}],
            "warnings": [],
        }
        page = parse_vlm_response(data, 1, [])
        assert page.confidence == pytest.approx(0.4)

    def test_page_confidence_none_when_no_questions(self):
        from app.vlm.prompt_parser import parse_vlm_response
        data = {"sections": [], "warnings": []}
        page = parse_vlm_response(data, 1, [])
        assert page.confidence is None

    def test_kind_unknown_stored_asis(self):
        """Unknown kind values are stored as-is so the validator can warn (no silent coercion)."""
        from app.schemas.homework import AnswerAreaEntry
        area = AnswerAreaEntry(kind="INVALID_VALUE")
        assert area.kind == "INVALID_VALUE"  # stored verbatim; validator will warn

    def test_kind_valid_passthrough(self):
        from app.schemas.homework import AnswerAreaEntry
        for k in ("blank_line", "blank_box", "table_cell", "tick_box", "circle", "dot"):
            area = AnswerAreaEntry(kind=k)
            assert area.kind == k

    def test_empty_box_normalized_to_blank_box(self):
        from app.vlm.prompt_parser import _parse_answer_areas, _norm_kind
        assert _norm_kind("empty_box") == "blank_box"
        assert _norm_kind("box") == "blank_box"
        areas = _parse_answer_areas([{"kind": "empty_box", "bbox": [100, 200, 300, 400]}])
        assert len(areas) == 1
        assert areas[0].kind == "blank_box"

    def test_matching_dot_normalized_to_dot(self):
        from app.vlm.prompt_parser import _parse_answer_areas, _norm_kind
        assert _norm_kind("matching_dot") == "dot"
        assert _norm_kind("match_dot") == "dot"
        areas = _parse_answer_areas([{"kind": "matching_dot", "bbox": [77, 181, 94, 201]}])
        assert len(areas) == 1
        assert areas[0].kind == "dot"

    def test_circle_target_normalized_to_circle(self):
        from app.vlm.prompt_parser import _parse_answer_areas, _norm_kind
        assert _norm_kind("circle_target") == "circle"
        assert _norm_kind("target_circle") == "circle"
        areas = _parse_answer_areas([{"kind": "circle_target", "bbox": [91, 183, 154, 200]}])
        assert len(areas) == 1
        assert areas[0].kind == "circle"


class TestElementsExtraction:
    """Elements parsing in questions (matching columns, text elements, etc.)"""

    def test_parse_elements_text_and_matching(self):
        from app.vlm.prompt_parser import _parse_elements
        raw = [
            {"type": "text", "text": "15", "bbox": [100, 100, 150, 150]},
            {"type": "matching", "left_item": "15", "right_item": "85"},
            "Simple text string",
        ]
        elements = _parse_elements(raw)
        assert len(elements) == 3
        assert elements[0].text == "15"
        assert elements[1].left_item == "15"
        assert elements[1].right_item == "85"
        assert elements[2].text == "Simple text string"

    def test_matching_question_populates_elements_from_matches(self):
        from app.vlm.prompt_parser import _parse_question
        q_data = {
            "id": "A",
            "number_printed": "None",
            "type": "match",
            "prompt": None,
            "answer_areas": [{"kind": "dot", "bbox": [77, 181, 94, 201]}],
            "matches": [["15", "85"], ["25", "75"]],
            "confidence": 0.9,
        }
        q = _parse_question(q_data)
        assert len(q.elements) == 2
        assert q.elements[0].left_item == "15"
        assert q.elements[0].right_item == "85"
        assert q.elements[1].left_item == "25"
        assert q.elements[1].right_item == "75"


class TestPostProcessingRules:
    """Item 3: question_no punctuation, homework_no digit check, footer subject fallback"""

    def test_strip_question_no_punctuation(self):
        from app.vlm.prompt_parser import _strip_question_no
        assert _strip_question_no("1.") == "1"
        assert _strip_question_no("A2:") == "A2"
        assert _strip_question_no("3)") == "3"
        assert _strip_question_no("4,") == "4"
        assert _strip_question_no("5") == "5"
        assert _strip_question_no("None") is None
        assert _strip_question_no("null") is None
        assert _strip_question_no("N/A") is None
        assert _strip_question_no("") is None
        assert _strip_question_no(None) is None

    def test_homework_no_requires_digit(self):
        from app.vlm.prompt_parser import parse_vlm_response
        # Case 1: no digit -> should be None
        data1 = {
            "header": {"school": "Westline", "homework_no": "Homework"},
            "sections": [],
            "warnings": [],
        }
        page1 = parse_vlm_response(data1, 1, [])
        assert page1.header.homework_no is None

        # Case 2: contains digit -> preserved
        data2 = {
            "header": {"school": "Westline", "homework_no": "HW 2"},
            "sections": [],
            "warnings": [],
        }
        page2 = parse_vlm_response(data2, 1, [])
        assert page2.header.homework_no == "HW 2"

    def test_subject_fallback_from_footer(self):
        from app.vlm.prompt_parser import parse_vlm_response
        data = {
            "header": {"school": "Westline", "subject": None},
            "sections": [],
            "footer": {"left": "Subject: Mathematics", "right": "Page 1"},
            "warnings": [],
        }
        page = parse_vlm_response(data, 1, [])
        assert page.header.subject == "Mathematics"
        assert page._meta["subject"] == "Mathematics"

    def test_directions_label_none_cleared(self):
        from app.vlm.prompt_parser import _parse_directions
        dirs = _parse_directions([{"label": "None", "text": "Grouping animals"}])
        assert len(dirs) == 1
        assert dirs[0].label == ""
        assert dirs[0].text == "Grouping animals"

    def test_clean_header_field_strips_blanks(self):
        from app.vlm.prompt_parser import _clean_header_field
        assert _clean_header_field("Name: ________________") is None
        assert _clean_header_field("Date: ________________") is None
        assert _clean_header_field("Score: ________________") is None
        assert _clean_header_field("Level: iP3") == "iP3"
        assert _clean_header_field("The Westline School") == "The Westline School"
        assert _clean_header_field(None) is None

    def test_doc_title_not_polluted_by_section_directions(self):
        from app.vlm.prompt_parser import parse_vlm_response
        data = {
            "header": {"school": "The Westline School"},
            "directions": [{"label": "A", "text": "Circle the two numbers that are easy to add first."}],
            "sections": [],
            "warnings": [],
        }
        page = parse_vlm_response(data, 1, [])
        assert page._meta["title"] == "The Westline School"


class TestValidationEnumsAndWarnings:
    """Item 2 & Item 4: type validation issues, warning deduplication"""

    def test_unknown_type_creates_issue_and_fails_validation(self):
        from app.validation.validator import Validator
        from app.schemas.homework import (
            HomeworkResponse, DocumentMeta, Page, Section, Question,
            QuestionType, ReviewFlag, ReviewReason,
        )

        q = Question(
            question_no="1",
            question_id="A1",
            type=QuestionType.UNKNOWN,
            review=ReviewFlag(reason=ReviewReason.UNKNOWN, detail="unrecognised_type:invalid_type_xyz"),
        )
        page = Page(page_number=1, sections=[Section(section_id="A", questions=[q])])
        resp = HomeworkResponse(status="success", document=DocumentMeta(), pages=[page])

        validator = Validator()
        val_result = validator.validate(resp)
        assert not val_result.passed
        assert any("unrecognised type" in issue for issue in val_result.issues)

    def test_warnings_deduplication_and_clearing(self):
        from app.validation.validator import Validator
        from app.schemas.homework import HomeworkResponse, DocumentMeta, Page, Section, Question, QuestionType

        q = Question(question_no="1", question_id="A1", type=QuestionType.FILL_BLANK)
        page = Page(
            page_number=1,
            sections=[Section(section_id="A", questions=[q])],
            warnings=["Model warning 1"],
        )
        resp = HomeworkResponse(
            status="success",
            document=DocumentMeta(),
            pages=[page],
            warnings=["Initial response warning to be cleared"],
        )

        validator = Validator()
        val_result = validator.validate(resp)
        # Model warning collected into val_result.warnings
        assert any("Page 1 [model]: Model warning 1" in w for w in val_result.warnings)
        # response.warnings cleared (single source of truth in validation.warnings)
        assert len(resp.warnings) == 0


class TestPromptMarkerStrippingAndNormalization:
    """Tests for prompt marker stripping and answer area kind normalization."""

    def test_strip_prompt_marker_variations(self):
        from app.vlm.prompt_parser import _strip_prompt_marker

        assert _strip_prompt_marker("1 a) Label the feathers on this owl's head.", "1 a") == "Label the feathers on this owl's head."
        assert _strip_prompt_marker("b) Label one feature that shows it is a bird of prey.", "b") == "Label one feature that shows it is a bird of prey."
        assert _strip_prompt_marker("c) How do the owl's eyes help it to hunt?", "c") == "How do the owl's eyes help it to hunt?"
        assert _strip_prompt_marker("a) Label one feature that shows this owl is a bird of prey.", "a") == "Label one feature that shows this owl is a bird of prey."
        assert _strip_prompt_marker("d) What does camouflage mean?", "d") == "What does camouflage mean?"
        assert _strip_prompt_marker("1. a) Label the feathers", "1a") == "Label the feathers"
        assert _strip_prompt_marker("(b) Circle the correct answer", "(b)") == "Circle the correct answer"
        assert _strip_prompt_marker("2. This owl sees an animal to eat.", "2") == "This owl sees an animal to eat."

    def test_norm_kind_label_variants(self):
        from app.vlm.prompt_parser import _norm_kind

        assert _norm_kind("image_label") == "blank_box"
        assert _norm_kind("diagram_label") == "blank_box"
        assert _norm_kind("label") == "blank_box"
        assert _norm_kind("blank_line") == "blank_line"
        assert _norm_kind("blank_box") == "blank_box"

    def test_instruction_deduplication(self):
        from app.vlm.prompt_parser import parse_vlm_response

        data = {
            "sections": [
                {
                    "section_id": "b",
                    "instructions": "Draw one line from each animal to the one with the most similar horns or antlers.",
                    "questions": [
                        {
                            "id": "b1",
                            "type": "matching",
                            "prompt": "Draw one line from each animal to the one with the most similar horns or antlers.",
                            "answer_areas": [{"kind": "dot", "bbox": [210, 144, 218, 156]}],
                        }
                    ],
                }
            ]
        }
        page = parse_vlm_response(data, 1, [])
        assert page.sections[0].instructions is None
        assert page.sections[0].questions[0].prompt == "Draw one line from each animal to the one with the most similar horns or antlers."

    def test_matching_grid_prompt_deduplication(self):
        from app.vlm.prompt_parser import parse_vlm_response

        data = {
            "sections": [
                {
                    "section_id": "b",
                    "title": "Draw one line from each animal to the one with the most similar horns or antlers.",
                    "questions": [
                        {
                            "id": "b1",
                            "type": "matching",
                            "prompt": "Draw one line from each animal to the one with the most similar horns or antlers.",
                            "figure": {"present": True, "description": "Silhouette of a moose"},
                            "answer_areas": [{"kind": "dot", "bbox": [210, 146, 218, 158]}],
                        },
                        {
                            "id": "b2",
                            "type": "matching",
                            "prompt": "Draw one line from each animal to the one with the most similar horns or antlers.",
                            "figure": {"present": True, "description": "Silhouette of a ram"},
                            "answer_areas": [{"kind": "dot", "bbox": [210, 289, 218, 301]}],
                        },
                        {
                            "id": "b_img1",
                            "type": "other",
                            "prompt": None,
                            "figure": {"present": True, "description": "Illustration of an oryx"},
                            "answer_areas": [{"kind": "dot", "bbox": [346, 146, 354, 158]}],
                        },
                    ],
                }
            ]
        }
        page = parse_vlm_response(data, 1, [])
        assert page.sections[0].title == "Draw one line from each animal to the one with the most similar horns or antlers."
        assert page.sections[0].questions[0].prompt is None
        assert page.sections[0].questions[1].prompt is None
        assert page.sections[0].questions[2].prompt is None

    def test_section_marker_bleed_prevention(self):
        from app.vlm.prompt_parser import parse_vlm_response

        data = {
            "sections": [
                {
                    "section_id": "b",
                    "title": "Draw one line from each animal to the one with the most similar horns or antlers.",
                    "questions": [
                        {
                            "id": "b1",
                            "number_printed": "b",
                            "type": "matching",
                            "prompt": None,
                        },
                        {
                            "id": "b2",
                            "number_printed": None,
                            "type": "matching",
                            "prompt": None,
                        },
                    ],
                }
            ]
        }
        page = parse_vlm_response(data, 1, [])
        assert page.sections[0].section_id == "b"
        assert page.sections[0].questions[0].question_no is None
        assert page.sections[0].questions[1].question_no is None

    def test_inverted_bbox_normalization(self):
        from app.vlm.prompt_parser import _norm_bbox, parse_vlm_response

        # Test direct helper
        inverted = [311, 275, 189, 229]
        normalized = _norm_bbox(inverted)
        assert normalized == [189.0, 229.0, 311.0, 275.0]

        # Test within VLM parse flow
        data = {
            "sections": [
                {
                    "section_id": "1",
                    "questions": [
                        {
                            "id": "q1",
                            "answer_areas": [
                                {"kind": "blank_box", "bbox": [311, 275, 189, 229]}
                            ],
                        }
                    ],
                }
            ]
        }
        page = parse_vlm_response(data, 1, [])
        area = page.sections[0].questions[0].answer_areas[0]
        assert area.bbox == [189.0, 229.0, 311.0, 275.0]





