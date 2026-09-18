"""
File: orchestrator/app/services/socratic/state.py
Description: Defines the TutorState TypedDict schema representing the persistent
             state machine context for the Socratic elementary tutoring workflow.
"""

from typing import TypedDict, Optional, List, Dict, Any
from app.services.socratic.card_schema import StepWidgetPayload, SocraticStep
from app.services.nlu.schema import NLUResult, StudentIntent


# Step attempt recorder class
class StepAttempt(TypedDict, total=False):
    step_number: int
    student_attempt: str
    is_correct: bool
    feedback: str
    hints_used: int


# Tutor state - Persistent state of the Socratic session
class TutorState(TypedDict, total=False):
    # --- Session and Identity Context ---
    session_id: str
    raw_user_input: str
    grade_level: str               # "grade_1_3" | "grade_4_6"
    subject: str                   # "math" | "science" | "general" (from NLU)
    subtopic: Optional[str]        # "arithmetic", "photosynthesis", etc.

    # --- Problem Context ---
    problem_text: str              # Problem statement as student sees it
    total_steps_count: int         # 2 to 4 decomposition steps

    # --- Stepper Widget & Step Cards ---
    step_widget: Optional[Dict[str, Any]]  # Serialized StepWidgetPayload dictionary
    current_step_index: int                # Active 0-indexed step pointer

    # --- NLU Understanding ---
    nlu_result: Optional[Dict[str, Any]]   # Serialized NLUResult
    detected_intent: Optional[str]

    # --- Active Interaction and Hinting ---
    student_attempt: Optional[str]         # Current message / answer attempt
    target_nav_index: Optional[int]        # Step index for manual navigation
    active_hint: Optional[str]             # Current hint text being displayed
    current_hint_tier: int                 # 0=none, 1=nudge, 2=visual, 3=micro-breakdown
    attempt_history: List[Dict[str, Any]]

    # --- Output Payloads ---
    feedback_message: Optional[str]        # Feedback on current attempt
    formatted_markdown: Optional[str]
    is_problem_complete: bool              # True when all steps are finished
    is_problem_solved: bool                # Alias for backwards compatibility
    clarification_needed: bool             # True if query was ambiguous
    clarification_question: Optional[str]

    # --- Chat History ---
    messages: List[Dict[str, str]]