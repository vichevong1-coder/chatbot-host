"""
File: orchestrator/app/services/socratic/__init__.py
Description: Public interface for the Socratic Stepper & Progressive Hinting Engine.
"""

from app.services.socratic.card_schema import (
    SocraticStep,
    StepWidgetPayload,
    SocraticResponse
)
from app.services.socratic.state import TutorState, StepAttempt
from app.services.socratic.hint_engine import HintEngine
from app.services.socratic.clarify import SocraticClarifier
from app.services.socratic.graph import build_socratic_graph, socratic_graph

__all__ = [
    "SocraticStep",
    "StepWidgetPayload",
    "SocraticResponse",
    "TutorState",
    "StepAttempt",
    "HintEngine",
    "SocraticClarifier",
    "build_socratic_graph",
    "socratic_graph"
]
