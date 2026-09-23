# 🚀 2-Month Socratic MVP: Proposed Project File Structure & UI Specification

> **Goal**: A streamlined, conflict-free project architecture tailored strictly to deliver the **4 Must-Have features** for elementary learners (Grades 1–6) within a 2-month timeline, featuring an **Interactive Step-by-Step Stepper Widget** for pedagogical responses.

---

## 1. The 4 Must-Haves Mapping

Every directory in this proposed layout maps directly to one of your core project commitments:

| Must-Have Feature | Dedicated Directory / Service | Purpose |
| :--- | :--- | :--- |
| **Must #1: Image Upload & OCR** | `orchestrator/app/services/ocr/` + `/api/upload.py` | Receives worksheet/textbook photos; extracts clean question text via Gemini Vision. |
| **Must #2: Natural Language Understanding** | `orchestrator/app/services/nlu/` | Cleans typos, normalizes math symbols, classifies intent (answering vs asking for hints). |
| **Must #3: Socratic AI Guidance & Stepper Widget** | `orchestrator/app/services/socratic/` | LangGraph state machine tracking student steps, emitting structured 4-part Socratic step cards, and driving the interactive stepper widget. |
| **Must #4: Safety Guardrails** | `orchestrator/app/services/guardrails/` | Pre-filters input and post-filters output for kid safety, inappropriate content, and off-topic homework deflection. |
| **Domain Solvers** | `services/science_service/` & `services/math_service/` | Consolidated backend engines providing ground truth solutions and intermediate verification steps. |

---

## 2. Full Proposed File Tree

```text
Science_chatbot/
│
├── docker-compose.yml                      # 3 core containers: orchestrator, science-service, math-service (+ redis)
├── .env.example                            # Configuration & API keys (GEMINI_API_KEY, ports)
├── README.md                               # Project onboarding & setup guide
│
├── orchestrator/                           # 🧠 Central Application & Socratic Gateway
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                         # FastAPI application entrypoint
│       │
│       ├── api/                            # HTTP API Endpoints
│       │   ├── endpoints.py                # Main chat & stepper navigation routes (/api/query, /api/session, /api/step/navigate)
│       │   └── upload.py                   # 🟢 MUST #1: Image upload & OCR route (/api/upload/ocr)
│       │
│       ├── core/                           # System Configuration
│       │   ├── config.py                   # Environment settings & service URLs
│       │   └── logging.py                  # Structured application logger
│       │
│       ├── infrastructure/                 # External Communication Layer
│       │   ├── clients.py                  # Resilient HTTP client with retry & circuit breakers
│       │   └── database.py                 # Redis session state persistence
│       │
│       └── services/                       # 🧩 Core Feature Modules
│           │
│           ├── ocr/                        # 🟢 MUST #1: Image Upload & Text Extraction
│           │   ├── __init__.py
│           │   └── extractor.py            # Gemini 2.5 Vision processor for printed/handwritten worksheets
│           │
│           ├── nlu/                        # 🟢 MUST #2: Natural Language Understanding
│           │   ├── __init__.py
│           │   ├── normalizer.py           # Text standardization & math symbol cleaning
│           │   ├── intent.py               # Classifies: INITIAL_SOLVE, STEP_ATTEMPT, CLARIFICATION, CHITCHAT
│           │   └── router.py               # Subject routing (Math vs General Science)
│           │
│           ├── socratic/                   # 🟢 MUST #3: Socratic AI Guidance & Stepper Engine
│           │   ├── __init__.py
│           │   ├── graph.py                # LangGraph StateGraph pipeline
│           │   ├── state.py                # TutorState schema (steps, current_step, hints_given, student_attempt)
│           │   ├── card_schema.py          # Pydantic models for 4-part Socratic card & Stepper payload
│           │   ├── hint_engine.py          # 3-tier progressive hint generator (Question -> Clue -> Worked step)
│           │   ├── clarify.py              # Clarification handler when student query is ambiguous
│           │   └── prompts/                # Grade 1-6 tailored prompt templates
│           │       ├── controller.py       # Prompt loader and response formatter
│           │       └── templates.yml       # 4-part card templates (Mission, Clue, Helpful Picture, Your Turn)
│           │
│           └── guardrails/                 # 🟢 MUST #4: Safety Guardrails
│               ├── __init__.py
│               ├── safety_filter.py        # Content moderation & PII protection for young kids
│               └── educational_scope.py    # Deflects non-homework queries (games, movies, off-topic chat)
│
├── services/                               # 🔬 Scientific Solvers (Ground Truth & Verification)
│   │
│   ├── science_service/                    # 🧪 Consolidated Elementary Science Service (Port 9002)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py                     # Unified /solve and /validate endpoints
│   │       └── solvers/
│   │           ├── __init__.py
│   │           ├── physics.py              # Elementary mechanics & forces (push/pull, gravity, energy)
│   │           ├── chemistry.py            # States of matter, mixtures, basic reactions
│   │           └── biology.py              # Plants, animals, ecosystems, human body
│   │
│   └── math_service/                       # 📐 Elementary Math Service (Port 9001)
│       ├── Dockerfile
│       ├── requirements.txt
│       └── app/
│       │   ├── main.py                     # Math /solve and /validate endpoints
│       │   ├── validator.py                # Algebraic and numeric equivalence checker
│       │   └── solvers/
│       │       └── algebra.py              # Arithmetic & grade-appropriate word problem solver
│
└── testing/                                # 🧪 Validation & Team Playgrounds
    ├── test_cases.py                       # Automated integration tests for the 4 Musts
    └── interactive_chat.py                 # CLI test tool for live Socratic dialogue testing
```

