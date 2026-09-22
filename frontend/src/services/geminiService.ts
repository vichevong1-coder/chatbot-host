import { HomeworkProblem, Language, StepItem } from '../types';

export interface BackendStep {
  step_number: number;
  title: string;
  status: string;
  mission: string;
  clue: string;
  helpful_example?: string;
  your_turn?: string;
  student_answer?: string | null;
  hints?: string[];
  current_hint_level?: number;
  expected_answer?: string;
  concept?: string;
}

export interface StepWidgetPayload {
  total_steps: number;
  current_step_index: number;
  completed_steps?: number[];
  steps: BackendStep[];
}

export interface BackendResponse {
  category: string;
  solution: string;
  steps?: any[];
  source?: string;
  current_step_index?: number;
  hint_count?: number;
  practice_mode?: boolean;
  completed?: boolean;
  is_problem_complete?: boolean;
  session_id: string;
  grade_level: string;
  language: string;
  step_widget?: StepWidgetPayload;
  formatted_markdown?: string;
}

const UNSAFE_KEYWORDS = [
  'cheat', 'hack', 'fight', 'kill', 'die', 'gun', 'weapon', 'bomb', 'hurt',
  'boyfriend', 'girlfriend', 'dating', 'kiss', 'sexy', 'naked',
  'write essay for me', 'do my homework', 'give me answer', 'answer this',
  'solve this for me', 'just tell me', 'copy', 'plagiar',
];

function isUnsafePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return UNSAFE_KEYWORDS.some(kw => lower.includes(kw));
}

// Strip question prefixes like "1.", "2.", "A.", "1)" before sending to math solver
export function cleanQueryForSolver(query: string): string {
  if (!query) return '';
  return query.replace(/^([0-9]+\.|\b[0-9]+\)|\b[A-Za-z]\.|\bQ[0-9]+[:.]?|\bExercise\s*[0-9]+[:.]?)\s*/i, '').trim();
}

// Map backend StepWidget steps into frontend StepItem[]
export function mapBackendStepsToStepItems(widget: StepWidgetPayload, defaultPrompt: string): StepItem[] {
  if (!widget?.steps || widget.steps.length === 0) {
    return [
      {
        id: 'step-1',
        stepNumber: 1,
        totalSteps: 1,
        questionKhmer: defaultPrompt,
        questionEng: defaultPrompt,
        inputFormat: 'text',
        correctAnswer: '',
        hint1: { khmer: 'សួរសំណួរទៅទន្សាយ', eng: 'Ask Tunsay for guidance.' },
        hint2: { khmer: 'ទន្សាយនឹងជួយអ្នក', eng: 'Tunsay will guide you step by step.' },
        hint3: { titleKhmer: 'ជំនួយ', titleEng: 'Help', exampleKhmer: '', exampleEng: '' },
        socraticPromptKhmer: defaultPrompt,
        socraticPromptEng: defaultPrompt,
        explainDifferently: {
          simpleKhmer: defaultPrompt,
          simpleEng: defaultPrompt,
          analogyTitle: 'Analogy',
          analogyKhmer: 'តោះចាប់ផ្តើម',
          analogyEng: "Let's begin",
          analogyType: 'apples',
        },
      },
    ];
  }

  return widget.steps.map((s, idx) => {
    const title = s.title || `Step ${s.step_number}`;
    const mission = s.mission || title;
    const clue = s.clue || '';
    const prompt = s.your_turn || mission || defaultPrompt;
    const expected = s.expected_answer || '';
    const example = s.helpful_example || '';

    return {
      id: `step-${idx + 1}`,
      stepNumber: s.step_number || idx + 1,
      totalSteps: widget.total_steps || widget.steps.length,
      title: title,
      mission: mission,
      clue: clue,
      helpfulExample: example,
      yourTurn: s.your_turn || prompt,
      status: (s.status as any) || (idx === widget.current_step_index ? 'in_progress' : idx < widget.current_step_index ? 'completed' : 'pending'),
      studentAnswer: s.student_answer || null,
      questionKhmer: mission,
      questionEng: mission,
      inputFormat: 'text',
      correctAnswer: expected,
      hint1: {
        khmer: clue || 'គិតអំពីជំហានដំបូងនៃលំហាត់នេះ។',
        eng: clue || 'Think about the first step of this problem.',
      },
      hint2: {
        khmer: example || 'តើអ្នកអាចរកផលបូក ឬផលគុណនៃលេខដំបូងបានទេ?',
        eng: example || 'Can you combine the first numbers first?',
      },
      hint3: {
        titleKhmer: 'ឧទាហរណ៍ជំនួយ',
        titleEng: 'Helpful Example',
        exampleKhmer: example || 'រាប់បន្តពីចំនួនធំជាងគេ។',
        exampleEng: example || 'Count up starting from the bigger number.',
      },
      socraticPromptKhmer: prompt,
      socraticPromptEng: prompt,
      explainDifferently: {
        simpleKhmer: clue || mission,
        simpleEng: clue || mission,
        analogyTitle: 'របៀបគិត (Analogy)',
        analogyKhmer: 'ស្រមៃដូចជាការប្រមូលរបស់របរដាក់ក្នុងកន្ត្រកតែមួយ។',
        analogyEng: 'Imagine putting items into a single basket together.',
        analogyType: 'apples',
      },
    };
  });
}

