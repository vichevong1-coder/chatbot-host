import { Grade, HomeworkProblem, Subject } from '../types';

export interface OCRProcessResult {
  success: boolean;
  problems: HomeworkProblem[];
  rawResponse?: any;
  error?: string;
}

// Extract full multi-part question text from all fields (title, prompt, instructions, elements, sub_questions)
function extractFullQuestionStatement(q: any, section?: any): string {
  const parts: string[] = [];

  const title = (q?.title || section?.title || '').trim();
  const prompt = (q?.prompt || '').trim();
  const instructions = (q?.instructions || section?.instructions || '').trim();

  // Extract from elements
  const elementTexts: string[] = [];
  const rawElements = q?.elements || section?.elements;
  if (Array.isArray(rawElements)) {
    for (const el of rawElements) {
      if (typeof el === 'string' && el.trim()) {
        elementTexts.push(el.trim());
      } else if (el?.text && typeof el.text === 'string' && el.text.trim()) {
        elementTexts.push(el.text.trim());
      }
    }
  }

  // Extract from sub_questions
  const subTexts: string[] = [];
  if (Array.isArray(q?.sub_questions)) {
    for (const sq of q.sub_questions) {
      const sqText = (sq?.prompt || sq?.text || sq?.instructions || '').trim();
      const sqNo = sq?.question_no ? `${sq.question_no}) ` : '';
      if (sqText) {
        subTexts.push(`${sqNo}${sqText}`);
      }
    }
  }

  // Assemble with clear hierarchy
  if (title) {
    parts.push(title);
  }

  if (prompt && prompt !== title) {
    parts.push(prompt);
  }

  if (instructions && instructions !== title && instructions !== prompt) {
    parts.push(instructions);
  }

  for (const et of elementTexts) {
    if (!parts.some(p => p.includes(et))) {
      parts.push(et);
    }
  }

  for (const st of subTexts) {
    if (!parts.some(p => p.includes(st))) {
      parts.push(st);
    }
  }

  const combined = parts.join('\n\n').trim();
  return combined || prompt || title || instructions || 'Worksheet Exercise';
}

