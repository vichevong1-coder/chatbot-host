import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, HomeworkProblem, UserProfile, TunsayState, ChatSession, WorksheetQueue } from '../types';
import { TunsayAvatar } from './TunsayAvatar';
import { StepTrail } from './StepTrail';
import { StepCard } from './StepCard';
import { HintSheet } from './HintSheet';
import { ExplanationCard } from './ExplanationCard';
import { StepChatBubble } from './StepChatBubble';
import { AllStepsDrawer } from './AllStepsDrawer';
import { WorksheetExerciseBar } from './WorksheetExerciseBar';
import { WorksheetProgressPanel } from './WorksheetProgressPanel';
import { ExerciseCelebrationBanner } from './ExerciseCelebrationBanner';
import { StepItem } from '../types';
import { askTunsayTutor } from '../services/geminiService';
// import { getDisplayName } from '../utils/language';
import { MOCK_PROBLEMS } from '../data/mockProblems';
import { Send, Camera, User, GraduationCap, ArrowLeft, Plus, BookOpen, Trash2, MessageSquare, Sparkles } from 'lucide-react';
import { cleanBilingualOption } from '../utils/language';
import {
  createActivity,
  updateActivity,
  findActiveActivity,
} from '../utils/reportUtils';

// Helper: Render numbered steps with visual badges
function formatMessageText(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split('\n\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    const stepMatch = trimmed.match(/^(\d+)\.\s*/);
    if (stepMatch) {
      const num = stepMatch[1];
      const content = trimmed.slice(stepMatch[0].length);
      return (
        <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
          <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-[#1B4332] text-white rounded-lg text-xs font-black shrink-0 mt-0.5 shadow-[1px_1px_0px_#1B4332]">
            {num}
          </span>
          <span className="leading-relaxed">{content}</span>
        </div>
      );
    }
    return <div key={i} className="mb-2 last:mb-0">{trimmed}</div>;
  });
}

interface ExtractedStepWidget {
  widget: any;
  activeStep: StepItem;
  activeIdx: number;
  totalSteps: number;
  completedSteps: number[];
  introText?: string;
}

/**
 * Extracts structured StepWidgetPayload from a ChatMessage.
 * Supports both direct `msg.stepWidget` payload and regex fallback parsing
 * for messages containing the 4-part Socratic card pattern.
 */
