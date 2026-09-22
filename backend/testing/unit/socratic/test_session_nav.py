"""
File: testing/test_session_nav.py
Description: Comprehensive unit and integration test suite for Part 5:
             Session Persistence & Step Navigation Endpoint.
             Verifies Redis/Memory SessionContext storage, StepWidgetPayload persistence,
             multi-mode navigation (index, dot click, direction), session state re-hydration,
             and rolling conversation summarization.
"""

import os
import sys
import json
# pyrefly: ignore [missing-import]
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

# Ensure repo root and orchestrator are on sys.path
def _find_repo_root():
    cur = os.path.abspath(os.path.dirname(__file__))
    while cur and not os.path.exists(os.path.join(cur, "orchestrator")):
        parent = os.path.dirname(cur)
        if parent == cur:
            break
        cur = parent
    return cur

BASE_DIR = _find_repo_root()
ORCHESTRATOR_DIR = os.path.join(BASE_DIR, "orchestrator")
for _p in (BASE_DIR, ORCHESTRATOR_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "orchestrator")))

from fastapi.testclient import TestClient
# pyrefly: ignore [missing-import]
from app.main import app
# pyrefly: ignore [missing-import]
from app.services.session import SessionContext, SessionManager, session_manager
# pyrefly: ignore [missing-import]
from app.services.socratic.card_schema import SocraticStep, StepWidgetPayload

client = TestClient(app)


# -------------------------------------------------------------------------
# Fixtures
# -------------------------------------------------------------------------

@pytest.fixture
def sample_steps():
    return [
        SocraticStep(
            step_number=1,
            title="Identify the starting cookies",
            status="completed",
            mission="Find how many cookies Maya had at first.",
            clue="Read the first sentence carefully.",
            helpful_example="🍎 Maya started with 10 cookies.",
            your_turn="How many cookies did Maya start with?",
            expected_answer="10",
            student_answer="10"
        ),
        SocraticStep(
            step_number=2,
            title="Subtract the shared cookies",
            status="in_progress",
            mission="Subtract the cookies given to Sam.",
            clue="Subtract: 10 - 4.",
            helpful_example="🍪 10 cookies minus 4 cookies leaves 6 cookies.",
            your_turn="What is 10 minus 4?",
            expected_answer="6"
        ),
        SocraticStep(
            step_number=3,
            title="Check the final count",
            status="pending",
            mission="Confirm our remaining cookie total.",
            clue="Check with addition: 6 + 4 = 10.",
            helpful_example="⭐ 6 + 4 equals 10, so 6 is right!",
            your_turn="Are there 6 cookies remaining?",
            expected_answer="yes"
        )
    ]


@pytest.fixture
def sample_widget(sample_steps):
    return StepWidgetPayload(
        total_steps=3,
        current_step_index=1,
        completed_steps=[0],
        steps=sample_steps
    )


# -------------------------------------------------------------------------
# 1. SessionContext & Model Serialization Tests
# -------------------------------------------------------------------------

def test_session_context_serialization_with_step_widget(sample_widget):
    session = SessionContext(
        session_id="test_sess_serial_1",
        subject="math",
        grade_level="grade_1_3"
    )
    session.set_step_widget(sample_widget)
    session.formatted_markdown = "Sample card markdown"
    session.add_turn("How many cookies?", "Maya started with 10 cookies.")

    data = session.to_dict()
    assert data["session_id"] == "test_sess_serial_1"
    assert data["step_widget"] is not None
    assert data["step_widget"]["total_steps"] == 3
    assert data["current_step_index"] == 1
    assert data["formatted_markdown"] == "Sample card markdown"
    assert len(data["turns"]) == 1
    assert data["turns"][0]["user"] == "How many cookies?"

    # Deserialize back from dict
    restored = SessionContext.from_dict(data)
    assert restored.session_id == "test_sess_serial_1"
    assert restored.subject == "math"
    assert restored.step_widget["total_steps"] == 3
    assert restored.current_step_index == 1
    assert len(restored.turns) == 1

    # Reconstruct typed Pydantic widget
    typed_widget = restored.get_step_widget_payload()
    assert isinstance(typed_widget, StepWidgetPayload)
    assert typed_widget.total_steps == 3
    assert typed_widget.current_step_index == 1
    assert typed_widget.get_active_step().step_number == 2