// Create a full HomeworkProblem from a backend StepWidgetPayload
export function createProblemFromStepWidget(
  query: string,
  widget: StepWidgetPayload,
  category: string = 'math',
  grade: number = 3
): HomeworkProblem {
  const steps = mapBackendStepsToStepItems(widget, query);
  const catLower = (category || '').toLowerCase();
  const isScience = catLower.includes('science') || catLower.includes('physic') || catLower.includes('bio') || catLower.includes('chem');

  return {
    id: `direct-prob-${Date.now()}`,
    titleKhmer: isScience ? 'លំហាត់វិទ្យាសាស្ត្រ' : 'លំហាត់គណិតវិទ្យា',
    titleEng: isScience ? 'Science Problem' : 'Mathematics Problem',
    problemStatementKhmer: query,
    problemStatementEng: query,
    grade: (grade >= 1 && grade <= 6 ? grade : 3) as any,
    subject: isScience ? 'science' : 'math',
    steps: steps,
  };
}

// ──────────────────────────────────────────────
// Main API Functions
// ──────────────────────────────────────────────

export async function askTunsayTutor(
  userPrompt: string,
  problemContext?: HomeworkProblem | undefined,
  language: Language = 'km',
  sessionId?: string | undefined,
  gradeOverride?: number | undefined
): Promise<{
  textKhmer: string;
  textEng: string;
  sessionId?: string | undefined;
  stepWidget?: StepWidgetPayload | undefined;
  problem?: HomeworkProblem | undefined;
  isProblemComplete?: boolean | undefined;
  isSafetyRefusal?: boolean | undefined;
}> {
  if (isUnsafePrompt(userPrompt)) {
    return {
      textKhmer: `🛡️ ខ្ញុំនៅទីនេះដើម្បីជួយសិក្សា និងធ្វើលំហាត់ដោយសុវត្ថិភាព។ តោះត្រឡប់ទៅមើលលំហាត់វិញណា! តើអ្នកមានសំណួរគណិតវិទ្យា ឬវិទ្យាសាស្ត្រចង់សួរទេ? 🐰`,
      textEng: `🛡️ I'm here to help with safe, educational topics only. Let's get back to your homework! Do you have a Math or Science question? 🐰`,
      isSafetyRefusal: true,
    };
  }

  try {
    const studentGrade = gradeOverride || problemContext?.grade || 3;
    const gradeLevel = `grade_${studentGrade <= 3 ? '1_3' : '4_6'}`;

    // Clean leading question prefix if this is an initial problem query
    const cleanedQuery = cleanQueryForSolver(userPrompt);
    const queryToSend = cleanedQuery.length > 0 ? cleanedQuery : userPrompt;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: queryToSend,
        session_id: sessionId || undefined,
        grade_level: gradeLevel,
        language: language === 'km' ? 'khmer' : 'en',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: BackendResponse = await response.json();
      let text = data.solution || data.formatted_markdown || '';

      // If backend returned mock placeholder due to missing GEMINI_API_KEY, generate helpful Socratic text
      if (!text || text.includes('Mock LLM generated response.')) {
        if (data.step_widget && data.step_widget.steps?.length > 0) {
          const step1 = data.step_widget.steps[0];
          text = language === 'km'
            ? `🌱 តោះយើងដោះស្រាយលំហាត់នេះជាមួយគ្នាជាជំហានៗ! \n\n**បេសកកម្មជំហានទី ១៖** ${step1.mission || step1.title}\n\n👉 **សំណួរ៖** ${step1.your_turn || step1.clue || 'តើអ្នកអាចរកចម្លើយសម្រាប់ជំហាននេះបានទេ?'}`
            : `🌱 Let's solve this together step-by-step! \n\n**Step 1 Mission:** ${step1.mission || step1.title}\n\n👉 **Question:** ${step1.your_turn || step1.clue || 'Can you solve this step?'}`;
        } else {
          text = language === 'km'
            ? `សួស្តី! ខ្ញុំកំពុងជួយអ្នកដោះស្រាយលំហាត់ \`${userPrompt}\`។ តើអ្នកចង់ចាប់ផ្តើមយ៉ាងដូចម្តេចដែរ? 🐰`
            : `Hi! I'm here to guide you with \`${userPrompt}\`. How would you like to start? 🐰`;
        }
      }

      let generatedProblem: HomeworkProblem | undefined = undefined;
      if (data.step_widget && data.step_widget.steps?.length > 0) {
        generatedProblem = createProblemFromStepWidget(
          userPrompt,
          data.step_widget,
          data.category,
          studentGrade
        );
      }

      return {
        textKhmer: text,
        textEng: text,
        sessionId: data.session_id,
        stepWidget: data.step_widget,
        problem: generatedProblem,
        isProblemComplete: data.is_problem_complete || data.completed || false,
        isSafetyRefusal: false,
      };
    } else {
      console.error('Backend returned error status:', response.status);
    }
  } catch (err) {
    console.error('Backend API error:', err);
  }

  // Fallback if backend is unavailable
  return {
    textKhmer: `តោះយើងដោះស្រាយសំណួរនេះជាមួយគ្នា! តើអ្នកគិតយ៉ាងណាដែរចំពោះជំហានដំបូង? 🐰🌱`,
    textEng: `Let's solve this problem together! What do you think is our very first step? 🐰🌱`,
    isSafetyRefusal: false,
  };
}

