import { HomeworkProblem, Language } from '../types';

interface BackendResponse {
  category: string;
  solution: string;
  steps?: any[];
  step_widget?: any;
  source?: string;
  current_step_index?: number;
  hint_count?: number;
  practice_mode?: boolean;
  completed?: boolean;
  session_id: string;
  grade_level: string;
  language: string;
}

// ──────────────────────────────────────────────
// 1. Socratic System Prompt
// ──────────────────────────────────────────────
const SocraticSystemPrompt = {
  km: `អ្នកគឺ ReanMore គ្រូបង្រៀន AI សម្រាប់កុមារថ្នាក់បឋមសិក្សា (ថ្នាក់ទី ១–៦)។ ច្បាប់គំរូសំខាន់ៗ៖
1. កុំប្រាប់ចម្លើយចុងក្រោយភ្លាមៗ — ជួយកុមារគិតដោយខ្លួនឯង
2. សួរសំណួរតូចៗជាជំហានៗ
3. ប្រើឧទាហរណ៍ដែលកុមារស្គាល់ (ផ្លែប៉ោម នំភីហ្សា ទឹក ឫស្សែង)
4. លើកទឹកចិត្តពេលកុមារឆ្លើយត្រូវ
5. ប្រសិនបើកុមារឆ្លើយខុស កុំប្រើពាក្យ «ខុស» — ពន្យល់ថាតើហេតុអ្វី ហើយណែនាំឱ្យព្យាយាមម្តងទៀត
6. ប្រើភាសាសាមញ្ញ ងាយយល់ មិនប្រើពាក្យពិបាក`,
  en: `You are ReanMore, an AI tutor for elementary students (Grades 1–6). Core rules:
1. NEVER give the final answer immediately — help the child think for themselves
2. Ask small guiding sub-questions step by step
3. Use relatable analogies (apples, pizza, water, plants)
4. Encourage the child when they answer correctly
5. If the child answers wrong, never say "wrong" — gently explain why and guide them to try again
6. Use simple, age-appropriate language`
};

// ──────────────────────────────────────────────
// 3. Expanded Safety Guardrails
// ──────────────────────────────────────────────
const UNSAFE_KEYWORDS = [
  // Violence / Danger
  'cheat', 'hack', 'fight', 'kill', 'die', 'gun', 'weapon', 'bomb', 'hurt',
  // Inappropriate for children
  'boyfriend', 'girlfriend', 'dating', 'kiss', 'sexy', 'naked',
  // Academic dishonesty
  'write essay for me', 'do my homework', 'give me answer', 'answer this',
  'solve this for me', 'just tell me', 'copy', 'plagiar',
  // Off-topic
  'who is your father', 'who made you', 'are you real', 'marry me',
];

function isUnsafePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return UNSAFE_KEYWORDS.some(kw => lower.includes(kw));
}

// ──────────────────────────────────────────────
// 5. Inline Math Formatting Helper
// ──────────────────────────────────────────────
function formatMathInline(text: string): string {
  // Replace common patterns with visually friendly versions
  return text
    // Fractions: 1/2, 3/4 etc.
    .replace(/(\d+)\/(\d+)(?!\d)/g, '$1⁄$2')
    // Multiplication: 2x3 or 2*3 → 2 × 3
    .replace(/(\d+)\s*\*\s*(\d+)/g, '$1 × $2')
    .replace(/(\d+)\s*x\s*(\d+)/gi, '$1 × $2')
    // Division: 10÷2 or 10/2 → 10 ÷ 2
    .replace(/(\d+)\s*\/÷\s*(\d+)/g, '$1 ÷ $2')
    // Square root: sqrt(9) → √9
    .replace(/sqrt\((\d+)\)/gi, '√$1')
    // Equals with spaces for readability
    .replace(/(\S+)=(\S+)/g, '$1 = $2');
}

// ──────────────────────────────────────────────
// 2. Parse Numbered Steps from Backend Response
// ──────────────────────────────────────────────
function parseSteps(text: string): string[] {
  // Try to find "Step 1:", "Step 2:" etc. patterns
  const stepRegex = /(?:Step|ជំហាន)\s*(\d+)[:.\s]/gi;
  const steps: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = stepRegex.exec(text)) !== null) {
    if (lastIndex > 0 && match.index > lastIndex) {
      steps.push(text.slice(lastIndex, match.index).trim());
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex > 0 && lastIndex < text.length) {
    steps.push(text.slice(lastIndex).trim());
  }

  // If no steps found, return the whole text as one item
  return steps.length > 0 ? steps : [text];
}

