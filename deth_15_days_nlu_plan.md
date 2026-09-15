# 🧠 Deth's 15-Day NLU & Input Engine Sprint Execution Plan
### Socratic Science & Math AI Chatbot for Elementary Learners (Grades 1–6)
**Owner**: Deth (Backend Engineer — NLU & Input Pipeline)  
**Target Delivery Window**: 15 Working Days  
**Working Directory**: `orchestrator/app/services/nlu/`  
**Git Branch**: `feat/nlu-pipeline`

---

## 1. Executive Summary & Golden Contract

As the NLU Engineer, Deth is responsible for transforming raw, messy, typo-ridden student inputs (text and transcribed voice/OCR) into **clean, structured, and predictable data objects** that Vicheka's Socratic State Machine can process without failure.

```
Raw Student Input ("i hav 5 apls and gav 2 awy, how mny left?")
                        │
                        ▼
       [ 1. Normalizer (`normalizer.py`) ]
         • Fixes kid typos ("apls" -> "apples", "gav" -> "gave")
         • Standardizes math notation ("x" -> "*", "3/4", "5 cm")
                        │
                        ▼
       [ 2. Intent Classifier (`intent.py`) ]
         • Gemini Flash with strict JSON schema
         • Differentiates Step Answers vs Hint Requests vs Jumps
                        │
                        ▼
       [ 3. Subject & Subtopic Router (`router.py`) ]
         • Math (arithmetic, fractions, word problems)
         • Science (biology, physics, chemistry)
                        │
                        ▼
       [ 4. Golden NLUResult Output ] ───► Handed off to Socratic Engine
```

### 📋 The Golden Output Data Schema (`schema.py`)

Every function in Deth's pipeline must ultimately produce an instance of `NLUResult`:

```python
from pydantic import BaseModel, Field
from typing import Literal, Optional, List, Dict, Any

class StudentIntent(str):
    INITIAL_QUESTION = "INITIAL_QUESTION"       # "How do plants make food?" or new math problem
    STEP_ANSWER_ATTEMPT = "STEP_ANSWER_ATTEMPT" # Student answering active step: "Is it 5?", "8 cookies"
    REQUEST_HINT = "REQUEST_HINT"               # "I don't get it", "give me a clue", "help"
    REQUEST_CLARIFICATION = "REQUEST_CLARIFICATION" # "What does numerator mean?"
    OFF_TOPIC = "OFF_TOPIC"                     # "Do you play Minecraft?", non-academic chat
    CHITCHAT = "CHITCHAT"                       # "Hi", "Thank you", "Good morning"

class NLUResult(BaseModel):
    raw_query: str = Field(..., description="Original raw text sent by student")
    cleaned_text: str = Field(..., description="Normalized text with typos and math symbols corrected")
    intent: Literal[
        "INITIAL_QUESTION",
        "STEP_ANSWER_ATTEMPT",
        "REQUEST_HINT",
        "REQUEST_CLARIFICATION",
        "OFF_TOPIC",
        "CHITCHAT"
    ] = Field(..., description="Primary classified intent")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score")
    
    # Subject & Topic Metadata
    subject: Literal["math", "science", "general"] = Field(..., description="Broad subject area")
    subtopic: str = Field(default="general", description="e.g. arithmetic, fractions, photosynthesis, forces")
    grade_level: Literal["grade_1_3", "grade_4_6"] = Field(default="grade_4_6", description="Detected elementary tier")
    
    # Extracted Values
    extracted_answer: Optional[str] = Field(None, description="Cleaned core answer if intent is STEP_ANSWER_ATTEMPT")
    is_ambiguous: bool = Field(default=False, description="True if input is complete gibberish or unparseable")
    clarification_prompt: Optional[str] = Field(None, description="Generated clarifying question if ambiguous")

```

---

## 2. Directory & Module Architecture

```text
orchestrator/app/services/nlu/
├── __init__.py                 # Exports process_nlu and NLUResult
├── schema.py                   # Pydantic schemas (NLUResult, Enums)
├── normalizer.py               # Deterministic Regex & typo/math cleaning engine
├── intent.py                   # Gemini Flash structured intent classifier
├── router.py                   # Math vs Science & Grade level classifier
├── clarify.py                  # Kid-friendly clarification generator
├── pipeline.py                 # Master orchestrator combining all NLU stages
└── node.py                     # LangGraph node wrapper for Socratic integration
```

---

## 3. Detailed 15-Day Day-by-Day Implementation Roadmap

---