function extractStepWidgetFromMessage(msg: ChatMessage): ExtractedStepWidget | null {
  if (msg.stepWidget && msg.stepWidget.steps && msg.stepWidget.steps.length > 0) {
    const w = msg.stepWidget;
    const activeIdx = Math.max(0, Math.min(w.current_step_index ?? 0, w.steps.length - 1));
    const activeStep = w.steps[activeIdx];
    const totalSteps = w.total_steps || w.steps.length;
    const completedSteps = w.completed_steps || [];
    return {
      widget: w,
      activeStep,
      activeIdx,
      totalSteps,
      completedSteps,
    };
  }

  const rawText = msg.textEng || msg.textKhmer || '';
  const missionRegex = /(?:🌟\s*)?\*{0,2}(?:Our Mission|បេសកកម្មរបស់យើង)\*{0,2}:?\s*([\s\S]*?)(?=(?:💡\s*)?\*{0,2}(?:Clue|តម្រុយគន្លឹះ)\*{0,2}:|$)/i;
  const clueRegex = /(?:💡\s*)?\*{0,2}(?:Clue|តម្រុយគន្លឹះ)\*{0,2}:?\s*([\s\S]*?)(?=(?:🍎\s*)?\*{0,2}(?:Helpful (?:Picture \/ )?Example|រូបភាព \/ ឧទាហរណ៍ជំនួយ)\*{0,2}:|$)/i;
  const exampleRegex = /(?:🍎\s*)?\*{0,2}(?:Helpful (?:Picture \/ )?Example|រូបភាព \/ ឧទាហរណ៍ជំនួយ)\*{0,2}:?\s*([\s\S]*?)(?=(?:👉\s*)?\*{0,2}(?:Your Turn|វេនរបស់អ្នក)\*{0,2}:|$)/i;
  const yourTurnRegex = /(?:👉\s*)?\*{0,2}(?:Your Turn|វេនរបស់អ្នក)\*{0,2}:?\s*([\s\S]*?)$/i;

  const missionMatch = rawText.match(missionRegex);
  const yourTurnMatch = rawText.match(yourTurnRegex);

  if (missionMatch && yourTurnMatch) {
    const firstSectionIdx = rawText.search(/(?:🌟\s*)?\*{0,2}(?:Our Mission|បេសកកម្មរបស់យើង)\*{0,2}:/i);
    let intro = '';
    if (firstSectionIdx > 0) {
      intro = rawText.slice(0, firstSectionIdx).replace(/---\s*$/g, '').trim();
    }

    const clueMatch = rawText.match(clueRegex);
    const exampleMatch = rawText.match(exampleRegex);

    const clean = (s?: string) => {
      if (!s) return '';
      return s
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^>\s?/gm, '')
        .replace(/^#+\s?/gm, '')
        .replace(/`([^`]+)`/g, '$1')
        .trim();
    };

    const mission = clean(missionMatch[1]);
    const clue = clean(clueMatch?.[1]);
    const helpfulExample = clean(exampleMatch?.[1]);
    const yourTurn = clean(yourTurnMatch[1]);

    let stepNum = 1;
    const numMatch = (intro || rawText).match(/(?:Step|ជំហានទី)\s*(\d+)/i);
    if (numMatch) {
      stepNum = parseInt(numMatch[1], 10);
    }

    const synthesizedStep: StepItem = {
      id: `step-${stepNum}`,
      stepNumber: stepNum,
      title: `Step ${stepNum}`,
      status: 'in_progress',
      mission,
      clue,
      helpfulExample,
      yourTurn,
      currentHintLevel: 0,
      hints: [
        clue,
        helpfulExample,
        `Think about: ${yourTurn}`
      ],
      questionEng: mission,
      questionKhmer: mission,
      inputFormat: 'text',
      correctAnswer: '',
      hint1: { khmer: clue, eng: clue },
      hint2: { khmer: helpfulExample, eng: helpfulExample },
      hint3: { titleKhmer: 'Example', titleEng: 'Example', exampleKhmer: helpfulExample, exampleEng: helpfulExample },
      socraticPromptEng: yourTurn,
      socraticPromptKhmer: yourTurn,
      explainDifferently: { simpleKhmer: clue, simpleEng: clue, analogyTitle: '', analogyKhmer: '', analogyEng: '', analogyType: 'plants' },
      totalSteps: Math.max(stepNum, 3)
    };

    const synthesizedWidget = {
      total_steps: Math.max(stepNum, 3),
      current_step_index: stepNum - 1,
      completed_steps: [],
      steps: [synthesizedStep]
    };

    return {
      widget: synthesizedWidget,
      activeStep: synthesizedStep,
      activeIdx: 0,
      totalSteps: Math.max(stepNum, 3),
      completedSteps: [],
      introText: intro
    };
  }

  return null;
}

interface ChatViewProps {
  profile: UserProfile;
  initialProblem?: HomeworkProblem | undefined;
  initialQuery?: string | undefined;
  onClearInitialQuery?: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateMessages: (messages: ChatMessage[]) => void;
  onOpenScanner: () => void;
  onBackToHome?: () => void;
  /** Worksheet exercise queue state (set after scanning a multi-exercise worksheet) */
  worksheetQueue?: WorksheetQueue | undefined;
  onSelectExercise?: (index: number) => void;
  onExerciseComplete?: (problemId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  profile,
  initialProblem,
  initialQuery,
  onClearInitialQuery,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onUpdateMessages,
  onOpenScanner,
  onBackToHome,
  worksheetQueue,
  onSelectExercise,
  onExerciseComplete,
}) => {
  const isKhmer = profile.language === 'km';
  const [activeProblem, setActiveProblem] = useState<HomeworkProblem | undefined>(initialProblem);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Track exercise completion celebration
  const [celebratingProblemId, setCelebratingProblemId] = useState<string | null>(null);
  const celebrationShownRef = useRef<Set<string>>(new Set());

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];

  const [inputQuery, setInputQuery] = useState('');
  const [isSayoThinking, setIsSayoThinking] = useState(false);
  const [sayoStatus, setSayoStatus] = useState<TunsayState>('idle');
  const [thinkingTextIdx, setThinkingTextIdx] = useState(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mascotTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasWavedRef = useRef(false);
  const lastInteractionRef = useRef<number>(Date.now());
  const currentActivityRef = useRef<string | null>(null);

  // Reset wave flag when session changes
  useEffect(() => {
    hasWavedRef.current = false;
    setSayoStatus('idle');
    setCurrentStepIndex(0);
    setActiveProblem(initialProblem);
    if (mascotTimeoutRef.current) {
      clearTimeout(mascotTimeoutRef.current);
      mascotTimeoutRef.current = null;
    }
  }, [activeSessionId, initialProblem]);

  // Cycle through Socratic thinking messages while AI is processing
  useEffect(() => {
    if (sayoStatus === 'thinking') {
      const interval = setInterval(() => {
        setThinkingTextIdx((prev: number) => (prev + 1) % 4);
      }, 1800);
      return () => clearInterval(interval);
    } else {
      setThinkingTextIdx(0);
    }
  }, [sayoStatus]);

  // Sync backend decomposed steps into activeProblem so top StepCard renders the real 4-part Socratic card
  const syncStepsFromWidget = (widget: any, rawMsgText?: string) => {
    if (widget && Array.isArray(widget.steps) && widget.steps.length > 0) {
      const total = widget.total_steps || widget.steps.length;
      const mapped: StepItem[] = widget.steps.map((st: any, i: number) => ({
        id: `step-${st.step_number || i + 1}`,
        stepNumber: st.step_number || i + 1,
        totalSteps: total,
        title: st.title || `Step ${st.step_number || i + 1}`,
        mission: st.mission || st.questionKhmer || st.questionEng || '',
        clue: st.clue || st.hint1?.khmer || '',
        helpfulExample: st.helpful_example || st.helpfulExample || st.hint2?.khmer || '',
        yourTurn: st.your_turn || st.yourTurn || st.socraticPromptKhmer || st.socraticPromptEng || '',
        questionKhmer: st.mission || st.title || `Step ${i + 1}`,
        questionEng: st.mission || st.title || `Step ${i + 1}`,
        socraticPromptKhmer: st.your_turn || st.yourTurn || st.mission || '',
        socraticPromptEng: st.your_turn || st.yourTurn || st.mission || '',
        inputFormat: 'text',
        correctAnswer: st.expected_answer || st.expectedAnswer || st.correctAnswer || '',
        expectedAnswer: st.expected_answer || st.expectedAnswer || st.correctAnswer || '',
        hint1: { khmer: st.clue || '', eng: st.clue || '' },
        hint2: { khmer: st.helpful_example || st.helpfulExample || '', eng: st.helpful_example || st.helpfulExample || '' },
        hint3: { titleKhmer: 'ជំនួយ', titleEng: 'Help', exampleKhmer: '', exampleEng: '' },
        explainDifferently: { simpleKhmer: st.clue || '', simpleEng: st.clue || '', analogyTitle: '', analogyKhmer: '', analogyEng: '', analogyType: 'apples' },
      }));
      setActiveProblem((prev) => (prev ? { ...prev, steps: mapped } : prev));
      if (widget.current_step_index !== undefined) {
        setCurrentStepIndex(widget.current_step_index);
      }
    } else if (rawMsgText) {
      const parsed = extractStepWidgetFromMessage({ id: 'temp', sender: 'sayo', textEng: rawMsgText });
      if (parsed && parsed.widget) {
        syncStepsFromWidget(parsed.widget);
      }
    }
  };

  const updateMessages = (newMsgs: ChatMessage[]) => {
    onUpdateMessages(newMsgs);
  };

  // ── Mascot state helpers ──
  const transitionMascotState = useCallback((state: TunsayState, autoReturnToIdleMs?: number) => {
    if (mascotTimeoutRef.current) {
      clearTimeout(mascotTimeoutRef.current);
      mascotTimeoutRef.current = null;
    }
    setSayoStatus(state);
    if (autoReturnToIdleMs && autoReturnToIdleMs > 0) {
      mascotTimeoutRef.current = setTimeout(() => {
        setSayoStatus('idle');
      }, autoReturnToIdleMs);
    }
  }, []);

  const determineMascotStateFromResponse = (textEng: string): TunsayState => {
    const lower = textEng.toLowerCase();
    if (lower.includes('not quite') || lower.includes('not exactly') || lower.includes('try again') || lower.includes('not quite right') || lower.includes('oops') || lower.includes('that\'s not')) {
      return 'encouraging';
    }
    if (lower.includes('great') || lower.includes('excellent') || lower.includes('well done') || lower.includes('perfect') || lower.includes('amazing') || lower.includes('awesome') || lower.includes('brilliant')) {
      return 'celebrating';
    }
    if (lower.includes('think') || lower.includes('let me') || lower.includes('hmm') || lower.includes('let\'s see')) {
      return 'thinking';
    }
    if (lower.includes('?') && (lower.includes('what') || lower.includes('how') || lower.includes('why') || lower.includes('can you') || lower.includes('do you think'))) {
      return 'explaining';
    }
    return 'explaining';
  };

  const getMascotContextText = (state: TunsayState): string => {
    switch (state) {
      case 'idle': return isKhmer ? idleTextKhmer : idleTextEng;
      case 'waving': return isKhmer ? 'សួស្តី! តើអ្នករួចរៀបចំរៀនហើយឬនៅ?' : 'Hi! Ready to learn?';
      case 'thinking': return isKhmer ? thinkingTextsKhmer[thinkingTextIdx] : thinkingTextsEng[thinkingTextIdx];
      case 'listening': return isKhmer ? 'ខ្ញុំកំពុងស្ដាប់អ្នក...' : 'I\'m listening...';
      case 'explaining': return isKhmer ? 'អញ្ចឹងនេះជាវិធីពន្យល់...' : 'Here\'s how to think about it...';
      case 'encouraging': return isKhmer ? 'មិនអីទេ! សូមព្យាយាមម្ដងទៀត។' : 'That\'s okay! Let\'s look at it another way.';
      case 'happy': return isKhmer ? 'អ្នកធ្វើបានល្អ!' : 'You\'re doing great!';
      case 'celebrating': return isKhmer ? celebratoryTextKhmer : celebratoryTextEng;
      case 'jumping': return isKhmer ? 'អស្ចារ្យណាស់!' : 'Woohoo! Amazing!';
      case 'confused': return isKhmer ? 'ហ៊ឹម... តោះមើលឱ្យច្បាស់ជាមួយគ្នា' : 'Hmm... let\'s look closer together';
      case 'sleeping': return isKhmer ? 'ខ្ញុំកំពុងសម្រាកខណៈអ្នកគិត...' : 'Resting while you think...';
      default: return '';
    }
  };

  // Greeting wave on first load of a session
  useEffect(() => {
    if (!hasWavedRef.current && messages.length <= 1) {
      hasWavedRef.current = true;
      transitionMascotState('waving', 2500);
    }
  }, [messages.length, transitionMascotState]);

  // Inactivity → sleeping
  useEffect(() => {
    if (sayoStatus !== 'idle') return;
    const timer = setTimeout(() => {
      setSayoStatus('sleeping');
    }, 30000);
    return () => clearTimeout(timer);
  }, [sayoStatus]);

  // AI processing
  useEffect(() => {
    if (isSayoThinking) {
      setSayoStatus('thinking');
    }
  }, [isSayoThinking]);

  // 6. Socratic "Think Aloud" messages while processing
  const thinkingTextsKhmer = [
    'តើយើងដឹងអ្វីខ្លះជាដំបូងនៅក្នុងសំណួរនេះ?',
    'តើសំណួរនេះសុំឱ្យយើងរកអ្វី?',
    'តើយើងអាចបែងចែកវាជាជំហានតូចៗបានទេ?',
    'ជិតរួចរាល់ហើយ! ខ្ញុំកំពុងរៀបចំពន្យល់ឱ្យអ្នក'
  ];
  const thinkingTextsEng = [
    'What do we know first in this question?',
    'What is the question asking us to find?',
    'Can we break this into smaller steps?',
    'Almost ready! Preparing a helpful explanation'
  ];
  const celebratoryTextKhmer = 'រួចរាល់ហើយ!';
  const celebratoryTextEng = 'Aha! Got it!';
  const idleTextKhmer = 'ReanMore រង់ចាំសំណួរ!';
  const idleTextEng = 'Ready to help!';

  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  // ── Socratic Stepper Solution Journey Drawer state ──
  const [isAllStepsDrawerOpen, setIsAllStepsDrawerOpen] = useState(false);
  const [activeDrawerSteps, setActiveDrawerSteps] = useState<StepItem[]>([]);
  const [activeDrawerStepIdx, setActiveDrawerStepIdx] = useState(0);
  const [activeDrawerMsgId, setActiveDrawerMsgId] = useState<string | null>(null);

  const handleStepHint = (msgId: string) => {
    const idx = messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;
    const targetMsg = messages[idx];
    const parsed = extractStepWidgetFromMessage(targetMsg);
    if (!parsed) return;

    const widget = targetMsg.stepWidget || parsed.widget;
    const activeIdx = widget.current_step_index ?? 0;
    const step = widget.steps?.[activeIdx];
    if (!step) return;

    const curLevel = step.currentHintLevel ?? step.current_hint_level ?? 0;
    if (curLevel < 3) {
      const nextLevel = curLevel + 1;
      const newSteps = [...widget.steps];
      newSteps[activeIdx] = {
        ...step,
        currentHintLevel: nextLevel,
        current_hint_level: nextLevel,
      };
      const newWidget = {
        ...widget,
        steps: newSteps,
      };
      const newMsg: ChatMessage = {
        ...targetMsg,
        stepWidget: newWidget,
      };
      const updated = [...messages];
      updated[idx] = newMsg;

      if (currentActivityRef.current) {
        const act = findActiveActivity(activeSessionId);
        if (act) {
          updateActivity(currentActivityRef.current, {
            hintsUsed: act.hintsUsed + 1,
          });
        }
      }

      updateMessages(updated);
    }
  };

  const handleStepNavigate = async (msgId: string, targetIdx: number) => {
    const idx = messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;
    const targetMsg = messages[idx];
    const parsed = extractStepWidgetFromMessage(targetMsg);
    if (!parsed) return;

    const widget = targetMsg.stepWidget || parsed.widget;
    if (!widget.steps || targetIdx < 0 || targetIdx >= widget.steps.length) return;

    const newWidget = {
      ...widget,
      current_step_index: targetIdx,
    };
    const newMsg: ChatMessage = {
      ...targetMsg,
      stepWidget: newWidget,
    };
    const updated = [...messages];
    updated[idx] = newMsg;
    updateMessages(updated);

    try {
      await fetch('/api/step/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          target_step_index: targetIdx,
        }),
      });
    } catch (err) {
      console.error('Failed to sync step navigation with backend:', err);
    }
  };

  const handleOpenAllSteps = (msgId: string, widget: any) => {
    if (!widget || !widget.steps) return;
    setActiveDrawerSteps(widget.steps);
    setActiveDrawerStepIdx(widget.current_step_index ?? 0);
    setActiveDrawerMsgId(msgId);
    setIsAllStepsDrawerOpen(true);
  };

  const handleInlineStepAnswer = async (
    msgId: string,
    stepIndex: number,
    studentAnswer: string,
    isCorrect: boolean
  ) => {
    const idx = messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;
    const targetMsg = messages[idx];
    const parsed = extractStepWidgetFromMessage(targetMsg);
    if (!parsed) return;

    const widget = targetMsg.stepWidget || parsed.widget;
    if (!widget.steps || stepIndex < 0 || stepIndex >= widget.steps.length) return;

    const currentStepObj = widget.steps[stepIndex];
    const updatedStep = {
      ...currentStepObj,
      status: isCorrect ? 'completed' : 'in_progress',
      student_answer: studentAnswer,
      studentAnswer: studentAnswer,
    };

    const newSteps = [...widget.steps];
    newSteps[stepIndex] = updatedStep;

    const existingCompleted: number[] = widget.completed_steps || [];
    const newCompleted =
      isCorrect && !existingCompleted.includes(stepIndex)
        ? [...existingCompleted, stepIndex]
        : existingCompleted;

    const newWidget = {
      ...widget,
      steps: newSteps,
      completed_steps: newCompleted,
    };

    const newMsg: ChatMessage = {
      ...targetMsg,
      stepWidget: newWidget,
    };

    const updated = [...messages];
    updated[idx] = newMsg;
    updateMessages(updated);

    if (isCorrect) {
      transitionMascotState('jumping', 2000);
      /* Track activity */
      if (currentActivityRef.current) {
        const act = findActiveActivity(activeSessionId);
        if (act) {
          const nextSteps = (act.stepsCompleted || 0) + 1;
          const isDone = nextSteps >= (widget.total_steps || widget.steps.length);
          updateActivity(currentActivityRef.current, {
            stepsCompleted: nextSteps,
            status: isDone ? 'completed' : 'in_progress',
          });
          if (isDone) currentActivityRef.current = null;
        }
      }
    } else {
      transitionMascotState('encouraging', 2000);
    }

    // Inform backend of step answer to keep session synchronized
    try {
      await fetch('/api/step/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          step_number: stepIndex + 1,
          student_answer: studentAnswer,
          is_correct: isCorrect,
        }),
      });
    } catch (err) {
      // Graceful offline fallback
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!initialProblem) return;
    setActiveProblem(initialProblem);
    setCurrentStepIndex(0);
    const initialMsg: ChatMessage = {
      id: `init-${initialProblem.id}`,
      sender: 'sayo',
      textKhmer: `សួស្តី ${profile.name || 'សុជា'}! តោះដោះស្រាយលំហាត់ "${initialProblem.titleKhmer}" ទាំងអស់គ្នា! ReanMore នឹងជួយណែនាំអ្នកជាជំហានៗ។`,
      textEng: `Hi ${profile.name || 'Sochea'}! Let's solve "${initialProblem.titleEng}" together! ReanMore will guide you step-by-step.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      problem: initialProblem,
    };
    updateMessages([initialMsg]);

    // Automatically trigger backend Socratic decomposition for the problem
    const probStatement = initialProblem.problemStatementKhmer || initialProblem.problemStatementEng;
    if (probStatement) {
      setIsSayoThinking(true);
      askTunsayTutor(probStatement, initialProblem, profile.language, activeSessionId)
        .then((sayoRes) => {
          if (!isMountedRef.current) return;
          setIsSayoThinking(false);
          if (sayoRes.stepWidget) {
            syncStepsFromWidget(sayoRes.stepWidget, sayoRes.textEng || sayoRes.textKhmer);
          } else if (sayoRes.textEng || sayoRes.textKhmer) {
            syncStepsFromWidget(null, sayoRes.textEng || sayoRes.textKhmer);
          }

          if (sayoRes.textKhmer || sayoRes.textEng || sayoRes.stepWidget) {
            const guidedMsg: ChatMessage = {
              id: `guide-${initialProblem.id}-${Date.now()}`,
              sender: 'sayo',
              textKhmer: sayoRes.textKhmer,
              textEng: sayoRes.textEng,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              stepWidget: sayoRes.stepWidget,
            };
            updateMessages([initialMsg, guidedMsg]);
          }
        })
        .catch(() => {
          if (isMountedRef.current) setIsSayoThinking(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProblem]);

  useEffect(() => {
    if (!initialQuery?.trim()) return;
    const queryText = initialQuery.trim();
    onClearInitialQuery?.();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      textEng: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedWithUser = [...messages, userMsg];
    updateMessages(updatedWithUser);
    setIsSayoThinking(true);
    lastInteractionRef.current = Date.now();

    askTunsayTutor(queryText, activeProblem, profile.language, activeSessionId).then((sayoRes) => {
      if (!isMountedRef.current) return;
      setIsSayoThinking(false);
      if (sayoRes.stepWidget) {
        syncStepsFromWidget(sayoRes.stepWidget, sayoRes.textEng || sayoRes.textKhmer);
      } else if (sayoRes.textEng || sayoRes.textKhmer) {
        syncStepsFromWidget(null, sayoRes.textEng || sayoRes.textKhmer);
      }

      const sayoMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'sayo',
        textKhmer: sayoRes.textKhmer,
        textEng: sayoRes.textEng,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSafetyRefusal: sayoRes.isSafetyRefusal ?? false,
        stepWidget: sayoRes.stepWidget,
      };
      updateMessages([...updatedWithUser, sayoMsg]);

      if (sayoMsg.isSafetyRefusal) {
        transitionMascotState('encouraging', 3000);
      } else {
        const nextState = determineMascotStateFromResponse(sayoMsg.textEng || '');
        if (nextState === 'celebrating' || nextState === 'jumping' || nextState === 'encouraging' || nextState === 'happy') {
          transitionMascotState(nextState, 3000);
        } else {
          setSayoStatus(nextState);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSayoThinking, currentStepIndex]);

  const currentStep = activeProblem?.steps?.[currentStepIndex];

  const handleNewChat = () => {
    setActiveProblem(undefined);
    setCurrentStepIndex(0);
    onNewSession();
  };

  const handleSelectTopicCard = (prob: HomeworkProblem) => {
    setActiveProblem(prob);
    setCurrentStepIndex(0);
    const initialMsg: ChatMessage = {
      id: `init-${prob.id}`,
      sender: 'sayo',
      textKhmer: `សួស្តី ${profile.name || 'សុជា'}! តោះដោះស្រាយលំហាត់ "${prob.titleKhmer}" ទាំងអស់គ្នា! ReanMore នឹងជួយណែនាំអ្នកជាជំហានៗ។`,
      textEng: `Hi ${profile.name || 'Sochea'}! Let's solve "${prob.titleEng}" together! ReanMore will guide you step-by-step.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      problem: prob,
    };
    updateMessages([initialMsg]);
    transitionMascotState('explaining');

    /* Track: start new activity */
    const act = createActivity(
      activeSessionId,
      prob.id,
      prob.titleKhmer,
      prob.titleEng,
      prob.subject,
      prob.grade,
      prob.steps.length
    );
    currentActivityRef.current = act.id;

    // Trigger decomposition for topic card
    const probStatement = prob.problemStatementKhmer || prob.problemStatementEng || prob.titleKhmer || prob.titleEng;
    if (probStatement) {
      setIsSayoThinking(true);
      askTunsayTutor(probStatement, prob, profile.language, activeSessionId)
        .then((sayoRes) => {
          if (!isMountedRef.current) return;
          setIsSayoThinking(false);
          if (sayoRes.stepWidget) {
            syncStepsFromWidget(sayoRes.stepWidget, sayoRes.textEng || sayoRes.textKhmer);
          } else if (sayoRes.textEng || sayoRes.textKhmer) {
            syncStepsFromWidget(null, sayoRes.textEng || sayoRes.textKhmer);
          }

          if (sayoRes.textKhmer || sayoRes.textEng || sayoRes.stepWidget) {
            const guidedMsg: ChatMessage = {
              id: `guide-${prob.id}-${Date.now()}`,
              sender: 'sayo',
              textKhmer: sayoRes.textKhmer,
              textEng: sayoRes.textEng,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              stepWidget: sayoRes.stepWidget,
            };
            updateMessages([initialMsg, guidedMsg]);
          }
        })
        .catch(() => {
          if (isMountedRef.current) setIsSayoThinking(false);
        });
    }
  };

  const handleStepAnswer = (studentAnswer: string): boolean => {
    if (!currentStep) return false;

    const cleanedStudent = cleanBilingualOption(studentAnswer, profile.language).toLowerCase().trim();
    const cleanedCorrect = cleanBilingualOption(currentStep.correctAnswer, profile.language).toLowerCase().trim();
    const isCorrect = cleanedStudent === cleanedCorrect || cleanedCorrect.includes(cleanedStudent);

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      textEng: studentAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, newMsg];
    updateMessages(updated);
    lastInteractionRef.current = Date.now();

    if (isCorrect) {
      const nextStepIdx = currentStepIndex + 1;
      if (activeProblem && nextStepIdx < activeProblem.steps.length) {
        setTimeout(() => {
          setCurrentStepIndex((prev: number) => prev + 1);
        }, 800);
      } else if (activeProblem && nextStepIdx >= activeProblem.steps.length) {
        // All steps done — trigger exercise celebration if in queue
        if (worksheetQueue && !celebrationShownRef.current.has(activeProblem.id)) {
          celebrationShownRef.current.add(activeProblem.id);
          setCelebratingProblemId(activeProblem.id);
          transitionMascotState('celebrating', 4000);
          onExerciseComplete?.(activeProblem.id);
        }
      }
      transitionMascotState('jumping', 2000);

      /* Track: correct step */
      if (currentActivityRef.current) {
        const act = findActiveActivity(activeSessionId);
        if (act) {
          const nextSteps = act.stepsCompleted + 1;
          const isDone = activeProblem ? nextSteps >= activeProblem.steps.length : false;
          updateActivity(currentActivityRef.current, {
            stepsCompleted: nextSteps,
            status: isDone ? 'completed' : 'in_progress',
          });
          if (isDone) currentActivityRef.current = null;
        }
      }
    } else {
      transitionMascotState('encouraging', 2500);

      /* Track: wrong attempt */
      if (currentActivityRef.current) {
        const act = findActiveActivity(activeSessionId);
        if (act) {
          updateActivity(currentActivityRef.current, {
            wrongAttempts: act.wrongAttempts + 1,
          });
        }
      }
    }

    return isCorrect;
  };

  const handleSendMessage = async () => {
    if (!inputQuery.trim()) return;

    const userText = inputQuery.trim();
    setInputQuery('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      textEng: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedWithUser = [...messages, userMsg];
    updateMessages(updatedWithUser);
    setIsSayoThinking(true);
    lastInteractionRef.current = Date.now();

    const sayoRes = await askTunsayTutor(userText, activeProblem, profile.language, activeSessionId);
    if (!isMountedRef.current) return;

    setIsSayoThinking(false);
    if (sayoRes.stepWidget) {
      syncStepsFromWidget(sayoRes.stepWidget, sayoRes.textEng || sayoRes.textKhmer);
    } else if (sayoRes.textEng || sayoRes.textKhmer) {
      syncStepsFromWidget(null, sayoRes.textEng || sayoRes.textKhmer);
    }

    const sayoMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'sayo',
      textKhmer: sayoRes.textKhmer,
      textEng: sayoRes.textEng,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSafetyRefusal: sayoRes.isSafetyRefusal ?? false,
      stepWidget: sayoRes.stepWidget,
    };

    updateMessages([...updatedWithUser, sayoMsg]);

    if (sayoMsg.isSafetyRefusal) {
      transitionMascotState('encouraging', 3000);
    } else {
      const nextState = determineMascotStateFromResponse(sayoMsg.textEng || '');
      if (nextState === 'celebrating' || nextState === 'jumping' || nextState === 'encouraging' || nextState === 'happy') {
        transitionMascotState(nextState, 3000);
      } else {
        setSayoStatus(nextState);
      }
    }
  };

  // ── Session list helpers ──
  const getSessionPreview = (session: ChatSession): string => {
    const lastMsg = session.messages[session.messages.length - 1];
    if (!lastMsg) return '';
    const text = lastMsg.sender === 'user'
      ? (isKhmer ? lastMsg.textKhmer : lastMsg.textEng)
      : (isKhmer ? lastMsg.textKhmer : lastMsg.textEng);
    return (text || '').slice(0, 40) + ((text || '').length > 40 ? '...' : '');
  };

  const formatSessionTime = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div className="w-full h-full flex-1 flex flex-row items-stretch gap-4 sm:gap-5 overflow-hidden">
      {/* Left Panel: Mascot + Session History */}
      <div className="hidden lg:flex lg:w-[30%] lg:min-w-[240px] lg:max-w-[360px] shrink-0 h-full bg-[#F1EFFF] rounded-3xl border-3 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] flex-col select-none z-10 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-[#40916C]/25 rounded-full blur-sm pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-[#2D6A4F]/25 rounded-full blur-sm pointer-events-none" />

        {/* Mascot area */}
        <div className="flex flex-col items-center gap-3 pt-4 pb-3 px-4 relative z-10 shrink-0 border-b-2 border-[#1B4332]/10">
          <div className="w-full max-w-[220px]">
            {(() => {
              const badges: Record<TunsayState, { text: string; style: string; icon: 'ping' | 'sparkle' | 'dot' | 'none' }> = {
                thinking:    { text: isKhmer ? 'កំពុងគិត...' : 'Thinking...', style: 'bg-[#2D6A4F] text-white animate-pulse', icon: 'ping' },
                celebrating: { text: isKhmer ? 'រួចរាល់ហើយ!' : 'Done!', style: 'bg-[#2D6A4F] text-[#1B4332] animate-bounce', icon: 'sparkle' },
                jumping:     { text: isKhmer ? 'អស្ចារ្យមែន!' : 'Amazing!', style: 'bg-[#2D6A4F] text-[#1B4332] animate-bounce', icon: 'sparkle' },
                encouraging: { text: isKhmer ? 'កុំបារម្ភ!' : 'No worries!', style: 'bg-[#A7CDB4] text-[#1B4332]', icon: 'dot' },
                listening:   { text: isKhmer ? 'កំពុងស្ដាប់...' : 'Listening...', style: 'bg-[#A7CDB4] text-[#1B4332] animate-pulse', icon: 'dot' },
                explaining:  { text: isKhmer ? 'កំពុងពន្យល់...' : 'Explaining...', style: 'bg-[#A7CDB4] text-[#1B4332]', icon: 'dot' },
                waving:      { text: isKhmer ? 'សួស្តី!' : 'Hello!', style: 'bg-[#A7CDB4] text-[#1B4332] animate-bounce', icon: 'dot' },
                happy:       { text: isKhmer ? 'ពីរនេះ!' : 'Yay!', style: 'bg-[#2D6A4F] text-[#1B4332] animate-bounce', icon: 'sparkle' },
                confused:    { text: isKhmer ? 'ហ៊ឹម...' : 'Hmm...', style: 'bg-[#A7CDB4] text-[#1B4332]', icon: 'dot' },
                sleeping:    { text: isKhmer ? 'កំពុងសម្រាក...' : 'Resting...', style: 'bg-gray-200 text-gray-500', icon: 'none' },
                idle:        { text: isKhmer ? 'ReanMore AI Tutor' : 'ReanMore AI Tutor', style: 'bg-[#A7CDB4] text-[#1B4332]', icon: 'dot' },
              };
              const b = badges[sayoStatus];
              return (
                <span className={`px-3 py-1.5 text-xs font-black rounded-full border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] inline-flex items-center justify-center gap-1.5 uppercase tracking-wider w-full ${b.style}`}>
                  {b.icon === 'ping' && <span className="w-2 h-2 bg-white rounded-full animate-ping shrink-0" />}
                  {b.icon === 'sparkle' && <Sparkles className="w-3 h-3 text-[#1B4332]" />}
                  {b.icon === 'dot' && <span className="w-2 h-2 bg-[#2D6A4F] rounded-full border border-[#1B4332] shrink-0" />}
                  <span className="truncate">{b.text}</span>
                </span>
              );
            })()}
          </div>

          <div className="flex flex-col items-center justify-center transition-all duration-300 transform w-full">
            <div className={`transition-all duration-300 ${
              sayoStatus === 'thinking' ? 'scale-105' : sayoStatus === 'celebrating' || sayoStatus === 'jumping' || sayoStatus === 'happy' ? 'scale-110 animate-bounce' : 'scale-100 hover:scale-105'
            }`}>
              <TunsayAvatar size="xl" state={sayoStatus} showBadge={false} />
            </div>

            <div className="mt-3 px-2 w-full max-w-[240px] bg-white rounded-2xl p-2.5 border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] relative">
              <div className="w-3 h-3 bg-white border-t-3 border-l-3 border-[#1B4332] rotate-45 absolute -top-2 left-1/2 -translate-x-1/2" />
              <p className="font-heading font-black text-xs text-[#1B4332] leading-snug transition-all duration-300">
                {getMascotContextText(sayoStatus)}
              </p>
            </div>
          </div>
        </div>

        {/* Session History List — replaced by WorksheetProgressPanel when worksheet active */}
        {worksheetQueue && worksheetQueue.problems.length > 1 ? (
          <WorksheetProgressPanel
            problems={worksheetQueue.problems}
            activeIndex={worksheetQueue.activeIndex}
            completedIds={worksheetQueue.completedIds}
            language={profile.language}
            {...(worksheetQueue.worksheetTitle ? { worksheetTitle: worksheetQueue.worksheetTitle } : {})}
            onSelectExercise={(idx) => onSelectExercise?.(idx)}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-[#1B4332]/60 uppercase tracking-wider">
              {isKhmer ? 'ការជជែកថ្មីៗ' : 'Recent Chats'}
            </p>
            <button
              onClick={handleNewChat}
              className="text-[10px] font-black text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-1 cursor-pointer transition-colors"
              title={isKhmer ? 'ចាប់ផ្តើមជជែកថ្មី' : 'New Chat'}
            >
              <Plus className="w-3 h-3" />
              {isKhmer ? 'ថ្មី' : 'New'}
            </button>
          </div>

          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left rounded-xl border-2 p-2.5 transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-white border-[#1B4332] shadow-[2px_2px_0px_#1B4332]'
                    : 'bg-[#40916C]/10 border-transparent hover:bg-white hover:border-[#1B4332]/30'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-[#1B4332]' : 'text-[#1B4332]/40'}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-black truncate ${isActive ? 'text-[#1B4332]' : 'text-[#1B4332]/70'}`}>
                      {isKhmer ? session.titleKhmer : session.title}
                    </p>
                    <p className="text-[10px] text-[#1B4332]/50 truncate mt-0.5 leading-tight">
                      {getSessionPreview(session)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] text-[#1B4332]/40 font-semibold">
                      {formatSessionTime(session.updatedAt)}
                    </span>
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#1B4332]/30 hover:text-red-500 cursor-pointer"
                        title={isKhmer ? 'លុប' : 'Delete'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        )}

        <div className="w-full pt-2.5 pb-3 px-4 border-t-2 border-[#1B4332]/15 relative z-10 shrink-0">
          <p className="text-xs font-black text-[#1B4332] uppercase tracking-wider truncate text-center">
            ReanMore WEG
          </p>
        </div>
      </div>

      {/* Main Chat Frame */}
      <div className="flex-1 min-w-0 h-full flex flex-col bg-[#E8F5E9] rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] sm:shadow-[6px_6px_0px_#1B4332] overflow-hidden relative">
        {/* Top Navigation Bar */}
        <div className="shrink-0 z-20 px-3 py-2.5 sm:px-6 bg-[#1B4332] border-b-2 sm:border-b-3 border-[#1B4332] flex items-center justify-between gap-2 sm:gap-3 shadow-[0_3px_0px_#1B4332]">
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="relative">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#40916C] rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332]">
                <TunsayAvatar size="sm" state={isSayoThinking ? 'thinking' : 'idle'} showBadge={false} />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#2D6A4F] border-2 border-[#1B4332] rounded-full" title="Online" />
            </div>

            <div>
              <h3 className="font-black text-xs sm:text-base text-white flex items-center gap-1 font-heading leading-tight drop-shadow-[1px_1px_0px_#1B4332]">
                {isKhmer ? 'ReanMore' : 'ReanMore AI'}
              </h3>
              <p className="text-[10px] sm:text-xs text-[#40916C] font-black flex items-center gap-1 drop-shadow-[1px_1px_0px_#1B4332]">
                <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#40916C]" />
                {isKhmer ? `ថ្នាក់ទី ${profile.grade}` : `Grade ${profile.grade}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-[#40916C] text-[#1B4332] hover:bg-white rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] sm:shadow-[2px_2px_0px_#1B4332] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
              title={isKhmer ? 'ចាប់ផ្តើមជជែកថ្មី' : 'New Chat'}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            </button>

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-2.5 sm:px-3.5 py-1.5 bg-[#40916C] text-[#1B4332] hover:bg-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-1 cursor-pointer border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] sm:shadow-[2px_2px_0px_#1B4332] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                <span className="hidden min-[380px]:inline">{isKhmer ? 'ទំព័រដើម' : 'Home'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Worksheet Exercise Bar — shown above scrollable area when multi-exercise queue active */}
        {worksheetQueue && worksheetQueue.problems.length > 1 && (
          <WorksheetExerciseBar
            problems={worksheetQueue.problems}
            activeIndex={worksheetQueue.activeIndex}
            completedIds={worksheetQueue.completedIds}
            language={profile.language}
            onSelectExercise={(idx) => onSelectExercise?.(idx)}
          />
        )}

        {/* Scrollable Conversation Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5">
          {/* Celebration banner — shown inline after exercise completion */}
          {activeProblem && celebratingProblemId === activeProblem.id && worksheetQueue && (() => {
            const exIdx = worksheetQueue.problems.findIndex(p => p.id === celebratingProblemId);
            const hasNext = worksheetQueue.problems.some(
              (p, i) => i > exIdx && !worksheetQueue.completedIds.includes(p.id)
            );
            return (
              <ExerciseCelebrationBanner
                exerciseNumber={exIdx + 1}
                totalExercises={worksheetQueue.problems.length}
                exerciseTitleKhmer={activeProblem.titleKhmer}
                exerciseTitleEng={activeProblem.titleEng}
                language={profile.language}
                hasNext={hasNext}
                onNext={() => {
                  setCelebratingProblemId(null);
                  const nextIdx = worksheetQueue.problems.findIndex(
                    (p, i) => i > exIdx && !worksheetQueue.completedIds.includes(p.id)
                  );
                  if (nextIdx !== -1) onSelectExercise?.(nextIdx);
                }}
                onReview={() => setCelebratingProblemId(null)}
              />
            );
          })()}

          {/* Conversation History stream */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            let displayText = '';
            if (isUser) {
              displayText = msg.textEng || msg.textKhmer || '';
            } else {
              const extracted = extractStepWidgetFromMessage(msg);
              if (extracted && activeProblem) {
                displayText =
                  extracted.introText?.trim() ||
                  (isKhmer
                    ? `តោះយើងដោះស្រាយជំហានទី ${extracted.activeIdx + 1} ទាំងអស់គ្នា!`
                    : `Let's solve Step ${extracted.activeIdx + 1} together!`);
              } else {
                displayText = isKhmer ? (msg.textKhmer || msg.textEng || '') : (msg.textEng || msg.textKhmer || '');
              }
            }

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 sm:gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn`}
              >
                {!isUser ? (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#40916C] rounded-xl sm:rounded-2xl shrink-0 border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] sm:shadow-[2px_2px_0px_#1B4332] flex items-center justify-center p-0.5">
                    <TunsayAvatar size="sm" state={msg.isSafetyRefusal ? 'encouraging' : 'explaining'} showBadge={false} />
                  </div>
                ) : (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#A7CDB4] text-[#1B4332] border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] sm:shadow-[2px_2px_0px_#1B4332] font-black flex items-center justify-center shrink-0 overflow-hidden">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] min-w-0 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2.5 sm:border-3 border-[#1B4332] text-sm leading-relaxed break-words overflow-hidden ${
                    isUser
                      ? 'bg-[#1B4332] text-white shadow-[2.5px_2.5px_0px_#1B4332] sm:shadow-[3px_3px_0px_#1B4332] speech-tail-right'
                      : msg.isSafetyRefusal
                      ? 'bg-[#2D6A4F] text-white shadow-[2.5px_2.5px_0px_#1B4332] sm:shadow-[3px_3px_0px_#1B4332] speech-tail-left'
                      : 'bg-white text-[#1B4332] shadow-[2.5px_2.5px_0px_#1B4332] sm:shadow-[3px_3px_0px_#1B4332] speech-tail-left'
                  }`}
                >
                  <div className="font-black text-xs sm:text-base leading-relaxed break-words whitespace-pre-wrap">
                    {formatMessageText(displayText)}
                  </div>
                  <span className="text-[10px] mt-2 block text-right font-black opacity-80">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Active StepCard & StepTrail — interactive solving workspace (shown when steps are ready & not thinking) */}
          {!isSayoThinking && activeProblem && currentStep && (
            <div className="space-y-3 pt-1">
              <StepTrail
                currentStep={currentStepIndex + 1}
                totalSteps={activeProblem.steps.length}
                language={profile.language}
                onSelectStep={(stepIdx) => setCurrentStepIndex(stepIdx)}
              />

              <StepCard
                step={currentStep}
                language={profile.language}
                onAnswerSubmit={handleStepAnswer}
                onNavigateStep={(stepIdx) => setCurrentStepIndex(stepIdx)}
                onOpenHints={() => {
                  setIsHintOpen(true);
                  if (currentActivityRef.current) {
                    const act = findActiveActivity(activeSessionId);
                    if (act) {
                      updateActivity(currentActivityRef.current, {
                        hintsUsed: act.hintsUsed + 1,
                      });
                    }
                  }
                }}
                onOpenExplainDifferently={() => {
                  setIsExplainOpen(true);
                  if (currentActivityRef.current) {
                    const act = findActiveActivity(activeSessionId);
                    if (act) {
                      updateActivity(currentActivityRef.current, {
                        explainUsed: act.explainUsed + 1,
                      });
                    }
                  }
                }}
              />
            </div>
          )}

          {/* Socratic preparation indicator while waiting for steps */}
          {isSayoThinking && (
            <div className="flex items-center gap-3 p-4 bg-white/90 rounded-2xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-[#40916C] flex items-center justify-center border-2 border-[#1B4332]">
                <TunsayAvatar size="sm" state="thinking" showBadge={false} />
              </div>
              <p className="text-xs sm:text-sm font-black text-[#1B4332]">
                {isKhmer ? 'ReanMore កំពុងរៀបចំជំហានដោះស្រាយជូនអ្នក...' : 'ReanMore is preparing the step-by-step guidance for you...'}
              </p>
            </div>
          )}

          {/* Fresh Start: Scan + Topic Cards */}
          {!activeProblem && messages.length <= 1 && (
            <div className="space-y-4 pt-1 pl-2 sm:pl-14 animate-fadeIn">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="px-4 py-2.5 bg-[#2D6A4F] text-[#1B4332] hover:bg-[#40916C] rounded-2xl text-xs sm:text-sm font-black border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1B4332] flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>{isKhmer ? 'ស្កែនរូបថតលំហាត់' : 'Scan Homework Photo'}</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs font-black text-[#1B4332] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                  <BookOpen className="w-4 h-4 text-[#1B4332]" />
                  <span>{isKhmer ? 'ឧទាហរណ៍លំហាត់' : 'Example Problems'}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {MOCK_PROBLEMS.slice(0, 3).map((prob) => (
                    <button
                      key={prob.id}
                      type="button"
                      onClick={() => handleSelectTopicCard(prob)}
                      className="px-3 py-2 bg-white rounded-xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer text-left"
                    >
                      <span className="font-black text-xs text-[#1B4332]">
                        {isKhmer ? prob.titleKhmer : prob.titleEng}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Bottom Chat Input Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-t-3 border-[#1B4332] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="w-full flex items-center gap-2.5"
          >
            <button
              type="button"
              onClick={onOpenScanner}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-[#2D6A4F] text-[#1B4332] rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1B4332] transition-all cursor-pointer shrink-0"
              title={isKhmer ? 'ស្កែនរូបថតលំហាត់' : 'Scan Homework Photo'}
            >
              <Camera className="w-6 h-6 stroke-[2.5]" />
            </button>

            <div className="flex-1 bg-[#E8F5E9] rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] px-4 flex items-center">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputQuery(value);
                  lastInteractionRef.current = Date.now();
                  if (value.trim().length > 0 && sayoStatus !== 'thinking') {
                    setSayoStatus('listening');
                  }
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    setSayoStatus(prev => prev === 'listening' ? 'idle' : prev);
                  }, 1500);
                }}
                placeholder={
                  isKhmer
                    ? 'សួរអ្វីបន្ថែម ឬ "ខ្ញុំមិនយល់ទេ"...'
                    : 'Ask for help or "I\'m stuck"...'
                }
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm sm:text-base py-3 font-bold text-[#1B4332] placeholder:text-[#1B4332]/50"
              />
            </div>

            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1B4332] disabled:bg-gray-200 disabled:border-gray-400 text-white rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] font-black hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1B4332] transition-all flex items-center justify-center cursor-pointer shrink-0"
            >
              <Send className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>

      {/* Sheets Modals */}
      {currentStep && (
        <>
          <HintSheet
            step={currentStep}
            isOpen={isHintOpen}
            language={profile.language}
            onClose={() => setIsHintOpen(false)}
          />
          <ExplanationCard
            step={currentStep}
            isOpen={isExplainOpen}
            language={profile.language}
            onClose={() => setIsExplainOpen(false)}
          />
        </>
      )}

      {/* Socratic Stepper Solution Journey Drawer */}
      <AllStepsDrawer
        steps={activeDrawerSteps}
        currentStepIndex={activeDrawerStepIdx}
        isOpen={isAllStepsDrawerOpen}
        language={profile.language}
        onSelectStep={(idx) => {
          if (activeDrawerMsgId) {
            handleStepNavigate(activeDrawerMsgId, idx);
          }
          setIsAllStepsDrawerOpen(false);
        }}
        onClose={() => setIsAllStepsDrawerOpen(false)}
      />
    </div>
  );
};
