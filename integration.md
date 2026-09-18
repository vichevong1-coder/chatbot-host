# 🚀 Backend Core & Pedagogical Engine: Integrated Plan & Progress Tracker
### Unified Socratic State, Domain Solvers, Safety Guardrails & OCR Pipeline

> [!IMPORTANT]
> **🎯 MANDATORY TARGET AUDIENCE: Grade 1–3 Early Elementary (Ages 6–9)**
> All solvers, prompt controllers, validators, and hint engines MUST strictly target **Grade 1–3 curricula**:
> - **Tone & Vocabulary**: Extremely simple words, short sentences, visual emojis, zero academic jargon.
> - **Math Scope**: 1-to-2 digit arithmetic (`+`, `-`, `×`, `÷`), simple fractions (`1/2`, `1/4`, `3/4`), story word problems (cookies, apples, toys, distances), basic numbers and word numbers.
> - **Science Scope**: Observable everyday physical matter (states of matter: ice melting, water boiling/evaporating, condensation, dissolving sugar/salt), life science (plants needing sunlight/water, animal habitats, body parts), and simple physics (push/pull forces, gravity dropping objects).
> - **Strict Prohibition**: NO high school/college chemistry formulas (no stoichiometry, molar mass, complex balancing), NO advanced calculus/physics mechanics.

---

## 📊 Live Progress Tracker

| Part / Component | Description | Status | Test Coverage |
| :--- | :--- | :--- | :---: |
| **Part 1: 4-Part Socratic Card & Stepper Serializer** | Pydantic data schemas, 4-part card generator, Stepper payload models, Markdown serializer, Socratic prompt templates & controller | ✅ **DONE** | 8/8 Tests Passing (`test_card_schema.py`) |
| **Part 2: LangGraph State Machine & 3-Tier Hint Engine** | LangGraph StateGraph, `TutorState`, 3-tier progressive hint engine (Nudge $\rightarrow$ Visual $\rightarrow$ Worked), multi-turn Socratic loop | ✅ **DONE** | 8/8 Tests Passing (`test_socratic_state.py`) |
| **Part 3: Domain Solvers & Answer Validator** | Elementary Math & Science decomposition into 2–4 verified steps, ground truth targets, fuzzy/conceptual equivalence checking | ✅ **DONE** | 16/16 Tests Passing (`test_solvers.py`) |
| **Part 4: Child Safety Guardrails & Deflection** | PII redaction, inappropriate content filtering, non-homework educational scope deflection | ⏳ Pending | Pending |
| **Part 5: Session Persistence & Step Navigation** | Redis session state management, rolling AI summary of previous turns, step-jumping navigation (`/api/step/navigate`) | ⏳ Pending | Pending |
| **Part 6: OCR & Vision Extraction (With Mock Fallback)** | Gemini 2.5 Vision worksheet extraction, `POST /api/upload/ocr`, zero-model simulated fallback mode | ⏳ Pending | Pending |

---

## 1. System Architecture & Information Flow

```
                      ┌────────────────────────────────────────┐
                      │          Student Raw Input             │
                      │  (Text Query OR Worksheet Image Photo) │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼ (Image Path)                                  ▼ (Text Path)
       ┌──────────────────────┐                        ┌──────────────────────┐
       │   OCR Vision Engine  │                        │   NLU Normalizer     │
       │ (Gemini 2.5 / Mock)  │                        │ & Intent Classifier  │
       │    [Part 6]          │                        │    [✅ Done]         │
       └──────────┬───────────┘                        └──────────┬───────────┘
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          │ (Clean Text + NLU Intent)
                                          ▼
                         ┌─────────────────────────────────┐
                         │    Safety & Scope Guardrails    │
                         │ (PII Filter + Topic Deflector)  │
                         │           [Part 4]              │
                         └────────────────┬────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │       Domain Solver Layer       │
                         │  • Math Service (Decomposition) │
                         │  • Science Service (Concepts)   │
                         │  • Equivalence Validator        │
                         │           [Part 3]              │
                         └────────────────┬────────────────┘
                                          │ (Ground Truth Steps)
                                          ▼
                         ┌─────────────────────────────────┐
                         │   LangGraph Socratic State      │
                         │  • 3-Tier Progressive Hinting   │
                         │  • Step State & Navigation      │
                         │  • 4-Part Socratic Card Engine  │
                         │         [Parts 1 & 2]           │
                         └────────────────┬────────────────┘
                                          │
                                          ▼
                         ┌─────────────────────────────────┐
                         │     Dual-Payload API Output     │
                         │  • Structured Stepper JSON      │
                         │  • Rendered Markdown Card       │
                         │           [Part 1]              │
                         └─────────────────────────────────┘
```

