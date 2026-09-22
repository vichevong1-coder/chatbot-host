import React, { useEffect } from 'react';
import { StepItem, Language } from '../types';
import { X, CheckCircle2, CircleDot, Circle, ArrowRight, BookOpen } from 'lucide-react';

interface AllStepsDrawerProps {
  steps: StepItem[];
  currentStepIndex: number;
  isOpen: boolean;
  language?: Language;
  onSelectStep: (index: number) => void;
  onClose: () => void;
}

export const AllStepsDrawer: React.FC<AllStepsDrawerProps> = ({
  steps,
  currentStepIndex,
  isOpen,
  language = 'km',
  onSelectStep,
  onClose,
}) => {
  const isKhmer = language === 'km';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg max-h-[85vh] bg-white rounded-3xl border-3 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#1B4332] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#40916C] border-2 border-white flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm sm:text-base leading-tight">
                {isKhmer ? 'បញ្ជីជំហានទាំងអស់' : 'All Problem Steps'}
              </h3>
              <p className="text-[11px] font-bold text-[#A7CDB4]">
                {isKhmer
                  ? `ជំហានសរុប៖ ${steps.length} • កំពុងនៅជំហានទី ${currentStepIndex + 1}`
                  : `Total: ${steps.length} steps • Currently on Step ${currentStepIndex + 1}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-xl transition-all cursor-pointer"
            title={isKhmer ? 'បិទ' : 'Close'}
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Step Checklist List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {steps.map((s, idx) => {
            const isCompleted = idx < currentStepIndex || s.status === 'completed';
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={s.id || idx}
                onClick={() => {
                  onSelectStep(idx);
                  onClose();
                }}
                className={`p-4 rounded-2xl border-3 transition-all cursor-pointer flex items-start gap-3 relative ${
                  isCurrent
                    ? 'bg-[#E8F5E9] border-[#1B4332] shadow-[3px_3px_0px_#1B4332] scale-[1.01]'
                    : isCompleted
                    ? 'bg-[#F4FBF7] border-[#2D6A4F] hover:bg-[#E8F5E9]'
                    : 'bg-white border-[#1B4332]/30 hover:border-[#1B4332] hover:bg-[#F9FBF9]'
                }`}
              >
                {/* Status Icon */}
                <div className="shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="w-7 h-7 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center border-2 border-[#1B4332] shadow-[1px_1px_0px_#1B4332]">
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-7 h-7 rounded-xl bg-[#1B4332] text-white flex items-center justify-center border-2 border-[#1B4332] shadow-[1px_1px_0px_#1B4332] animate-pulse">
                      <CircleDot className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center border-2 border-gray-300">
                      <Circle className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#2D6A4F]">
                      {isKhmer ? `ជំហានទី ${idx + 1}` : `Step ${idx + 1}`}
                      {isCurrent && (
                        <span className="ml-2 px-2 py-0.5 bg-[#2D6A4F] text-white text-[10px] rounded-full">
                          {isKhmer ? 'សកម្ម' : 'Active'}
                        </span>
                      )}
                      {isCompleted && (
                        <span className="ml-2 px-2 py-0.5 bg-[#A7CDB4] text-[#1B4332] text-[10px] rounded-full">
                          {isKhmer ? 'រួចរាល់' : 'Done'}
                        </span>
                      )}
                    </span>
                  </div>

                  <h4 className="font-heading font-black text-xs sm:text-sm text-[#1B4332] mt-0.5 line-clamp-2">
                    {s.title || s.mission || (isKhmer ? s.questionKhmer : s.questionEng)}
                  </h4>

                  {/* Mission / Question preview */}
                  <p className="text-[11px] font-bold text-[#1B4332]/80 mt-1 line-clamp-2">
                    👉 {s.yourTurn || (isKhmer ? s.socraticPromptKhmer : s.socraticPromptEng)}
                  </p>

                  {/* Recorded Student Answer if completed */}
                  {s.studentAnswer && (
                    <div className="mt-2 p-2 bg-white rounded-xl border border-[#2D6A4F]/40 text-[11px] font-black text-[#1B4332] flex items-center gap-1.5">
                      <span className="text-[#2D6A4F]">{isKhmer ? 'ចម្លើយរបស់អ្នក៖' : 'Your Answer:'}</span>
                      <span className="bg-[#E8F5E9] px-2 py-0.5 rounded-md border border-[#1B4332]/20">
                        {s.studentAnswer}
                      </span>
                    </div>
                  )}
                </div>

                <div className="shrink-0 self-center text-[#1B4332]/40 hover:text-[#1B4332]">
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-[#E8F5E9] border-t-2 border-[#1B4332]/20 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1B4332] text-white font-black text-xs rounded-xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] hover:-translate-y-0.5 cursor-pointer transition-all"
          >
            {isKhmer ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
