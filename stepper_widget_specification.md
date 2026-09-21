# 🧩 Socratic Stepper Widget: UI/UX & Data Specification
### Interactive Step-by-Step Card System for Elementary STEM (Grades 1–6)

---

## 1. Executive Summary

The **Socratic Stepper Widget** is an interactive, multi-step card interface designed specifically for elementary learners. Instead of overwhelming young students with long text or giving away answers immediately, it breaks down complex science and math word problems into **bite-sized, sequential missions** with visual analogies, clickable progress dots, and instant step navigation.

---

## 2. The Socratic Principle: Parallel Problem Generation (Zero Answer Leakage)

> [!IMPORTANT]
> **Core Socratic Rule**: The AI **NEVER** calculates or displays the answer to the student's actual homework problem in the clues or examples.
>
> Instead, when a student submits their question, the Socratic Engine automatically generates a **Parallel Isomorphic Example** (same mathematical/scientific structure, but with different characters, numbers, and items).
>
> - **🍎 Helpful Picture / Example**: Teaches the concept and method using the **Parallel Example** (e.g. Maya with 10 cookies).
> - **👉 Your Turn**: Asks the student to calculate and apply the method to **their own Homework Problem** (Leo with 12 apples).

```
[ Student's Question: Leo has 12 apples, gives 4 away, splits into 2 boxes ]
                               │
                               ▼
        [ Socratic Engine Generates Parallel Example ]
     "Maya has 10 cookies, gives 2 away, splits into 2 jars"
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 [ 🍎 Helpful Picture / Example ]         [ 👉 Your Turn ]
 Solves Step on Maya's Cookies        Asks Student to Solve on
 (10 - 2 = 8) with cookie emojis      Their Own Apples (12 - 4 = ?)
 (ZERO ANSWER LEAKAGE!)               (ACTIVE LEARNING!)
```

---

## 3. Real-World End-to-End Problem Walkthrough

### 📖 Student's Homework Question:
> *"Leo has 12 apples. He gives 4 apples to his sister. Then he splits the rest equally into 2 lunchboxes. How many apples are in each lunchbox?"*

### 🎨 System's Generated Parallel Example (Used in Clues/Pictures):
> *"Maya has 10 cookies. She gives 2 cookies to her brother. Then she splits the rest equally into 2 jars."*

---

