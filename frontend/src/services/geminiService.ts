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

// ──────────────────────────────────────────────
// Main API Functions
// ──────────────────────────────────────────────

export async function askTunsayTutor(
  userPrompt: string,
  problemContext?: HomeworkProblem,
  language: Language = 'km',
  sessionId?: string
): Promise<{
  textKhmer: string;
  textEng: string;
  sessionId?: string;
  stepWidget?: StepWidgetPayload;
  isProblemComplete?: boolean;
  isSafetyRefusal?: boolean;
}> {
  if (isUnsafePrompt(userPrompt)) {
    return {
      textKhmer: `🛡️ ខ្ញុំនៅទីនេះដើម្បីជួយសិក្សា និងធ្វើលំហាត់ដោយសុវត្ថិភាព។ តោះត្រឡប់ទៅមើលលំហាត់វិញណា! តើអ្នកមានសំណួរគណិតវិទ្យា ឬវិទ្យាសាស្ត្រចង់សួរទេ? 🐰`,
      textEng: `🛡️ I'm here to help with safe, educational topics only. Let's get back to your homework! Do you have a Math or Science question? 🐰`,
      isSafetyRefusal: true,
    };
  }

  try {
    const gradeLevel = problemContext?.grade
      ? `grade_${problemContext.grade <= 3 ? '1_3' : '4_6'}`
      : 'grade_1_3';

    // Clean leading question prefix if this is an initial problem query
    const cleanedQuery = cleanQueryForSolver(userPrompt);
    const queryToSend = cleanedQuery.length > 0 ? cleanedQuery : userPrompt;

    const response = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: queryToSend,
        session_id: sessionId || undefined,
        grade_level: gradeLevel,
        language: language === 'km' ? 'khmer' : 'en',
      }),
    });

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

      return {
        textKhmer: text,
        textEng: text,
        sessionId: data.session_id,
        stepWidget: data.step_widget,
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

export const askSayoTutor = askTunsayTutor;
