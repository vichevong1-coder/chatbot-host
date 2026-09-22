import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, HomeworkProblem, UserProfile, StepItem } from '../types';
import { TunsayAvatar } from './TunsayAvatar';
import { StepTrail } from './StepTrail';
import { StepCard } from './StepCard';
import { HintSheet } from './HintSheet';
import { ExplanationCard } from './ExplanationCard';
import { askTunsayTutor, mapBackendStepsToStepItems } from '../services/geminiService';
import { getDisplayName } from '../utils/language';
import { MOCK_PROBLEMS } from '../data/mockProblems';
import { Send, Camera, User, GraduationCap, ArrowLeft, Plus, BookOpen, CheckCircle, ArrowRight, ListOrdered } from 'lucide-react';
import { cleanBilingualOption } from '../utils/language';

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

interface ChatViewProps {
  profile: UserProfile;
  initialProblem?: HomeworkProblem | undefined;
  worksheetQueue?: HomeworkProblem[] | undefined;
  initialQuery?: string | undefined;
  onClearInitialQuery?: () => void;
  chatMessages?: ChatMessage[];
  onUpdateMessages?: (messages: ChatMessage[]) => void;
  onOpenScanner: () => void;
  onBackToHome?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  profile,
  initialProblem,
  worksheetQueue = [],
  initialQuery,
  onClearInitialQuery,
  chatMessages,
  onUpdateMessages,
  onOpenScanner,
  onBackToHome
}) => {
  const isKhmer = profile.language === 'km';
  
  // Worksheet Queue & Navigation state
  const [queue, setQueue] = useState<HomeworkProblem[]>(() => {
    if (worksheetQueue && worksheetQueue.length > 0) return worksheetQueue;
    if (initialProblem) return [initialProblem];
    return [];
  });
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [completedProblemIds, setCompletedProblemIds] = useState<string[]>([]);
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);

  const [activeProblem, setActiveProblem] = useState<HomeworkProblem | undefined>(() => {
    if (worksheetQueue && worksheetQueue.length > 0) return worksheetQueue[0];
    return initialProblem;
  });
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (chatMessages && chatMessages.length > 0) {
      return chatMessages;
    }
    return [
      {
        id: 'init-msg',
        sender: 'sayo',
        textKhmer: `សួស្តី ${getDisplayName(profile.name, true)}! ខ្ញុំគឺទន្សាយ គ្រូបង្រៀន AI។ តើអ្នកមានលំហាត់អ្វីចង់ឱ្យខ្ញុំជួយទេ? អ្នកអាចថតរូបស្កែនលំហាត់ ឬវាយបញ្ចូលសំណួរនៅខាងក្រោម!`,
        textEng: `Hi ${getDisplayName(profile.name, false)}! I am Tunsay, your AI Tutor. What homework would you like help with? You can scan a photo or type your question below!`,
        timestamp: 'Just now'
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isSayoThinking, setIsSayoThinking] = useState(false);
  const [sayoStatus, setSayoStatus] = useState<'idle' | 'thinking' | 'celebrating'>('idle');
  const [thinkingTextIdx, setThinkingTextIdx] = useState(0);

  const updateMessages = (newMsgs: ChatMessage[]) => {
    setMessages(newMsgs);
    if (onUpdateMessages) {
      onUpdateMessages(newMsgs);
    }
  };

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Fetch real Socratic steps from Backend whenever a problem is initiated
  const loadProblemSessionFromBackend = async (prob: HomeworkProblem) => {
    setIsSayoThinking(true);
    const queryStatement = prob.problemStatementEng || prob.problemStatementKhmer;
    
    // Call real Backend Orchestrator on port 9000
    const res = await askTunsayTutor(queryStatement, prob, profile.language);
    if (!isMountedRef.current) return;
    setIsSayoThinking(false);

    if (res.sessionId) {
      setCurrentSessionId(res.sessionId);
    }

    // Populate steps from real backend step_widget
    if (res.stepWidget) {
      const realSteps = mapBackendStepsToStepItems(res.stepWidget, queryStatement);
      const updatedProb = { ...prob, steps: realSteps };
      setActiveProblem(updatedProb);
    }

    // Add initial Socratic greeting message from Tunsay
    const openingMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'sayo',
      textKhmer: res.textKhmer || `សួស្តី! តោះយើងដោះស្រាយលំហាត់នេះជាមួយគ្នា! \n\n\`${queryStatement}\``,
      textEng: res.textEng || `Hi! Let's solve this problem together! \n\n\`${queryStatement}\``,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    updateMessages([openingMsg]);
  };

  // Sync when worksheetQueue or initialProblem changes
  useEffect(() => {
    if (worksheetQueue && worksheetQueue.length > 0) {
      setQueue(worksheetQueue);
      const foundIdx = initialProblem ? worksheetQueue.findIndex(p => p.id === initialProblem.id) : 0;
      const idx = foundIdx >= 0 ? foundIdx : 0;
      setCurrentQueueIndex(idx);
      setActiveProblem(worksheetQueue[idx]);
      setCurrentStepIndex(0);
      setShowNextPrompt(false);
      loadProblemSessionFromBackend(worksheetQueue[idx]);
    } else if (initialProblem) {
      setQueue([initialProblem]);
      setCurrentQueueIndex(0);
      setActiveProblem(initialProblem);
      setCurrentStepIndex(0);
      setShowNextPrompt(false);
      loadProblemSessionFromBackend(initialProblem);
    }
  }, [worksheetQueue, initialProblem]);

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

  useEffect(() => {
    if (isSayoThinking) {
      setSayoStatus('thinking');
    } else if (sayoStatus === 'thinking') {
      setSayoStatus('celebrating');
      const timer = setTimeout(() => {
        setSayoStatus('idle');
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [isSayoThinking]);

  const thinkingTextsKhmer = [
    'តើយើងដឹងអ្វីខ្លះជាដំបូងនៅក្នុងសំណួរនេះ? 🤔',
    'តើសំណួរនេះសុំឱ្យយើងរកអ្វី? 🎯',
    'តើយើងអាចបែងចែកវាជាជំហានតូចៗបានទេ? 📐',
    'ជិតរួចរាល់ហើយ! ខ្ញុំកំពុងរៀបចំពន្យល់ឱ្យអ្នក 🐰'
  ];
  const thinkingTextsEng = [
    'What do we know first in this question? 🤔',
    'What is the question asking us to find? 🎯',
    'Can we break this into smaller steps? 📐',
    'Almost ready! Preparing a helpful explanation 🐰'
  ];
  const celebratoryTextKhmer = 'រួចរាល់ហើយ! 🎉';
  const celebratoryTextEng = 'Aha! Got it! 🎉';
  const idleTextKhmer = 'ទន្សាយ រង់ចាំសំណួរ! 🐰';
  const idleTextEng = 'Ready to help! 🐰';

  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

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

    askTunsayTutor(queryText, activeProblem, profile.language, currentSessionId).then((sayoRes) => {
      if (!isMountedRef.current) return;
      setIsSayoThinking(false);
      if (sayoRes.sessionId) setCurrentSessionId(sayoRes.sessionId);

      const sayoMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'sayo',
        textKhmer: sayoRes.textKhmer,
        textEng: sayoRes.textEng,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSafetyRefusal: sayoRes.isSafetyRefusal ?? false,
      };
      updateMessages([...updatedWithUser, sayoMsg]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSayoThinking, currentStepIndex, showNextPrompt]);

  const currentStep = activeProblem?.steps?.[currentStepIndex];

  const handleNewChat = () => {
    setActiveProblem(undefined);
    setQueue([]);
    setCurrentQueueIndex(0);
    setCurrentStepIndex(0);
    setShowNextPrompt(false);
    setCurrentSessionId(undefined);
    const freshGreeting: ChatMessage = {
      id: Date.now().toString(),
      sender: 'sayo',
      textKhmer: `សួស្តី ${getDisplayName(profile.name, true)}! ខ្ញុំគឺទន្សាយ គ្រូបង្រៀន AI។ តើអ្នកមានលំហាត់អ្វីចង់ឱ្យខ្ញុំជួយទេ? អ្នកអាចថតរូបស្កែនលំហាត់ ឬវាយបញ្ចូលសំណួរនៅខាងក្រោម!`,
      textEng: `Hi ${getDisplayName(profile.name, false)}! I am Tunsay, your AI Tutor. What homework would you like help with? You can scan a photo or type your question below!`,
      timestamp: 'Just now'
    };
    updateMessages([freshGreeting]);
  };

  const handleSelectTopicCard = (prob: HomeworkProblem) => {
    setActiveProblem(prob);
    setQueue([prob]);
    setCurrentQueueIndex(0);
    setCurrentStepIndex(0);
    setShowNextPrompt(false);
    loadProblemSessionFromBackend(prob);
  };

  // Switch to a specific problem from the worksheet queue
  const handleSelectQueueProblem = (index: number) => {
    if (index < 0 || index >= queue.length) return;
    const targetProb = queue[index];
    setCurrentQueueIndex(index);
    setActiveProblem(targetProb);
    setCurrentStepIndex(0);
    setShowNextPrompt(false);
    loadProblemSessionFromBackend(targetProb);
  };

  const handleNextExercise = () => {
    if (currentQueueIndex + 1 < queue.length) {
      handleSelectQueueProblem(currentQueueIndex + 1);
    }
  };

  const handleStepAnswer = async (studentAnswer: string): Promise<boolean> => {
    if (!currentStep) return false;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      textEng: studentAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    updateMessages(updated);
    setIsSayoThinking(true);

    // Call real Backend Socratic engine
    const sayoRes = await askTunsayTutor(studentAnswer, activeProblem, profile.language, currentSessionId);
    if (!isMountedRef.current) return false;
    setIsSayoThinking(false);

    if (sayoRes.sessionId) {
      setCurrentSessionId(sayoRes.sessionId);
    }

    const sayoMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'sayo',
      textKhmer: sayoRes.textKhmer,
      textEng: sayoRes.textEng,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSafetyRefusal: sayoRes.isSafetyRefusal ?? false,
    };
    updateMessages([...updated, sayoMsg]);

    const cleanedStudent = cleanBilingualOption(studentAnswer, profile.language).toLowerCase().trim();
    const cleanedCorrect = cleanBilingualOption(currentStep.correctAnswer, profile.language).toLowerCase().trim();
    const isLocalCorrect = cleanedCorrect ? (cleanedStudent === cleanedCorrect || cleanedCorrect.includes(cleanedStudent)) : true;

    if (sayoRes.isProblemComplete || isLocalCorrect) {
      if (activeProblem && currentStepIndex + 1 < activeProblem.steps.length) {
        setTimeout(() => {
          setCurrentStepIndex((prev: number) => prev + 1);
        }, 800);
      } else if (activeProblem) {
        // Completed all steps of this problem
        if (!completedProblemIds.includes(activeProblem.id)) {
          setCompletedProblemIds(prev => [...prev, activeProblem.id]);
        }
        setShowNextPrompt(true);
        setSayoStatus('celebrating');
      }
      return true;
    }

    return false;
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

    const sayoRes = await askTunsayTutor(userText, activeProblem, profile.language, currentSessionId);
    if (!isMountedRef.current) return;

    setIsSayoThinking(false);
    if (sayoRes.sessionId) setCurrentSessionId(sayoRes.sessionId);

    if (sayoRes.isProblemComplete && activeProblem) {
      if (!completedProblemIds.includes(activeProblem.id)) {
        setCompletedProblemIds(prev => [...prev, activeProblem.id]);
      }
      setShowNextPrompt(true);
      setSayoStatus('celebrating');
    }

    const sayoMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'sayo',
      textKhmer: sayoRes.textKhmer,
      textEng: sayoRes.textEng,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSafetyRefusal: sayoRes.isSafetyRefusal ?? false,
    };

    updateMessages([...updatedWithUser, sayoMsg]);
  };

  const hasNextProblem = currentQueueIndex + 1 < queue.length;
  const nextProblem = hasNextProblem ? queue[currentQueueIndex + 1] : null;

  return (
    <div className="w-full h-full flex-1 flex flex-row items-stretch gap-4 sm:gap-5 overflow-hidden">
      {/* Left Mascot Status Panel */}
      <div className="hidden lg:flex lg:w-[30%] lg:min-w-[220px] lg:max-w-[360px] shrink-0 h-full bg-[#F1EFFF] rounded-3xl border-3 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] p-4 flex-col justify-between items-center text-center select-none z-10 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-[#40916C]/25 rounded-full blur-sm pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-[#2D6A4F]/25 rounded-full blur-sm pointer-events-none" />

        <div className="w-full flex flex-col items-center gap-4 pt-1 relative z-10 my-auto">
          <div className="w-full max-w-[220px]">
            {sayoStatus === 'thinking' ? (
              <span className="px-3 py-1.5 bg-[#2D6A4F] text-white text-xs font-black rounded-full border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] inline-flex items-center justify-center gap-1.5 animate-pulse uppercase tracking-wider w-full">
                <span className="w-2 h-2 bg-white rounded-full animate-ping shrink-0" />
                <span className="truncate">{isKhmer ? 'កំពុងគិត...' : 'Thinking...'}</span>
              </span>
            ) : sayoStatus === 'celebrating' ? (
              <span className="px-3 py-1.5 bg-[#2D6A4F] text-white text-xs font-black rounded-full border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] inline-flex items-center justify-center gap-1.5 uppercase tracking-wider w-full animate-bounce">
                ✨ <span className="truncate">{isKhmer ? 'រួចរាល់ហើយ!' : 'Done!'}</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-[#A7CDB4] text-[#1B4332] text-xs font-black rounded-full border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] inline-flex items-center justify-center gap-1.5 uppercase tracking-wider w-full">
                <span className="w-2 h-2 bg-[#2D6A4F] rounded-full border border-[#1B4332] shrink-0" />
                <span className="truncate">{isKhmer ? 'ទន្សាយ AI Tutor' : 'Tunsay AI Tutor'}</span>
              </span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center my-2 transition-all duration-300 transform w-full">
            <div className={`transition-all duration-300 ${
              sayoStatus === 'thinking' ? 'scale-105' : sayoStatus === 'celebrating' ? 'scale-110 animate-bounce' : 'scale-100 hover:scale-105'
            }`}>
              <TunsayAvatar size="lg" state={sayoStatus} showBadge={false} />
            </div>

            <div className="mt-4 px-2 w-full max-w-[240px] bg-white rounded-2xl p-3 border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] relative">
              <div className="w-3 h-3 bg-white border-t-3 border-l-3 border-[#1B4332] rotate-45 absolute -top-2 left-1/2 -translate-x-1/2" />
              <p className="font-heading font-black text-xs sm:text-sm text-[#1B4332] leading-snug transition-all duration-300">
                {sayoStatus === 'thinking' && (isKhmer ? thinkingTextsKhmer[thinkingTextIdx] : thinkingTextsEng[thinkingTextIdx])}
                {sayoStatus === 'celebrating' && (isKhmer ? celebratoryTextKhmer : celebratoryTextEng)}
                {sayoStatus === 'idle' && (isKhmer ? idleTextKhmer : idleTextEng)}
              </p>
            </div>
          </div>
        </div>

        {/* Left Panel Worksheet Progress Indicator */}
        {queue.length > 1 && (
          <div className="w-full p-2.5 bg-white rounded-2xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] text-left space-y-1 relative z-10 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-black text-[#1B4332]">
              <span>{isKhmer ? 'វឌ្ឍនភាពសន្លឹកកិច្ចការ' : 'Worksheet Progress'}</span>
              <span>{completedProblemIds.length} / {queue.length}</span>
            </div>
            <div className="w-full bg-[#E8F5E9] h-2.5 rounded-full border border-[#1B4332] overflow-hidden">
              <div
                className="bg-[#2D6A4F] h-full transition-all duration-500 rounded-full"
                style={{ width: `${Math.round((completedProblemIds.length / queue.length) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="w-full pt-2 border-t-2 border-[#1B4332]/15 relative z-10 shrink-0">
          <p className="text-xs font-black text-[#1B4332] uppercase tracking-wider truncate">
            WEG Tutor 🐰
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
                {isKhmer ? 'ទន្សាយ' : 'Tunsay AI'}
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
              className="w-8 h-8 sm:w-10 sm:h-10 bg-[#40916C] text-white hover:bg-white hover:text-[#1B4332] rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] sm:shadow-[2px_2px_0px_#1B4332] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
              title={isKhmer ? 'ចាប់ផ្តើមជជែកថ្មី' : 'New Chat'}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            </button>

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-2.5 sm:px-3.5 py-1.5 bg-[#40916C] text-white hover:bg-white hover:text-[#1B4332] rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-1 cursor-pointer border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] sm:shadow-[2px_2px_0px_#1B4332] active:translate-x-0.5 active:translate-y-0.5 shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                <span className="hidden min-[380px]:inline">{isKhmer ? 'ទំព័រដើម' : 'Home'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Worksheet Exercises Navigation Bar */}
        {queue.length > 1 && (
          <div className="shrink-0 bg-white border-b-2 border-[#1B4332] px-3 py-2 flex items-center gap-2 overflow-x-auto shadow-sm z-10">
            <div className="flex items-center gap-1 shrink-0 text-xs font-black text-[#1B4332] pr-1 border-r-2 border-[#1B4332]/20">
              <ListOrdered className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span className="hidden sm:inline">{isKhmer ? 'សន្លឹកកិច្ចការ៖' : 'Worksheet:'}</span>
              <span className="bg-[#E8F5E9] px-1.5 py-0.5 rounded-lg border border-[#1B4332]">
                {currentQueueIndex + 1}/{queue.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {queue.map((prob, idx) => {
                const isCurrent = idx === currentQueueIndex;
                const isCompleted = completedProblemIds.includes(prob.id);
                return (
                  <button
                    key={prob.id}
                    type="button"
                    onClick={() => handleSelectQueueProblem(idx)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-2 flex items-center gap-1 ${
                      isCurrent
                        ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-[2px_2px_0px_#2D6A4F] scale-105'
                        : isCompleted
                        ? 'bg-[#A7CDB4] text-[#1B4332] border-[#1B4332] shadow-[1px_1px_0px_#1B4332]'
                        : 'bg-[#E8F5E9] text-[#1B4332] border-[#1B4332]/40 hover:bg-[#40916C]/20'
                    }`}
                    title={prob.problemStatementEng || `Exercise ${idx + 1}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-3 h-3 text-[#1B4332] stroke-[3]" />
                    ) : null}
                    <span>Ex {idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Conversation Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5">
          {activeProblem && (
            <div className="space-y-4">
              {/* Problem Statement Card with Visual Worksheet Preview */}
              <div className="p-4 bg-white rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black text-[#2D6A4F] uppercase">
                  <span>{activeProblem.titleEng || `Exercise ${currentQueueIndex + 1}`}</span>
                  {queue.length > 1 && (
                    <span className="text-[#1B4332]/70">
                      {isKhmer ? `លំហាត់ទី ${currentQueueIndex + 1} នៃ ${queue.length}` : `Problem ${currentQueueIndex + 1} of ${queue.length}`}
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-base sm:text-lg text-[#1B4332] leading-snug">
                    {isKhmer ? activeProblem.problemStatementKhmer : activeProblem.problemStatementEng}
                  </p>
                  {activeProblem.imageUri && (
                    <div className="shrink-0" title={isKhmer ? 'ចុចដើម្បីមើលរូបភាពធំ' : 'Worksheet Visual'}>
                      <img
                        src={activeProblem.imageUri}
                        alt="Worksheet Preview"
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(activeProblem.imageUri, '_blank')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {activeProblem.steps && activeProblem.steps.length > 1 && (
                <StepTrail
                  currentStep={currentStepIndex + 1}
                  totalSteps={activeProblem.steps.length}
                  language={profile.language}
                  onSelectStep={(stepIdx) => setCurrentStepIndex(stepIdx)}
                />
              )}

              {currentStep && (
                <StepCard
                  step={currentStep}
                  language={profile.language}
                  onAnswerSubmit={(ans) => {
                    handleStepAnswer(ans);
                    return true;
                  }}
                  onOpenHints={() => setIsHintOpen(true)}
                  onOpenExplainDifferently={() => setIsExplainOpen(true)}
                />
              )}
            </div>
          )}

          {/* Celebratory Next Exercise Banner */}
          {showNextPrompt && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#D8F3DC] to-[#B7E4C7] rounded-2xl border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <div>
                  <h4 className="font-black text-sm sm:text-base text-[#1B4332]">
                    {isKhmer ? `អបអរសាទរ! អ្នកបានដោះស្រាយលំហាត់ទី ${currentQueueIndex + 1} រួចរាល់ហើយ!` : `Great job! You solved Exercise ${currentQueueIndex + 1}!`}
                  </h4>
                  <p className="text-xs font-bold text-[#1B4332]/80">
                    {hasNextProblem
                      ? (isKhmer ? 'តើអ្នកចង់បន្តទៅលំហាត់បន្ទាប់ទៀតទេ?' : 'Would you like to move on to the next exercise?')
                      : (isKhmer ? 'អ្នកបានដោះស្រាយលំហាត់ទាំងអស់នៅលើសន្លឹកកិច្ចការរួចរាល់ហើយ!' : 'You have completed all exercises on this worksheet!')}
                  </p>
                </div>
              </div>

              {hasNextProblem && nextProblem && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleNextExercise}
                    className="flex-1 py-3 px-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-black text-xs sm:text-sm rounded-xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {isKhmer ? `បន្តទៅលំហាត់ទី ${currentQueueIndex + 2}` : `Solve Exercise ${currentQueueIndex + 2}`}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            let displayText = '';
            if (isUser) {
              displayText = msg.textEng || msg.textKhmer || '';
            } else {
              displayText = isKhmer ? (msg.textKhmer || msg.textEng || '') : (msg.textEng || msg.textKhmer || '');
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
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#A7CDB4] text-[#1B4332] border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] sm:shadow-[2px_2px_0px_#1B4332] font-black flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
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

          {/* Fresh Start: Scan + Topic Cards */}
          {!activeProblem && messages.length <= 1 && (
            <div className="space-y-4 pt-1 pl-2 sm:pl-14 animate-fadeIn">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onOpenScanner}
                  className="px-4 py-2.5 bg-[#2D6A4F] text-white hover:bg-[#40916C] rounded-2xl text-xs sm:text-sm font-black border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1B4332] flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>{isKhmer ? 'ស្កែនរូបថតលំហាត់' : 'Scan Homework Photo'}</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs font-black text-[#1B4332] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                  <BookOpen className="w-4 h-4 text-[#1B4332]" />
                  {isKhmer ? 'លំហាត់គំរូពេញនិយម៖' : 'Popular Sample Homework:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                  {MOCK_PROBLEMS.slice(0, 4).map((prob) => (
                    <button
                      key={prob.id}
                      type="button"
                      onClick={() => handleSelectTopicCard(prob)}
                      className="p-3.5 rounded-2xl border-3 border-[#1B4332] bg-white hover:bg-[#D8F3DC] text-left transition-all shadow-[3px_3px_0px_#1B4332] flex flex-col justify-between cursor-pointer group"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-[#1B4332] bg-[#E8F5E9] px-2 py-0.5 rounded-full border border-[#1B4332] inline-block">
                          {isKhmer 
                            ? `ថ្នាក់ទី ${prob.grade} • ${prob.subject === 'math' ? 'គណិត' : prob.subject === 'science' ? 'វិទ្យាសាស្ត្រ' : 'អង់គ្លេស'}` 
                            : `Grade ${prob.grade} • ${prob.subject === 'math' ? 'Math' : prob.subject === 'science' ? 'Science' : 'English'}`}
                        </span>
                        <p className="font-black text-xs sm:text-sm text-[#1B4332] line-clamp-2">
                          {isKhmer ? prob.titleKhmer : prob.titleEng}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Bottom Chat Input Form */}
        <div className="shrink-0 p-3 sm:p-4 bg-white border-t-2 sm:border-t-3 border-[#1B4332]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            <button
              type="button"
              onClick={onOpenScanner}
              className="p-2.5 sm:p-3 bg-[#E8F5E9] hover:bg-[#D8F3DC] text-[#1B4332] rounded-xl sm:rounded-2xl border-2 sm:border-3 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] cursor-pointer hover:-translate-y-0.5 transition-all shrink-0"
              title={isKhmer ? 'ស្កែនលំហាត់ថ្មី' : 'Scan New Worksheet'}
            >
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                isKhmer
                  ? 'សរសេរសំណួរ ឬចម្លើយរបស់អ្នកនៅទីនេះ...'
                  : 'Type your question or answer here...'
              }
              className="flex-1 min-w-0 bg-[#E8F5E9] border-2 sm:border-3 border-[#1B4332] rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-[#1B4332] placeholder:text-[#1B4332]/50 focus:outline-none focus:bg-white shadow-[2px_2px_0px_#1B4332] transition-all"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isSayoThinking}
              className="p-2.5 sm:p-3 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-white rounded-xl sm:rounded-2xl border-2 sm:border-3 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] cursor-pointer hover:-translate-y-0.5 disabled:hover:translate-y-0 transition-all shrink-0"
            >
              <Send className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </div>

      {/* Hint Sheet Modal */}
      {isHintOpen && currentStep && (
        <HintSheet
          step={currentStep}
          language={profile.language}
          onClose={() => setIsHintOpen(false)}
        />
      )}

      {/* Explanation Modal */}
      {isExplainOpen && currentStep && (
        <ExplanationCard
          step={currentStep}
          language={profile.language}
          onClose={() => setIsExplainOpen(false)}
        />
      )}
    </div>
  );
};
