import React from 'react';
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
}) => {
  const isKhmer = language === 'km';
  const stepNum = step.stepNumber || stepIndex + 1;

  const isCompleted = completedStepIndices.includes(stepIndex) || step.status === 'completed';
  const currentHintLevel = step.currentHintLevel ?? 0;

  // 4-Part Socratic Card data extraction per spec §3
  const missionText  = step.mission        || (isKhmer ? step.questionKhmer          : step.questionEng);
  const clueText     = step.clue           || (isKhmer ? step.hint1?.khmer           : step.hint1?.eng);
  const exampleText  = step.helpfulExample || (isKhmer ? step.hint3?.exampleKhmer    : step.hint3?.exampleEng);
  const yourTurnText = step.yourTurn       || (isKhmer ? step.socraticPromptKhmer    : step.socraticPromptEng);

  // Active inline hint text based on current unlocked tier (spec §4)
  const getActiveHintContent = (tier: number) => {
    if (tier === 1) {
      return {
        title: isKhmer ? 'តម្រុយណែនាំ (Tier 1: Guiding Nudge)' : 'Tier 1: Guiding Nudge',
        icon: '💡',
        text: step.hints?.[0] || (isKhmer ? step.hint1?.khmer : step.hint1?.eng)
      };
    }
    if (tier === 2) {
      return {
        title: isKhmer ? 'រូបភាពជំនួយ (Tier 2: Visual Scaffold)' : 'Tier 2: Visual Scaffold',
        icon: '🍎',
        text: step.hints?.[1] || (isKhmer ? step.hint2?.khmer : step.hint2?.eng) || step.helpfulExample
      };
    }
    return {
      title: isKhmer ? 'បំបែកជំហានតូចៗ (Tier 3: Micro-Breakdown)' : 'Tier 3: Micro-Breakdown',
      icon: '📐',
      text: step.hints?.[2] || (isKhmer ? step.hint3?.exampleKhmer : step.hint3?.exampleEng)
    };
  };

  const canGoBack = stepIndex > 0;
  // Next is enabled if current step is solved or if reviewing an earlier step
  const canGoNext = (isCompleted || stepIndex < Math.max(...completedStepIndices, -1)) && (stepIndex + 1 < totalSteps);

  return (
    <div className="w-full max-w-[94%] sm:max-w-[88%] rounded-3xl border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] overflow-hidden animate-fadeIn bg-white">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1B4332]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-3 py-1 bg-[#40916C] text-white text-[11px] font-black rounded-full border border-white/20 tracking-wide shrink-0">
            🧩&nbsp;
            {isKhmer
              ? `ជំហានទី ${stepNum} នៃ ${totalSteps}`
              : `Step ${stepNum} of ${totalSteps}`}
          </span>
          {step.title && (
            <span className="text-[#A7CDB4] text-[11px] font-bold hidden sm:inline truncate max-w-[140px]">
              • {step.title}
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
      <div className="p-4 space-y-3">

        {/* 🌟 Our Mission */}
        {missionText && (
          <div className="p-3.5 bg-[#F4FBF7] rounded-2xl border-2 border-[#2D6A4F] shadow-[1px_1px_0px_#2D6A4F]">
            <p className="text-[10px] sm:text-[11px] font-black text-[#2D6A4F] uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <span>🌟</span>
              <span>{isKhmer ? 'បេសកកម្មរបស់យើង' : 'Our Mission'}</span>
            </p>
            <p className="text-xs sm:text-sm font-black text-[#1B4332] leading-snug">{missionText}</p>
          </div>
        )}

        {/* 💡 Clue */}
        {clueText && (
          <div className="p-3.5 bg-gradient-to-r from-[#FFFBEA] to-[#FEF3C7] rounded-2xl border-2 border-[#D97706] shadow-[1px_1px_0px_#D97706]">
            <p className="text-[10px] sm:text-[11px] font-black text-[#B45309] uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <span>💡</span>
              <span>{isKhmer ? 'តម្រុយគន្លឹះ' : 'Clue'}</span>
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#78350F] leading-relaxed">{clueText}</p>
          </div>
        )}

        {/* 🍎 Helpful Example */}
        {exampleText && (
          <div className="p-3.5 bg-[#FDF2F8] rounded-2xl border-2 border-[#DB2777] shadow-[1px_1px_0px_#DB2777]">
            <p className="text-[10px] sm:text-[11px] font-black text-[#BE185D] uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <span>🍎</span>
              <span>{isKhmer ? 'រូបភាព / ឧទាហរណ៍ជំនួយ' : 'Helpful Example'}</span>
            </p>
            <blockquote className="pl-3 border-l-[3px] border-[#DB2777] text-xs sm:text-sm font-black text-[#831843] leading-relaxed whitespace-pre-wrap">
              {exampleText}
            </blockquote>
          </div>
        )}

        {/* 👉 Your Turn & Review Mode Container */}
        <div className={`p-4 rounded-2xl border-2 border-[#1B4332] transition-all ${
          isLatest && !isCompleted
            ? 'bg-[#E8F5E9] shadow-[2px_2px_0px_#1B4332] ring-2 ring-[#40916C] ring-offset-1'
            : isCompleted
            ? 'bg-[#F4FBF7] shadow-[1px_1px_0px_#1B4332]'
            : 'bg-[#F4FBF7] opacity-85'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] sm:text-[11px] font-black text-[#1B4332] uppercase tracking-wider flex items-center gap-1">
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

          <p className="text-sm sm:text-base font-black text-[#1B4332] leading-relaxed">{yourTurnText}</p>

          {/* Review Mode: Display recorded answer badge instead of typing prompt */}
          {isCompleted ? (
            <div className="mt-3 p-2.5 sm:p-3 bg-white rounded-xl border-2 border-[#2D6A4F] text-xs sm:text-sm font-black text-[#1B4332] flex items-center justify-between gap-2 shadow-[1px_1px_0px_#2D6A4F]">
              <span className="flex items-center gap-1.5 text-[#2D6A4F]">
                <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                <span>{isKhmer ? 'បានដោះស្រាយរួចរាល់! ចម្លើយរបស់អ្នក៖' : 'Solved! Your Answer:'}</span>
              </span>
              <span className="px-2.5 py-0.5 bg-[#E8F5E9] rounded-lg border border-[#2D6A4F]/40 text-[#1B4332] font-black">
                "{step.studentAnswer || (isKhmer ? 'ត្រឹមត្រូវ' : 'Done')}"
              </span>
            </div>
          ) : isLatest ? (
            <p className="text-[11px] text-[#2D6A4F] font-bold mt-2 flex items-center gap-1 animate-pulse">
              <span>⌨️</span>
              <span>
                {isKhmer
                  ? 'វាយចម្លើយរបស់អ្នកនៅប្រអប់ជជែកខាងក្រោម...'
                  : 'Type your answer in the chat box below...'}
              </span>
            </p>
          ) : null}
        </div>

        {/* ── Spec §4 Inline Hint Box (Visible when hint is unlocked) ─── */}
        {currentHintLevel > 0 && (() => {
          const hintData = getActiveHintContent(currentHintLevel);
          return (
            <div className="p-3.5 bg-gradient-to-r from-[#FFFBEA] to-[#FEF3C7] rounded-2xl border-2 border-[#D97706] shadow-[2px_2px_0px_#D97706] animate-fadeIn">
              <div className="flex items-center justify-between gap-2 mb-1.5">
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

        {/* ── Footer: Spec §4 & §6 Back / Numbered Dots / Next Controls ─ */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-[#1B4332]/10 gap-2 flex-wrap">

          {/* Left: Back Button */}
          <button
            type="button"
            onClick={() => onNavigateStep(stepIndex - 1)}
            disabled={!canGoBack}
            className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-[#F4FBF7] disabled:opacity-40 disabled:cursor-not-allowed text-[#1B4332] text-xs font-black rounded-xl border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] hover:-translate-y-0.5 disabled:hover:translate-y-0 transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">{isKhmer ? 'ថយក្រោយ' : 'Back'}</span>
          </button>

          {/* Center: Interactive Numbered Progress Dots */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {Array.from({ length: totalSteps }, (_, i) => {
              const isDone   = completedStepIndices.includes(i) || (step.status === 'completed' && i === stepIndex);
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
                className="px-2.5 sm:px-3 py-1.5 bg-[#FFFBEA] hover:bg-[#FEF3C7] text-[#92400E] text-xs font-black rounded-xl border-2 border-[#D97706] shadow-[1.5px_1.5px_0px_#D97706] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1 cursor-pointer"
                title={isKhmer ? 'សុំតម្រុយ' : 'Need a hint?'}
              >
                <Lightbulb className="w-3.5 h-3.5 fill-[#D97706] stroke-[2]" />
                <span className="hidden sm:inline">
                  {currentHintLevel > 0
                    ? (isKhmer ? `តម្រុយ (${currentHintLevel}/3)` : `Hint (${currentHintLevel}/3)`)
                    : (isKhmer ? 'ត្រូវការជំនួយ?' : 'Need a Hint?')}
                </span>
              </button>
            )}

            {/* Next Button */}
            <button
              type="button"
              onClick={() => onNavigateStep(stepIndex + 1)}
              disabled={!canGoNext}
              className="px-2.5 sm:px-3 py-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] hover:-translate-y-0.5 disabled:hover:translate-y-0 transition-all flex items-center gap-1 cursor-pointer shrink-0"
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