export async function processHomeworkImage(file: File): Promise<OCRProcessResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/process-homework', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OCR service responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const problems: HomeworkProblem[] = [];

    // Parse grade
    let grade: Grade = 3;
    const gradeStr = data.document?.grade_level || '';
    const gradeMatch = gradeStr.match(/\d+/);
    if (gradeMatch) {
      const g = parseInt(gradeMatch[0], 10);
      if (g >= 1 && g <= 6) grade = g as Grade;
    }

    // Parse subject
    let subject: Subject = 'math';
    const subStr = (data.document?.subject || '').toLowerCase();
    if (subStr.includes('science') || subStr.includes('physic') || subStr.includes('bio') || subStr.includes('chem')) {
      subject = 'science';
    } else if (subStr.includes('eng') || subStr.includes('language') || subStr.includes('vocab')) {
      subject = 'english';
    }

    const pages = data.pages || [];
    let problemCounter = 1;

    for (const page of pages) {
      // 1. Process Sections
      if (Array.isArray(page.sections) && page.sections.length > 0) {
        for (const sec of page.sections) {
          const secQuestions = Array.isArray(sec.questions) ? sec.questions : [];
          
          if (secQuestions.length > 0) {
            for (const q of secQuestions) {
              const fullStatement = extractFullQuestionStatement(q, sec);
              const qNo = q.question_no || sec.label || `Q${problemCounter}`;
              const cardTitle = q.title || sec.title || `Exercise ${qNo}`;

              problems.push({
                id: `ocr-p-${problemCounter}`,
                titleKhmer: `លំហាត់ ${qNo}: ${cardTitle}`,
                titleEng: `Problem ${qNo}: ${cardTitle}`,
                grade,
                subject,
                problemStatementKhmer: fullStatement,
                problemStatementEng: fullStatement,
                steps: [
                  {
                    id: `ocr-p-${problemCounter}-s1`,
                    stepNumber: 1,
                    totalSteps: 1,
                    questionKhmer: fullStatement,
                    questionEng: fullStatement,
                    inputFormat: 'text',
                    correctAnswer: '',
                    hint1: {
                      khmer: 'សូមអានសំណួរ និងការណែនាំដោយប្រុងប្រយ័ត្ន។',
                      eng: 'Read the instructions and numbers carefully.',
                    },
                    hint2: {
                      khmer: 'តើមានពាក្យគន្លឹះ ឬរូបមន្តអ្វីខ្លះនៅក្នុងសំណួរនេះ?',
                      eng: 'Look for keywords and calculations in the question.',
                    },
                    hint3: {
                      titleKhmer: 'ជំនួយពីទន្សាយ',
                      titleEng: 'Guidance from Tunsay',
                      exampleKhmer: 'សួរសំណួរទៅទន្សាយដើម្បីបំបែកលំហាត់ជាជំហានៗ!',
                      exampleEng: 'Ask Tunsay to break this problem down step-by-step!',
                    },
                    socraticPromptKhmer: `តោះយើងចាប់ផ្តើមដោះស្រាយ ${cardTitle} ទាំងអស់គ្នា!`,
                    socraticPromptEng: `Let's solve ${cardTitle} step by step!`,
                    explainDifferently: {
                      simpleKhmer: fullStatement,
                      simpleEng: fullStatement,
                      analogyTitle: 'ជំនួយការគិត',
                      analogyKhmer: 'តោះចាប់ផ្តើមដោះស្រាយជាមួយគ្នា។',
                      analogyEng: "Let's work through this step by step.",
                      analogyType: 'apples',
                    },
                  },
                ],
              });
              problemCounter++;
            }
          } else {
            // Section has no inner questions array — treat Section itself as a question card
            const secStatement = extractFullQuestionStatement(null, sec);
            const secNo = sec.label || `Q${problemCounter}`;
            const secTitle = sec.title || `Exercise ${secNo}`;

            problems.push({
              id: `ocr-p-${problemCounter}`,
              titleKhmer: `លំហាត់ ${secNo}: ${secTitle}`,
              titleEng: `Problem ${secNo}: ${secTitle}`,
              grade,
              subject,
              problemStatementKhmer: secStatement,
              problemStatementEng: secStatement,
              steps: [
                {
                  id: `ocr-p-${problemCounter}-s1`,
                  stepNumber: 1,
                  totalSteps: 1,
                  questionKhmer: secStatement,
                  questionEng: secStatement,
                  inputFormat: 'text',
                  correctAnswer: '',
                  hint1: {
                    khmer: 'សូមអានសំណួរ និងការណែនាំដោយប្រុងប្រយ័ត្ន។',
                    eng: 'Read the instructions and numbers carefully.',
                  },
                  hint2: {
                    khmer: 'តើមានពាក្យគន្លឹះ ឬរូបមន្តអ្វីខ្លះនៅក្នុងសំណួរនេះ?',
                    eng: 'Look for keywords and calculations in the question.',
                  },
                  hint3: {
                    titleKhmer: 'ជំនួយពីទន្សាយ',
                    titleEng: 'Guidance from Tunsay',
                    exampleKhmer: 'សួរសំណួរទៅទន្សាយដើម្បីបំបែកលំហាត់ជាជំហានៗ!',
                    exampleEng: 'Ask Tunsay to break this problem down step-by-step!',
                  },
                  socraticPromptKhmer: `តោះយើងចាប់ផ្តើមដោះស្រាយ ${secTitle}!`,
                  socraticPromptEng: `Let's solve ${secTitle}!`,
                  explainDifferently: {
                    simpleKhmer: secStatement,
                    simpleEng: secStatement,
                    analogyTitle: 'ជំនួយការគិត',
                    analogyKhmer: 'តោះចាប់ផ្តើមដោះស្រាយជាមួយគ្នា។',
                    analogyEng: "Let's work through this step by step.",
                    analogyType: 'apples',
                  },
                },
              ],
            });
            problemCounter++;
          }
        }
      }

      // 2. Process Top-Level page.questions (if any exist outside sections)
      if (Array.isArray(page.questions) && page.questions.length > 0) {
        for (const q of page.questions) {
          const fullStatement = extractFullQuestionStatement(q);
          const qNo = q.question_no || `Q${problemCounter}`;
          const title = q.title || `Exercise ${qNo}`;

          problems.push({
            id: `ocr-p-${problemCounter}`,
            titleKhmer: `លំហាត់ ${qNo}`,
            titleEng: `Problem ${qNo}`,
            grade,
            subject,
            problemStatementKhmer: fullStatement,
            problemStatementEng: fullStatement,
            steps: [
              {
                id: `ocr-p-${problemCounter}-s1`,
                stepNumber: 1,
                totalSteps: 1,
                questionKhmer: fullStatement,
                questionEng: fullStatement,
                inputFormat: 'text',
                correctAnswer: '',
                hint1: {
                  khmer: 'សូមអានសំណួរម្តងទៀតដោយប្រុងប្រយ័ត្ន។',
                  eng: 'Read the question carefully and think about the main concept.',
                },
                hint2: {
                  khmer: 'តើមានពាក្យគន្លឹះអ្វីខ្លះនៅក្នុងសំណួរនេះ?',
                  eng: 'Look for keywords in the question.',
                },
                hint3: {
                  titleKhmer: 'ជំនួយ',
                  titleEng: 'Guidance',
                  exampleKhmer: 'អ្នកអាចសួរទន្សាយដើម្បីទទួលបានការណែនាំបន្ថែម!',
                  exampleEng: 'You can ask Tunsay for step-by-step guidance!',
                },
                socraticPromptKhmer: `តើអ្នកយល់ថាសំណួរ \`${fullStatement}\` ចាប់ផ្តើមដោយអ្វីជាដំបូង?`,
                socraticPromptEng: `What do you think we need to find first for "${fullStatement}"?`,
                explainDifferently: {
                  simpleKhmer: fullStatement,
                  simpleEng: fullStatement,
                  analogyTitle: 'ជំនួយការគិត',
                  analogyKhmer: 'តោះចាប់ផ្តើមដោះស្រាយជាមួយគ្នា។',
                  analogyEng: "Let's work through this step by step.",
                  analogyType: 'apples',
                },
              },
            ],
          });
          problemCounter++;
        }
      }
    }

    if (problems.length === 0) {
      const docTitle = data.document?.title || 'Scanned Worksheet';
      problems.push({
        id: `ocr-p-1`,
        titleKhmer: 'លំហាត់ស្កែនបាន',
        titleEng: docTitle,
        grade,
        subject,
        problemStatementKhmer: docTitle,
        problemStatementEng: docTitle,
        steps: [
          {
            id: `ocr-p-1-s1`,
            stepNumber: 1,
            totalSteps: 1,
            questionKhmer: docTitle,
            questionEng: docTitle,
            inputFormat: 'text',
            correctAnswer: '',
            hint1: { khmer: 'សួរសំណួរទៅទន្សាយ', eng: 'Ask Tunsay a question about your homework' },
            hint2: { khmer: 'ទន្សាយនឹងជួយអ្នក', eng: 'Tunsay will help guide you' },
            hint3: { titleKhmer: 'ជំនួយ', titleEng: 'Help', exampleKhmer: '', exampleEng: '' },
            socraticPromptKhmer: 'តោះចាប់ផ្តើម',
            socraticPromptEng: "Let's start",
            explainDifferently: {
              simpleKhmer: '',
              simpleEng: '',
              analogyTitle: '',
              analogyKhmer: '',
              analogyEng: '',
              analogyType: 'apples',
            },
          },
        ],
      });
    }

    return {
      success: true,
      problems,
      rawResponse: data,
    };
  } catch (error: any) {
    console.error('OCR Processing failed:', error);
    return {
      success: false,
      problems: [],
      error: error?.message || 'Failed to connect to OCR service',
    };
  }
}
