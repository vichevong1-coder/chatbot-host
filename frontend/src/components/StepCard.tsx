import React, { useState, useEffect } from 'react';
import { StepItem, Language } from '../types';
import { TunsayAvatar } from './TunsayAvatar';
import { Lightbulb, RefreshCw, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { cleanBilingualOption } from '../utils/language';

interface StepCardProps {
  step: StepItem;
  language?: Language;
  onAnswerSubmit: (answer: string) => boolean;
  onOpenHints: () => void;
  onOpenExplainDifferently: () => void;
  onNavigateStep?: (stepIdx: number) => void;
}

export const StepCard: React.FC<StepCardProps> = ({
  step,
  language = 'km',
  onAnswerSubmit,
  onOpenHints,
  onOpenExplainDifferently,
}) => {
  const isKhmer = language === 'km';
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [typedAnswer, setTypedAnswer] = useState('');

  useEffect(() => {
    setSelectedOption(null);
    setFeedback('none');
    setTypedAnswer('');
  }, [step.id, step.stepNumber]);

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

  const promptText =
    step.yourTurn ||
    (isKhmer ? step.socraticPromptKhmer : step.socraticPromptEng) ||
    step.mission ||
    (isKhmer ? step.questionKhmer : step.questionEng);

  const titleText =
    (isKhmer ? step.questionKhmer : step.questionEng) ||
    step.title ||
    `Step ${step.stepNumber}`;

  return (
    <div className="w-full bg-white rounded-3xl border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] p-5 sm:p-6 space-y-4 animate-fadeIn">
      {/* Top Banner: Step Indicator & Title */}
      <div className="flex items-center space-x-3 text-left">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#40916C] rounded-2xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] flex items-center justify-center shrink-0">
          <TunsayAvatar
            size="sm"
            state={feedback === 'incorrect' ? 'encouraging' : feedback === 'correct' ? 'celebrating' : 'explaining'}
            showBadge={false}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-0.5 bg-[#1B4332] text-white text-[11px] sm:text-xs font-black rounded-full border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#40916C] shrink-0">
              {isKhmer 
                ? `ជំហានទី ${step.stepNumber} នៃ ${step.totalSteps}` 
                : `Step ${step.stepNumber} of ${step.totalSteps}`}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-black text-[#1B4332] font-heading mt-1 leading-snug">
            {titleText}
          </h4>
        </div>
      </div>

      {/* Socratic Guiding Prompt Box (Mint Green) */}
      <div className="p-4 sm:p-5 bg-[#E8F5E9] rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] space-y-2.5 text-left">
        <p className="text-[11px] font-black text-[#1B4332] uppercase tracking-wider pb-1 border-b border-[#1B4332]/15">
          {isKhmer ? 'សំណួរណែនាំពី REANMORE' : "REANMORE'S GUIDING PROMPT"}
        </p>

        {/* 4-Part Socratic Breakdown if available */}
        {(step.mission || step.clue || step.helpfulExample || step.yourTurn) ? (
          <div className="space-y-2">
            {step.mission && (
              <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border-2 border-[#1B4332]/20">
                <span className="text-sm shrink-0">🌟</span>
                <div className="text-xs sm:text-sm font-bold text-[#1B4332] leading-snug">
                  <span className="font-black mr-1">{isKhmer ? 'បេសកកម្ម៖' : 'Mission:'}</span>
                  {step.mission}
                </div>
              </div>
            )}

            {step.clue && (
              <div className="flex items-start gap-2 bg-[#A7CDB4]/30 p-2.5 rounded-xl border-2 border-[#1B4332]/20">
                <span className="text-sm shrink-0">💡</span>
                <div className="text-xs sm:text-sm font-bold text-[#1B4332] leading-snug">
                  <span className="font-black mr-1">{isKhmer ? 'តម្រុយ៖' : 'Clue:'}</span>
                  {step.clue}
                </div>
              </div>
            )}

            {step.helpfulExample && (
              <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-xl border-2 border-[#1B4332]/20">
                <span className="text-sm shrink-0">🍎</span>
                <div className="text-xs sm:text-sm font-bold text-[#1B4332] leading-snug">
                  <span className="font-black mr-1">{isKhmer ? 'ឧទាហរណ៍ជំនួយ៖' : 'Example:'}</span>
                  {step.helpfulExample}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 bg-white p-3 rounded-xl border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332]">
              <span className="text-sm shrink-0">👉</span>
              <div className="text-xs sm:text-sm font-black text-[#1B4332] leading-snug">
                <span className="mr-1">{isKhmer ? 'វេនរបស់អ្នក៖' : 'Your Turn:'}</span>
                {step.yourTurn || promptText}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm sm:text-base font-black text-[#1B4332] leading-relaxed">
            {promptText}
          </p>
        )}
      </div>

      {/* Answer Options or Full-Width Input Box */}
      {step.options ? (
        <div className="space-y-3">
          <p className="text-xs font-black text-[#1B4332] uppercase text-left">
            {isKhmer ? 'ជ្រើសរើសចម្លើយរបស់អ្នក៖' : 'Choose your answer:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {step.options.map((opt, idx) => {
              const displayOpt = cleanBilingualOption(opt, language);
              const isSelected = selectedOption === displayOpt;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleOptionClick(opt)}
                  className={`p-3.5 rounded-2xl border-3 font-black text-sm sm:text-base transition-all text-left flex items-center justify-between cursor-pointer ${
                    isSelected && feedback === 'correct'
                      ? 'bg-[#2D6A4F] border-[#1B4332] text-white shadow-[3px_3px_0px_#1B4332]'
                      : isSelected && feedback === 'incorrect'
                      ? 'bg-[#2D6A4F] border-[#1B4332] text-white shadow-[3px_3px_0px_#1B4332]'
                      : 'bg-white border-[#1B4332] text-[#1B4332] hover:bg-[#40916C]/30 shadow-[3px_3px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5'
                  }`}
                >
                  <span>{displayOpt}</span>
                  {isSelected && feedback === 'correct' && (
                    <CheckCircle className="w-5 h-5 text-white stroke-[3]" />
                  )}
                  {isSelected && feedback === 'incorrect' && (
                    <AlertCircle className="w-5 h-5 text-white stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="relative w-full">
          <input
            type="text"
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            placeholder={isKhmer ? 'វាយចម្លើយរបស់អ្នកនៅទីនេះ...' : 'Type your answer here...'}
            className="w-full p-3.5 sm:p-4 pr-14 bg-white rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] font-black text-sm sm:text-base text-[#1B4332] focus:outline-none placeholder-[#1B4332]/40"
          />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-[#1B4332] text-white rounded-xl flex items-center justify-center border-2 border-[#1B4332] hover:bg-[#2D6A4F] hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[1px_1px_0px_#1B4332]"
            aria-label="Submit Answer"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          </button>
        </form>
      )}

      {/* Feedback Banner */}
      {feedback === 'correct' && (
        <div className="p-3 bg-[#2D6A4F] text-white rounded-2xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] flex items-center gap-2 font-black text-xs sm:text-sm animate-fadeIn">
          <CheckCircle className="w-4 h-4 stroke-[3]" />
          <span>{isKhmer ? 'ត្រឹមត្រូវហើយ! ពូកែណាស់!' : 'Correct! Awesome job!'}</span>
        </div>
      )}

      {feedback === 'incorrect' && (
        <div className="p-3 bg-[#40916C] text-[#1B4332] rounded-2xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] flex items-center justify-between gap-2 font-black text-xs sm:text-sm animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 stroke-[3]" />
            <span>{isKhmer ? 'ព្យាយាមម្តងទៀត! មើលតម្រុយខាងក្រោម' : 'Try again! Check the hint'}</span>
          </div>
          <button
            type="button"
            onClick={onOpenHints}
            className="px-2.5 py-1 bg-white text-[#1B4332] rounded-lg border-2 border-[#1B4332] text-xs font-black cursor-pointer shadow-[1px_1px_0px_#1B4332]"
          >
            {isKhmer ? 'តម្រុយ' : 'Hint'}
          </button>
        </div>
      )}

      {/* Scaffolding Action Buttons (Hint on Left, Explain on Right) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onOpenHints}
          className="px-4 py-2.5 bg-[#2D6A4F] text-white hover:bg-[#1B4332] rounded-2xl font-black text-xs sm:text-sm border-2 border-[#1B4332] shadow-[2.5px_2.5px_0px_#1B4332] flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5"
        >
          <Lightbulb className="w-4 h-4 fill-white stroke-[2]" />
          <span>{isKhmer ? 'តម្រុយ' : 'Hint'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenExplainDifferently}
          className="px-4 py-2.5 bg-white text-[#1B4332] hover:bg-[#E8F5E9] rounded-2xl font-black text-xs sm:text-sm border-2 border-[#1B4332] shadow-[2.5px_2.5px_0px_#1B4332] flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5"
        >
          <RefreshCw className="w-4 h-4 stroke-[2.5]" />
          <span>{isKhmer ? 'ពន្យល់តាមរបៀបផ្សេង' : 'Explain Differently'}</span>
        </button>
      </div>
    </div>
  );
};
