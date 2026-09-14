"""
File: services/science_service/app/solvers/physics.py
Description: Physics solver module in the Unified Science Service.
             Handles forces, simple mechanics, kinematics, and AI step fallback.
"""

import re
import json
import os
import google.generativeai as genai
from app.prompts.controller import prompt_controller

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def solve_physics_ai(expression: str, grade_level: str) -> dict:
    """
    Compiles physics solver steps using Gemini with grade-level adaptive dynamic prompts.
    """
    if not GEMINI_API_KEY:
        return {
            "solution": None,
            "steps": [expression],
            "success": False,
            "error": "GEMINI_API_KEY is not configured in Science Service environment."
        }
        
    try:
        model = genai.GenerativeModel("gemini-flash-latest")
        prompt = prompt_controller.get_prompt("physics", expression, grade_level)
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean markdown wrappers if any
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
            
        steps = json.loads(text)
        if isinstance(steps, list) and len(steps) > 0:
            return {
                "solution": str(steps[-1]),
                "steps": steps,
                "success": True,
                "error": None
            }
        else:
            raise ValueError("Output is not a valid list of steps.")
    except Exception as e:
        return {
            "solution": None,
            "steps": [expression],
            "success": False,
            "error": f"Physics AI Solver failed: {str(e)}"
        }

def solve_physics(expression: str, context: dict = None) -> dict:
    """
    Main entry point for physics queries.
    Evaluates basic mechanics (F=ma) deterministically or falls back to AI step solver.
    """
    context = context or {}
    grade_level = context.get("grade_level", "grade_4_6")
    
    query_lower = expression.lower()
    mass_match = re.search(r'\bmass\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:kg)?', query_lower)
    accel_match = re.search(r'\b(?:acceleration|accel)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:m/s\^2|m/s2)?', query_lower)
    
    if mass_match and accel_match:
        try:
            mass = float(mass_match.group(1))
            accel = float(accel_match.group(1))
            force = round(mass * accel, 2)
            steps = [
                f"Identify mass (m) = {mass} kg",
                f"Identify acceleration (a) = {accel} m/s^2",
                "Apply Newton's Second Law: Force = mass * acceleration",
                f"Substitute values: F = {mass} * {accel}",
                f"Calculate force: F = {force} N"
            ]
            return {
                "solution": f"{force} N",
                "steps": steps,
                "success": True,
                "error": None
            }
        except Exception:
            pass
            
    return solve_physics_ai(expression, grade_level)
