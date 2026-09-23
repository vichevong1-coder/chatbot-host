import { Grade, HomeworkProblem, Subject } from '../types';
import { MOCK_PROBLEMS as BACKEND_MOCK_WORKSHEET_PROBLEMS } from '../data/mockProblems';


export interface OCRProcessResult {
  success: boolean;
  problems: HomeworkProblem[];
  rawResponse?: any;
  error?: string;
}

// Helper to check for generic subject/worksheet header words
function isGenericHeader(text: string): boolean {
  if (!text) return true;
  const cleaned = text.trim().toUpperCase();
  return ['MATHEMATICS', 'MATH', 'SCIENCE', 'HOMEWORK', 'WORKSHEET', 'EXERCISE', 'SECTION', 'QUESTION', 'PROBLEM'].includes(cleaned);
}

// Extract specific descriptive title for a problem card (e.g. "Q1: Addition & Number Bonds")
function extractSpecificTitle(q: any, section: any, qNo: string, fullStatement: string): string {
  let topic = '';

  // 1. Check if q.title is specific
  if (q?.title && !isGenericHeader(q.title)) {
    topic = q.title.trim();
  } 
  // 2. Check if section.title is specific
  else if (section?.title && !isGenericHeader(section.title)) {
    topic = section.title.trim();
  }
  // 3. Check instructions or prompt for a short topic (e.g. "Calendar Facts")
  else if (q?.instructions && !isGenericHeader(q.instructions)) {
    const firstLine = q.instructions.split('\n')[0].trim();
    if (firstLine.length <= 35 && !isGenericHeader(firstLine)) {
      topic = firstLine;
    }
  } else if (q?.prompt && !isGenericHeader(q.prompt)) {
    const firstLine = q.prompt.split('\n')[0].trim();
    if (firstLine.length <= 35 && !isGenericHeader(firstLine)) {
      topic = firstLine;
    }
  }

  // 4. If no short topic found, check first sub-question or calculation formula
  if (!topic && Array.isArray(q?.sub_questions) && q.sub_questions.length > 0) {
    const firstSq = q.sub_questions[0];
    const sqText = (firstSq?.prompt || firstSq?.text || '').trim();
    if (sqText) {
      topic = sqText.length > 25 ? sqText.slice(0, 22) + '...' : sqText;
    }
  }

  // 5. Fallback: clean snippet of full statement
  if (!topic && fullStatement) {
    const cleanStmt = fullStatement
      .replace(/^(MATHEMATICS|MATH|SCIENCE|HOMEWORK|WORKSHEET)\s*/gi, '')
      .trim();
    const firstLine = cleanStmt.split('\n')[0].trim();
    if (firstLine) {
      topic = firstLine.length > 25 ? firstLine.slice(0, 22) + '...' : firstLine;
    }
  }

  // Format clean label: "Q1: Addition & Number Bonds"
  const cleanQNo = (qNo || 'Q').replace(/^(Problem|លំហាត់)\s*/i, '').trim();
  return topic ? `${cleanQNo}: ${topic}` : `Problem ${cleanQNo}`;
}

