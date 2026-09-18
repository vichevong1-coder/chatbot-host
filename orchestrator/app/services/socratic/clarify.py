"""
File: orchestrator/app/services/socratic/clarify.py
Description: Builds supportive, kid-friendly clarification prompts for ambiguous queries
             while preserving active StepWidgetPayload state and completed step progress.
"""

from typing import Optional, Dict, Any
from app.services.socratic.card_schema import StepWidgetPayload


class SocraticClarifier:
    """
    Handles ambiguous, incomplete, or off-track student queries during an active Socratic session.
    """

    @staticmethod
    def build_clarification_response(
        raw_query: str,
        widget: Optional[StepWidgetPayload] = None,
        grade_level: str = "grade_1_3"
    ) -> Dict[str, Any]:
        """
        Creates a gentle clarification message without resetting the student's problem.
        """
        clean = raw_query.strip()
        active_step = widget.get_active_step() if widget else None

        if not clean or len(clean) < 2:
            msg = "👋 I'm here to help! Could you type your answer or ask a question?"
        elif clean.isdigit():
            if active_step:
                msg = f"I see you typed '{clean}'! Is that your answer for Step {active_step.step_number}: '{active_step.title}'?"
            else:
                msg = f"I received '{clean}'. Which math or science problem are we working on today?"
        else:
            if active_step:
                msg = (
                    f"I want to make sure I understand you! 😊\n"
                    f"We are currently on **Step {active_step.step_number}: {active_step.title}**.\n"
                    f"Would you like to try answering: *\"{active_step.your_turn}\"*, or do you want a 💡 hint?"
                )
            else:
                msg = "I didn't quite catch that! What math or science homework problem would you like to explore together?"

        return {
            "clarification_needed": True,
            "clarification_question": msg,
            "feedback_message": msg
        }