### 🟢 Step 1 of 4: Identify Starting Quantities

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🧩 Step 1 of 4                                     [ 👁️ View all steps ]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  🌟 Our Mission:                                                       │
│     Let's find the total number we start with before anything changes! │
│                                                                        │
│  💡 Clue:                                                              │
│     Look at the first sentence of any story problem for the start.     │
│                                                                        │
│  🍎 Helpful Picture / Example (Maya's Story):                          │
│     > In Maya's story, she starts with 10 cookies:                     │
│     > 🍪🍪🍪🍪🍪🍪🍪🍪🍪🍪 (Maya's starting basket = 10)               │
│                                                                        │
│  👉 Your Turn (Leo's Homework):                                        │
│     What is the starting number of apples Leo has in his basket?       │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [ ⬅️ Back (disabled) ]     ● 1 ●  ( 2 )  ( 3 )  ( 4 )     [ Next ➡️ ] │
└────────────────────────────────────────────────────────────────────────┘
```
- **Student Input**: `"12"`
- **Tutor Feedback**: *"Great observation! 🌟 You found the starting amount right from the story! Let's see what happens next in Step 2!"*
- **UI State**: Dot 1 turns into `( ✔ 1 )` and Dot 2 becomes active `● 2 ●`.

---

### 🟢 Step 2 of 4: Subtraction (Taking Away)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🧩 Step 2 of 4                                     [ 👁️ View all steps ]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  🌟 Our Mission:                                                       │
│     Let's take away the items given away using subtraction (-)!        │
│                                                                        │
│  💡 Clue:                                                              │
│     "Gives away" means taking away from the total group.               │
│                                                                        │
│  🍎 Helpful Picture / Example (Maya's Story):                          │
│     > Maya started with 10 cookies and gave away 2:                    │
│     > 🍪🍪🍪🍪🍪🍪🍪🍪🍪🍪 (10) take away 🍪🍪 (2) = 🍪🍪🍪🍪🍪🍪🍪🍪 (8) │
│                                                                        │
│  👉 Your Turn (Leo's Homework):                                        │
│     Leo started with 12 apples and gives away 4. How many are left?    │
│     (What is 12 minus 4?)                                              │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [ ⬅️ Back ]           ( ✔ 1 )  ● 2 ●  ( 3 )  ( 4 )        [ Next ➡️ ] │
└────────────────────────────────────────────────────────────────────────┘
```
- **Student Input**: `"8"`
- **Tutor Feedback**: *"Spot on thinking! 🍎 You subtracted the given-away apples correctly! Ready to share them in Step 3?"*
- **UI State**: Dot 2 turns into `( ✔ 2 )` and Dot 3 becomes active `● 3 ●`.

---

### 🟢 Step 3 of 4: Division (Equal Sharing)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🧩 Step 3 of 4                                     [ 👁️ View all steps ]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  🌟 Our Mission:                                                       │
│     Let's share the remaining items equally into groups (division ÷)!  │
│                                                                        │
│  💡 Clue:                                                              │
│     Sharing equally into 2 groups means dividing by 2 (Total ÷ 2).     │
│                                                                        │
│  🍎 Helpful Picture / Example (Maya's Story):                          │
│     > Maya divides her 8 cookies equally into 2 jars:                  │
│     > 🏺 Jar A: 🍪🍪🍪🍪 (4)   |   🏺 Jar B: 🍪🍪🍪🍪 (4)               │
│     > 8 split equally into 2 = 4 cookies in each jar!                  │
│                                                                        │
│  👉 Your Turn (Leo's Homework):                                        │
│     Leo splits his 8 remaining apples equally into 2 lunchboxes.       │
│     How many apples go into each lunchbox? (What is 8 ÷ 2?)            │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [ ⬅️ Back ]        ( ✔ 1 )  ( ✔ 2 )  ● 3 ●  ( 4 )         [ Next ➡️ ] │
└────────────────────────────────────────────────────────────────────────┘
```
- **Student Input**: `"4"`
- **Tutor Feedback**: *"Brilliant calculation! ✨ You divided them into equal lunchboxes! You completed all the steps — let's celebrate!"*
- **UI State**: Dot 3 turns into `( ✔ 3 )` and Dot 4 becomes active `● 4 ●`.

---

### 🟢 Step 4 of 4: Final Mission Summary & Mastery Badge 🎉

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🎉 Mission Complete!                                [ 👁️ View all steps ]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  🌟 Mission Accomplished:                                              │
│     You successfully solved the entire problem step by step!           │
│                                                                        │
│  💡 How You Solved It:                                                 │
│     1. You identified the starting basket of apples.                   │
│     2. You subtracted the apples given to Leo's sister.                │
│     3. You divided the remaining apples equally into 2 lunchboxes.     │
│                                                                        │
│  🍎 Celebration:                                                       │
│     > 🎊 ⭐ 🏅 Super STEM Detective Badge Earned! 🏅 ⭐ 🎊             │
│                                                                        │
│  👉 Your Turn:                                                         │
│     Ready to try another exciting problem together? ✨                 │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [ ⬅️ Back ]        ( ✔ 1 )  ( ✔ 2 )  ( ✔ 3 )  ● 4 ●    [ Try New ✨ ] │
└────────────────────────────────────────────────────────────────────────┘
```



---

## 4. The 3-Tier Progressive Hint System: `[ 💡 Need a Hint? ]`

Elementary students often get stuck even after seeing a parallel example. To make the learning experience frustration-free, every step card includes a prominent **`[ 💡 Need a Hint? (1/3) ]`** button.

Students can either **click the button** or **type in chat** (*"I'm stuck"*, *"give me a hint"*, *"help"* — parsed by Deth's `REQUEST_HINT` intent).

```
                      [ Student is Stuck on Step 2: 12 - 4 ]
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
      [ Tier 1 Hint ]            [ Tier 2 Hint ]            [ Tier 3 Hint ]
     "The Guiding Nudge"        "Visual Scaffold"          "Micro-Breakdown"
   "Count back 4 from 12:     "🍎🍎🍎🍎🍎🍎🍎🍎 ❌❌❌❌    "Split into 2 easy steps:
    11, 10, 9, ...?"           Cross out 4. How many      12 - 2 = 10, then
                               apples are left?"          10 - 2 = ?"
```

---

### 🎨 Live UI Preview: When Student Clicks `[ 💡 Need a Hint? ]`

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🧩 Step 2 of 4                                     [ 👁️ View all steps ]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  🌟 Our Mission:                                                       │
│     Let's take away the items given away using subtraction (-)!        │
│                                                                        │
│  💡 Clue:                                                              │
│     "Gives away" means taking away from the total group.               │
│                                                                        │
│  🍎 Helpful Picture / Example (Maya's Story):                          │
│     > Maya started with 10 cookies and gave away 2:                    │
│     > 🍪🍪🍪🍪🍪🍪🍪🍪🍪🍪 (10) take away 🍪🍪 (2) = 🍪🍪🍪🍪🍪🍪🍪🍪 (8) │
│                                                                        │
│  👉 Your Turn (Leo's Homework):                                        │
│     Leo started with 12 apples and gives away 4. How many are left?    │
│                                                                        │
│  ┌─ 💡 Hint Box (Hint 2 of 3) ──────────────────────────────────────┐  │
│  │ 🍎 Visual Helper for Leo's Apples:                               │  │
│  │ 🍏🍏🍏🍏🍏🍏🍏🍏 ❌❌❌❌                                         │  │
│  │ We crossed out 4 apples. Count the green 🍏 apples left!         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [ ⬅️ Back ]     ( ✔ 1 )  ● 2 ●  ( 3 )  ( 4 )    [ 💡 Next Hint (3/3) ]│
└────────────────────────────────────────────────────────────────────────┘
```

---

### 📈 Progressive Hint Breakdown

| Hint Tier | Goal | What the AI Shows the Kid | Answer Leaked? |
| :---: | :--- | :--- | :---: |
| **Tier 1<br>(Nudge)** | Points directly to the arithmetic strategy. | *"Try counting backwards 4 steps starting from 12: 11, 10, 9, ... what comes next?"* | ❌ **No** |
| **Tier 2<br>(Visual)** | Visual emoji cross-out scaffold. | *"Here are Leo's 12 apples: 🍏🍏🍏🍏🍏🍏🍏🍏 ❌❌❌❌. Count how many 🍏 are left!"* | ❌ **No** |
| **Tier 3<br>(Worked)** | Breaks down the calculation into 2 friendly micro-steps. | *"Let's do it in two baby steps! First, 12 - 2 = 10. Now, what is 10 - 2?"* | ❌ **No** |

---

## 5. Overview Mode: `[ 👁️ View all steps ]` (Clean, Question-Free Roadmap)

> [!TIP]
> **Read-Only / Roadmap Rule**: When the student clicks `[ 👁️ View all steps ]`, the system switches to **Overview Mode**. 
> - **NO `👉 Your Turn` questions or input prompts are shown in this view.**
> - It acts strictly as a clean, peaceful **bird's-eye solution roadmap** summarizing the missions, methods, and progress.
> - To answer a question, the student clicks **`[ ✏️ Solve Step 2 ]`**, which takes them back to the active step card.

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 📋 Full Solution Journey                           [ ❌ Close Overview ]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ✅ Step 1: Identify Starting Quantities                               │
│     • Mission: Find total starting items                               │
│     • Rule: Check the opening sentence of the story                    │
│     • Status: Solved (Recorded: 12 apples)                             │
│                                                                        │
│  🔄 Step 2: Subtraction (Active Step)                                   │
│     • Mission: Take away given-away apples                             │
│     • Rule: Subtraction (Start - Given Away)                           │
│     • Status: In Progress ──► [ ✏️ Go to Step 2 to Solve ]             │
│                                                                        │
│  ⏳ Step 3: Division into Equal Groups                                 │
│     • Mission: Split remaining apples into 2 lunchboxes                │
│     • Rule: Division (Remaining ÷ 2)                                   │
│     • Status: Up Next 🔒                                               │
│                                                                        │
│  ⭐ Step 4: Final Mastery & Solution Badge                             │
│     • Mission: Complete problem & celebrate!                           │
│     • Status: Locked 🔒                                                │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [ ⬅️ Return to Active Card ]                 [ ✏️ Go to Step 2 ]     │
└────────────────────────────────────────────────────────────────────────┘
```


---

## 6. Navigation Architecture: Pure Interactive UI

Step navigation is handled directly on the frontend UI:

1. **Numbered Dots `( 1 )  ● 2 ●  ( 3 )  ( 4 )`**:
   - Completed steps show green badges `( ✔ 1 )`.
   - Active step has glowing highlight `● 2 ●`.
   - Clicking any dot jumps immediately to that card.
2. **`[ ⬅️ Back ]` & `[ Next ➡️ ]` Buttons**:
   - `Back` is disabled on Step 1.
   - `Next` is enabled once the current step is answered or during review.
3. **`[ 💡 Need a Hint? ]` Button**:
   - Progressive expansion drawer showing Tier 1 $\rightarrow$ Tier 2 $\rightarrow$ Tier 3 scaffolds.
4. **`[ 👁️ View all steps ]` Toggle**:
   - Toggles full checklist view without disrupting active conversation.

---

## 7. Backend JSON Payload Schema (`card_schema.py`)

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
        "title": "Starting Apples",
        "status": "completed",
        "mission": "Find how many apples Leo started with!",
        "clue": "Look at the very first sentence of the story.",
        "helpful_example": "🍪🍪🍪🍪🍪🍪🍪🍪🍪🍪 (Maya starts with 10 cookies)",
        "your_turn": "What is the total number of apples Leo has at the beginning?",
        "student_answer": "12",
        "hints": [
          "Look at the first number in the story problem.",
          "Count: Leo has one dozen (12) apples in his basket."
        ],
        "current_hint_level": 0
      },
      {
        "step_number": 2,
        "title": "Subtract Given Away",
        "status": "in_progress",
        "mission": "Let's take away the apples Leo gives to his sister!",
        "clue": "'Gives away' means subtraction (-).",
        "helpful_example": "🍪🍪🍪🍪🍪🍪🍪🍪🍪🍪 (10) take away 🍪🍪 (2) = 🍪🍪🍪🍪🍪🍪🍪🍪 (8)",
        "your_turn": "Leo started with 12 apples and gives away 4. How many are left?",
        "student_answer": null,
        "hints": [
          "Try counting backwards 4 steps starting from 12: 11, 10, 9, ...?",
          "🍏🍏🍏🍏🍏🍏🍏🍏 ❌❌❌❌ (We crossed out 4 apples. Count the green 🍏 left!)",
          "Let's do two smaller steps: 12 - 2 = 10, then what is 10 - 2?"
        ],
        "current_hint_level": 2
      }
    ]
  },
  "formatted_markdown": "🌟 **Our Mission:** Let's take away the apples Leo gives to his sister!\n\n💡 **Clue:** 'Gives away' means subtraction (-).\n\n🍎 **Helpful Picture / Example:**\n> 🍪🍪🍪🍪🍪🍪🍪🍪🍪🍪 (10) take away 🍪🍪 (2) = 🍪🍪🍪🍪🍪🍪🍪🍪 (8)\n\n👉 **Your Turn:**\nLeo started with 12 apples and gives away 4. How many are left?\n\n💡 **Hint:** 🍏🍏🍏🍏🍏🍏🍏🍏 ❌❌❌❌ (Count the green apples left!)"
}
```

