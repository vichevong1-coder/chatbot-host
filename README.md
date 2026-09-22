# WEG Homework AI & Socratic Tutoring Ecosystem 🎓

Integrated multimodal homework digitization and AI Socratic tutoring system for elementary school students (Grades 1–6).

---

## 🏗️ Architecture Overview

```
                      ┌─────────────────────────────────┐
                      │    Homework OCR + VLM (:8000)   │
                      │  PaddleOCR + Vision Pipeline    │
                      └────────────────┬────────────────┘
                                       │ Scanned JSON
                                       ▼
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│        Frontend Web UI (:5173)  │ ─── /api/query ─▶│    Backend Orchestrator (:9000) │
│ - React + Vite + TypeScript     │                 │ - LangGraph Socratic State Mach │
│ - Tunsay Mascot & Stepper Card  │◀─── Socratic ───│ - Math Microservice (:9001)     │
│ - Multi-Exercise Worksheet Bar  │     Responses   │ - Science Microservice (:9002)  │
└─────────────────────────────────┘                 │ - Redis + Postgres + Qdrant DB  │
                                                    └─────────────────────────────────┘
```

---

## 📂 Project Structure

```
.
├── backend/                  # Socratic Tutoring Backend (FastAPI, LangGraph, Redis, Postgres, Qdrant)
│   ├── orchestrator/         # Main Gateway API (Port 9000)
│   ├── services/             # Math solver (:9001) & Science solver (:9002)
│   └── docker-compose.yml
├── frontend/                 # Student-Facing Web App (React 18, Vite, Tailwind CSS)
│   ├── src/components/       # ChatView, StepCard, HomeworkScanner, Stepper
│   └── src/services/         # geminiService.ts, ocrService.ts
├── homework_ocr_vlm/         # Multimodal OCR Pipeline (PaddleOCR, PyMuPDF, OpenCV)
│   ├── app/                  # FastAPI service (Port 8000), Layout, Vision
│   └── Dockerfile
├── docker-compose.yml        # Unified Multi-Service Docker Orchestration
├── start_all.ps1             # One-click Windows PowerShell startup script
└── WORK_LOG.md               # Cumulative work log
```

---

## 🚀 Quick Start Guide

### Option 1: Full Docker Stack (Recommended)
```bash
docker compose up --build
```

### Option 2: Local Development
1. **Start Backend & OCR**:
   ```bash
   cd backend && docker compose up
   ```
2. **Start Frontend**:
   ```bash
   cd frontend && npm install && npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
