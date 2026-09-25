# 🎓 Backend Socratic Prompts & Curriculum Fallback Registry

This directory contains the Socratic Prompt Controller, dynamic YAML templates, and deterministic STEM curriculum domain rules used by the backend orchestrator.

---

## 📁 Files & Structure

| File | Purpose | Description |
| :--- | :--- | :--- |
| **`controller.py`** | 🕹️ Prompt Controller Engine | Compiles prompt templates, manages grade-level adaptation (Grades 1–2, 3–4, 5–6), calls LLM services, and parses structured Socratic step models. |
| **`templates.yml`** | 📝 YAML Prompt Templates | Strictly structured prompt templates for 4-Part Socratic Card generation, parallel isomorphic examples, progressive hints, and step breakdown. |
| **`controller.py` (Curricular Fallback)** | 📖 Deterministic Domain Registry | Contains hardcoded elementary STEM topic rules (boiling/evaporation, melting, magnets, shadows, buoyancy, plant growth, subtraction, multiplication, fractions) ensuring reliable offline execution. |

---

## 🧭 How It Works

1. **Dynamic Prompting**: When the orchestrator processes a query with an active LLM, it uses `templates.yml` and the grade-tier guidelines from `GRADE_LEVELS`.
2. **Deterministic Fallback**: If the LLM call times out or is offline, the controller automatically evaluates regex patterns and numbers to generate structured 4-part cards for common elementary math and science topics.