### 🟢 PHASE 1: Data Contracts & Deterministic Normalizer (Days 1–5)
*Objective: Build blazing-fast ($<5\text{ms}$), deterministic Python cleaning rules for kid spelling, slang, and elementary math notations.*

#### Day 1: Setup, Environment & Schema Definition `[COMPLETED ✅]`
- **Files Created**:
  - `orchestrator/app/services/nlu/__init__.py`
  - `orchestrator/app/services/nlu/schema.py`
- **Code Implemented**:
  - Full Pydantic definitions for `StudentIntent` and `NLUResult`.
  - JSON serialization helper methods and default fallback constructors (`NLUResult.create_fallback()`).
- **Verification**:
  - Validated with `testing/test_nlu_schema.py` (7 tests passing 100%).
- **Done Criteria**: Schema imports cleanly with zero runtime warnings.

#### Day 2: Hybrid Bilingual Normalizer & OCR/Voice Text Cleaner `[COMPLETED ✅]`
- **Files Created**:
  - `orchestrator/app/services/nlu/typo_dictionary.json` (170+ STEM typos, OCR patterns, kid slang, Khmenglish, voice speech artifacts, and known STEM vocabulary)
  - `orchestrator/app/services/nlu/normalizer.py`
- **Logic & Rules**:
  1. **OCR Worksheet & Transcribed Text Cleaner**: Resolves digit/letter character confusions from worksheet scans (`l2` $\rightarrow$ `12`, `2O` $\rightarrow$ `20`, `4 x 5` $\rightarrow$ `4 * 5`, `cm2` $\rightarrow$ `cm^2`, `5t3` $\rightarrow$ `5 + 3`).
  2. **Voice-to-Text Readiness**: Formats and handles spoken phonetic variations and audio-transcribed math terms (`"three fourths"` $\rightarrow$ `"3/4"`, `"square root of"` $\rightarrow$ `"sqrt"`).
  3. **Bilingual & Language Gate**: Detects Khmer script (`\u1780-\u17FF`), Khmenglish romanized terms (`"som"`, `"dour"`, `"ouk"`), and English STEM queries.
  4. **Tier 1 Fast Regex Engine**: Longest-match-first regex replacement ($<1\text{ms}$) with compiled patterns and in-memory LRU caching (`@lru_cache`).
  5. **Tier 2 Gemini LLM Fallback Gate**: Deterministic heuristic triggers (OOV $>30\%$, heavy phonetic garble, triple character repeats for $\ge 3$ word queries) with strict 1.5s timeout (`asyncio.wait_for`) and graceful offline fallback.
  6. **Post-LLM Safety Invariant Verification**: `verify_invariants(raw, cleaned)` pre-normalizes raw text deterministically and strictly rejects any LLM output that alters numbers (`\d+`) or mathematical operators (`[+\-*/=^]`).
- **Verification**: Validated OCR strings (`"Leo has l2 apls"` $\rightarrow$ `"Leo has 12 apples"`), Khmenglish (`"som subtrak 4 pi 12"` $\rightarrow$ `"សូម subtract 4 pi 12"`), and invariant protection.

#### Day 3: Math Symbol & Unit Standardization `[COMPLETED ✅]`
- **File Updated**: `orchestrator/app/services/nlu/normalizer.py`, `orchestrator/app/services/nlu/typo_dictionary.json`
- **Logic & Rules Implemented**:
  - **Multiplication normalization**: Convert `3 x 4`, `3 X 4`, `3 times 4`, `3 multiplied by 4`, `3 · 4`, `3 × 4` $\rightarrow$ `3 * 4`.
  - **Division normalization**: Convert `10 / 2`, `10 divided by 2`, `10 : 2`, `10 ÷ 2`, `10 over 2` $\rightarrow$ `10 / 2`.
  - **Fraction standardizer**: Convert `3/4th`, `3/4ths`, `1/2nd`, `three fourths`, `one half` $\rightarrow$ `3/4`, `1/2`; spaced proper fractions `3 / 4` $\rightarrow$ `3/4`; mixed numbers `1 and 1/2` $\rightarrow$ `1 1/2`.
  - **Scientific unit spacing**: Convert `5cm` $\rightarrow$ `5 cm`, `10kg` $\rightarrow$ `10 kg`, `250ml` $\rightarrow$ `250 ml`, `15km/h` $\rightarrow$ `15 km/h`, `100km/h` $\rightarrow$ `100 km/h`.
  - **Exponents & superscripts**: Convert Unicode `cm²` $\rightarrow$ `cm^2`, `m³` $\rightarrow$ `m^3`, `x²` $\rightarrow$ `x^2`, shorthand `cm2` $\rightarrow$ `cm^2`, `m3` $\rightarrow$ `m^3`, `50m3` $\rightarrow$ `50 m^3`.
  - **Parentheses & formatting**: Convert `( 3 + 4 )` $\rightarrow$ `(3 + 4)`.