---

## 2. Directory Structure & Implementation Status

```text
Science_chatbot/
├── orchestrator/app/
│   ├── api/
│   │   ├── endpoints.py                  # ⏳ Part 5: /api/query, /api/session, /api/step/navigate
│   │   └── upload.py                     # ⏳ Part 6: POST /api/upload/ocr
│   │
│   └── services/
│       ├── socratic/                     # 🌟 Socratic Stepper Engine
│       │   ├── __init__.py               # ✅ Part 1: Socratic package exports
│       │   ├── card_schema.py            # ✅ Part 1: SocraticStep, StepWidgetPayload, SocraticResponse
│       │   ├── state.py                  # ✅ Part 2: TutorState schema (steps, current_step, hints, attempts)
│       │   ├── graph.py                  # ✅ Part 2: LangGraph StateGraph orchestration pipeline
│       │   ├── hint_engine.py            # ✅ Part 2: 3-Tier progressive hint generator
│       │   ├── clarify.py                # ✅ Part 2: Ambiguity & clarification question builder
│       │   └── prompts/
│       │       ├── __init__.py           # ✅ Part 1: Prompts package exports
│       │       ├── controller.py         # ✅ Part 1: SocraticPromptController & JSON extractor
│       │       └── templates.yml         # ✅ Part 1: 4-part templates, hints, parallel examples
│       │
│       ├── guardrails/                   # 🛡️ Part 4: Safety & Moderation Layer
│       │   ├── __init__.py               # ⏳ Part 4
│       │   ├── safety_filter.py          # ⏳ Part 4: Child safety, PII detection & profanity redaction
│       │   └── educational_scope.py      # ⏳ Part 4: Non-homework deflection (gaming, gossip, off-topic)
│       │
│       ├── ocr/                          # 📷 Part 6: OCR & Vision Module
│       │   ├── __init__.py               # ⏳ Part 6
│       │   └── extractor.py              # ⏳ Part 6: Gemini Vision extractor + Mock/Simulated OCR fallback
│       │
│       └── session.py                    # ⏳ Part 5: Redis session persistence & conversation summaries
│
├── services/                             # 🔬 Scientific Solvers (Verification & Decomposition)
│   ├── math_service/                     # ✅ Part 3: Port 9001
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py                   # ✅ Part 3: /solve and /validate endpoints
│   │       ├── validator.py              # ✅ Part 3: Numeric, fraction & word answer equivalence checker
│   │       └── solvers/
│   │           ├── __init__.py
│   │           └── algebra.py            # ✅ Part 3: Elementary arithmetic, fractions, word problems
│   │
│   └── science_service/                  # ✅ Part 3: Port 9002
│       ├── Dockerfile
│       ├── requirements.txt
│       └── app/
│           ├── main.py                   # ✅ Part 3: /solve and /validate endpoints
│           ├── validator.py              # ✅ Part 3: Conceptual keyword & taxonomy validator
│           └── solvers/
│               ├── __init__.py
│               ├── physics.py            # ✅ Part 3: Forces, gravity, simple machines, light, sound
│               ├── chemistry.py          # ✅ Part 3: States of matter, mixtures, water cycle
│               └── biology.py            # ✅ Part 3: Plants, animals, ecosystems, human body
│
└── testing/
    ├── test_card_schema.py               # ✅ Part 1: Card schema & prompt controller tests (8/8 passed)
    ├── test_socratic_state.py            # ✅ Part 2: State machine & hint engine tests (8/8 passed)
    ├── test_solvers.py                   # ✅ Part 3: Math and science solver tests (16/16 passed)
    ├── test_guardrails.py                # ⏳ Part 4: Safety & deflection tests
    └── test_session_nav.py               # ⏳ Part 5: Step navigation & Redis session tests
```