def test_session_context_clear_step_widget(sample_widget):
    session = SessionContext(session_id="test_clear_sess")
    session.set_step_widget(sample_widget)
    assert session.step_widget is not None

    session.clear_step_widget()
    assert session.step_widget is None
    assert session.current_step_index == 0
    assert session.hint_count == 0
    assert session.is_problem_complete is False


# -------------------------------------------------------------------------
# 2. SessionManager Persistence & CRUD Tests (Local & Redis Mock)
# -------------------------------------------------------------------------

def test_session_manager_in_memory_crud():
    mgr = SessionManager(connect_redis=False)
    sid = "mem_session_crud_1"

    # Create & Save
    sess = mgr.get_or_create_session(sid)
    sess.subject = "science"
    sess.grade_level = "grade_1_3"
    sess._trigger_change()

    # Retrieve
    retrieved = mgr.get_session(sid)
    assert retrieved is not None
    assert retrieved.session_id == sid
    assert retrieved.subject == "science"

    # Nonexistent session
    assert mgr.get_session("non_existent_sid") is None

    # Delete
    deleted = mgr.delete_session(sid)
    assert deleted is True
    assert mgr.get_session(sid) is None


def test_session_manager_redis_mock_persistence(sample_widget):
    mock_redis = MagicMock()
    mock_storage = {}

    def mock_get(key):
        return mock_storage.get(key)

    def mock_set(key, value, ex=None):
        mock_storage[key] = value
        return True

    def mock_delete(key):
        mock_storage.pop(key, None)
        return 1

    mock_redis.get.side_effect = mock_get
    mock_redis.set.side_effect = mock_set
    mock_redis.delete.side_effect = mock_delete

    mgr = SessionManager(redis_client=mock_redis)
    sid = "redis_test_sess_42"

    sess = mgr.get_or_create_session(sid)
    sess.set_step_widget(sample_widget)
    sess.add_turn("What is step 2?", "Subtract 4 from 10.")

    # Verify Redis set was invoked with context key and JSON payload
    assert f"session:{sid}:context" in mock_storage
    stored_data = json.loads(mock_storage[f"session:{sid}:context"])
    assert stored_data["step_widget"]["total_steps"] == 3
    assert stored_data["current_step_index"] == 1

    # Verify transcript streaming via xadd
    assert mock_redis.xadd.call_count >= 2

    # Simulate fresh manager reading from Redis
    mgr2 = SessionManager(redis_client=mock_redis)
    restored = mgr2.get_session(sid)
    assert restored is not None
    assert restored.session_id == sid
    assert restored.step_widget["total_steps"] == 3


# -------------------------------------------------------------------------
# 3. Rolling AI Conversation Summarization Tests
# -------------------------------------------------------------------------

def test_rolling_summary_eviction_deterministic_fallback():
    session = SessionContext(session_id="test_rolling_det", max_turns=3)

    with patch("app.services.llm.llm_service.generate_text", side_effect=RuntimeError("LLM offline")):
        session.add_turn("Turn 1 user", "Turn 1 bot response")
        session.add_turn("Turn 2 user", "Turn 2 bot response")
        session.add_turn("Turn 3 user", "Turn 3 bot response")
        assert len(session.turns) == 3
        assert session.rolling_summary == ""

        # Adding 4th turn evicts Turn 1 into rolling summary
        session.add_turn("Turn 4 user", "Turn 4 bot response")
        assert len(session.turns) == 3
        assert "Student: Turn 1 user" in session.rolling_summary
        assert "Tutor: Turn 1 bot response" in session.rolling_summary

        # Adding 5th turn evicts Turn 2 into rolling summary
        session.add_turn("Turn 5 user", "Turn 5 bot response")
        assert len(session.turns) == 3
        assert "Student: Turn 2 user" in session.rolling_summary


