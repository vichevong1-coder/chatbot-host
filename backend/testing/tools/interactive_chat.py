"""
File: testing/interactive_chat.py
Description: Interactive terminal-based Socratic tutor test client.
             Supports both Direct In-Memory LangGraph execution (zero server required)
             and HTTP Gateway connection to http://localhost:9000/api/query.
"""

import os
import sys
import json
import uuid

# Reconfigure stdout for UTF-8 emoji support on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

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

# pyrefly: ignore [missing-import]
from app.services.socratic.graph import socratic_graph

# Terminal formatting
CYAN = "\033[96m"
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


def main():
    print(f"\n{CYAN}{BOLD}========================================================")
    print("   🚀 SOCRATIC STEM TUTOR - INTERACTIVE CLI (Grade 1-3) ")
    print(f"========================================================{RESET}\n")

    # Select Grade Level (Defaults to Grade 1-3)
    print(f"{BOLD}Select Student Grade Level:{RESET}")
    print("1. Grade 1-3 (Early Elementary - Active Default)")
    print("2. Grade 4-6 (Upper Elementary)")
    
    choice = input("\nEnter choice (1-2) [Default: 1]: ").strip()
    grade_level = "grade_4_6" if choice == "2" else "grade_1_3"
    print(f"\n{GREEN}✅ Active Mode: {grade_level.upper()}{RESET}\n")

    session_id = f"cli_{uuid.uuid4().hex[:6]}"
    config = {"configurable": {"thread_id": session_id}}

    print(f"{BOLD}Enter the homework problem you want to solve:{RESET}")
    print(f"{YELLOW}Grade 1-3 Examples:{RESET}")
    print("  • Math: 'Leo has 15 candies and ate 6 candies'")
    print("  • Math: 'What is 8 + 7?'")
    print("  • Physics: 'Why do magnets stick to the fridge?'")
    print("  • Physics: 'What makes a shadow?'")
    print("  • Physics: 'Does a wooden stick sink or float in water?'")
    print("  • Biology: 'How does a caterpillar turn into a butterfly?'")
    print("  • Biology: 'Why do birds have feathers?'")
    print("  • Earth: 'Why is the sky dark at night?'")
    print("  • Earth: 'What are clouds made of and why does it rain?'")
    print("  • Chemistry: 'What happens when water boils?'")
    print("  • General: 'Why do cats purr?' (Or any other question!)")

    initial_problem = input(f"\n{BOLD}Problem: {RESET}").strip()
    if not initial_problem:
        print("No problem entered. Exiting.")
        return

    print(f"\n{CYAN}⏳ Decomposing problem into 4-Part Socratic Steps...{RESET}\n")

    # Initial State invoke
    state = {
        "session_id": session_id,
        "raw_user_input": initial_problem,
        "problem_text": initial_problem,
        "grade_level": grade_level,
        "detected_intent": "INITIAL_QUESTION"
    }

    try:
        res = socratic_graph.invoke(state, config=config)
    except Exception as e:
        print(f"{RED}Error generating card: {e}{RESET}")
        return

    # Print first Socratic Card
    print(f"{GREEN}{res.get('formatted_markdown', '')}{RESET}\n")

    # Interactive Socratic Dialogue Loop
    while True:
        # Check if problem was fully completed
        if res.get("is_problem_complete") or res.get("is_problem_solved"):
            print(f"\n{YELLOW}{BOLD}🎉 Problem Complete! Great job!{RESET}\n")
            break

        print(f"{CYAN}--------------------------------------------------------{RESET}")
        user_input = input(f"{BOLD}Your Answer (or type 'hint', 'jump 2', 'quit'): {RESET}").strip()

        if not user_input:
            continue
        if user_input.lower() in ["quit", "exit", "q"]:
            print(f"\n{BLUE}Goodbye! Keep exploring science & math! ⭐{RESET}\n")
            break

        # Route user attempt or hint request
        lower = user_input.lower()
        if lower.startswith("jump") or lower.startswith("step"):
            target_idx = 0
            for part in lower.split():
                if part.isdigit():
                    target_idx = max(0, int(part) - 1)
            step_state = {
                "session_id": session_id,
                "raw_user_input": user_input,
                "target_nav_index": target_idx,
                "detected_intent": "NAVIGATION_JUMP"
            }
        elif any(h in lower for h in ["hint", "clue", "help", "stuck", "don't know", "dont know"]):
            step_state = {
                "session_id": session_id,
                "raw_user_input": user_input,
                "detected_intent": "REQUEST_HINT"
            }
        else:
            step_state = {
                "session_id": session_id,
                "raw_user_input": user_input,
                "student_attempt": user_input,
                "detected_intent": "STEP_ANSWER_ATTEMPT"
            }

        try:
            res = socratic_graph.invoke(step_state, config=config)
            print(f"\n{GREEN}{res.get('formatted_markdown', '')}{RESET}\n")
        except Exception as e:
            print(f"{RED}Error processing response: {e}{RESET}")


if __name__ == "__main__":
    main()
