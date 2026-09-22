import React from 'react';
import { Language } from '../types';
import { Footprints, Check, ChevronLeft, ChevronRight, ListOrdered } from 'lucide-react';

interface StepTrailProps {
  currentStep: number;
  totalSteps: number;
  language?: Language | undefined;
  onSelectStep?: ((stepIndex: number) => void) | undefined;
  onPreviousStep?: (() => void) | undefined;
  onNextStep?: (() => void) | undefined;
  onOpenAllSteps?: (() => void) | undefined;
}

export const StepTrail: React.FC<StepTrailProps> = ({
  currentStep,
  totalSteps,
  language = 'km',
  onSelectStep,
  onPreviousStep,
  onNextStep,
  onOpenAllSteps,
}) => {
  const isKhmer = language === 'km';
  const canGoBack = currentStep > 1 && onPreviousStep;
  const canGoForward = currentStep < totalSteps && onNextStep;

  return (
    <div className="w-full flex justify-center items-center my-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-5 py-2 bg-white rounded-full border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] max-w-full">
        {/* Left: Step label */}
        <div className="flex items-center gap-1.5 text-xs font-black text-[#1B4332] shrink-0">
          <Footprints className="w-4 h-4 text-[#2D6A4F]" />
          <span>
            {isKhmer 
              ? `ជំហាន ${currentStep}/${totalSteps}` 
              : `Step ${currentStep}/${totalSteps}`}
          </span>
        </div>

        {/* Center: Prev + Dots + Next */}
        <div className="flex items-center gap-1.5">
          {canGoBack && (
            <button
              type="button"
              onClick={onPreviousStep}
              className="w-6 h-6 rounded-full bg-[#E8F5E9] hover:bg-[#D8F3DC] border border-[#1B4332] flex items-center justify-center text-[#1B4332] transition-transform hover:scale-105 cursor-pointer shrink-0"
              title={isKhmer ? 'ជំហានមុន' : 'Previous Step'}
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto px-1">
            {Array.from({ length: totalSteps }).map((_, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <div 
                      className={`w-3 sm:w-5 h-[3px] rounded-full transition-colors ${
                        stepNum <= currentStep ? 'bg-[#1B4332]' : 'bg-[#1B4332]/25'
                      }`}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectStep && onSelectStep(idx)}
                    className={`flex items-center justify-center transition-all shrink-0 ${
                      onSelectStep ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                    }`}
                    title={isKhmer ? `ទៅកាន់ជំហានទី ${stepNum}` : `Go to step ${stepNum}`}
                  >
                    {isCompleted ? (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#2D6A4F] border-2 border-[#1B4332] text-white flex items-center justify-center shadow-[1px_1px_0px_#1B4332]">
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#1B4332] border-2 border-[#1B4332] text-white flex items-center justify-center text-[11px] sm:text-xs font-black shadow-[2px_2px_0px_#1B4332] animate-pulse">
                        {stepNum}
                      </div>
                    ) : (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-[#1B4332] bg-[#E8F5E9]" />
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {canGoForward && (
            <button
              type="button"
              onClick={onNextStep}
              className="w-6 h-6 rounded-full bg-[#E8F5E9] hover:bg-[#D8F3DC] border border-[#1B4332] flex items-center justify-center text-[#1B4332] transition-transform hover:scale-105 cursor-pointer shrink-0"
              title={isKhmer ? 'ជំហានបន្ទាប់' : 'Next Step'}
            >
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Right: All steps drawer button */}
        {onOpenAllSteps && (
          <button
            type="button"
            onClick={onOpenAllSteps}
            className="p-1 text-[#1B4332] hover:bg-[#E8F5E9] rounded-lg transition-colors cursor-pointer shrink-0"
            title={isKhmer ? 'មើលជំហានទាំងអស់' : 'View all steps'}
          >
            <ListOrdered className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
};
