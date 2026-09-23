"""
File: services/math_service/app/solvers/algebra.py
Description: Decomposes elementary math queries (arithmetic, fractions, word problems, algebra)
             into 2-4 verified pedagogical steps.
"""

import re
import json
import os
from fractions import Fraction
try:
    from google import genai
except ImportError:
    genai = None

try:
    from app.prompts import prompt_controller
except ImportError:
    from services.math_service.app.prompts import prompt_controller

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
_genai_client = None
if GEMINI_API_KEY and genai:
    _genai_client = genai.Client(api_key=GEMINI_API_KEY)


def decompose_arithmetic(expr: str) -> dict:
    """Deterministic 2-3 step decomposition for basic arithmetic operations (+, -, *, /)."""
    clean = expr.replace("×", "*").replace("÷", "/").replace("x", "*")
    match = re.search(r'(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)', clean)
    if not match:
        return {"success": False}

    a, op, b = float(match.group(1)), match.group(2), float(match.group(3))
    a_str = str(int(a)) if a.is_integer() else str(a)
    b_str = str(int(b)) if b.is_integer() else str(b)

    if op == '+':
        ans = a + b
        ans_str = str(int(ans)) if ans.is_integer() else str(ans)
        steps = [
            {"step_number": 1, "title": "Identify the Numbers", "clue": f"We are adding {a_str} and {b_str}.", "expected_answer": a_str},
            {"step_number": 2, "title": "Perform Addition", "clue": f"Calculate {a_str} + {b_str}.", "expected_answer": ans_str}
        ]
    elif op == '-':
        ans = a - b
        ans_str = str(int(ans)) if ans.is_integer() else str(ans)
        steps = [
            {"step_number": 1, "title": "Identify Starting Value", "clue": f"We start with {a_str} and take away {b_str}.", "expected_answer": a_str},
            {"step_number": 2, "title": "Perform Subtraction", "clue": f"Calculate {a_str} - {b_str}.", "expected_answer": ans_str}
        ]
    elif op == '*':
        ans = a * b
        ans_str = str(int(ans)) if ans.is_integer() else str(ans)
        steps = [
            {"step_number": 1, "title": "Identify Groups", "clue": f"We have {a_str} groups of {b_str}.", "expected_answer": a_str},
            {"step_number": 2, "title": "Multiply", "clue": f"Multiply {a_str} × {b_str}.", "expected_answer": ans_str}
        ]
    else:
        if b == 0:
            return {"success": False, "error": "Division by zero"}
        ans = a / b
        ans_str = str(int(ans)) if ans.is_integer() else str(round(ans, 2))
        steps = [
            {"step_number": 1, "title": "Set Up Division", "clue": f"How many times does {b_str} fit into {a_str}?", "expected_answer": b_str},
            {"step_number": 2, "title": "Divide", "clue": f"Calculate {a_str} ÷ {b_str}.", "expected_answer": ans_str}
        ]

    return {
        "solution": ans_str,
        "steps": [s["clue"] for s in steps],
        "structured_steps": steps,
        "success": True,
        "error": None
    }


def is_word_problem(expression: str) -> bool:
    """Checks if the expression contains plain english words that indicate a word problem."""
    words = re.findall(r'\b[a-zA-Z]{2,}\b', expression)
    math_terms = {'sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'exp', 'pi', 'solve', 'for', 'evaluate', 'simplify'}
    words = [w for w in words if w.lower() not in math_terms]
    return len(words) > 1


def solve_math_ai(expression: str, grade_level: str) -> dict:
    """Compiles math solver steps using Gemini with grade-level adaptive dynamic prompts."""
    if not GEMINI_API_KEY:
        nums = re.findall(r'\d+', expression)
        if len(nums) >= 2:
            n1, n2 = int(nums[0]), int(nums[1])
            expr_lower = expression.lower()
            if any(w in expr_lower for w in ["times", "each", "groups of", "multiply", "multiplied"]):
                res = n1 * n2
                op_name = "multiplication"
            elif any(w in expr_lower for w in ["divided", "split", "share", "shared equally", "divide"]):
                big, small = max(n1, n2), min(n1, n2)
                res = big // small if small > 0 else 0
                op_name = "division"
            elif any(w in expr_lower for w in ["total", "together", "plus", "add", "altogether", "combined"]):
                res = n1 + n2
                op_name = "addition"
            else:
                res = max(n1, n2) - min(n1, n2)
                op_name = "subtraction"

            steps = [
                f"Identify the given quantities: {n1} and {n2}",
                f"Determine the operation ({op_name}) from the story problem",
                f"Calculate the final result: {res}"
            ]
            return {
                "solution": str(res),
                "steps": steps,
                "structured_steps": [
                    {"step_number": 1, "title": "Extract Given Values", "clue": f"Identify {n1} and {n2}", "expected_answer": str(n1)},
                    {"step_number": 2, "title": "Solve Problem", "clue": f"Calculate the answer", "expected_answer": str(res)}
                ],
                "success": True,
                "error": None
            }
        return {
            "solution": None,
            "steps": [expression],
            "success": False,
            "error": "Gemini API key is not configured in the Math Service environment."
        }

    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        prompt = prompt_controller.get_solver_prompt(expression, grade_level)
        response = _genai_client.models.generate_content(
            model=model_name,
            contents=prompt
        )
        text = response.text.strip()

        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            text = "\n".join(lines).strip()

        steps = json.loads(text)
        if isinstance(steps, list) and len(steps) > 0:
            return {
                "solution": str(steps[-1]),
                "steps": steps,
                "success": True,
                "error": None
            }
        raise ValueError("Parsed output is not a valid list of steps.")
    except Exception as e:
        return {
            "solution": None,
            "steps": [expression],
            "success": False,
            "error": f"AI Step Solver failed: {str(e)}"
        }


def solve_math(expression: str, context: dict = None) -> dict:
    """Main solve entry point for math queries."""
    context = context or {}
    grade_level = context.get("grade_level", "grade_1_3")

    # 1. Deterministic arithmetic
    arith_res = decompose_arithmetic(expression)
    if arith_res.get("success"):
        return arith_res

    # 2. Word problem / AI solver
    return solve_math_ai(expression, grade_level)
