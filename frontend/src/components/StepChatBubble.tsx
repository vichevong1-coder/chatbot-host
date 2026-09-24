import React, { useState, useEffect } from 'react';
import { StepItem, Language } from '../types';
import { Lightbulb, ListOrdered, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface StepChatBubbleProps {
  step: StepItem;
  stepIndex: number;
  totalSteps: number;
  language: Language;
  completedStepIndices: number[];
  /** True if this is the currently active step the student is solving */
  isLatest: boolean;
  onOpenHints: () => void;
  onOpenAllSteps: () => void;
  onNavigateStep: (idx: number) => void;
  /** Callback fired when student submits an answer via the inline input */
  onStepAnswerSubmit?: (stepIndex: number, studentAnswer: string, isCorrect: boolean) => void;
}

/**
 * Splits example text into discrete list items if it contains numbered items
 * (e.g. "1. Flour / 2. Milk / 3. An oven's heat" or newline-separated numbered items).
 */
function parseExampleItems(text: string): { isList: boolean; items: string[] } {
  if (!text) return { isList: false, items: [] };

  // Check for slash-separated numbered items: "1. Flour / 2. Milk / 3. An oven's heat"
  if (/\d+[\.\)]\s*[^/]+(?:\s*\/\s*\d+[\.\)])/.test(text)) {
    const parts = text.split(/\s*\/\s*(?=\d+[\.\)])/);
    const cleaned = parts.map((p) => p.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
    if (cleaned.length > 1) {
      return { isList: true, items: cleaned };
    }
  }

  // Check for newline-separated numbered items or bullets
  if (text.includes('\n')) {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const hasListMarkers = lines.some((l) => /^(?:\d+[\.\)]|[-*•])\s+/.test(l));
    if (hasListMarkers && lines.length > 1) {
      const cleaned = lines.map((l) => l.replace(/^(?:\d+[\.\)]|[-*•])\s+/, '').trim()).filter(Boolean);
      return { isList: true, items: cleaned };
    }
  }

  return { isList: false, items: [text] };
}

/**
 * Normalizes Khmer numerals (០-៩) into Arabic digits (0-9).
 */
function normalizeKhmerDigits(val: string): string {
  const khmerDigits = '០១២៣៤៥៦៧៨៩';
  return val.replace(/[០-៩]/g, (ch) => khmerDigits.indexOf(ch).toString());
}

/**
 * Prepares strings for comparison by normalizing digits, lowercasing, and stripping punctuation.
 */
function cleanTextForComparison(val: string): string {
  if (!val) return '';
  return normalizeKhmerDigits(val)
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, '')
    .trim();
}

/**
 * Deterministically evaluates the student's answer against the expected answer
 * without needing an expensive, high-latency LLM round-trip.
 */
function checkAnswerCorrectness(studentAns: string, expectedAns?: string): boolean {
  if (!studentAns.trim()) return false;
  if (!expectedAns || !expectedAns.trim()) {
    // If no expected answer is configured on the step, treat student answer as valid
    return true;
  }

  const normStudent = cleanTextForComparison(studentAns);
  const normExpected = cleanTextForComparison(expectedAns);

  if (normStudent === normExpected) return true;

  // Numerical comparison (e.g. "07" vs "7" or "14.0" vs "14")
  const numStudent = parseFloat(normStudent);
  const numExpected = parseFloat(normExpected);
  if (!isNaN(numStudent) && !isNaN(numExpected) && numStudent === numExpected) {
    return true;
  }

  // Substring or token containment (e.g. "evaporation" inside "water evaporation")
  if (normExpected.length > 2 && normStudent.includes(normExpected)) {
    return true;
  }
  if (normStudent.length > 2 && normExpected.includes(normStudent)) {
    return true;
  }

  return false;
}