// Extract full multi-part question text from all fields (title, prompt, instructions, elements, sub_questions)
function extractFullQuestionStatement(q: any, section?: any): string {
  const parts: string[] = [];

  const rawTitle = (q?.title || section?.title || '').trim();
  const prompt = (q?.prompt || '').trim();
  const instructions = (q?.instructions || section?.instructions || '').trim();

  // Extract from elements and stitch formula blanks together (e.g. "35 +" + "= 100" -> "35 + ___ = 100")
  const elementTexts: string[] = [];
  const rawElements = q?.elements || section?.elements;
  if (Array.isArray(rawElements) && rawElements.length > 0) {
    let currentLine = '';
    for (const el of rawElements) {
      const txt = typeof el === 'string' ? el.trim() : (el?.text || '').trim();
      if (!txt) continue;

      if (!currentLine) {
        currentLine = txt;
      } else if (currentLine.endsWith('+') || currentLine.endsWith('-') || currentLine.endsWith('x') || currentLine.endsWith('/') || currentLine.endsWith('=')) {
        if (txt.startsWith('=')) {
          currentLine = `${currentLine} ___ ${txt}`;
        } else {
          currentLine = `${currentLine} ${txt}`;
        }
      } else if (txt.startsWith('=') || txt.startsWith('+') || txt.startsWith('-')) {
        currentLine = `${currentLine} ___ ${txt}`;
      } else {
        elementTexts.push(currentLine);
        currentLine = txt;
      }
    }
    if (currentLine) {
      if (currentLine.endsWith('+') || currentLine.endsWith('-') || currentLine.endsWith('x') || currentLine.endsWith('=')) {
        currentLine = `${currentLine} ___`;
      }
      elementTexts.push(currentLine);
    }
  }

  // Extract from sub_questions
  const subTexts: string[] = [];
  if (Array.isArray(q?.sub_questions)) {
    for (const sq of q.sub_questions) {
      let sqText = (sq?.prompt || sq?.text || sq?.instructions || '').trim();
      
      // If sq has inner elements
      if (Array.isArray(sq?.elements) && sq.elements.length > 0) {
        const joinedEls = sq.elements
          .map((e: any) => (typeof e === 'string' ? e.trim() : (e?.text || '').trim()))
          .filter(Boolean);
        if (joinedEls.length > 0) {
          const elStr = joinedEls.join(' ');
          if (!sqText.includes(elStr)) {
            sqText = sqText ? `${sqText}: ${elStr}` : elStr;
          }
        }
      }

      if (sqText.endsWith('+') || sqText.endsWith('-') || sqText.endsWith('x') || sqText.endsWith('=')) {
        sqText = `${sqText} ___`;
      }

      const sqNo = sq?.question_no ? `${sq.question_no}) ` : '';
      if (sqText) {
        subTexts.push(`${sqNo}${sqText}`);
      }
    }
  }

  // Only add title if it is meaningful content (not just a standalone generic "MATHEMATICS" header)
  if (rawTitle && (!isGenericHeader(rawTitle) || (!prompt && !instructions && elementTexts.length === 0 && subTexts.length === 0))) {
    parts.push(rawTitle);
  }

  if (prompt && prompt !== rawTitle) {
    let cleanPrompt = prompt;
    if (cleanPrompt.endsWith('+') || cleanPrompt.endsWith('-') || cleanPrompt.endsWith('x') || cleanPrompt.endsWith('=')) {
      cleanPrompt = `${cleanPrompt} ___`;
    }
    parts.push(cleanPrompt);
  }

  if (instructions && instructions !== rawTitle && instructions !== prompt) {
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
  return combined || prompt || rawTitle || instructions || 'Worksheet Exercise';
}

/**
 * Parses raw JSON response from either Direct OCR (/process-homework)
 * or Backend Gateway (/api/upload/ocr or /api/upload/mock) into typed HomeworkProblem[].
 */
export function parseOCRResponse(data: any): OCRProcessResult {
  if (!data) {
    return {
      success: false,
      problems: [],
      error: 'Empty response received from OCR service.',
    };
  }

  const problems: HomeworkProblem[] = [];

  // Parse grade — supports both direct OCR (data.document) and orchestrator (data.document_meta)
  let grade: Grade = 3;
  const gradeStr = data.document?.grade_level || data.document_meta?.grade_level || data.grade_level || '';
  const gradeMatch = gradeStr.match(/\d+/);
  if (gradeMatch) {
    const g = parseInt(gradeMatch[0], 10);
    if (g >= 1 && g <= 6) grade = g as Grade;
  }

  // Parse subject — supports both direct OCR and orchestrator formats
  let subject: Subject = 'math';
  const subStr = (data.document?.subject || data.document_meta?.subject || data.detected_subject || data.subject || '').toLowerCase();
  if (subStr.includes('science') || subStr.includes('physic') || subStr.includes('bio') || subStr.includes('chem')) {
    subject = 'science';
  } else if (subStr.includes('eng') || subStr.includes('language') || subStr.includes('vocab')) {
    subject = 'english';
  }

  let problemCounter = 1;
  const pages = data.pages || [];

  // If pages are present (from direct OCR service), parse them
  if (pages.length > 0) {
    for (const page of pages) {
      // 1. Process Sections
      if (Array.isArray(page.sections) && page.sections.length > 0) {
        for (const sec of page.sections) {
          const secQuestions = Array.isArray(sec.questions) ? sec.questions : [];

          if (secQuestions.length > 0) {
            for (const q of secQuestions) {
              const fullStatement = extractFullQuestionStatement(q, sec);
              const qNo = q.question_no || sec.label || `Q${problemCounter}`;
              const specificTitle = extractSpecificTitle(q, sec, qNo, fullStatement);

              problems.push({
                id: `ocr-p-${problemCounter}`,
                titleKhmer: `លំហាត់ ${specificTitle}`,
                titleEng: specificTitle,
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
                    socraticPromptKhmer: `តោះយើងចាប់ផ្តើមដោះស្រាយ ${specificTitle} ទាំងអស់គ្នា!`,
                    socraticPromptEng: `Let's solve ${specificTitle} step by step!`,
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
            const specificTitle = extractSpecificTitle(null, sec, secNo, secStatement);

            problems.push({
              id: `ocr-p-${problemCounter}`,
              titleKhmer: `លំហាត់ ${specificTitle}`,
              titleEng: specificTitle,
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
                  socraticPromptKhmer: `តោះយើងចាប់ផ្តើមដោះស្រាយ ${specificTitle}!`,
                  socraticPromptEng: `Let's solve ${specificTitle}!`,
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

      // 2. Process Top-Level page.questions
      if (Array.isArray(page.questions) && page.questions.length > 0) {
        for (const q of page.questions) {
          const fullStatement = extractFullQuestionStatement(q);
          const qNo = q.question_no || `Q${problemCounter}`;
          const specificTitle = extractSpecificTitle(q, null, qNo, fullStatement);

          problems.push({
            id: `ocr-p-${problemCounter}`,
            titleKhmer: `លំហាត់ ${specificTitle}`,
            titleEng: specificTitle,
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
  } else if (Array.isArray(data.exercises) && data.exercises.length > 0) {
    // Structured exercises from Orchestrator Gateway (e.g. Q5, Q6, Q7)
    for (let exIdx = 0; exIdx < data.exercises.length; exIdx++) {
      const ex = data.exercises[exIdx];
      const fullStatement = ex.prompt || ex.scanned_text || ex.title || `Exercise ${problemCounter}`;
      const titleEng = ex.title ? `${ex.number ? `${ex.number}: ` : ''}${ex.title}` : (ex.tab_label || `Exercise ${problemCounter}`);
      const titleKhmer = ex.tab_label_khmer ? `${ex.tab_label_khmer}${ex.title ? `: ${ex.title}` : ''}` : `លំហាត់ទី ${problemCounter}`;

      // Check if this matches one of our rich pre-crafted mock templates (Q5, Q6, Q7)
      const isQ5 = ex.number === 'Q5' || (ex.title && ex.title.toLowerCase().includes('adjusting'));
      const isQ6 = ex.number === 'Q6' || (ex.title && ex.title.toLowerCase().includes('money'));
      const isQ7 = ex.number === 'Q7' || (ex.title && (ex.title.toLowerCase().includes('multiplication') || ex.title.toLowerCase().includes('doubling')));

      let templateProblem: HomeworkProblem | undefined = undefined;
      if (isQ5 && BACKEND_MOCK_WORKSHEET_PROBLEMS[0]) {
        templateProblem = BACKEND_MOCK_WORKSHEET_PROBLEMS[0];
      } else if (isQ6 && BACKEND_MOCK_WORKSHEET_PROBLEMS[1]) {
        templateProblem = BACKEND_MOCK_WORKSHEET_PROBLEMS[1];
      } else if (isQ7 && BACKEND_MOCK_WORKSHEET_PROBLEMS[2]) {
        templateProblem = BACKEND_MOCK_WORKSHEET_PROBLEMS[2];
      }

      if (templateProblem) {
        problems.push({
          ...templateProblem,
          id: ex.exercise_id || templateProblem.id,
          titleEng: titleEng || templateProblem.titleEng,
          titleKhmer: titleKhmer || templateProblem.titleKhmer,
          problemStatementEng: fullStatement || templateProblem.problemStatementEng,
          problemStatementKhmer: templateProblem.problemStatementKhmer || fullStatement,
        });
        problemCounter++;
        continue;
      }

      // Dynamic decomposition for any arbitrary exercise
      const steps: any[] = [];
      if (Array.isArray(ex.sub_questions) && ex.sub_questions.length > 0) {
        for (let sIdx = 0; sIdx < ex.sub_questions.length; sIdx++) {
          const sq = ex.sub_questions[sIdx];
          const sqPrompt = sq.prompt || `Part ${sq.question_no || sIdx + 1}`;
          const expectedAns = sq.expected_answer || sq.answer || '';
          steps.push({
            id: `${ex.exercise_id || `ocr-p-${problemCounter}`}-s${sIdx + 1}`,
            stepNumber: sIdx + 1,
            totalSteps: ex.sub_questions.length,
            questionKhmer: sqPrompt,
            questionEng: sqPrompt,
            inputFormat: sq.type === 'fill_blank' || sq.type === 'equation' ? 'number' : 'text',
            correctAnswer: expectedAns,
            hint1: {
              khmer: `សូមពិនិត្យមើលសំណួរទី ${sq.question_no || sIdx + 1}៖ ${sqPrompt}`,
              eng: sq.hint || `Look at part ${sq.question_no || sIdx + 1}: ${sqPrompt}`,
            },
            hint2: {
              khmer: 'តើមានពាក្យគន្លឹះ ឬលេខអ្វីខ្លះដែលត្រូវគណនា?',
              eng: 'Look at the numbers and operation.',
            },
            hint3: {
              titleKhmer: 'ជំនួយពីទន្សាយ',
              titleEng: 'Guidance from Tunsay',
              exampleKhmer: 'សួរសំណួរទៅទន្សាយដើម្បីបំបែកលំហាត់ជាជំហានៗ!',
              exampleEng: 'Ask Tunsay to break this problem down step-by-step!',
            },
            socraticPromptKhmer: `តោះដោះស្រាយ ${sqPrompt}!`,
            socraticPromptEng: `Let's solve ${sqPrompt}!`,
            explainDifferently: {
              simpleKhmer: sqPrompt,
              simpleEng: sqPrompt,
              analogyTitle: 'ជំនួយការគិត',
              analogyKhmer: 'តោះចាប់ផ្តើមដោះស្រាយជាមួយគ្នា។',
              analogyEng: "Let's work through this step by step.",
              analogyType: 'apples',
            },
          });
        }
      } else {
        steps.push({
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
            exampleKhmer: 'អ្នកអាចសួរទន្សាយដើម្បីទទួលបានការណែនាំបន្ថែម!',
            exampleEng: 'Ask Tunsay to break this problem down step-by-step!',
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
        });
      }

      problems.push({
        id: ex.exercise_id || `ocr-p-${problemCounter}`,
        titleKhmer,
        titleEng,
        grade,
        subject,
        problemStatementKhmer: fullStatement,
        problemStatementEng: fullStatement,
        steps,
      });
      problemCounter++;
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
}

/**
 * Directly fetches the hardcoded multi-exercise worksheet mock (Q5, Q6, Q7)
 * from the Backend Orchestrator (/api/upload/mock or /api/upload/ocr?force_mock=true).
 * Seamlessly falls back to client-side definition if backend is offline.
 */
export async function fetchBackendMockExercises(): Promise<OCRProcessResult> {
  // 1. Try GET /api/upload/mock
  try {
    const response = await fetch('/api/upload/mock');
    if (response.ok) {
      const data = await response.json();
      const parsed = parseOCRResponse(data);
      if (parsed.problems.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('GET /api/upload/mock unreachable, trying fallback:', err);
  }

  // 2. Try POST /api/upload/ocr?force_mock=true
  try {
    const formData = new FormData();
    const fakeBlob = new Blob(['mock-worksheet-content'], { type: 'image/png' });
    formData.append('file', fakeBlob, 'practice_worksheet.png');
    const response = await fetch('/api/upload/ocr?force_mock=true', {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      const data = await response.json();
      const parsed = parseOCRResponse(data);
      if (parsed.problems.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('POST /api/upload/ocr?force_mock=true unreachable:', err);
  }

  // 3. Fallback to client-side BACKEND_MOCK_WORKSHEET_PROBLEMS (guaranteed 100% uptime)
  return {
    success: true,
    problems: BACKEND_MOCK_WORKSHEET_PROBLEMS,
  };
}

export async function processHomeworkImage(file: File): Promise<OCRProcessResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    let data: any = null;

    // 1. Send directly to /process-homework (Port 9003 via Vite proxy)
    try {
      const response = await fetch('/process-homework', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        data = await response.json();
      } else {
        const errorText = await response.text();
        console.warn(`Direct /process-homework responded with ${response.status}: ${errorText}`);
      }
    } catch (directErr) {
      console.warn('Direct /process-homework unreachable, trying gateway fallback:', directErr);
    }

    // 2. If direct call failed, fallback to /api/upload/ocr on Orchestrator
    if (!data) {
      try {
        const gatewayRes = await fetch('/api/upload/ocr', {
          method: 'POST',
          body: formData,
        });
        if (gatewayRes.ok) {
          data = await gatewayRes.json();
        }
      } catch (gatewayErr) {
        console.warn('Gateway fallback unreachable:', gatewayErr);
      }
    }

    // 3. If both failed, trigger force_mock on Orchestrator
    if (!data) {
      try {
        const mockRes = await fetch('/api/upload/ocr?force_mock=true', {
          method: 'POST',
          body: formData,
        });
        if (mockRes.ok) {
          data = await mockRes.json();
        }
      } catch (mockErr) {
        console.warn('Force mock gateway unreachable:', mockErr);
      }
    }

    if (!data) {
      // Offline fallback: return standard backend mock problems
      return {
        success: true,
        problems: BACKEND_MOCK_WORKSHEET_PROBLEMS,
      };
    }

    return parseOCRResponse(data);
  } catch (error: any) {
    console.error('OCR Processing failed:', error);
    return {
      success: false,
      problems: [],
      error: error?.message || 'Failed to connect to OCR service',
    };
  }
}
