import React, { useState, useEffect } from 'react';
import { StepItem, Language } from '../types';
import { Lightbulb, Sparkles, HelpCircle, X, ChevronRight, Loader2, Layers } from 'lucide-react';
import { TunsayAvatar } from './TunsayAvatar';
import { requestHintApi } from '../services/geminiService';

interface HintSheetProps {
  step: StepItem;
  isOpen: boolean;
  language?: Language | undefined;
  sessionId?: string | undefined;
  gradeLevel?: string | undefined;
  onHintLevelChange?: (level: number) => void;
  onClose: () => void;
}

export const HintSheet: React.FC<HintSheetProps> = ({
  step,
  isOpen,
  language = 'km',
  sessionId,
  gradeLevel = 'grade_1_3',
  onHintLevelChange,
  onClose
}) => {
  const [hintLevel, setHintLevel] = useState<1 | 2 | 3>(() => {
    const initial = step.currentHintLevel && step.currentHintLevel >= 1 ? step.currentHintLevel : 1;
    return Math.min(3, Math.max(1, initial)) as 1 | 2 | 3;
  });
  const [dynamicHint, setDynamicHint] = useState<string | null>(null);
  const [isLoadingDynamicHint, setIsLoadingDynamicHint] = useState(false);
  const isKhmer = language === 'km';

  const selectTier = (tier: 1 | 2 | 3) => {
    setHintLevel(tier);
    onHintLevelChange?.(tier);
  };

  const handleFetchBackendHint = async () => {
    if (!sessionId) return;
    setIsLoadingDynamicHint(true);
    const res = await requestHintApi(sessionId, language, gradeLevel);
    setIsLoadingDynamicHint(false);
    if (res?.text) {
      setDynamicHint(res.text);
      const nextTier = Math.min(3, hintLevel + 1) as 1 | 2 | 3;
      selectTier(nextTier);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tier1Text = step.hints?.[0] || (isKhmer ? step.hint1?.khmer : step.hint1?.eng);
  const tier2Text = step.hints?.[1] || (isKhmer ? step.hint2?.khmer : step.hint2?.eng) || step.helpfulExample;
  const tier3Text = step.hints?.[2] || (isKhmer ? step.hint3?.exampleKhmer : step.hint3?.exampleEng);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1B4332]/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn text-[#1B4332]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-sheet-title"
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border-3 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] overflow-hidden flex flex-col max-h-[85vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet Header */}
        <div className="p-4 bg-[#1B4332] border-b-3 border-[#1B4332] flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#40916C] rounded-2xl border-2 border-white flex items-center justify-center shadow-[1px_1px_0px_white]">
              <TunsayAvatar size="sm" state="thinking" showBadge={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="hint-sheet-title" className="text-base sm:text-lg font-black text-white font-heading flex items-center gap-1.5 drop-shadow-[1px_1px_0px_#1B4332]">
                  <Lightbulb className="w-5 h-5 text-[#FFE600] fill-[#FFE600]" />
                  {isKhmer ? 'តម្រុយ ៣ កម្រិតពី ទន្សាយ' : "Tunsay's 3-Tier Hints"}
                </h3>
                <span className="px-2 py-0.5 bg-[#40916C] text-white text-[10px] font-black rounded-full border border-white/20">
                  {isKhmer ? `កម្រិត ${hintLevel} នៃ 3` : `Tier ${hintLevel} of 3`}
                </span>
              </div>
              <p className="text-xs text-[#A7CDB4] font-bold">
                {isKhmer 
                  ? `ជំហានទី ${step.stepNumber || 1} នៃ ${step.totalSteps || 1} • គ្មានការប្រាប់ចម្លើយផ្ទាល់` 
                  : `Step ${step.stepNumber || 1} of ${step.totalSteps || 1} • Zero answer leakage`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#2D6A4F] border-2 border-white/30 text-white hover:bg-[#40916C] transition-colors cursor-pointer"
            title="Close hints"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Spec §4 3-Tier Progressive Selector Tabs */}
        <div className="flex border-b-3 border-[#1B4332] bg-[#E8F5E9] p-2 gap-1.5">
          <button
            type="button"
            onClick={() => selectTier(1)}
            className={`flex-1 py-2 px-2 rounded-2xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer border-2 border-[#1B4332] ${
              hintLevel === 1 
                ? 'bg-[#40916C] text-white shadow-[2px_2px_0px_#1B4332] -translate-y-0.5' 
                : 'bg-white text-[#1B4332]/80 hover:bg-[#40916C]/30'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isKhmer ? 'កម្រិត ១៖ ណែនាំ' : 'Tier 1: Nudge'}</span>
          </button>

          <button
            type="button"
            onClick={() => selectTier(2)}
            className={`flex-1 py-2 px-2 rounded-2xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer border-2 border-[#1B4332] ${
              hintLevel === 2 
                ? 'bg-[#D97706] text-white shadow-[2px_2px_0px_#1B4332] -translate-y-0.5' 
                : 'bg-white text-[#1B4332]/80 hover:bg-[#FEF3C7]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isKhmer ? 'កម្រិត ២៖ រូបភាព' : 'Tier 2: Visual'}</span>
          </button>

          <button
            type="button"
            onClick={() => selectTier(3)}
            className={`flex-1 py-2 px-2 rounded-2xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer border-2 border-[#1B4332] ${
              hintLevel === 3 
                ? 'bg-[#2D6A4F] text-white shadow-[2px_2px_0px_#1B4332] -translate-y-0.5' 
                : 'bg-white text-[#1B4332]/80 hover:bg-[#2D6A4F]/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isKhmer ? 'កម្រិត ៣៖ បំបែក' : 'Tier 3: Breakdown'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {hintLevel === 1 && (
            <div className="bg-[#E8F5E9] p-4 rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between gap-2 border-b border-[#1B4332]/10 pb-1.5">
                <div className="flex items-center gap-2 text-[#1B4332] font-black text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-[#2D6A4F]" />
                  <span>{isKhmer ? 'កម្រិត ១៖ តម្រុយណែនាំយុទ្ធសាស្ត្រ (Guiding Nudge)' : 'Tier 1: Guiding Arithmetic Strategy'}</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-[#2D6A4F]">
                {isKhmer ? '💡 ចង្អុលបង្ហាញវិធីគិត និងយុទ្ធសាស្ត្រគណនា ដោយមិនបញ្ចេញចម្លើយ៖' : '💡 Points directly to arithmetic strategy without answer leakage:'}
              </p>
              <p className="text-sm sm:text-base text-[#1B4332] font-black leading-relaxed bg-white p-3 rounded-xl border-2 border-[#1B4332]/20">
                {tier1Text}
              </p>
            </div>
          )}

          {hintLevel === 2 && (
            <div className="bg-gradient-to-r from-[#FFFBEA] to-[#FEF3C7] p-4 rounded-2xl border-3 border-[#D97706] shadow-[3px_3px_0px_#D97706] space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between gap-2 border-b border-[#D97706]/20 pb-1.5">
                <div className="flex items-center gap-2 text-[#92400E] font-black text-xs sm:text-sm">
                  <HelpCircle className="w-4 h-4 text-[#D97706]" />
                  <span>{isKhmer ? 'កម្រិត ២៖ រូបភាពជំនួយ (Visual Scaffold)' : 'Tier 2: Visual Emoji Scaffold'}</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-[#B45309]">
                {isKhmer ? '🍎 ជំនួយតាមរយៈរូបភាព ឬការគូសចំណាំបង្ហាញចំនួន៖' : '🍎 Visual representation / emoji cross-out helper:'}
              </p>
              <p className="text-sm sm:text-base text-[#78350F] font-black leading-relaxed bg-white p-3 rounded-xl border-2 border-[#D97706]/40 whitespace-pre-wrap">
                {tier2Text}
              </p>
            </div>
          )}

          {hintLevel === 3 && (
            <div className="bg-[#E8F5E9] p-4 rounded-2xl border-3 border-[#2D6A4F] shadow-[3px_3px_0px_#2D6A4F] space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between gap-2 border-b border-[#2D6A4F]/20 pb-1.5">
                <div className="flex items-center gap-2 text-[#1B4332] font-black text-xs sm:text-sm">
                  <Layers className="w-4 h-4 text-[#2D6A4F]" />
                  <span>{isKhmer ? 'កម្រិត ៣៖ បំបែកជាជំហានតូចៗ (Micro-Breakdown)' : 'Tier 3: Micro-Breakdown Calculation'}</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-[#2D6A4F]">
                {isKhmer ? '📐 បំបែកការគណនាជា ២ ជំហានតូចៗងាយស្រួលធ្វើ៖' : '📐 Breaks down the calculation into 2 friendly micro baby-steps:'}
              </p>
              <p className="text-sm sm:text-base text-[#1B4332] font-black leading-relaxed bg-white p-3 rounded-xl border-2 border-[#1B4332]/20 whitespace-pre-wrap">
                {tier3Text}
              </p>
            </div>
          )}

          {/* Dynamic AI Hint from Backend HintEngine */}
          {dynamicHint && (
            <div className="bg-[#D8F3DC] p-4 rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#1B4332] font-black text-sm">
                <Sparkles className="w-4 h-4 text-[#2D6A4F]" />
                <span>{isKhmer ? 'តម្រុយបន្ថែមពី AI Hint Engine៖' : 'Adaptive AI Hint from Backend:'}</span>
              </div>
              <p className="text-sm sm:text-base text-[#1B4332] font-black leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border-2 border-[#1B4332]/20">
                {dynamicHint}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 p-3.5 bg-[#A7CDB4] rounded-2xl border-3 border-[#1B4332] shadow-[2px_2px_0px_#1B4332]">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-5 h-5 text-[#1B4332] shrink-0" />
              <p className="text-xs sm:text-sm text-[#1B4332] font-black truncate">
                {isKhmer
                  ? "ត្រូវការតម្រុយបន្ថែមពី AI?"
                  : "Need deeper progressive hints from AI?"}
              </p>
            </div>
            <button
              type="button"
              onClick={sessionId ? handleFetchBackendHint : undefined}
              disabled={!sessionId || isLoadingDynamicHint}
              title={!sessionId ? (isKhmer ? 'ត្រូវការ Backend ដំណើរការ' : 'Requires backend connection') : undefined}
              className="px-3 py-1.5 bg-[#2D6A4F] text-white hover:bg-[#1B4332] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black rounded-xl border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
            >
              {isLoadingDynamicHint ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lightbulb className="w-3.5 h-3.5" />
              )}
              <span>{isKhmer ? 'សុំតម្រុយ AI' : 'Ask AI Hint'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-white border-t-3 border-[#1B4332] flex items-center justify-between">
          {hintLevel < 3 ? (
            <button
              type="button"
              onClick={() => selectTier((hintLevel + 1) as 1 | 2 | 3)}
              className="text-xs sm:text-sm font-black text-[#1B4332] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isKhmer ? `មើលតម្រុយបន្ទាប់ (Tier ${hintLevel + 1})` : `See next tier (Tier ${hintLevel + 1})`}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <span className="text-xs font-black text-[#2D6A4F] flex items-center gap-1">
              <span>🌟</span>
              <span>{isKhmer ? 'ត្រៀមខ្លួនសាកល្បងចម្លើយ!' : 'Ready to try your answer!'}</span>
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-black text-xs sm:text-sm rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] transition-all cursor-pointer"
          >
            {isKhmer ? 'យល់ហើយ!' : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
};

