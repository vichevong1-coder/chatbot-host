"""
File: testing/interactive_nlu_tester.py
Description: Interactive standalone terminal test client for the Elementary STEM NLU Engine.
             Runs 100% locally with ZERO Docker or network dependencies.
Usage:
    python testing/interactive_nlu_tester.py
"""

import sys
import os
import time

# Ensure orchestrator package is in path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORCHESTRATOR_DIR = os.path.join(BASE_DIR, "orchestrator")
if ORCHESTRATOR_DIR not in sys.path:
    sys.path.insert(0, ORCHESTRATOR_DIR)

try:
    from app.services.nlu import (  # type: ignore
        process_nlu_sync,
        StudentIntent,
        SubjectArea,
        GradeTier,
        NLUResult,
        normalize_text_sync,
    )
except ImportError:
    from orchestrator.app.services.nlu import (  # type: ignore
        process_nlu_sync,
        StudentIntent,
        SubjectArea,
        GradeTier,
        NLUResult,
        normalize_text_sync,
    )

# Reconfigure stdout for UTF-8 on Windows terminals if supported
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ANSI Terminal Colors
CYAN = "\033[96m"
BLUE = "\033[94m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


MOCK_STEP_CONTEXT = {
    "step_number": 2,
    "total_steps": 4,
    "question": "What is 4 multiplied by 3?",
    "target_concept": "multiplication",
    "expected_answer": "12",
}


def print_banner():
    print(f"\n{CYAN}{BOLD}{'=' * 60}")
    print("      ELEMENTARY STEM SOCRATIC NLU - TEST CONSOLE      ")
    print(f"{'=' * 60}{RESET}")
    print(f"{DIM}Runs locally in pure Python. No Docker / DBs required.{RESET}\n")


def display_nlu_result(raw_query: str, res: NLUResult, elapsed_ms: float, context_active: bool):
    print(f"\n{BLUE}{BOLD}----------------- NLU ANALYSIS RESULTS -----------------{RESET}")
    print(f"{BOLD}Raw Input:{RESET}        {raw_query}")
    print(f"{BOLD}Cleaned/Norm:{RESET}     {res.cleaned_text}")
    
    # Intent formatting
    intent_color = GREEN if res.intent in (StudentIntent.INITIAL_QUESTION, StudentIntent.STEP_ANSWER_ATTEMPT) else YELLOW
    if res.intent == StudentIntent.OFF_TOPIC:
        intent_color = RED
    print(f"{BOLD}Detected Intent:{RESET}  {intent_color}{res.intent.value} (Confidence: {res.confidence:.2f}){RESET}")
    
    # Subject & Subtopic
    subj_color = CYAN if res.subject == SubjectArea.MATH else MAGENTA
    print(f"{BOLD}Subject Area:{RESET}     {subj_color}{res.subject.value}{RESET}")
    if res.subtopic:
        print(f"{BOLD}Subtopic:{RESET}         {subj_color}{res.subtopic}{RESET}")
    
    # Extracted answer (if step answer)
    if res.extracted_answer is not None:
        print(f"{BOLD}Extracted Answer:{RESET} {GREEN}{res.extracted_answer}{RESET}")
        
    # Ambiguity / Clarification
    if res.is_ambiguous:
        print(f"{BOLD}Ambiguity:{RESET}        {YELLOW}Ambiguous / Incomplete Query{RESET}")
    if res.clarification_prompt:
        print(f"{BOLD}Socratic Prompt:{RESET}  {YELLOW}{res.clarification_prompt}{RESET}")
        
    # Context mode & Latency
    ctx_status = f"{GREEN}Active (Step 2/4: 'What is 4 * 3?'){RESET}" if context_active else f"{DIM}None (Initial Query Mode){RESET}"
    print(f"{BOLD}Step Context:{RESET}     {ctx_status}")
    print(f"{BOLD}Execution Time:{RESET}   {CYAN}{elapsed_ms:.3f} ms{RESET}")
    print(f"{BLUE}{BOLD}--------------------------------------------------------{RESET}\n")


def main():
    print_banner()
    
    context_active = False
    
    print(f"{BOLD}Commands:{RESET}")
    print(f"  {YELLOW}/context{RESET}   Toggle mock active step context (current: {context_active})")
    print(f"  {YELLOW}/samples{RESET}   Run predefined test samples")
    print(f"  {YELLOW}/help{RESET}      Show help")
    print(f"  {YELLOW}/exit{RESET}      Quit\n")

    while True:
        try:
            prompt_label = f"{GREEN}[Context ON]{RESET}" if context_active else f"{DIM}[No Context]{RESET}"
            user_input = input(f"{BOLD}NLU Query {prompt_label} > {RESET}").strip()
            
            if not user_input:
                continue
                
            if user_input.lower() in ("/exit", "exit", "quit", "q"):
                print(f"{CYAN}Goodbye! Happy testing!{RESET}")
                break
                
            if user_input.lower() == "/context":
                context_active = not context_active
                status = f"{GREEN}ENABLED{RESET}" if context_active else f"{YELLOW}DISABLED{RESET}"
                print(f"\n{BOLD}Step Context is now {status}.{RESET}")
                if context_active:
                    print(f"{DIM}Simulating active step: 'What is 4 multiplied by 3?'{RESET}\n")
                else:
                    print(f"{DIM}Simulating standalone initial question / exploration.{RESET}\n")
                continue
                
            if user_input.lower() == "/samples":
                sample_queries = [
                    ("what is 15 * 4?", False),
                    ("Leo has 8 cookiez and givs 3 away, how mny left?", False),
                    ("how plantz mak food with fotosynthesis?", False),
                    ("12", True),
                    ("I think the answer is 12 cookies", True),
                    ("hint please", True),
                    ("i'm stuck", True),
                    ("what is a numerator?", False),
                    ("do you play fortnite?", False),
                    ("asdfghjkl", False),
                ]
                print(f"\n{YELLOW}{BOLD}Running 10 Sample Queries...{RESET}\n")
                for q, ctx in sample_queries:
                    t0 = time.perf_counter()
                    res = process_nlu_sync(q, current_context=MOCK_STEP_CONTEXT if ctx else None)
                    t1 = time.perf_counter()
                    display_nlu_result(q, res, (t1 - t0) * 1000, ctx)
                continue
                
            if user_input.lower() == "/help":
                print(f"\n{BOLD}Type any student query to test NLU.{RESET}")
                print(f"Examples:")
                print(f"  - Math problem: 'what is 3/4 + 1/2' or 'calculate 15 * 4'")
                print(f"  - Science query: 'why do objects fall to the ground?'")
                print(f"  - Step answer: '12', 'chloroplast', 'is it 20?' (toggle /context first)")
                print(f"  - Help / Hint: 'i'm stuck', 'give me a clue', 'idk'")
                print(f"  - Clarification: 'what is a numerator?', 'what does gravity mean?'")
                print(f"  - Off-topic: 'do you play fortnite?'\n")
                continue
                
            # Process query
            current_ctx = MOCK_STEP_CONTEXT if context_active else None
            t0 = time.perf_counter()
            result = process_nlu_sync(user_input, current_context=current_ctx)
            t1 = time.perf_counter()
            elapsed_ms = (t1 - t0) * 1000
            
            display_nlu_result(user_input, result, elapsed_ms, context_active)
            
        except KeyboardInterrupt:
            print(f"\n{CYAN}Session ended.{RESET}")
            break
        except Exception as e:
            print(f"{RED}[Error processing query]{RESET}: {e}\n")


if __name__ == "__main__":
    main()