---

## 3. Detailed Component Breakdown & Implementation Status

---

### ✅ Part 1: 4-Part Socratic Card & Stepper Serializer (COMPLETED)
- **Status**: ✅ **Done**
- **Files Created**:
  - `orchestrator/app/services/socratic/__init__.py`
  - `orchestrator/app/services/socratic/card_schema.py`
  - `orchestrator/app/services/socratic/prompts/__init__.py`
  - `orchestrator/app/services/socratic/prompts/templates.yml`
  - `orchestrator/app/services/socratic/prompts/controller.py`
  - `testing/test_card_schema.py`
- **Features Delivered**:
  - [x] Pydantic `SocraticStep` with strict 4 sections:
    - 🌟 **Our Mission**: 1 simple sentence defining the step.
    - 💡 **Clue**: Grade-appropriate concept/rule.
    - 🍎 **Helpful Picture / Example**: Isomorphic parallel example with visual emojis (Zero Answer Leakage).
    - 👉 **Your Turn**: Exactly ONE single question on student's homework.
  - [x] Pydantic `StepWidgetPayload` for state tracking (`total_steps`, `current_step_index`, `completed_steps`, `steps[]`).
  - [x] `advance_step()`, `jump_to_step()`, and `to_overview_markdown()` (clean question-free roadmap).
  - [x] Dual-mode `SocraticResponse` emitting synchronized JSON and Markdown.
  - [x] `SocraticPromptController` loading prompts with markdown-fence JSON parsing resilience.
  - [x] Automated unit test suite passing 8/8 tests.

---

### ✅ Part 2: LangGraph State Machine & 3-Tier Hint Engine (COMPLETED)
- **Status**: ✅ **Done**
- **Target Files**:
  - `orchestrator/app/services/socratic/state.py`
  - `orchestrator/app/services/socratic/graph.py`
  - `orchestrator/app/services/socratic/hint_engine.py`
  - `orchestrator/app/services/socratic/clarify.py`
  - `testing/test_socratic_state.py`
- **Checklist**:
  - [x] Define `TutorState` TypedDict for LangGraph (problem text, NLU output, solver steps, current step, hint tier, messages).
  - [x] Implement `hint_engine.py` generating:
    - **Tier 1 (Guiding Nudge)**: Points attention to keywords without math.
    - **Tier 2 (Visual Scaffold)**: Emoji diagrams and cross-out examples.
    - **Tier 3 (Micro-Breakdown)**: Small baby calculation steps.
  - [x] Build `graph.py` state machine handling transitions:
    - `INITIAL_QUESTION` $\rightarrow$ decompose problem & emit Step 1 card.
    - `STEP_ANSWER_ATTEMPT` $\rightarrow$ validate answer; if correct, advance step; if incorrect, increment hint.
    - `REQUEST_HINT` $\rightarrow$ generate next progressive hint tier on active card.
    - `NAVIGATION_JUMP` $\rightarrow$ switch active step index.
  - [x] Build `clarify.py` handling ambiguous queries without resetting problem state.
  - [x] Add unit and integration tests in `testing/test_socratic_state.py` (8/8 passed).

---

### ✅ Part 3: Domain Solvers & Step Equivalence Validator (COMPLETED)
- **Status**: ✅ **Done**
- **Grade Focus**: 🎒 **Grade 1–3 Early Elementary (Ages 6–9)**
- **Target Files**:
  - `services/math_service/app/main.py`, `validator.py`, `solvers/algebra.py`
  - `services/science_service/app/main.py`, `validator.py`, `solvers/{physics,chemistry,biology}.py`
  - `testing/test_solvers.py`
