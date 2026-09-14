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

#### Day 1: Setup, Environment & Schema Definition
- **Files Created**:
  - `orchestrator/app/services/nlu/__init__.py`
  - `orchestrator/app/services/nlu/schema.py`
- **Code to Implement**:
  - Full Pydantic definitions for `StudentIntent` and `NLUResult`.
  - JSON serialization helper methods and default fallback constructors.
- **Verification**:
  - Run `python -c "from app.services.nlu.schema import NLUResult; print(NLUResult.model_json_schema())"`.
- **Done Criteria**: Schema imports cleanly with zero runtime warnings.

#### Day 2: Hybrid Bilingual Normalizer & OCR/Voice Text Cleaner
- **Files Created**:
  - `orchestrator/app/services/nlu/typo_dictionary.json` (150+ STEM typos, OCR patterns, kid slang, Khmenglish, and known STEM vocabulary)
  - `orchestrator/app/services/nlu/normalizer.py`
- **Logic & Rules**:
  1. **OCR Worksheet & Transcribed Text Cleaner (Chesda's OCR Integration)**: Resolves digit/letter character confusions from worksheet scans (`l2` $\rightarrow$ `12`, `2O` $\rightarrow$ `20`, `4 x 5` $\rightarrow$ `4 * 5`, `cm2` $\rightarrow$ `cm^2`, `5t3` $\rightarrow$ `5 + 3`).
  2. **Voice-to-Text Readiness (Future-Proofing)**: Formats and handles spoken phonetic variations and audio-transcribed math terms (`"three fourths"` $\rightarrow$ `"3/4"`, `"square root of"` $\rightarrow$ `"sqrt"`).
  3. **Bilingual & Language Gate**: Detects Khmer script (`\u1780-\u17FF`), Khmenglish romanized terms (`"som"`, `"dour"`, `"ouk"`), and English STEM queries.
  4. **Tier 1 Fast Regex Engine**: Longest-match-first regex replacement ($<1\text{ms}$) with compiled patterns and in-memory LRU caching (`@lru_cache`).
  5. **Tier 2 Gemini LLM Fallback Gate**: Deterministic heuristic triggers (OOV $>30\%$, heavy phonetic garble, triple character repeats for $\ge 3$ word queries) with strict 1.5s timeout (`asyncio.wait_for`) and graceful offline fallback.
  6. **Post-LLM Safety Invariant Verification**: `verify_invariants(raw, cleaned)` strictly rejects any LLM output that alters numbers (`\d+`) or mathematical operators (`[+\-*/=^]`).
- **Verification**: Test OCR strings (`"Leo has l2 apls"` $\rightarrow$ `"Leo has 12 apples"`), Khmenglish (`"som subtrak 4 pi 12"` $\rightarrow$ `"សូម subtract 4 pi 12"`), and invariant protection.


#### Day 3: Math Symbol & Unit Standardization
- **File Updated**: `orchestrator/app/services/nlu/normalizer.py`
- **Logic & Rules**:
  - Multiplication normalization: Convert `3 x 4`, `3 X 4`, `3 times 4` $\rightarrow$ `3 * 4`.
  - Division normalization: Convert `10 / 2`, `10 divided by 2`, `10 : 2` $\rightarrow$ `10 / 2`.
  - Fraction standardizer: Convert `3/4th`, `3 / 4` $\rightarrow$ `3/4`.
  - Unit spacing: Convert `5cm` $\rightarrow$ `5 cm`, `10kg` $\rightarrow$ `10 kg`, `20ml` $\rightarrow$ `20 ml`.
  - Exponents: `cm2` $\rightarrow$ `cm^2`, `m3` $\rightarrow$ `m^3`.
- **Verification**: Test string `"what is 4 x 5cm plus 1/2"` $\rightarrow$ `"what is 4 * 5 cm plus 1/2"`.

#### Day 4: Unit Test Suite for Normalizer
- **File Created**: `testing/test_nlu_normalizer.py`
- **Content**:
  - Create 30 pytest test cases covering:
    - Pure arithmetic queries.
    - Word problems with kid slang (`"Leo has 8 cookiez"`).
    - Science queries with phonetic misspellings (`"how plantz mak food with fotosynthesis"`).
- **Verification Command**: `pytest testing/test_nlu_normalizer.py -v`.
- **Done Criteria**: All 30 test cases pass with $100\%$ green status.

#### Day 5: Performance Optimization & Fast-Path Guard
- **File Updated**: `orchestrator/app/services/nlu/normalizer.py`
- **Enhancement**:
  - Compile all regex patterns at module load time (`re.compile`).
  - Add execution benchmark: Normalizer must execute in under **3 milliseconds**.
- **Done Criteria**: Benchmark test passes consistently under 3ms.

---

### 🟣 PHASE 2: Gemini Flash Intent Classifier & Subject Routing (Days 6–10)
*Objective: Use Gemini 2.5 Flash with structured system instructions to classify intent, extract answers, and route subjects.*

#### Day 6: Intent Classification Engine
- **File Created**: `orchestrator/app/services/nlu/intent.py`
- **Prompt Structure**:
  ```python
  INTENT_SYSTEM_PROMPT = """You are an expert NLP classifier for an elementary school Socratic AI chatbot (Grades 1-6).
  Analyze the student's message and categorize it into EXACTLY ONE intent:
  - INITIAL_QUESTION: Student provides a new problem or asks to solve something.
  - STEP_ANSWER_ATTEMPT: Student is attempting to answer a step question (e.g. "5", "is it 8?", "leaves").
  - REQUEST_HINT: Student is stuck or asking for help (e.g. "i don't know", "hint please", "help me").
  - REQUEST_CLARIFICATION: Student asks about a specific term or concept (e.g. "what is quotient?").
  - OFF_TOPIC: Chat unrelated to schoolwork (e.g. video games, personal questions).
  - CHITCHAT: Simple greetings ("hi", "hello", "thanks").

  Return JSON adhering strictly to:
  {
    "intent": "INTENT_NAME",
    "confidence": 0.95,
    "extracted_answer": "value or null",
    "is_ambiguous": false
  }
  """
  ```
- **Verification**: Run standalone test script calling Gemini Flash with sample student queries.

#### Day 7: Answer Extraction & Disambiguation
- **File Updated**: `orchestrator/app/services/nlu/intent.py`
- **Logic**:
  - If intent is `STEP_ANSWER_ATTEMPT`, clean conversational noise and extract strictly the core answer:
    - *"I think the answer is 12 cookies"* $\rightarrow$ `extracted_answer: "12"`
    - *"It happens in the chloroplast"* $\rightarrow$ `extracted_answer: "chloroplast"`
    - *"Maybe 3/4?"* $\rightarrow$ `extracted_answer: "3/4"`
- **Verification**: Test 15 distinct answer sentence structures.

#### Day 8: Subject & Grade-Level Router
- **File Created**: `orchestrator/app/services/nlu/router.py`
- **Logic**:
  - Classify subject into `math` vs `science`.
  - Classify subtopic:
    - Math: `arithmetic`, `fractions`, `geometry`, `word_problem`, `measurement`.
    - Science: `plants_biology`, `animals_ecosystem`, `matter_chemistry`, `forces_physics`, `earth_space`.
  - Classify grade tier: `grade_1_3` vs `grade_4_6` based on vocabulary and problem complexity.
- **Verification**: Test `"Why do leaves change color?"` $\rightarrow$ `subject: science`, `subtopic: plants_biology`, `grade_level: grade_1_3`.

#### Day 9: Step Context Disambiguation & Short Answer Extractor
- **File Updated**: `orchestrator/app/services/nlu/intent.py`
- **Logic**:
  - Use `current_step` context to disambiguate short single-token answers (e.g. `"4"`, `"yes"`, `"leaves"`).
  - Ensure short student answers are accurately classified as `STEP_ANSWER_ATTEMPT` rather than chitchat or ambiguity.
- **Verification**: Test 15 single-word/number answers against current active step context.


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
| **Day 3** | Normalizer | Implement math symbol, fraction & unit standardizer | `services/nlu/normalizer.py` | 🔲 |
| **Day 4** | Testing | Build 30 unit tests for normalizer | `testing/test_nlu_normalizer.py` | 🔲 |
| **Day 5** | Optimization | Benchmark regex $(< 3\text{ms})$ and add fast path | `services/nlu/normalizer.py` | 🔲 |
| **Day 6** | Intent | Design Gemini Flash intent classification prompt | `services/nlu/intent.py` | 🔲 |
| **Day 7** | Intent | Implement `extracted_answer` clean parser | `services/nlu/intent.py` | 🔲 |
| **Day 8** | Router | Build Math/Science & Grade Level classifier | `services/nlu/router.py` | 🔲 |
| **Day 9** | Intent | Implement step context disambiguation for short answers | `services/nlu/intent.py` | 🔲 |
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
