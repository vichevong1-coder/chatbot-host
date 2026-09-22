import React, { useState } from 'react';
import { StepItem, Language } from '../types';
import { TunsayAvatar } from './TunsayAvatar';
import { 
  Lightbulb, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ListOrdered 
} from 'lucide-react';
import { cleanBilingualOption } from '../utils/language';

interface StepCardProps {
  step: StepItem;
  currentStepIndex?: number | undefined;
  totalSteps?: number | undefined;
  language?: Language | undefined;
  onAnswerSubmit: (answer: string) => boolean;
  onOpenHints: () => void;
  onOpenExplainDifferently: () => void;
  onPreviousStep?: (() => void) | undefined;
  onNextStep?: (() => void) | undefined;
  onOpenAllSteps?: (() => void) | undefined;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  currentStepIndex = 0,
  totalSteps = 1,
  language = 'km',
  onAnswerSubmit,
  onOpenHints,
  onOpenExplainDifferently,
  onPreviousStep,
  onNextStep,
  onOpenAllSteps,
}) => {
  const isKhmer = language === 'km';
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [typedAnswer, setTypedAnswer] = useState('');

  const stepNum = step.stepNumber || currentStepIndex + 1;
  const totSteps = totalSteps || step.totalSteps || 1;

  const handleOptionClick = (rawOption: string) => {
    const cleaned = cleanBilingualOption(rawOption, language);
    setSelectedOption(cleaned);
    const isCorrect = onAnswerSubmit(cleaned);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim()) return;
    const isCorrect = onAnswerSubmit(typedAnswer.trim());
    setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  // 4-Part Data extraction
  const missionText = step.mission || (isKhmer ? step.questionKhmer : step.questionEng);
  const clueText = step.clue || (isKhmer ? step.hint1?.khmer : step.hint1?.eng);
  const exampleText = step.helpfulExample || (isKhmer ? step.hint3?.exampleKhmer : step.hint3?.exampleEng);
  const yourTurnText = step.yourTurn || (isKhmer ? step.socraticPromptKhmer : step.socraticPromptEng);

  const canGoBack = currentStepIndex > 0 && onPreviousStep;
  const canGoForward = currentStepIndex + 1 < totSteps && onNextStep;

  return (
    <div className="w-full bg-white rounded-3xl border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] p-4 sm:p-6 space-y-4 animate-fadeIn">
      {/* Top Banner: Step Indicator, Title & All Steps Checklist Button */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b-2 border-[#1B4332]/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#40916C] rounded-2xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] flex items-center justify-center">
            <TunsayAvatar 
              size="sm" 
              state={feedback === 'incorrect' ? 'thinking' : feedback === 'correct' ? 'celebrating' : 'explaining'} 
              showBadge={false} 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 bg-[#2D6A4F] text-white text-xs font-black rounded-full border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332]">
                {isKhmer 
                  ? `ជំហានទី ${stepNum} នៃ ${totSteps}` 
                  : `Step ${stepNum} of ${totSteps}`}
              </span>
              {step.title && (
                <span className="text-xs font-black text-[#2D6A4F] hidden sm:inline">
                  • {step.title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Action: View All Steps Drawer */}
        {onOpenAllSteps && (
          <button
            type="button"
            onClick={onOpenAllSteps}
            className="px-3 py-1.5 bg-[#E8F5E9] hover:bg-[#D8F3DC] text-[#1B4332] rounded-xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5"
            title={isKhmer ? 'មើលជំហានទាំងអស់' : 'View All Steps'}
          >
            <ListOrdered className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isKhmer ? 'ជំហានទាំងអស់' : 'All Steps'}</span>
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          THE 4-PART SOCRATIC STEP CARD SPECIFICATION
          1. 🌟 Our Mission
          2. 💡 Clue (rule / formula with ambient glow)
          3. 🍎 Helpful Picture / Example (concrete analogy / emojis)
          4. 👉 Your Turn (highlighted prompt + answer input)
         ───────────────────────────────────────────────────────────── */}

      {/* Block 1: 🌟 Our Mission */}
      {missionText && (
        <div className="p-3.5 bg-[#F4FBF7] rounded-2xl border-2 border-[#2D6A4F] text-[#1B4332] shadow-[2px_2px_0px_#2D6A4F]">
          <span className="text-xs font-black uppercase tracking-wider text-[#2D6A4F] flex items-center gap-1">
            <span>🌟</span>
            <span>{isKhmer ? 'បេសកកម្មរបស់យើង (Our Mission)' : 'Our Mission'}</span>
          </span>
          <p className="font-heading font-black text-sm sm:text-base text-[#1B4332] mt-1 leading-snug">
            {missionText}
          </p>
        </div>
      )}

      {/* Block 2: 💡 Clue (Knowledge Base Rule / Formula) */}
      {clueText && (
        <div className="p-3.5 bg-gradient-to-r from-[#FFFBEA] to-[#FEF3C7] rounded-2xl border-2 border-[#D97706] text-[#92400E] shadow-[2px_2px_0px_#D97706]">
          <span className="text-xs font-black uppercase tracking-wider text-[#B45309] flex items-center gap-1">
            <span>💡</span>
            <span>{isKhmer ? 'តម្រុយគន្លឹះ (Clue)' : 'Clue'}</span>
          </span>
          <p className="font-bold text-xs sm:text-sm text-[#78350F] mt-1 leading-relaxed">
            {clueText}
          </p>
        </div>
      )}

      {/* Block 3: 🍎 Helpful Picture / Example (Isomorphic Parallel Analogy) */}
      {exampleText && (
        <div className="p-3.5 bg-[#FDF2F8] rounded-2xl border-2 border-[#DB2777] text-[#9D174D] shadow-[2px_2px_0px_#DB2777]">
          <span className="text-xs font-black uppercase tracking-wider text-[#BE185D] flex items-center gap-1">
            <span>🍎</span>
            <span>{isKhmer ? 'រូបភាព ឬឧទាហរណ៍ជំនួយ (Helpful Example)' : 'Helpful Example'}</span>
          </span>
          <blockquote className="mt-1 pl-3 border-l-3 border-[#DB2777] text-xs sm:text-sm font-black text-[#831843] leading-relaxed whitespace-pre-wrap">
            {exampleText}
          </blockquote>
        </div>
      )}

      {/* Block 4: 👉 Your Turn (One Specific Question & Answer Input) */}
      <div className="p-4 bg-[#E8F5E9] rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-[#1B4332] flex items-center gap-1">
          <span>👉</span>
          <span>{isKhmer ? 'វេនរបស់អ្នក (Your Turn)' : 'Your Turn'}</span>
        </span>
        <p className="text-sm sm:text-base font-black text-[#1B4332] leading-relaxed">
          {yourTurnText}
        </p>

        {/* Answer Options or Input Area */}
        {step.options && step.options.length > 0 ? (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-black text-[#1B4332] uppercase">
              {isKhmer ? 'ជ្រើសរើសចម្លើយរបស់អ្នក៖' : 'Choose your answer:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {step.options.map((opt, idx) => {
                const displayOpt = cleanBilingualOption(opt, language);
                const isSelected = selectedOption === displayOpt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOptionClick(opt)}
                    className={`p-3.5 rounded-2xl border-2.5 font-black text-xs sm:text-sm transition-all text-left flex items-center justify-between cursor-pointer ${
                      isSelected && feedback === 'correct'
                        ? 'bg-[#2D6A4F] border-[#1B4332] text-white shadow-[2px_2px_0px_#1B4332]'
                        : isSelected && feedback === 'incorrect'
                        ? 'bg-[#E63946] border-[#1B4332] text-white shadow-[2px_2px_0px_#1B4332]'
                        : 'bg-white border-[#1B4332] text-[#1B4332] hover:bg-[#D8F3DC] shadow-[2px_2px_0px_#1B4332] hover:-translate-y-0.5'
                    }`}
                  >
                    <span>{displayOpt}</span>
                    {isSelected && feedback === 'correct' && (
                      <CheckCircle className="w-4 h-4 text-white stroke-[3]" />
                    )}
                    {isSelected && feedback === 'incorrect' && (
                      <AlertCircle className="w-4 h-4 text-white stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder={isKhmer ? 'វាយចម្លើយសម្រាប់ជំហាននេះ...' : 'Type answer for this step...'}
                className="flex-1 p-3 bg-white rounded-xl border-2 sm:border-3 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] font-black text-xs sm:text-sm text-[#1B4332] focus:outline-none placeholder:text-[#1B4332]/40"
              />
              <button
                type="submit"
                disabled={!typedAnswer.trim()}
                className="px-4 py-3 bg-[#1B4332] hover:bg-[#2D6A4F] disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl border-2 sm:border-3 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] hover:-translate-y-0.5 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <span>{isKhmer ? 'ឆ្លើយ' : 'Submit'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback === 'correct' && (
        <div className="p-3 bg-[#2D6A4F] text-white rounded-2xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] flex items-center gap-2 font-black text-xs sm:text-sm animate-fadeIn">
          <CheckCircle className="w-4 h-4 stroke-[3]" />
          <span>{isKhmer ? '✨ ត្រឹមត្រូវហើយ! ពូកែណាស់!' : '✨ Correct! Awesome job!'}</span>
        </div>
      )}

      {feedback === 'incorrect' && (
        <div className="p-3 bg-[#D97706] text-white rounded-2xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] flex items-center justify-between gap-2 font-black text-xs sm:text-sm animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 stroke-[3]" />
            <span>{isKhmer ? 'ព្យាយាមម្តងទៀត! ចុចមើលតម្រុយខាងក្រោម' : 'Try again! Check the hint below'}</span>
          </div>
          <button
            type="button"
            onClick={onOpenHints}
            className="px-2.5 py-1 bg-white text-[#92400E] rounded-xl border border-[#1B4332] text-xs font-black cursor-pointer shadow-sm"
          >
            {isKhmer ? 'តម្រុយ' : 'Hint'}
          </button>
        </div>
      )}

      {/* Navigation Controls: Previous / Next Step Buttons + Scaffolding Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t-2 border-[#1B4332]/20">
        {/* Step Navigation: Next / Back */}
        <div className="flex items-center gap-2">
          {canGoBack && (
            <button
              type="button"
              onClick={onPreviousStep}
              className="px-3 py-2 bg-white text-[#1B4332] hover:bg-[#E8F5E9] rounded-xl font-black text-xs border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5 flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
              <span>{isKhmer ? 'ថយក្រោយ' : 'Back'}</span>
            </button>
          )}

          {canGoForward && (
            <button
              type="button"
              onClick={onNextStep}
              className="px-3 py-2 bg-[#2D6A4F] text-white hover:bg-[#1B4332] rounded-xl font-black text-xs border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>{isKhmer ? 'បន្ទាប់' : 'Next'}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>

        {/* AI Scaffolding Actions: Hint & Explain Differently */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onOpenHints}
            className="px-3 py-2 bg-[#FFFBEA] text-[#92400E] hover:bg-[#FEF3C7] rounded-xl font-black text-xs border-2 border-[#D97706] shadow-[2px_2px_0px_#D97706] hover:-translate-y-0.5 active:translate-y-0.5 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 fill-[#D97706] stroke-[2.5]" />
            <span>{isKhmer ? 'ជំនួយ' : 'Hint'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenExplainDifferently}
            className="px-3 py-2 bg-[#FDF2F8] text-[#9D174D] hover:bg-[#FCE7F3] rounded-xl font-black text-xs border-2 border-[#DB2777] shadow-[2px_2px_0px_#DB2777] hover:-translate-y-0.5 active:translate-y-0.5 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isKhmer ? 'ពន្យល់' : 'Analogy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