def test_rolling_summary_llm_integration():
    session = SessionContext(session_id="test_rolling_llm", max_turns=2)

    mock_llm_resp = MagicMock()
    mock_llm_resp.text = "Student is solving a subtraction problem involving 10 cookies."

    with patch("app.services.llm.llm_service.generate_text", return_value=mock_llm_resp):
        session.add_turn("I have 10 cookies", "Great, let's start with 10.")
        session.add_turn("I eat 3 cookies", "Now subtract 3.")
        assert len(session.turns) == 2

        # 3rd turn triggers LLM rolling summary
        session.add_turn("How many left?", "Count what is left.")
        assert session.rolling_summary == "Student is solving a subtraction problem involving 10 cookies."


# -------------------------------------------------------------------------
# 4. Step Navigation Endpoint Tests (POST /api/step/navigate)
# -------------------------------------------------------------------------

def test_api_step_navigate_direct_target_index():
    sid = "test_nav_direct_idx"
    # Seed session with active problem
    sess = session_manager.get_or_create_session(sid)
    steps = [
        SocraticStep(step_number=1, title="Step 1", mission="Mission 1", clue="Clue 1",
                    helpful_example="Ex 1", your_turn="YT 1", expected_answer="1").model_dump(),
        SocraticStep(step_number=2, title="Step 2", mission="Mission 2", clue="Clue 2",
                    helpful_example="Ex 2", your_turn="YT 2", expected_answer="2").model_dump(),
        SocraticStep(step_number=3, title="Step 3", mission="Mission 3", clue="Clue 3",
                    helpful_example="Ex 3", your_turn="YT 3", expected_answer="3").model_dump()
    ]
    widget = StepWidgetPayload(total_steps=3, current_step_index=0, completed_steps=[], steps=steps)
    sess.set_step_widget(widget)

    # Jump to Step 3 (index 2)
    resp = client.post("/api/step/navigate", json={
        "session_id": sid,
        "target_step_index": 2
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == sid
    assert data["current_step_index"] == 2
    assert data["step_widget"]["current_step_index"] == 2
    assert data["active_step"]["step_number"] == 3
    assert "Step 3" in data["feedback_message"]

    # Verify session manager was synchronized
    assert sess.current_step_index == 2


def test_api_step_navigate_dot_click_step_number():
    sid = "test_nav_dot_click"
    sess = session_manager.get_or_create_session(sid)
    steps = [
        SocraticStep(step_number=1, title="Step 1", mission="Mission 1", clue="Clue 1",
                    helpful_example="Ex 1", your_turn="YT 1", expected_answer="1").model_dump(),
        SocraticStep(step_number=2, title="Step 2", mission="Mission 2", clue="Clue 2",
                    helpful_example="Ex 2", your_turn="YT 2", expected_answer="2").model_dump(),
    ]
    widget = StepWidgetPayload(total_steps=2, current_step_index=0, completed_steps=[], steps=steps)
    sess.set_step_widget(widget)

    # Click dot for Step 2 (1-indexed step_number: 2)
    resp = client.post("/api/step/navigate", json={
        "session_id": sid,
        "step_number": 2
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["current_step_index"] == 1
    assert data["active_step"]["step_number"] == 2


def test_api_step_navigate_directional_next_and_back():
    sid = "test_nav_directional"
    sess = session_manager.get_or_create_session(sid)
    steps = [
        SocraticStep(step_number=1, title="Step 1", mission="Mission 1", clue="Clue 1",
                    helpful_example="Ex 1", your_turn="YT 1", expected_answer="1").model_dump(),
        SocraticStep(step_number=2, title="Step 2", mission="Mission 2", clue="Clue 2",
                    helpful_example="Ex 2", your_turn="YT 2", expected_answer="2").model_dump(),
        SocraticStep(step_number=3, title="Step 3", mission="Mission 3", clue="Clue 3",
                    helpful_example="Ex 3", your_turn="YT 3", expected_answer="3").model_dump(),
    ]
    widget = StepWidgetPayload(total_steps=3, current_step_index=0, completed_steps=[], steps=steps)
    sess.set_step_widget(widget)

    # Move Next -> Step 2
    resp_next = client.post("/api/step/navigate", json={
        "session_id": sid,
        "direction": "next"
    })
    assert resp_next.status_code == 200
    assert resp_next.json()["current_step_index"] == 1

    # Move Back -> Step 1
    resp_back = client.post("/api/step/navigate", json={
        "session_id": sid,
        "direction": "back"
    })
    assert resp_back.status_code == 200
    assert resp_back.json()["current_step_index"] == 0


def test_api_step_navigate_boundary_errors():
    sid = "test_nav_boundary"
    sess = session_manager.get_or_create_session(sid)
    steps = [
        SocraticStep(step_number=1, title="Step 1", mission="Mission 1", clue="Clue 1",
                    helpful_example="Ex 1", your_turn="YT 1", expected_answer="1").model_dump(),
        SocraticStep(step_number=2, title="Step 2", mission="Mission 2", clue="Clue 2",
                    helpful_example="Ex 2", your_turn="YT 2", expected_answer="2").model_dump(),
    ]
    widget = StepWidgetPayload(total_steps=2, current_step_index=0, completed_steps=[], steps=steps)
    sess.set_step_widget(widget)

    # 1. Negative index (Out of bounds)
    resp = client.post("/api/step/navigate", json={
        "session_id": sid,
        "target_step_index": -1
    })
    assert resp.status_code == 400
    assert "out of bounds" in resp.json()["detail"].lower()

    # 2. Too large index
    resp_large = client.post("/api/step/navigate", json={
        "session_id": sid,
        "target_step_index": 99
    })
    assert resp_large.status_code == 400
    assert "out of bounds" in resp_large.json()["detail"].lower()

    # 3. Moving "back" from step 0
    resp_under = client.post("/api/step/navigate", json={
        "session_id": sid,
        "direction": "back"
    })
    assert resp_under.status_code == 400
    assert "out of bounds" in resp_under.json()["detail"].lower()

    # 4. Empty payload missing target
    resp_empty = client.post("/api/step/navigate", json={
        "session_id": sid
    })
    assert resp_empty.status_code == 400


# -------------------------------------------------------------------------
# 5. Session Retrieval & Re-Hydration Tests (GET /api/session/{session_id})
# -------------------------------------------------------------------------

def test_api_get_session_active_restoration():
    sid = "test_get_sess_restored"
    sess = session_manager.get_or_create_session(sid)
    steps = [
        SocraticStep(step_number=1, title="Step 1", mission="Mission 1", clue="Clue 1",
                    helpful_example="Ex 1", your_turn="YT 1", expected_answer="1").model_dump(),
        SocraticStep(step_number=2, title="Step 2", mission="Mission 2", clue="Clue 2",
                    helpful_example="Ex 2", your_turn="YT 2", expected_answer="2").model_dump(),
    ]
    widget = StepWidgetPayload(total_steps=2, current_step_index=1, completed_steps=[0], steps=steps)
    sess.set_step_widget(widget)
    sess.formatted_markdown = "Rendered Step 2 Card"
    sess.add_turn("User query", "Bot response")

    resp = client.get(f"/api/session/{sid}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == sid
    assert data["current_step_index"] == 1
    assert data["step_widget"] is not None
    assert data["step_widget"]["total_steps"] == 2
    assert data["active_step"]["step_number"] == 2
    assert data["formatted_markdown"] == "Rendered Step 2 Card"
    assert len(data["turns"]) == 1


def test_api_get_session_empty_session():
    sid = "test_get_sess_empty_123"
    # Ensure session does not exist
    session_manager.delete_session(sid)

    resp = client.get(f"/api/session/{sid}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"] == sid
    assert data["step_widget"] is None
    assert "No active Socratic problem" in data["message"]


def test_api_session_delete_endpoint():
    sid = "test_del_endpoint_sid"
    sess = session_manager.get_or_create_session(sid)
    sess.subject = "math"

    # Delete
    resp = client.delete(f"/api/session/{sid}")
    assert resp.status_code == 200
    assert resp.json()["deleted"] is True

    # Verify session is now empty
    get_resp = client.get(f"/api/session/{sid}")
    assert get_resp.json()["step_widget"] is None
