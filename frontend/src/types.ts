/**
 * Core type definitions for Tunsay AI Homework Tutor — MVP Scope
 * Must-haves: OCR, NLU, Socratic Guidance, Safety Guardrails
 */

export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

export type Subject = 'math' | 'science' | 'english';

export type Language = 'km' | 'en';

export type TunsayState =
  | 'idle'
  | 'thinking'
  | 'explaining'
  | 'encouraging'
  | 'celebrating';

export interface StepItem {
  id: string;
  stepNumber: number;
  totalSteps: number;
  questionKhmer: string;
  questionEng: string;
  inputFormat: 'mcq' | 'number' | 'text';
  options?: string[];
  correctAnswer: string;
  hint1: {
    khmer: string;
    eng: string;
  };
  hint2: {
    khmer: string;
    eng: string;
  };
  hint3: {
    titleKhmer: string;
    titleEng: string;
    exampleKhmer: string;
    exampleEng: string;
  };
  socraticPromptKhmer: string;
  socraticPromptEng: string;
  // 4-Part Socratic Card fields from roadmap specification
  title?: string | undefined;
  mission?: string | undefined;
  clue?: string | undefined;
  helpfulExample?: string | undefined;
  yourTurn?: string | undefined;
  studentAnswer?: string | null | undefined;
  status?: 'completed' | 'in_progress' | 'pending' | 'locked' | undefined;
  hints?: string[] | undefined;
  currentHintLevel?: number | undefined;
  explainDifferently: {
    simpleKhmer: string;
    simpleEng: string;
    analogyTitle: string;
    analogyKhmer: string;
    analogyEng: string;
    analogyType: 'apples' | 'pizza' | 'water' | 'plants';
  };
}

export interface HomeworkProblem {
  id: string;
  titleKhmer: string;
  titleEng: string;
  grade: Grade;
  subject: Subject;
  problemStatementKhmer: string;
  problemStatementEng: string;
  imageUri?: string;
  steps: StepItem[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'sayo' | 'system';
  textKhmer?: string;
  textEng: string;
  timestamp: string;
  imageUri?: string;
  problem?: HomeworkProblem;
  activeStepIndex?: number;
  isSafetyRefusal?: boolean;
  /** When present, renders a Socratic Step Card bubble instead of plain text */
  stepCard?: {
    step: StepItem;
    stepIndex: number;
    totalSteps: number;
  };
}

export interface UserProfile {
  name: string;
  grade: Grade;
  subject: Subject;
  language: Language;
}