---

## 3. Socratic Response Output Specification: 4-Part Step Card

Every pedagogical response generated by the Socratic Guidance Engine follows a strict **4-part elementary structure**:

```markdown
🌟 **Our Mission:** [1 simple sentence on what we are doing]

💡 **Clue:** [Simple rule from the Grade 1-6 knowledge base]

🍎 **Helpful Picture / Example:**
> [Visual analogy with objects like apples, pizza slices, or step-by-step numbers]

👉 **Your Turn:**
[Only ONE simple question for the student to answer]
```

### Breakdown of Sections:
1. 🌟 **Our Mission**: Sets clear, bite-sized intent for the current step (e.g., *"Let's find how many apples Sarah started with!"*).
2. 💡 **Clue**: Recalls a foundational rule or concept from elementary science/math without giving away the answer.
3. 🍎 **Helpful Picture / Example**: Provides concrete visual analogies using child-friendly examples (apples, pizza slices, building blocks, water cycles).
4. 👉 **Your Turn**: Asks **only ONE** straightforward question or prompt for the student to attempt.

---

## 4. Interactive Step-by-Step Card ("Stepper Widget") UI/UX

The frontend renders each problem as an interactive checklist / stepper widget, providing intuitive step-by-step navigation for kids:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🧩 Step 2 of 4                                     [ 👁️ View all steps ]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  🌟 Our Mission:                                                       │
│     Let's subtract the eaten cookies from the total!                   │
│                                                                        │
│  💡 Clue:                                                              │
│     When someone eats cookies, we take away from the big group.         │
│                                                                        │
│  🍎 Helpful Picture / Example:                                         │
│     > 🍪🍪🍪🍪🍪🍪 (6 cookies) take away 🍪🍪 (2 cookies) = 🍪🍪🍪🍪     │
│                                                                        │
│  👉 Your Turn:                                                         │
│     If Leo had 8 cookies and gave away 3, how many are left?           │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [ ⬅️ Back ]           ( 1 )  ● 2 ●  ( 3 )  ( 4 )          [ Next ➡️ ] │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Stepper Widget Features:
- **Active Step Card**: Displays the current 4-part Socratic card for the active step.
- **Numbered Dots Progress Bar**: Clickable numbered dots `(1) (2) (3) (4)` at the bottom showing solved vs current vs upcoming steps. Clicking a dot jumps directly to that step.
- **Next / Back Navigation Buttons**: Seamlessly move one step forward or backward to review prior steps.
- **"View all steps" Mode**: A toggle/modal that unfolds all steps into a full interactive checklist view so students can see the entire solution journey.
- **Student Input Integration**: The student's answer or question in the chat input specifically addresses the active step's **👉 Your Turn**.

