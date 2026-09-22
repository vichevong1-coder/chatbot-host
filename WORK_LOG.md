# WEG Homework AI Ecosystem - Work Log

### Work Entry 1: Microservice Integration & Setup
- Cloned the backend repository (`WEG_MVP_Chatbot` branch `sovandeth`) into `backend/` and extracted the React frontend from branch `vechika` into `frontend/`.
- Configured Vite development proxy in `frontend/vite.config.ts` to route `/api` requests to the Backend Orchestrator (`:9000`) and `/process-homework` to the OCR service (`:8000`).
- Initialized `.env` configurations across all services and verified that Docker Desktop runs all backend dependencies (Redis, Postgres, Qdrant, Math Service, Science Service).

### Work Entry 2: OCR Microservice & Docker Packaging
- Containerized the Homework OCR + VLM pipeline with `homework_ocr_vlm/Dockerfile` including OpenCV, PaddleOCR, and PyMuPDF dependencies.
- Created a unified root `docker-compose.yml` to orchestrate all services simultaneously on their designated ports.
- Verified that both the OCR service (`:8000/health`) and the Backend Orchestrator (`:9000/health`) run cleanly and respond with `200 OK`.

### Work Entry 3: Multi-Exercise Worksheet Queue
- Connected the frontend `HomeworkScanner` to send real uploaded worksheet photos/PDFs directly to `POST /process-homework`.
- Added multi-exercise queue state management so all detected exercises from a scanned page (e.g., 11 problems) are preserved in memory.
- Created an interactive Worksheet Exercise Bar (`Ex 1` to `Ex 11`) and left panel progress tracker with celebratory progression banners.

### Work Entry 4: Real Socratic Backend Integration & Chat Fix
- Replaced the hardcoded mock history generator with real dynamic sessions connected directly to the Backend Orchestrator (`/api/query`).
- Integrated the backend's `step_widget` payload to dynamically generate step cards, missions, clues, and expected answers for any scanned question.
- Connected student step answers and chat inputs to the LangGraph Socratic state machine with live session tracking (`session_id`).

### Work Entry 5: Math Prefix Cleaning & Visual Worksheet Preview
- Added mathematical query normalization to strip exercise label prefixes (e.g. `1.`, `2.`, `A.`) so the math microservice evaluates the exact arithmetic formula (`4 + 5 + 6 = 15`) instead of misinterpreting the question index as an operand.
- Added visual worksheet thumbnail cards with click-to-expand preview directly beside the active problem card.
- Replaced backend mock fallback messages with intelligent Socratic mission prompts to ensure clear instruction when running without external LLM keys.
- Verified that all components compile cleanly with Vite and communicate seamlessly across Docker containers.

### Work Entry 6: Multi-Column Card Grid Prompting & CLI Entrypoint
- Created `homework_ocr_vlm/main.py` alias so `python main.py` runs the OCR service directly without `No such file or directory` errors.
- Enhanced the VLM precision extraction prompt in `prompt_parser.py` with explicit rules for 2-column card grid worksheets (e.g., Q1–Q10 boxed cards).
- Enforced independent card bounding, preventing horizontal cross-column text merging and preserving sub-parts `a)` and `b)` and property tables.

### Work Entry 7: Full Multi-Part Statement Extraction Fix
- Refactored `ocrService.ts` to extract the full multi-part question body (sub-questions `a)` and `b)`, instructions, and formulas) instead of only reading the section title.
- Combined card headers with their underlying calculation prompts (`a) Calculate: 9 + 2 + 3 + 1 = ___`, `b) Find the missing number: 35 + ___ = 100`).
- Ensured that each problem in the worksheet queue contains its complete mathematical statement for both display and Socratic tutoring.

### Work Entry 8: Git Branch Integration & GitHub Remote Push
- Created a new unified Git branch named `integration-ecosystem` to consolidate all three sub-systems (`backend`, `frontend`, and `homework_ocr_vlm`).
- Cleaned up nested submodule git trees to ensure all source code, Docker configs, and documentation are tracked cohesively in the primary repository.
- Staged all integrated files including the unified `docker-compose.yml`, `start_all.ps1`, `WORK_LOG.md`, and `README.md`.
- Committed the complete integrated architecture and pushed the new branch to the GitHub remote repository (`Sovandeth0063/WEG_MVP_Chatbot`).

### Work Entry 9: Question Pill Titles & Redundant Header Cleaning
- Replaced the repetitive `Problem QX: MATHEMATICS` default labels with intelligent specific topic extractors in `ocrService.ts`.
- Filtered out generic subject headers (`MATHEMATICS`, `MATH`, `SCIENCE`) to prioritize the actual exercise subtitle or calculation prompt (e.g., `Q9: Calendar Facts`).
- Prevented duplicate header prefixes in the problem statement so questions begin cleanly with their actual task and instructions.
- Enhanced the scanner question selector pill bar with horizontal scrolling cues, distinct active button scaling, and bilingual Khmer/English label support.

### Work Entry 10: Multi-Part Formula Stitching & Whitespace Preservation
- Resolved flattened multi-part questions by applying `whitespace-pre-line` across the Homework Scanner and Socratic Chat views, allowing distinct line breaks for sub-parts (`a)`, `b)`).
- Implemented inline element stitching in `ocrService.ts` to reconnect fragmented math formulas around blank lines (e.g., merging `"35 +"` and `"= 100"` into `"35 + ___ = 100"`).
- Automatically appended fill-in placeholders (`___`) whenever a calculation ends with an operator (`+`, `-`, `x`, `/`, `=`).
- Compacted selector pill dimensions so multiple exercise buttons fit comfortably on screen without excessive horizontal truncation.



