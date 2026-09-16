# Natural Language Understanding (NLU) Pipeline for Socratic STEM Chatbot

Production-grade Natural Language Understanding (NLU) subsystem for the Elementary Math & Science Socratic Tutoring AI Chatbot.

Built specifically for Grades 1–6 students in Cambodia (supporting English, Khmer transliterations, and mixed kid slang), providing **hybrid sub-millisecond fast-path heuristics** ($<1\text{ms}$) coupled with **Gemini 2.5 Flash LLM** classification.

---

## 🚀 Key Features

1. **Bilingual Text & Math Normalizer (`normalizer.py`)**:
   - Cleans kid typos, informal mobile slang (`"idk"`, `"dont"`), and Khmenglish transliterations (`"som"`, `"arkun"`, `"ouk"`, `"chek"`).
   - Standardizes OCR worksheet artifacts and unicode math characters (`×`, `÷`, `½`, `²`, `³`, `sqrt`).
   - Normalizes metric/imperial units and spacing (`5cm` $\rightarrow$ `5 cm`, `15km/h` $\rightarrow$ `15 km/h`).
   - Invariant-preserving guardrails preventing accidental manipulation of numbers or arithmetic operations.

2. **Intent Classification & Structured Answer Extraction (`intent.py`)**:
   - Structured taxonomy adhering to `StudentIntent`:
     - `INITIAL_QUESTION`: Starting a new problem or conceptual question.
     - `STEP_ANSWER_ATTEMPT`: Answering the current step in the Socratic dialogue.
     - `CLARIFY`: Seeking hints, asking for definitions, or expressing confusion.
     - `REQUEST_PRACTICE`: Asking for similar practice problems or the next question.
     - `CHITCHAT`: Greetings, gratitude, and pleasantries.
     - `OFF_TOPIC`: Video games, social media, memes, or bot persona queries.
   - Cleans conversational hedging and filler (`"I think the answer is 12 cookies"` $\rightarrow$ `extracted_answer: "12"`).

3. **Step Context Disambiguation Engine**:
   - Resolves ambiguous single-token and short responses (e.g. `"4"`, `"leaves"`, `"yes"`, `"1/2"`) into `STEP_ANSWER_ATTEMPT` with `confidence=0.95` when an active step is in progress.
   - Routes help-seeking phrases (`"hint please"`, `"i'm stuck"`, `"what next?"`) to `REQUEST_CLARIFICATION`.

4. **Subject & Subtopic Router (`router.py`)**:
   - Classifies domain into `MATH`, `SCIENCE`, or `GENERAL`.
   - Tags granular subtopics:
     - **Math**: `arithmetic`, `fractions`, `geometry`, `word_problem`, `measurement`.
     - **Science**: `plants_biology`, `animals_ecosystem`, `matter_chemistry`, `forces_physics`, `earth_space`.
   - Preserves session-level elementary grade tier (`GRADE_1_3` vs `GRADE_4_6`) as the authoritative source of truth.

5. **Ambiguity, Gibberish & Off-Topic Deflections (`clarify.py`, `intent.py`)**:
   - Fast deterministic detection of keyboard smashes (`"asdfghjkl"`), repeated characters (`"aaaaa"`), and punctuation storms (`"???!!!"`).
   - Produces grade-tiered, encouraging Socratic re-prompts to guide students back to their learning.

6. **LangGraph Integration Node (`node.py`)**:
   - Standalone `nlu_node(state)` wrapper ready for direct execution in Socratic state graphs.
   - Includes synchronous fast-path `nlu_node_sync(state)` for instant testing.

---

## 📂 Architecture & Directory Structure

```
orchestrator/app/services/nlu/
├── __init__.py               # Re-exports all pipeline schemas, routers, and nodes
├── schema.py                 # Pydantic schemas (NLUResult, StudentIntent, SubjectArea, GradeTier)
├── normalizer.py             # NormalizerEngine, bilingual mapping & invariant guards
├── typo_dictionary.json      # Bilingual regex dictionary, math phrases & kid slang
├── intent.py                 # Gemini Flash intent classifier, answer extractor & off-topic guard
├── router.py                 # Subject & subtopic classifier (Math/Science domains)
├── clarify.py                # Ambiguity handler, keyboard smash detector & kid re-prompts
├── pipeline.py               # Master process_nlu() async & sync pipeline runners
├── node.py                   # LangGraph Node wrapper (nlu_node) for Socratic graph execution
└── README.md                 # Technical documentation & usage guide
```

---

## ⚡ Quickstart & Usage

### 1. Direct Pipeline Invocation (Async & Sync)

```python
import asyncio
from app.services.nlu import (
    process_nlu,
    process_nlu_sync,
    StudentIntent,
    SubjectArea,
    GradeTier,
)

# Active Step Context Mock (Optional)
current_step = {
    "step_number": 2,
    "total_steps": 4,
    "question": "What is 4 times 3?",
    "expected_answer": "12",
    "active": True
}

# Synchronous Fast-Path (<1ms)
result = process_nlu_sync(
    raw_query="I think the answer is 12 cookies",
    current_context=current_step,
    session_grade_level=GradeTier.GRADE_4_6
)

print(result.intent)            # StudentIntent.STEP_ANSWER_ATTEMPT
print(result.extracted_answer)  # "12"
print(result.cleaned_text)      # "i think the answer is 12 cookies"
print(result.subject)           # SubjectArea.MATH
print(result.subtopic)          # "arithmetic"
```

---

### 2. LangGraph Node Integration

Drop `nlu_node` into your LangGraph `StateGraph` workflow:

```python
from langgraph.graph import StateGraph, START, END
from app.services.state import SocraticTutorState
from app.services.nlu import nlu_node

builder = StateGraph(SocraticTutorState)

# Add NLU Gateway Node
builder.add_node("nlu_node", nlu_node)

# Connect Node
builder.add_edge(START, "nlu_node")
# ... connect downstream tutor nodes ...
```

---

## 📊 Standard Schema: `NLUResult`

| Field | Type | Description |
| :--- | :--- | :--- |
| `raw_query` | `str` | Original raw string entered by student |
| `cleaned_text` | `str` | Normalized string with typos and math symbols standardized |
| `intent` | `StudentIntent` | Classified student intent enum |
| `confidence` | `float` | Classification confidence score ($0.0 - 1.0$) |
| `subject` | `SubjectArea` | Detected academic domain (`math`, `science`, `general`) |
| `subtopic` | `str` | Granular academic subtopic (e.g. `plants_biology`, `fractions`) |
| `grade_level` | `GradeTier` | Elementary grade tier (`grade_1_3` or `grade_4_6`) |
| `extracted_answer` | `Optional[str]` | Cleaned core answer value (e.g. `"12"`, `"chloroplast"`) |
| `is_ambiguous` | `bool` | True if query is gibberish, empty, or unparseable |
| `clarification_prompt`| `Optional[str]` | Encouraging Socratic re-prompt when input is ambiguous |

---

## 🧪 Testing & Performance SLA

All modules are accompanied by comprehensive pytest test suites located in `testing/`:

```bash
# Run all NLU test suites
pytest testing/test_nlu_*.py testing/test_prompt_controller.py -v
```

### Performance & Quality Metrics
- **Test Suite Pass Rate**: **231 / 231 tests passing (100% green)** across all 11 test modules.
- **50-Case Comprehensive Benchmark**: **3.22 ms total execution time** (~**0.064 ms average latency per query**), far outperforming the $<2\text{ms}$ latency SLA.
- **Deterministic Offline Guarantee**: Full fallback path operates entirely without external network dependencies.
