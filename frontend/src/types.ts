/**
 * Core type definitions for ReanMore AI Homework Tutor — MVP Scope
 * Must-haves: OCR, NLU, Socratic Guidance, Safety Guardrails
 */

export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

export type Subject = 'math' | 'science' | 'english';

export type Language = 'km' | 'en';

export type ReanMoreState =
  | 'idle'
  | 'waving'
  | 'thinking'
  | 'listening'
  | 'explaining'
  | 'encouraging'
  | 'happy'
  | 'celebrating'
  | 'jumping'
  | 'confused'
  | 'sleeping';

export type TunsayState = ReanMoreState;

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
}

export interface ChatSession {
  id: string;
  title: string;
  titleKhmer: string;
  messages: ChatMessage[];
  problem?: HomeworkProblem | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  grade: Grade;
  subject: Subject;
  language: Language;
  avatarUrl?: string | undefined;
}

/* ── Parent Weekly Report types ── */

export type ActivityStatus = 'in_progress' | 'completed' | 'abandoned';

export interface LearningActivity {
  id: string;
  sessionId: string;
  problemId: string;
  problemTitleKhmer: string;
  problemTitleEng: string;
  subject: Subject;
  grade: Grade;
  startedAt: string;       /* ISO timestamp */
  completedAt?: string | undefined;    /* ISO timestamp */
  stepsCompleted: number;
  totalSteps: number;
  wrongAttempts: number;
  hintsUsed: number;
  explainUsed: number;
  status: ActivityStatus;
}

export interface WeeklyReportData {
  weekStart: string;       /* Monday ISO date */
  weekEnd: string;         /* Sunday ISO date */
  totalProblems: number;
  completedProblems: number;
  completionRate: number;  /* 0-100 */
  totalWrongAttempts: number;
  totalHintsUsed: number;
  totalTimeMinutes: number;
  subjectBreakdown: Record<Subject, { solved: number; attempted: number; wrongRate: number }>;
  struggleAreas: Array<{ titleKhmer: string; titleEng: string; subject: Subject; wrongRate: number; hintsNeeded: number }>;
  strongestAreas: Array<{ titleKhmer: string; titleEng: string; subject: Subject; correctRate: number }>;
  dailyBreakdown: Array<{ day: string; label: string; solved: number; attempted: number }>;
}
