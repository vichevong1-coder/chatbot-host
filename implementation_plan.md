# 📋 Comprehensive Project Audit & Implementation Plan

Comparison of the current repository state against:
- [mvp_development_roadmap.md](file:///e:/Competition/Khmer%20Enterprise/Science_chatbot/mvp_development_roadmap.md)
- [proposed_mvp_file_structure.md](file:///e:/Competition/Khmer%20Enterprise/Science_chatbot/proposed_mvp_file_structure.md)
- [stepper_widget_specification.md](file:///e:/Competition/Khmer%20Enterprise/Science_chatbot/stepper_widget_specification.md)

---

## 1. Executive Audit Summary

| Component | Target Spec Requirement | Current Code Status | Gap / Issue Identified | Severity |
| :--- | :--- | :--- | :--- | :---: |
| **AllStepsDrawer (Overview Mode)** | **Spec §5**: Clean, question-free bird's-eye solution roadmap. **NO `👉 Your Turn` questions or prompts allowed.** Must show missions, rules, and `[ ✏️ Go to Step X to Solve ]`. | `AllStepsDrawer.tsx:131-133` displays `👉 {s.yourTurn}`. Bottom action buttons missing. | **Direct Spec §5 Violation**: leaks interactive questions into overview roadmap. Missing navigation actions. | 🔴 High |
| **StepChatBubble (Inline Widget)** | **Spec §4 & §6**: Active card must feature `[ ⬅️ Back ]` and `[ Next ➡️ ]` navigation buttons around the numbered progress dots. | `StepChatBubble.tsx` only has dots and hint button. Lacks Back/Next buttons. When reviewing prior steps, still prompts to type answer. | **Missing Spec §4 & §6 Controls**: Kid cannot step back/forward using button controls. Review mode lacks completed answer badge. | 🟡 Medium |
| **StepChatBubble (Inline Hint Box)** | **Spec §4 UI Preview**: When hint is active, display styled inline `💡 Hint Box (Hint X of 3)` directly inside the card bubble. | Hints only open modal (`HintSheet`), not displayed inline on card. | Minor UX gap vs Spec §4 illustration. | 🟢 Low |
| **HintSheet (3-Tier Scaffolds)** | **Spec §4**: Strict 3-Tier Progressive Hinting: Tier 1 (Guiding Nudge), Tier 2 (Visual Emoji Scaffold), Tier 3 (Micro-Breakdown). | Tabs named generic "Hint 1, Hint 2, Example". Doesn't highlight the 3 progressive tiers clearly. Backend sync doesn't update active step hint level in state. | Conceptual misalignment with Tier 1/2/3 specification. | 🟡 Medium |
| **ExplanationCard (Isomorphic Analogy)** | **Spec §2**: Core Socratic Principle: Parallel Isomorphic Example (Maya's cookies vs Leo's apples, zero answer leak). | Fallback uses generic basket analogy instead of `step.helpfulExample`. | Visual analogy should bind to `step.helpfulExample`. | 🟢 Low |
| **Backend Socratic Engine** | **Roadmap §3.3 & Card Schema**: 4-part cards, 3-tier hint engine, StateGraph, child safety guardrails, Redis session. | `card_schema.py`, `graph.py`, `hint_engine.py`, `endpoints.py` are well-structured and functional. | Minor: verify `current_hint_tier` and hints sync accurately on step advance. | 🟢 Low |
| **OCR & Solver Engine** | **Roadmap §3.2 & Must #1**: `/api/upload/ocr`, `/api/upload/mock`, `/api/upload/select`, multi-exercise extraction. | Working cleanly on port 9000 & 9003 with zero-model fallback. | Fully aligned. No regression needed. | 🟢 Clean |

---

## 2. User Review Required

> [!IMPORTANT]
> **Zero Breaking Changes Commitment**:
> All proposed fixes are additive and strictly preserve:
> 1. The existing chat-only inline layout with `StepChatBubble`.
> 2. The working OCR pipeline and multi-exercise selection in `HomeworkScanner.tsx`.
> 3. The local Ollama `gemma4:latest` configuration and backend mock endpoints (`/api/upload/mock`).
> 4. All previously applied stability fixes (timeouts, immutability, state reset).

---

## 3. Proposed Changes Grouped by Component

### Component A: `AllStepsDrawer.tsx` (Spec §5 Overview Mode Compliance)

#### [MODIFY] [AllStepsDrawer.tsx](file:///e:/Competition/Khmer%20Enterprise/Science_chatbot/frontend/src/components/AllStepsDrawer.tsx)
- **Remove `👉 Your Turn`**: Eliminate line 131–133 which displays the active question in overview mode.
- **Implement Spec §5 Roadmap View**:
  - Display Mission: `• Mission: {s.mission}`
  - Display Rule/Clue: `• Rule: {s.clue}`
  - Display Status:
    - Solved: `✅ Solved (Recorded: "{s.studentAnswer || 'Done'}")`
    - In Progress (Active): `🔄 In Progress ──► [ ✏️ Go to Step {idx + 1} to Solve ]`
    - Up Next: `⏳ Up Next 🔒`
- **Add Footer Navigation**:
  - `[ ⬅️ Return to Active Card ]` button.
  - `[ ✏️ Go to Step {activeStep} ]` button.

---

### Component B: `StepChatBubble.tsx` (Spec §4 & §6 Controls & Review Mode)

#### [MODIFY] [StepChatBubble.tsx](file:///e:/Competition/Khmer%20Enterprise/Science_chatbot/frontend/src/components/StepChatBubble.tsx)
- **Add Next / Back Navigation Buttons** to the footer:
  - `[ ⬅️ Back ]`: Call `onNavigateStep(stepIndex - 1)`. Disabled if `stepIndex === 0`.
  - Clickable numbered dots `( 1 )  ● 2 ●  ( 3 )  ( 4 )`: Green check for completed, highlight for active.
  - `[ Next ➡️ ]`: Call `onNavigateStep(stepIndex + 1)`. Enabled if step is completed or reviewing prior steps.
- **Review Mode Handling**:
  - If viewing an already completed step (`completedStepIndices.includes(stepIndex)`):
    - Display a neat `[ ✅ Solved! Your Answer: "{step.studentAnswer}" ]` container instead of the animated "Type your answer..." prompt.
- **Inline Hint Box (Spec §4)**:
  - If `step.currentHintLevel > 0` or an active hint is revealed, render the styled `💡 Hint Box (Hint X of 3)` with visual emoji styling directly in the bubble.

---

### Component C: `HintSheet.tsx` & `geminiService.ts` (3-Tier Progressive Scaffolding)

#### [MODIFY] [HintSheet.tsx](file:///e:/Competition/Khmer%20Enterprise/Science_chatbot/frontend/src/components/HintSheet.tsx)
- Align tabs with **Spec §4 Progressive 3-Tier System**:
  - **Tier 1: Guiding Nudge** (`step.hint1` / `step.hints[0]`).
  - **Tier 2: Visual Scaffold** (`step.hint2` / `step.helpfulExample` / `step.hints[1]`) with emoji callouts.
  - **Tier 3: Micro-Breakdown** (`step.hint3` / `step.hints[2]`) with baby-step calculations.
- Display current tier badge `(Tier X of 3)`.

#### [MODIFY] [geminiService.ts](file:///e:/Competition/Khmer%20Enterprise/Science_chatbot/frontend/src/services/geminiService.ts)
- In `requestHintApi`, ensure the returned hint tier updates the active step object so both `HintSheet` and `StepChatBubble` reflect the unlocked hint tier.

---

### Component D: `ChatView.tsx` (State Wiring & Navigation Integration)

#### [MODIFY] [ChatView.tsx](file:///e:/Competition/Khmer%20Enterprise/Science_chatbot/frontend/src/components/ChatView.tsx)
- Ensure `handleStepNavigate` properly switches the active displayed step card or scrolls to the target bubble.
- Connect the Back/Next navigation callbacks from `StepChatBubble`.
- When an exercise is completed, celebrate with confetti and show the Next Exercise banner smoothly.

---

## 4. Verification Plan

### Automated Checks:
- `npx tsc --noEmit` in `frontend/` (Zero TypeScript errors).
- Python lint / syntax check on backend orchestrator files.

### Manual End-to-End Verification:
1. **Overview Mode Test**:
   - Start problem $\rightarrow$ Click `[ 👁️ View all steps ]`.
   - Verify that **NO `👉 Your Turn` questions** appear.
   - Verify that missions, rules, and status badges (✅ Solved, 🔄 In Progress, ⏳ Up Next) are cleanly displayed.
   - Click `[ ✏️ Go to Step to Solve ]` and verify it returns to active card.
2. **Next / Back Navigation Test**:
   - Check that `[ ⬅️ Back ]` is disabled on Step 1.
   - Solve Step 1 $\rightarrow$ Step 2 card appears.
   - Click `[ ⬅️ Back ]` $\rightarrow$ reviews Step 1 with recorded answer badge.
   - Click `[ Next ➡️ ]` $\rightarrow$ advances back to Step 2 with typing prompt.
3. **Progressive Hint Test**:
   - Click `[ 💡 Need a Hint? ]` $\rightarrow$ verify Tier 1 Nudge, Tier 2 Visual Scaffold, Tier 3 Micro-Breakdown render with zero answer leaks.
4. **OCR & Scanner Regression Test**:
   - Open Homework Scanner $\rightarrow$ click "Use Backend Exercises (Q5, Q6, Q7)" $\rightarrow$ select Exercise $\rightarrow$ verify it launches Step 1 cleanly in chat.