- **Verification**: Validated test string `"what is 4 x 5cm plus 1/2"` $\rightarrow$ `"what is 4 * 5 cm + 1/2"`.

#### Day 4: Unit Test Suite for Normalizer `[COMPLETED ✅]`
- **File Created**: `testing/test_nlu_normalizer.py`
- **Content**:
  - Created 29 pytest test cases covering:
    - Pure arithmetic and operator queries (`test_multiplication_variants`, `test_division_variants`, `test_addition_and_subtraction`).
    - Fractions, mixed numbers, and Unicode glyphs (`test_fraction_standardization`).
    - Units, exponents, and spacing (`test_unit_spacing_and_exponents`).
    - Word problems with kid slang (`"Leo has 8 cookiez"`).
    - Science queries with phonetic misspellings (`"how plantz mak food with fotosynthesis"`).
    - Invariant safety checks and benchmark performance.
- **Verification Command**: `pytest testing/test_nlu_normalizer.py -v`.
- **Done Criteria**: All 29 test cases pass with $100\%$ green status in 0.08s.

#### Day 5: Performance Optimization & Fast-Path Guard `[COMPLETED ✅]`
- **File Updated**: `orchestrator/app/services/nlu/normalizer.py`
- **Enhancements**:
  - Precompiled all regex patterns and lookups at module load time (`_UNITS_SPACING_REGEX`, `_UNICODE_EXPONENTS`, `_UNICODE_FRACTIONS`, `_UNICODE_MATH_OPS`, `self._compiled_regex`).
  - Added in-memory `@lru_cache(maxsize=1024)` fast-path entrypoint `normalize_text_sync()`.
  - Added automated execution benchmark in `TestPerformanceBenchmark`.
- **Done Criteria**: Benchmark test executes consistently in **~0.05ms to 0.1ms**, well exceeding the $<3\text{ms}$ requirement.

---

### 🟣 PHASE 2: Gemini Flash Intent Classifier & Subject Routing (Days 6–10)
*Objective: Use Gemini 2.5 Flash with structured system instructions to classify intent, extract answers, and route subjects.*

#### Day 6: Intent Classification Engine `[COMPLETED ✅]`
- **File Created**: `orchestrator/app/services/nlu/intent.py`
- **Logic & Implementation**:
  - Integrated with `prompt_controller.get_intent_prompt` to classify queries into `IntentType` (`INITIAL_SOLVE`, `STEP_ATTEMPT`, `CLARIFY`, `REQUEST_PRACTICE`, `CHITCHAT`).
  - Added `format_chat_history()` integrating active turn lists with `SessionManager.rolling_summary`.
  - Built sub-millisecond deterministic fallback engine `classify_intent_heuristic()` for offline stability and instant evaluations.
  - Implemented async Gemini Flash caller `classify_intent()` with 1.5s timeout.
- **Verification**: Created `testing/test_nlu_intent.py` with 16 automated tests covering all intents, rolling summaries, and edge cases passing 100% green.

#### Day 7: Answer Extraction & Disambiguation `[COMPLETED ✅]`
- **File Updated**: `orchestrator/app/services/nlu/intent.py`
- **Logic & Implementation**:
  - Implemented `extract_core_answer(text: str) -> Optional[str]` to clean conversational noise, hedging prefixes (`"I think"`, `"Maybe"`, `"Is it"`, `"My answer is"`), and trailing question marks/punctuation:
    - *"I think the answer is 12 cookies"* $\rightarrow$ `extracted_answer: "12"`
    - *"It happens in the chloroplast"* $\rightarrow$ `extracted_answer: "chloroplast"`
    - *"Maybe 3/4?"* $\rightarrow$ `extracted_answer: "3/4"`
  - Integrated `extracted_answer` into `IntentResult` model.
- **Verification**: Validated answer extraction in `testing/test_nlu_router.py` (`TestAnswerExtraction`).