// ──────────────────────────────────────────────
// 4. Better Fallback Messages (Socratic Redirect)
// ──────────────────────────────────────────────
function getSocraticFallback(_language: Language, prompt: string): { textKhmer: string; textEng: string } {
  const promptLower = prompt.toLowerCase();

  // Math-related fallback
  const mathKeywords = ['plus', 'add', 'minus', 'subtract', 'times', 'multiply', 'divide', 'fraction', '+', '-', '×', '÷', '=', '?'];
  const isMath = mathKeywords.some(kw => promptLower.includes(kw));

  if (isMath) {
    return {
      textKhmer: `តោះយើងមើលសំណួរនេះជាមួយគ្នា! ជំហានទី ១៖ តើអ្នកឃើញលេខអ្វីខ្លះក្នុងសំណួរនេះ? ចុចលើរូបភាពឬវាយប្រាប់ខ្ញុំពីលេខទាំងនោះណា!`,
      textEng: `Let's look at this together! Step 1: What numbers do you see in the question? Tap or tell me what they are!`,
    };
  }

  // Science-related fallback
  const scienceKeywords = ['plant', 'water', 'animal', 'earth', 'sun', 'moon', 'weather', 'body', 'food'];
  const isScience = scienceKeywords.some(kw => promptLower.includes(kw));

  if (isScience) {
    return {
      textKhmer: `ចំណង់ចំណូលចិត្តណាស់! តោះយើងស្វែងយល់ពីវិទ្យាសាស្ត្រនេះជាមួយគ្នា។ ជំហានទី ១៖ តើអ្នកដឹងអ្វីខ្លះអំពីប្រធានបទនេះរួចហើយ?`,
      textEng: `Great curiosity! Let's explore this science topic together. Step 1: What do you already know about this?`,
    };
  }

  // Generic Socratic fallback
  return {
    textKhmer: `សួស្តី! ខ្ញុំគឺ ReanMore។ តើយើងរៀនមុខវិជ្ជាអ្វីថ្ងៃនេះ? អ្នកអាចសួរខ្ញុំអំពីគណិតវិទ្យា វិទ្យាសាស្ត្រ ឬភាសាអង់គ្លេស!`,
    textEng: `Hi! I'm ReanMore. What subject shall we learn today? You can ask me about Math, Science, or English!`,
  };
}

// ──────────────────────────────────────────────
// Main API Function
// ──────────────────────────────────────────────
export async function askReanMoreTutor(
  userPrompt: string,
  problemContext?: HomeworkProblem,
  language: Language = 'km',
  sessionId?: string
): Promise<{ textKhmer: string; textEng: string; isSafetyRefusal?: boolean; stepWidget?: any }> {

  // ── Safety Check FIRST ──
  if (isUnsafePrompt(userPrompt)) {
    return {
      textKhmer: `ខ្ញុំនៅទីនេះដើម្បីជួយសិក្សា និងធ្វើលំហាត់ដោយសុវត្ថិភាព។ តោះត្រឡប់ទៅមើលលំហាត់វិញណា! តើអ្នកមានសំណួរគណិតវិទ្យា ឬវិទ្យាសាស្ត្រចង់សួរទេ?`,
      textEng: `I'm here to help with safe, educational topics only. Let's get back to your homework! Do you have a Math or Science question?`,
      isSafetyRefusal: true,
    };
  }

  try {
    const response = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: userPrompt,
        session_id: sessionId,
        grade_level: problemContext?.grade ? `grade_${problemContext.grade}_${problemContext.grade + 2}` : 'grade_1_3',
        language: language === 'km' ? 'km' : 'en',
        // Send Socratic system prompt to backend
        system_prompt: language === 'km' ? SocraticSystemPrompt.km : SocraticSystemPrompt.en,
      }),
    });

    if (response.ok) {
      const data: BackendResponse = await response.json();
      let text = data.solution || '';

      // Apply math formatting
      text = formatMathInline(text);

      // Parse and re-format numbered steps if found
      const steps = parseSteps(text);
      if (steps.length > 1) {
        // Rejoin with clear visual separation
        text = steps.map((step, i) => `${i + 1}. ${step.trim()}`).join('\n\n');
      }

      if (language === 'km') {
        return {
          textKhmer: text,
          textEng: '',
          isSafetyRefusal: false,
          stepWidget: data.step_widget,
        };
      } else {
        return {
          textKhmer: '',
          textEng: text,
          isSafetyRefusal: false,
          stepWidget: data.step_widget,
        };
      }
    }
  } catch (err) {
    console.error('Backend API error:', err);
  }

  // ── Fallback: Socratic redirect ──
  const fallback = getSocraticFallback(language, userPrompt);
  return {
    ...fallback,
    isSafetyRefusal: false,
  };
}

export const askTunsayTutor = askReanMoreTutor;
export const askSayoTutor = askReanMoreTutor;
