"""
File: orchestrator/app/services/nodes/hint_generator.py
Description: LangGraph node that generates Socratic hints using the Dynamic Prompt Controller,
             shaping explanations dynamically based on mistake count.
"""

import google.generativeai as genai
from app.core.config import settings
from app.core.logging import logger
from app.services.state import SocraticTutorState
from app.services.prompts import prompt_controller

async def generate_hint_node(state: SocraticTutorState) -> dict:
    """
    LangGraph node to formulate Socratic hints when the student makes a mistake,
    or provide direct general answers for general subject queries.
    """
    subject = state.get("subject", "GENERAL")
    solved_steps = state.get("solved_steps", [])
    current_index = state.get("current_step_index", 0)
    hint_count = state.get("hint_count", 0)
    query = state.get("query", "")
    student_attempt = state.get("student_attempt", "")

    # 1. General Subject Query: Answer directly but educationally
    if subject == "GENERAL":
        try:
            model = genai.GenerativeModel("gemini-flash-latest")
            prompt = prompt_controller.get_general_tutor_prompt(query)
            response = model.generate_content(prompt)
            return {"tutor_feedback": response.text.strip()}
        except Exception as e:
            logger.error(f"General query Gemini helper failed: {e}")
            return {"tutor_feedback": "I am having trouble connecting to my Socratic engine right now. Let's try that again in a moment!"}

    # 2. Math/Science step hints: Build dynamic adaptive Socratic prompt from prompt_controller
    full_prompt = prompt_controller.get_tutor_prompt(
        subject=subject,
        solved_steps=solved_steps,
        current_step_index=current_index,
        hint_count=hint_count,
        student_attempt=student_attempt,
        grade_level=state.get("grade_level", "grade_4_6")
    )
    
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        
        chat_context = []
        for msg in state.get("history", [])[-6:]:
            chat_context.append(f"{msg['role']}: {msg['content']}")
            
        final_prompt = (
            f"{full_prompt}\n\n"
            f"--- RECENT CONVERSATION HISTORY ---\n"
            + "\n".join(chat_context) + "\n\n"
            "Output ONLY the tutor's hint response. No preamble, no labels, no markdown headers."
        )
        
        response = model.generate_content(final_prompt)
        feedback = response.text.strip()
    except Exception as e:
        logger.error(f"Gemini hint generation failed: {e}")
        if subject == "GENERAL":
            feedback = "I am having trouble connecting to my Socratic engine right now. Let's try that again in a moment!"
        else:
            expected_step = solved_steps[current_index] if current_index < len(solved_steps) else {}
            feedback = f"Let's focus on the next step: {expected_step.get('hint', 'Try solving the expression.')}"
        
    return {"tutor_feedback": feedback}