#### Day 8: Subject & Subtopic Router `[COMPLETED ✅]`
- **File Created**: `orchestrator/app/services/nlu/router.py`
- **Logic & Implementation**:
  - Routes student queries into `SubjectArea` (`MATH`, `SCIENCE`, `GENERAL`).
  - Tags granular subtopics:
    - Math: `arithmetic`, `fractions`, `geometry`, `word_problem`, `measurement`.
    - Science: `plants_biology`, `animals_ecosystem`, `matter_chemistry`, `forces_physics`, `earth_space`.
  - **Grade Tier Alignment (Option A)**: Grade level is selected explicitly by the student in the UI/session context (`state["grade_level"]`) and preserved as the authoritative source of truth, avoiding erroneous text-based guessing.
  - Implemented fast-path deterministic heuristics (`route_subject_heuristic`, `<1ms`) and async LLM classifier (`route_subject`) leveraging `prompt_controller.get_classification_prompt`.
  - Re-exported all router schemas and functions in `orchestrator/app/services/nlu/__init__.py`.
- **Verification**: Validated with 8 test cases in `testing/test_nlu_router.py` (all passing 100% green in 0.10s).

#### Day 9: Step Context Disambiguation & Short Answer Extractor `[COMPLETED ✅]`
- **File Updated**: `orchestrator/app/services/nlu/intent.py`
- **Logic & Implementation**:
  - Implemented `disambiguate_step_input()` and `is_step_active()` engine functions.
  - Extended `classify_intent()`, `classify_intent_sync()`, and `classify_intent_heuristic()` with `current_step` context parameter.
  - Single-token and short student answers (e.g. `"4"`, `"chloroplast"`, `"yes"`, `"12 cookies"`, `"3/4"`, `"5 cm"`) are deterministically classified as `STEP_ATTEMPT` with `confidence=0.95` and extracted core answers in `<1ms`.
  - Help-seeking expressions (e.g. `"idk"`, `"hint please"`, `"help me"`, `"i'm stuck"`, `"not sure"`) during an active step are routed to `CLARIFY`.
  - Conversational hedging prefixes (`"I think 12"`, `"It happens in the chloroplast"`, `"maybe 3/4?"`) are accurately parsed down to core answers.
  - Active step context is incorporated into `format_chat_history()` when LLM calls are invoked.
  - Exported all new functions cleanly in `orchestrator/app/services/nlu/__init__.py`.
- **Verification**: Validated with 52 test cases in `testing/test_nlu_disambiguation.py` (100% green, 112/112 tests across full NLU suite passing in 0.19s).


#### Day 10: Master Pipeline Runner
- **File Created**: `orchestrator/app/services/nlu/pipeline.py`
- **Function**:
  ```python
  async def process_nlu(raw_query: str, current_context: Optional[dict] = None) -> NLUResult:
      # Step 1: Deterministic fast clean
      cleaned = normalize_student_input(raw_query)
      
      # Step 2: Intent & Answer classification
      intent_data = await classify_intent(cleaned, current_context)
      
      # Step 3: Subject & Grade routing
      route_data = await route_subject_and_grade(cleaned)
      
      # Step 4: Construct and validate Golden Schema
      return NLUResult(
          raw_query=raw_query,
          cleaned_text=cleaned,
          intent=intent_data.intent,
          confidence=intent_data.confidence,
          subject=route_data.subject,
          subtopic=route_data.subtopic,
          grade_level=route_data.grade_level,
          extracted_answer=intent_data.extracted_answer,
          is_ambiguous=intent_data.is_ambiguous
      )
  ```
- **Done Criteria**: Single async function call takes raw text and outputs valid `NLUResult`.

---

### 🔵 PHASE 3: Clarifications, Integration & Hand-Off (Days 11–15)
*Objective: Build ambiguity fallbacks, complete test coverage, wrap into LangGraph, and merge to staging.*

#### Day 11: Ambiguity & Gibberish Handler
- **File Created**: `orchestrator/app/services/nlu/clarify.py`
- **Logic**:
  - Detect keyboard smashes (e.g. `"asdfghjkl"`, `"?????"`), ultra-short non-answers (`"k"`, `"um"`).
  - Mark `is_ambiguous = True`.
  - Generate a friendly, encouraging prompt to gently ask the student to rephrase:
    - *"I didn't quite catch that! Could you tell me what number or word you're thinking of?"*
- **Verification**: Test 10 gibberish and empty queries.

#### Day 12: Off-Topic Deflection Tagging
- **File Updated**: `orchestrator/app/services/nlu/intent.py`
- **Logic**:
  - Identify non-academic distractions (games, YouTube, pop culture, personal questions).
  - Mark `intent = "OFF_TOPIC"` and attach friendly redirection context for Vicheka's guardrails.
- **Verification**: Test `"Do you like Fortnite?"` $\rightarrow$ `intent: OFF_TOPIC`.

