# WEG MVP Socratic Chatbot 🎓

> **Minimum Viable Product (MVP)** for an AI-powered Socratic tutoring chatbot designed for elementary school students (Grades 1–6) in **Math** and **Science** (Physics, Chemistry, Biology), supporting both **English** and **Khmer**.

---

## 📌 MVP Overview & Purpose

The **WEG MVP Chatbot** is built to guide students step-by-step using the **Socratic method** rather than simply providing answers. It breaks down complex exercises into digestible milestones, validates student reasoning, generates progressive multi-tier hints upon errors, and offers reinforcement practice problems upon completion.

### Key Capabilities in this MVP:
- 🧠 **Socratic Tutoring Loop**: Step-by-step guidance that never directly gives away the answer.
- 📐 **Domain Solvers**:
  - **Math Service**: Symbolic math parsing and step-by-step algebra breakdown powered by SymPy & LLM.
  - **Science Service**: Dedicated Physics, Chemistry, and Biology solvers integrated with domain knowledge.
- 🔍 **RAG Knowledge Ingestion**: Vector search with **Qdrant** for contextual science reference retrieval.
- 🌐 **Multilingual & Grade-Aware**: Supports **English** and **Khmer** with tailored vocabulary for Grades 1–3 and Grades 4–6.
- ⚡ **Stateful Architecture**: Session checkpointing with **Redis** and persistent logging with **PostgreSQL**.

---

## 🏗️ Architecture

```
                       ┌─────────────────────────┐
                       │   Student / Frontend    │
                       │   (Web / CLI Client)    │
                       └────────────┬────────────┘
                                    │ HTTP / REST
                                    ▼
                       ┌─────────────────────────┐
                       │   Orchestrator Gateway  │ (Port 9000)
                       │  (FastAPI + LangGraph)  │
                       └──────┬────────────┬─────┘
                              │            │
             ┌────────────────┘            └────────────────┐
             ▼                                              ▼
   ┌───────────────────┐                          ┌───────────────────┐
   │    Math Service   │ (Port 9001)              │  Science Service  │ (Port 9002)
   │ (SymPy + Algebra) │                          │ (Phys/Chem/Bio)   │
   └───────────────────┘                          └─────────┬─────────┘
                                                            │ Vector Search
                                                            ▼
   ┌───────────────────┐  ┌───────────────────┐   ┌───────────────────┐
   │   Redis Cache     │  │ Postgres Database │   │   Qdrant Vector   │
   │ (Session State)   │  │ (Session History) │   │     Database      │
   └───────────────────┘  └───────────────────┘   └───────────────────┘
```

---

## 📂 Project Structure

```
WEG_MVP_Chatbot/
├── .env.example                 # Example environment configuration
├── docker-compose.yml           # Multi-container orchestration (Redis, DB, Qdrant, Services)
├── mvp_development_roadmap.md   # Architectural roadmap and MVP specifications
├── proposed_mvp_file_structure.md
├── ingestion/                   # RAG dataset and Qdrant ingestion scripts
│   ├── data_sources/            # Science reference data
│   └── ingest_data.py
├── orchestrator/                # Main API gateway & LangGraph state machine
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── api/                 # REST endpoints (/api/query, /health)
│       ├── core/                # Configuration and logging
│       ├── infrastructure/      # Redis, PostgreSQL, and HTTP clients
│       └── services/            # LangGraph nodes (NLU, router, hint, practice)
├── services/
│   ├── math_service/            # Math microservice (SymPy + LLM validator)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   └── science_service/         # Science microservice (Physics, Chem, Bio RAG)
│       ├── Dockerfile
│       ├── requirements.txt
│       └── app/
└── testing/                     # Test suites and CLI interface
    ├── interactive_chat.py      # Terminal-based Socratic tutor test client
    └── test_cases.py            # End-to-end integration test suite
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- Python 3.10+ (for local CLI test client)
- Google Gemini API Key

### 2. Environment Setup
Copy `.env.example` to `.env` and provide your Gemini API key:
```bash
cp .env.example .env
```
Edit `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
ORCHESTRATOR_PORT=9000
MATH_SERVICE_PORT=9001
SCIENCE_SERVICE_PORT=9002
```

### 3. Launch Services with Docker Compose
```bash
docker compose up --build
```
This starts:
- **Redis**: Port `6379`
- **PostgreSQL**: Port `5432`
- **Qdrant**: Port `6333`
- **Orchestrator**: Port `9000`
- **Math Service**: Port `9001`
- **Science Service**: Port `9002`

---

## 🧪 Testing the MVP

### Interactive CLI Tutor
Experience the live Socratic loop directly from your terminal:
```bash
python testing/interactive_chat.py
```
1. Select language (**English** or **Khmer**).
2. Select student grade tier (**Grade 1–3** or **Grade 4–6**).
3. Type a math or science problem (e.g., `solve 3*x + 9 = 18` or `how do plants make food?`).
4. Step through the solution conversationally.

### Automated End-to-End Tests
Run the test suite against the running orchestrator:
```bash
python testing/test_cases.py
```

---

## 📡 API Endpoints

### `POST /api/query`
Main endpoint for submitting student prompts and step responses.

**Request Body:**
```json
{
  "query": "Solve 2x + 4 = 10",
  "session_id": "student_session_123",
  "grade_level": "grade_4_6",
  "language": "en"
}
```

**Response Body:**
```json
{
  "session_id": "student_session_123",
  "category": "MATH_ALGEBRA",
  "solution": "Let's start! What should we do to both sides to isolate the 2x term?",
  "current_step_index": 0,
  "hint_count": 0,
  "practice_mode": false,
  "completed": false
}
```

### `GET /health`
Returns system health and connectivity status of downstream services and databases.

---

## 🗺️ Roadmap & Next Steps
- [x] LangGraph Socratic State Machine & Routing
- [x] Math & Science Microservices with SymPy + RAG
- [x] Multilingual Support (English & Khmer)
- [x] Elementary Grade Adaptations (Grades 1–6)
- [ ] Speech-to-Text (STT) and Text-to-Speech (TTS) Integration
- [ ] Mobile & Web Frontend Interfaces