// ──────────────────────────────────────────────
// Additional Backend Integration APIs
// ──────────────────────────────────────────────

export async function navigateStepApi(
  sessionId: string,
  targetStepIndex?: number | undefined,
  stepNumber?: number | undefined,
  direction?: 'next' | 'back' | undefined
): Promise<{
  sessionId: string;
  currentStepIndex: number;
  stepWidget?: StepWidgetPayload | undefined;
  formattedMarkdown?: string | undefined;
  feedbackMessage?: string | undefined;
} | null> {
  try {
    const res = await fetch('/api/step/navigate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        target_step_index: targetStepIndex,
        step_number: stepNumber,
        direction: direction,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      sessionId: data.session_id,
      currentStepIndex: data.current_step_index,
      stepWidget: data.step_widget,
      formattedMarkdown: data.formatted_markdown,
      feedbackMessage: data.feedback_message,
    };
  } catch (err) {
    console.error('Failed to navigate step on backend:', err);
    return null;
  }
}

export async function fetchSessionApi(sessionId: string) {
  try {
    const res = await fetch(`/api/session/${sessionId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch session from backend:', err);
    return null;
  }
}

export async function deleteSessionApi(sessionId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/session/${sessionId}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete session on backend:', err);
    return false;
  }
}

export async function requestHintApi(
  sessionId: string,
  language: Language = 'km',
  gradeLevel: string = 'grade_1_3'
): Promise<{ text: string; hintCount?: number | undefined } | null> {
  try {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: language === 'km' ? 'សូមផ្តល់តម្រុយ ឬជំនួយដល់ខ្ញុំ' : 'Please give me a hint',
        session_id: sessionId,
        grade_level: gradeLevel,
        language: language === 'km' ? 'khmer' : 'en',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      text: data.solution || data.formatted_markdown || '',
      hintCount: data.hint_count,
    };
  } catch (err) {
    console.error('Failed to request hint from backend:', err);
    return null;
  }
}

export async function requestClarificationApi(
  sessionId: string,
  language: Language = 'km',
  gradeLevel: string = 'grade_1_3'
): Promise<{ text: string } | null> {
  try {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: language === 'km' ? 'ខ្ញុំមិនយល់ទេ សូមពន្យល់តាមរបៀបផ្សេងជាមួយឧទាហរណ៍' : "I don't understand, please explain differently with a simple analogy",
        session_id: sessionId,
        grade_level: gradeLevel,
        language: language === 'km' ? 'khmer' : 'en',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      text: data.solution || data.formatted_markdown || '',
    };
  } catch (err) {
    console.error('Failed to request clarification from backend:', err);
    return null;
  }
}

export const askSayoTutor = askTunsayTutor;