- **Checklist**:
  - [x] Math Solver (`/solve`): Decompose elementary math (arithmetic, simple fractions, word problems) into 2–4 verified steps with expected answers.
  - [x] Science Solver (`/solve`): Grade 1–3 Physical matter (states of matter, melting, freezing, boiling, dissolving), Life Science (plants, photosynthesis basics, animals), Physics (forces, push/pull, gravity).
  - [x] Answer Validator (`/validate`): Flexible equivalence checking:
    - Numbers: `5`, `"5"`, `"five"`, `"5 cookies"`, `"5cm"` $\rightarrow$ Match.
    - Fractions: `1/2`, `0.5`, `"half"` $\rightarrow$ Match.
    - Scientific concepts: `"evaporation"`, `"it evaporates"`, `"steam"`, `"melting"` $\rightarrow$ Match.
  - [x] Verify standalone solver endpoints on ports 9001 and 9002.
  - [x] Automated unit and integration test suite passing 16/16 tests (`testing/test_solvers.py`).

---

### ⏳ Part 4: Child Safety Guardrails & Educational Scope Deflector
- **Status**: ⏳ **Pending**
- **Target Files**:
  - `orchestrator/app/services/guardrails/__init__.py`
  - `orchestrator/app/services/guardrails/safety_filter.py`
  - `orchestrator/app/services/guardrails/educational_scope.py`
  - `testing/test_guardrails.py`
- **Checklist**:
  - [ ] `safety_filter.py`: Pre-filter redacting PII (phone numbers, addresses, real full names) and blocking inappropriate content.
  - [ ] `educational_scope.py`: Deflect non-homework questions (e.g. Fortnite, Roblox, gossip, Minecraft) back to active homework step.
  - [ ] Unit test 100% deflection on inappropriate / off-topic queries.

---

### ⏳ Part 5: Session Persistence & Step Navigation Endpoint
- **Status**: ⏳ **Pending**
- **Target Files**:
  - `orchestrator/app/services/session.py`
  - `orchestrator/app/api/endpoints.py`
  - `testing/test_session_nav.py`
- **Checklist**:
  - [ ] Redis session state persistence saving `StepWidgetPayload` and conversation history.
  - [ ] Implement `POST /api/step/navigate` endpoint for clicking numbered dots `( 1 )  ● 2 ●  ( 3 )` or Next/Back buttons.
  - [ ] Implement `GET /api/session/{session_id}` returning restored stepper card state.
  - [ ] Add rolling AI conversation summarization for long dialogues.

---

### ⏳ Part 6: OCR Worksheet Vision Pipeline (With Zero-Model Fallback)
- **Status**: ⏳ **Pending**
- **Target Files**:
  - `orchestrator/app/services/ocr/__init__.py`
  - `orchestrator/app/services/ocr/extractor.py`
  - `orchestrator/app/api/upload.py`
  - `testing/test_ocr_upload.py`
- **Checklist**:
  - [ ] Implement `POST /api/upload/ocr` accepting worksheet photo uploads (`.png`, `.jpg`, `.webp`).
  - [ ] Gemini 2.5 Vision transcription engine extracting clean question text.
  - [ ] Zero-model mock fallback mode: enables instant development and testing even when no OCR model is connected.
  - [ ] Unit and endpoint tests for image uploads.

---

## 4. Verification & Testing Protocol

| Part | Test File | Target Verification Metric |
| :--- | :--- | :--- |
| **Part 1** | `testing/test_card_schema.py` | ✅ **8/8 PASSED** (Strict 4-part card, JSON serialization, Markdown generation) |
| **Part 2** | `testing/test_socratic_state.py` | ✅ **8/8 PASSED** (Multi-turn state transitions, 3-tier progressive hint escalation) |
| **Part 3** | `testing/test_solvers.py` | ✅ **16/16 PASSED** (Grade 1–3 math/science step breakdown, multi-modal & conceptual equivalence) |
| **Part 4** | `testing/test_guardrails.py` | ⏳ 100% deflection of gaming/off-topic chat, PII redacted |
| **Part 5** | `testing/test_session_nav.py` | ⏳ Redis session recovery and `/api/step/navigate` response correctness |
| **Part 6** | `testing/test_ocr_upload.py` | ⏳ Image upload to clean text transcription & simulated mode |