export const StepChatBubble: React.FC<StepChatBubbleProps> = ({
  step,
  stepIndex,
  totalSteps,
  language,
  completedStepIndices,
  isLatest,
  onOpenHints,
  onOpenAllSteps,
  onNavigateStep,
  onStepAnswerSubmit,
}) => {
  const isKhmer = language === 'km';
  const rawStep = step as any;
  const stepNum = step.stepNumber || rawStep.step_number || stepIndex + 1;

  const isCompleted =
    completedStepIndices.includes(stepIndex) ||
    step.status === 'completed' ||
    rawStep.status === 'completed';

  const currentHintLevel = step.currentHintLevel ?? rawStep.current_hint_level ?? 0;

  // ── Inline Answer Input State ──────────────────────────────────────────
  const [inputAnswer, setInputAnswer] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'checking' | 'correct' | 'incorrect'>('idle');
  const [submittedAnswer, setSubmittedAnswer] = useState<string | null>(
    step.studentAnswer || rawStep.student_answer || null
  );

  // Sync state when navigating between steps
  useEffect(() => {
    setInputAnswer('');
    setFeedbackStatus('idle');
    setSubmittedAnswer(step.studentAnswer || rawStep.student_answer || null);
  }, [stepIndex, step.studentAnswer, rawStep.student_answer]);

  // Clean helper: strips markdown tokens so strings render cleanly into UI components
  const stripMd = (str?: string): string => {
    if (!str) return '';
    return str
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^>\s?/gm, '')
      .replace(/^#+\s?/gm, '')
      .replace(/`([^`]+)`/g, '$1')
      .trim();
  };

  // 4-Part Socratic Card data extraction
  const missionText = stripMd(step.mission || rawStep.mission || (isKhmer ? step.questionKhmer : step.questionEng));
  const clueText = stripMd(step.clue || rawStep.clue || (isKhmer ? step.hint1?.khmer : step.hint1?.eng));
  const rawExampleText = stripMd(
    step.helpfulExample || rawStep.helpful_example || (isKhmer ? step.hint3?.exampleKhmer : step.hint3?.exampleEng)
  );
  const yourTurnText = stripMd(
    step.yourTurn || rawStep.your_turn || (isKhmer ? step.socraticPromptKhmer : step.socraticPromptEng)
  );
  const titleText = stripMd(step.title || rawStep.title);
  const expectedAnswer = rawStep.expectedAnswer || rawStep.expected_answer;

  const parsedExample = parseExampleItems(rawExampleText);

  // Active inline hint text based on current unlocked tier
  const hintsArray = step.hints || rawStep.hints || [];
  const getActiveHintContent = (tier: number) => {
    if (tier === 1) {
      return {
        title: isKhmer ? 'តម្រុយណែនាំ (Tier 1: Guiding Nudge)' : 'Tier 1: Guiding Nudge',
        icon: '💡',
        text: stripMd(hintsArray[0] || (isKhmer ? step.hint1?.khmer : step.hint1?.eng)),
      };
    }
    if (tier === 2) {
      return {
        title: isKhmer ? 'រូបភាពជំនួយ (Tier 2: Visual Scaffold)' : 'Tier 2: Visual Scaffold',
        icon: '🍎',
        text: stripMd(hintsArray[1] || (isKhmer ? step.hint2?.khmer : step.hint2?.eng) || rawExampleText),
      };
    }
    return {
      title: isKhmer ? 'បំបែកជំហានតូចៗ (Tier 3: Micro-Breakdown)' : 'Tier 3: Micro-Breakdown',
      icon: '📐',
      text: stripMd(hintsArray[2] || (isKhmer ? step.hint3?.exampleKhmer : step.hint3?.exampleEng)),
    };
  };

  // ── Handle Inline Answer Submission ────────────────────────────────────
  const handleAnswerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputAnswer.trim();
    if (!trimmed || feedbackStatus === 'checking' || isCompleted) return;

    setFeedbackStatus('checking');

    const isCorrect = checkAnswerCorrectness(trimmed, expectedAnswer);

    if (isCorrect) {
      setFeedbackStatus('correct');
      setSubmittedAnswer(trimmed);
      onStepAnswerSubmit?.(stepIndex, trimmed, true);

      // Auto-advance to reveal next step's card after 850ms celebratory pause
      setTimeout(() => {
        if (stepIndex + 1 < totalSteps) {
          onNavigateStep(stepIndex + 1);
        }
      }, 850);
    } else {
      setFeedbackStatus('incorrect');
      onStepAnswerSubmit?.(stepIndex, trimmed, false);
    }
  };

  const canGoBack = stepIndex > 0;
  const canGoNext =
    (isCompleted || stepIndex < Math.max(...completedStepIndices, -1)) && stepIndex + 1 < totalSteps;

  const recordedAnswer =
    submittedAnswer || step.studentAnswer || rawStep.student_answer || (isKhmer ? 'ត្រឹមត្រូវ' : 'Done');

  return (
    <div className="w-full max-w-[94%] sm:max-w-[88%] rounded-3xl border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] overflow-hidden animate-fadeIn bg-white">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1B4332]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-3 py-1 bg-[#40916C] text-white text-[11px] font-black rounded-full border border-white/20 tracking-wide shrink-0">
            🧩&nbsp;
            {isKhmer ? `ជំហានទី ${stepNum} នៃ ${totalSteps}` : `Step ${stepNum} of ${totalSteps}`}
          </span>
          {titleText && (
            <span className="text-white/70 text-[11px] font-bold hidden sm:inline truncate max-w-[140px]">
              • {titleText}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenAllSteps}
          className="px-2.5 py-1 bg-[#2D6A4F] hover:bg-[#40916C] text-white text-[10px] font-black rounded-xl border border-white/15 flex items-center gap-1 transition-all cursor-pointer shrink-0 ml-2"
        >
          <ListOrdered className="w-3 h-3" />
          <span className="hidden sm:inline">{isKhmer ? 'បញ្ជីជំហាន' : 'View all steps'}</span>
          <span className="sm:hidden">👁</span>
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="p-4 space-y-2.5">
        {/* 🌟 Mission Card (Context: receded with lighter bg, thin border, smaller font) */}
        {missionText && (
          <div className="px-3.5 py-2.5 bg-[#F7FCF9] rounded-xl border border-[#2D6A4F]/25">
            <p className="text-[10px] font-bold text-[#2D6A4F]/80 uppercase tracking-wider flex items-center gap-1 mb-0.5">
              <span>🌟</span>
              <span>{isKhmer ? 'បេសកកម្មរបស់យើង' : 'Our Mission'}</span>
            </p>
            <p className="text-xs font-medium text-[#1B4332]/90 leading-snug">{missionText}</p>
          </div>
        )}

        {/* 💡 Clue Card (Context: receded with lighter bg, thin border, smaller font) */}
        {clueText && (
          <div className="px-3.5 py-2.5 bg-[#FFFDF7] rounded-xl border border-amber-300/35">
            <p className="text-[10px] font-bold text-amber-700/80 uppercase tracking-wider flex items-center gap-1 mb-0.5">
              <span>💡</span>
              <span>{isKhmer ? 'តម្រុយគន្លឹះ' : 'Clue'}</span>
            </p>
            <p className="text-xs font-medium text-amber-950/85 leading-snug">{clueText}</p>
          </div>
        )}

        {/* 🍎 Helpful Example Card (Accent border, reduced vertical padding, proper <ol>/<ul> list) */}
        {rawExampleText && (
          <div className="px-3.5 py-2.5 bg-[#FDF2F8]/70 rounded-xl border-l-4 border-l-[#DB2777] border-y border-r border-[#DB2777]/20">
            <p className="text-[10px] font-bold text-[#BE185D] uppercase tracking-wider flex items-center gap-1 mb-1">
              <span>🍎</span>
              <span>{isKhmer ? 'រូបភាព / ឧទាហរណ៍ជំនួយ' : 'Helpful Example'}</span>
            </p>
            {parsedExample.isList ? (
              <ol className="list-decimal list-inside space-y-1 text-xs font-semibold text-[#831843] pl-1">
                {parsedExample.items.map((item, idx) => (
                  <li key={idx} className="leading-snug">
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs font-semibold text-[#831843] leading-snug whitespace-pre-wrap">
                {rawExampleText}
              </p>
            )}
          </div>
        )}

        {/* 👉 Your Turn Card — VISUAL ANCHOR (Bolder border, larger padding, inline input & auto-advance) */}
        <div
          className={`p-4 sm:p-4.5 rounded-2xl border-2 sm:border-3 border-[#1B4332] transition-all ${
            isCompleted
              ? 'bg-[#F4FBF7] shadow-[2px_2px_0px_#1B4332]'
              : isLatest
              ? 'bg-white shadow-[3px_3px_0px_#1B4332] ring-2 ring-[#40916C]/60 ring-offset-1'
              : 'bg-white shadow-[2px_2px_0px_#1B4332]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-black text-[#1B4332] uppercase tracking-wider flex items-center gap-1.5">
              <span>👉</span>
              <span>{isKhmer ? 'វេនរបស់អ្នក' : 'Your Turn'}</span>
            </p>
            {isCompleted && (
              <span className="px-2 py-0.5 bg-[#2D6A4F] text-white text-[10px] font-black rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3 stroke-[3]" />
                {isKhmer ? 'រួចរាល់' : 'Solved'}
              </span>
            )}
          </div>

          {/* Question Text */}
          <p className="text-base sm:text-lg font-black text-[#1B4332] leading-snug">{yourTurnText}</p>

          {/* ── State A: Compact Completed State (Greyed out with checkmark and student's answer) ── */}
          {isCompleted ? (
            <div className="mt-3 p-2.5 bg-[#F4FBF7] rounded-xl border border-[#2D6A4F]/30 text-xs sm:text-sm font-bold text-[#1B4332] flex items-center justify-between gap-2 shadow-[1px_1px_0px_#2D6A4F]/10">
              <span className="flex items-center gap-1.5 text-[#2D6A4F]">
                <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                <span>{isKhmer ? 'បានដោះស្រាយរួចរាល់! ចម្លើយរបស់អ្នក៖' : 'Solved! Your Answer:'}</span>
              </span>
              <span className="px-2.5 py-0.5 bg-white rounded-lg border border-[#2D6A4F]/30 text-[#1B4332] font-black opacity-85">
                "{recordedAnswer}"
              </span>
            </div>
          ) : (
            /* ── State B: Inline Answer Input (Active actionable card) ── */
            <form onSubmit={handleAnswerSubmit} className="mt-3 space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={inputAnswer}
                  onChange={(e) => {
                    setInputAnswer(e.target.value);
                    if (feedbackStatus === 'incorrect') {
                      setFeedbackStatus('idle');
                    }
                  }}
                  disabled={feedbackStatus === 'checking' || feedbackStatus === 'correct'}
                  placeholder={isKhmer ? 'វាយចម្លើយរបស់អ្នកនៅទីនេះ...' : 'Type your answer here...'}
                  className="flex-1 px-3.5 py-2.5 bg-[#F4FBF7] rounded-xl border-2 border-[#1B4332] text-base font-black text-[#1B4332] placeholder:text-[#1B4332]/45 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2D6A4F] disabled:opacity-60 transition-all"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!inputAnswer.trim() || feedbackStatus === 'checking' || feedbackStatus === 'correct'}
                  className="px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-black rounded-xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0px_0px_0px_#1B4332] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {feedbackStatus === 'checking' ? (
                    <span>{isKhmer ? 'កំពុងពិនិត្យ...' : 'Checking...'}</span>
                  ) : (
                    <>
                      <span>{isKhmer ? 'ពិនិត្យចម្លើយ' : 'Check Answer'}</span>
                      <span>✓</span>
                    </>
                  )}
                </button>
              </div>

              {/* Inline Feedback Banner: Correct */}
              {feedbackStatus === 'correct' && (
                <div className="p-2.5 bg-[#E8F5E9] rounded-xl border-2 border-[#2D6A4F] text-sm sm:text-base font-black text-[#1B4332] flex items-center gap-2 animate-fadeIn shadow-[1px_1px_0px_#2D6A4F]">
                  <span className="text-base">✅</span>
                  <span className="flex-1">
                    {isKhmer ? 'ត្រឹមត្រូវណាស់! អស្ចារ្យណាស់ 🎉' : 'Correct! Advancing to next step... 🎉'}
                  </span>
                </div>
              )}

              {/* Inline Feedback Banner: Try Again */}
              {feedbackStatus === 'incorrect' && (
                <div className="p-2.5 bg-[#FEF2F2] rounded-xl border-2 border-[#DC2626] text-sm sm:text-base font-black text-[#991B1B] flex items-center gap-2 animate-fadeIn shadow-[1px_1px_0px_#DC2626]">
                  <span className="text-base">🔄</span>
                  <span className="flex-1">
                    {isKhmer
                      ? 'មិនទាន់ត្រឹមត្រូវទេ! សូមព្យាយាមម្តងទៀត ឬចុចសុំតម្រុយ 💡'
                      : 'Not quite yet! Try again, or tap "Need a Hint?" below 💡'}
                  </span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* ── Spec §4 Inline Hint Box (Visible when hint is unlocked) ─── */}
        {currentHintLevel > 0 && (() => {
          const hintData = getActiveHintContent(currentHintLevel);
          return (
            <div className="p-3 bg-gradient-to-r from-[#FFFBEA] to-[#FEF3C7] rounded-2xl border-2 border-[#D97706] shadow-[2px_2px_0px_#D97706] animate-fadeIn">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[11px] font-black text-[#B45309] uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 fill-[#D97706] stroke-[2]" />
                  <span>
                    {isKhmer
                      ? `ប្រអប់តម្រុយ (តម្រុយ ${currentHintLevel} នៃ 3)`
                      : `Hint Box (Hint ${currentHintLevel} of 3)`}
                  </span>
                </p>
                <span className="px-2 py-0.5 bg-[#D97706] text-white text-[10px] font-black rounded-md">
                  {hintData.title}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#78350F] leading-relaxed whitespace-pre-wrap">
                {hintData.text}
              </p>
            </div>
          );
        })()}

        {/* ── Footer: Back / Numbered Dots / Hint & Next Controls ──────── */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-[#1B4332]/10 gap-2 flex-wrap">
          {/* Left: Back Button */}
          <button
            type="button"
            onClick={() => onNavigateStep(stepIndex - 1)}
            disabled={!canGoBack}
            className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-[#F4FBF7] disabled:opacity-40 disabled:cursor-not-allowed text-[#1B4332] text-sm font-black rounded-xl border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] hover:-translate-y-0.5 disabled:hover:translate-y-0 transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">{isKhmer ? 'ថយក្រោយ' : 'Back'}</span>
          </button>

          {/* Center: Interactive Numbered Progress Dots */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {Array.from({ length: totalSteps }, (_, i) => {
              const isDone = completedStepIndices.includes(i) || (step.status === 'completed' && i === stepIndex);
              const isActive = i === stepIndex;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onNavigateStep(i)}
                  title={`Step ${i + 1}`}
                  className={`flex items-center justify-center text-[10px] font-black rounded-full border-2 transition-all cursor-pointer ${
                    isDone
                      ? 'w-6 h-6 bg-[#2D6A4F] border-[#1B4332] text-white'
                      : isActive
                      ? 'w-7 h-7 bg-[#1B4332] border-[#1B4332] text-white ring-2 ring-[#40916C] ring-offset-1'
                      : 'w-6 h-6 bg-white border-[#1B4332]/40 text-[#1B4332]/50 hover:bg-[#E8F5E9]'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-3 h-3 stroke-[3]" /> : i + 1}
                </button>
              );
            })}
          </div>

          {/* Right: Hint Button & Next Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Hint Button */}
            {!isCompleted && (
              <button
                type="button"
                onClick={onOpenHints}
                className="px-2.5 sm:px-3 py-1.5 bg-[#FFFBEA] hover:bg-[#FEF3C7] text-[#92400E] text-sm font-black rounded-xl border-2 border-[#D97706] shadow-[1.5px_1.5px_0px_#D97706] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1 cursor-pointer"
                title={isKhmer ? 'សុំតម្រុយ' : 'Need a hint?'}
              >
                <Lightbulb className="w-3.5 h-3.5 fill-[#D97706] stroke-[2]" />
                <span className="hidden sm:inline">
                  {currentHintLevel > 0
                    ? isKhmer
                      ? `តម្រុយ (${currentHintLevel}/3)`
                      : `Hint (${currentHintLevel}/3)`
                    : isKhmer
                    ? 'ត្រូវការជំនួយ?'
                    : 'Need a Hint?'}
                </span>
              </button>
            )}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => onNavigateStep(stepIndex + 1)}
              disabled={!canGoNext}
              className="px-2.5 sm:px-3 py-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] hover:-translate-y-0.5 disabled:hover:translate-y-0 transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span className="hidden sm:inline">{isKhmer ? 'បន្ទាប់' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