---

## 5. Structured API Response Contract (`card_schema.py`)

To power the interactive widget on the web client, the orchestrator returns both rendered Markdown and structured JSON:

```json
{
  "session_id": "sess_12345",
  "step_widget": {
    "total_steps": 4,
    "current_step_index": 1,
    "completed_steps": [0],
    "steps": [
      {
        "step_number": 1,
        "title": "Identify given quantities",
        "status": "completed",
        "mission": "Find what numbers we already know.",
        "clue": "Look for the numbers mentioned in the story.",
        "helpful_example": "Leo has 8 cookies, and gives away 3.",
        "your_turn": "What is the total number of cookies Leo started with?",
        "student_answer": "8"
      },
      {
        "step_number": 2,
        "title": "Subtract given away cookies",
        "status": "in_progress",
        "mission": "Let's subtract the eaten cookies from the total!",
        "clue": "When someone eats cookies, we take away from the big group.",
        "helpful_example": "🍪🍪🍪🍪🍪🍪 (6 cookies) take away 🍪🍪 (2 cookies) = 🍪🍪🍪🍪",
        "your_turn": "If Leo had 8 cookies and gave away 3, how many are left?",
        "student_answer": null
      }
    ]
  },
  "formatted_markdown": "🌟 **Our Mission:** Let's subtract the eaten cookies from the total!\n\n💡 **Clue:** When someone eats cookies, we take away from the big group.\n\n🍎 **Helpful Picture / Example:**\n> 🍪🍪🍪🍪🍪🍪 (6 cookies) take away 🍪🍪 (2 cookies) = 🍪🍪🍪🍪\n\n👉 **Your Turn:**\nIf Leo had 8 cookies and gave away 3, how many are left?"
}
```

---

## 6. Team Work Distribution (Zero Code Conflicts)

With this structure, your team can work concurrently on separate Git branches without colliding:

| Teammate | Assigned Scope | Working Directory | Conflict Risk |
| :--- | :--- | :--- | :--- |
| **Chesda** (Backend) | **Must #1 & Solvers: OCR & Math/Science Solvers** | `orchestrator/app/services/ocr/`, `services/` | 🟢 **Zero** (completely isolated files) |
| **Deth** (Backend) | **Must #2: NLU Pipeline & Normalizer** | `orchestrator/app/services/nlu/` | 🟢 **Zero** (isolated to NLU logic) |
| **Vicheka** (Backend) | **Must #3 & #4: Socratic Engine, State & Guardrails** | `orchestrator/app/services/socratic/`, `guardrails/` | 🟢 **Zero** (owns graph, card schema & safety) |
| **Vong** (Frontend) | **Interactive Stepper Widget & Web UI** | `frontend/` | 🟢 **Zero** (separate client app) |

---

## 7. Key Improvements from the Current Codebase

1. **Structured Stepper Widget UI Standard**: Clearly defines the 4-part step card (Mission, Clue, Helpful Picture/Example, Your Turn) alongside the interactive stepper widget (numbered dots, Next/Back buttons, "View all steps" mode).
2. **Dual Representation (JSON + Markdown)**: Backend emits both structured JSON for the stepper component and rendered markdown for universal client support.
3. **Eliminated Over-Engineering**: Merged 3 separate high-school microservices (`chemistry_service`, `biology_service`, `physics_service`) into a single `science_service`.
4. **First-Class Homes for Missing Must-Haves**: Explicit packages for **OCR** (`services/ocr/`), **Guardrails** (`services/guardrails/`), and **Stepper Card Schema** (`services/socratic/card_schema.py`).
5. **Clean Separation of Concerns**: Socratic prompting logic and UI card schemas are isolated from NLU classification, allowing easy pedagogical prompt tuning.