#### Day 13: 50-Case Comprehensive Test Suite
- **File Created**: `testing/test_nlu_suite.py`
- **Test Matrix (50 Real Elementary Test Cases)**:
  - 10 Initial math/science problems
  - 15 Student answer attempts (numbers, words, full sentences)
  - 10 Hint/help requests
  - 5 Step navigation requests
  - 5 Clarification questions
  - 5 Gibberish / off-topic queries
- **Execution**: Run `pytest testing/test_nlu_suite.py -v`.
- **Target**: $>95\%$ classification accuracy across all 50 cases.

#### Day 14: LangGraph Node Integration Wrapper
- **File Created**: `orchestrator/app/services/nlu/node.py`
- **Function**:
  ```python
  from app.services.nlu.pipeline import process_nlu

  async def nlu_node(state: dict) -> dict:
      """
      LangGraph Node entrypoint for Socratic graph execution.
      Called at the start of every student turn.
      """
      user_input = state.get("user_input", "")
      current_step = state.get("current_step", {})
      
      nlu_result = await process_nlu(user_input, current_context=current_step)
      
      return {
          "nlu_result": nlu_result.model_dump(),
          "intent": nlu_result.intent,
          "cleaned_input": nlu_result.cleaned_text,
          "extracted_answer": nlu_result.extracted_answer
      }
  ```
- **Done Criteria**: `nlu_node` can be imported directly into `graph.py` by Vicheka.

#### Day 15: Documentation, Final Verification & Merge to Staging
- **Deliverables**:
  - Verify all unit tests pass: `pytest testing/test_nlu_normalizer.py testing/test_nlu_suite.py`.
  - Create README section inside `orchestrator/app/services/nlu/README.md` explaining usage and examples.
  - Commit all changes to `feat/nlu-pipeline`.
  - Push branch and create Pull Request to `staging`.
- **Done Criteria**: Branch is cleanly merged into `staging` with zero Git conflicts!

---

## 4. Daily Execution Checklist for Deth

| Day | Module | Task Description | Target File | Status |
| :---: | :--- | :--- | :--- | :---: |
| **Day 1** | Schema | Define `NLUResult` & `StudentIntent` Pydantic models | `services/nlu/schema.py` | ✅ |
| **Day 2** | Normalizer | Implement hybrid bilingual normalizer, OCR/voice cleaner & regex dictionary | `services/nlu/normalizer.py` | ✅ |
| **Day 3** | Normalizer | Implement math symbol, fraction & unit standardizer | `services/nlu/normalizer.py` | ✅ |
| **Day 4** | Testing | Build 30 unit tests for normalizer | `testing/test_nlu_normalizer.py` | ✅ |
| **Day 5** | Optimization | Benchmark regex $(< 3\text{ms})$ and add fast path | `services/nlu/normalizer.py` | ✅ |
| **Day 6** | Intent | Design Gemini Flash intent classification prompt | `services/nlu/intent.py` | ✅ |
| **Day 7** | Intent | Implement `extracted_answer` clean parser | `services/nlu/intent.py` | ✅ |
| **Day 8** | Router | Build Math/Science & Subtopic classifier | `services/nlu/router.py` | ✅ |
| **Day 9** | Intent | Implement step context disambiguation for short answers | `services/nlu/intent.py` | ✅ |
| **Day 10** | Pipeline | Assemble master `process_nlu()` async function | `services/nlu/pipeline.py` | 🔲 |
| **Day 11** | Clarify | Implement ambiguity & gibberish handler | `services/nlu/clarify.py` | 🔲 |
| **Day 12** | Guard | Implement off-topic deflection tagger | `services/nlu/intent.py` | 🔲 |
| **Day 13** | Testing | Build & validate 50-case integration test suite | `testing/test_nlu_suite.py` | 🔲 |
| **Day 14** | LangGraph | Build `nlu_node()` wrapper for Vicheka's graph | `services/nlu/node.py` | 🔲 |
| **Day 15** | Delivery | Final QA, docs & PR merge to `staging` | `feat/nlu-pipeline` PR | 🔲 |

---

## 5. Git Commands for Deth's Daily Workflow

```bash
# 1. Start from latest staging branch
git checkout staging
git pull origin staging

# 2. Create your isolated feature branch
git checkout -b feat/nlu-pipeline

# 3. Daily workflow: stage, commit, test
git add orchestrator/app/services/nlu/ testing/
git commit -m "feat(nlu): Day X - completed normalizer and unit tests"

# 4. Run tests before pushing
pytest testing/test_nlu_normalizer.py testing/test_nlu_suite.py -v

# 5. Push your progress
git push origin feat/nlu-pipeline
```
