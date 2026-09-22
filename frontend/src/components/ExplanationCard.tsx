import React, { useState, useEffect } from 'react';
import { StepItem, Language } from '../types';
import { RefreshCw, X, Sparkles, HeartHandshake, Loader2 } from 'lucide-react';
import { TunsayAvatar } from './TunsayAvatar';
import { requestClarificationApi } from '../services/geminiService';

interface ExplanationCardProps {
  step: StepItem;
  isOpen: boolean;
  language?: Language | undefined;
  sessionId?: string | undefined;
  gradeLevel?: string | undefined;
  onClose: () => void;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  step,
  isOpen,
  language = 'km',
  sessionId,
  gradeLevel = 'grade_1_3',
  onClose
}) => {
  const isKhmer = language === 'km';
  const [activeTab, setActiveTab] = useState<'simple' | 'analogy'>('simple');
  const [dynamicExplanation, setDynamicExplanation] = useState<string | null>(null);
  const [isLoadingDynamic, setIsLoadingDynamic] = useState(false);

  const handleFetchBackendClarification = async () => {
    if (!sessionId) return;
    setIsLoadingDynamic(true);
    const res = await requestClarificationApi(sessionId, language, gradeLevel);
    setIsLoadingDynamic(false);
    if (res?.text) {
      setDynamicExplanation(res.text);
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

  const { explainDifferently } = step;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B4332]/60 backdrop-blur-xs p-4 animate-fadeIn text-[#1B4332]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="explain-sheet-title"
        className="w-full max-w-lg bg-white rounded-3xl border-3 border-[#1B4332] shadow-[6px_6px_0px_#1B4332] overflow-hidden flex flex-col max-h-[85vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[#A7CDB4] border-b-3 border-[#1B4332] flex items-center justify-between text-[#1B4332]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-2xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] flex items-center justify-center">
              <TunsayAvatar size="sm" state="explaining" showBadge={false} />
            </div>
            <div>
              <h3 id="explain-sheet-title" className="text-base sm:text-lg font-black font-heading flex items-center gap-1.5 drop-shadow-[1px_1px_0px_white]">
                <RefreshCw className="w-5 h-5 text-[#1B4332] stroke-[2.5]" />
                {isKhmer ? 'ពន្យល់តាមរបៀបផ្សេង' : 'Explain Differently'}
              </h3>
              <p className="text-xs font-bold text-[#1B4332]">
                {isKhmer ? 'ទន្សាយពន្យល់តាមរបៀបងាយយល់!' : 'Tunsay explains in simpler ways!'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#2D6A4F] border-2 border-[#1B4332] text-white hover:bg-[#40916C] hover:text-[#1B4332] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Style Selector Tabs */}
        <div className="flex border-b-3 border-[#1B4332] bg-[#E8F5E9] p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('simple')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border-2 border-[#1B4332] ${
              activeTab === 'simple' 
                ? 'bg-[#2D6A4F] text-[#1B4332] shadow-[2px_2px_0px_#1B4332] -translate-y-0.5' 
                : 'bg-white text-[#1B4332]/80 hover:bg-[#2D6A4F]/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            {isKhmer ? 'ពន្យល់យ៉ាងងាយ' : 'Simple Explanation'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analogy')}
            className={`flex-1 py-2 px-3 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border-2 border-[#1B4332] ${
              activeTab === 'analogy' 
                ? 'bg-[#40916C] text-[#1B4332] shadow-[2px_2px_0px_#1B4332] -translate-y-0.5' 
                : 'bg-white text-[#1B4332]/80 hover:bg-[#40916C]/50'
            }`}
          >
            {isKhmer ? 'ឧទាហរណ៍រូបភាព' : 'Analogy & Visual'}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'simple' && (
            <div className="bg-[#E8F5E9] p-4 rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#1B4332] font-black text-sm">
                <HeartHandshake className="w-5 h-5 text-[#2D6A4F]" />
                {isKhmer ? 'ពន្យល់យ៉ាងងាយស្រួលយល់៖' : 'Simple explanation:'}
              </div>
              <p className="text-base text-[#1B4332] font-black leading-relaxed bg-white p-3.5 rounded-xl border-2 border-[#1B4332]">
                {isKhmer ? explainDifferently.simpleKhmer : explainDifferently.simpleEng}
              </p>
            </div>
          )}

          {activeTab === 'analogy' && (
            <div className="bg-[#40916C] p-4 rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#1B4332] font-black text-sm">
                <Sparkles className="w-4 h-4 text-[#1B4332]" />
                {isKhmer ? explainDifferently.analogyTitle : explainDifferently.analogyTitle}
              </div>
              <p className="text-base text-[#1B4332] font-black leading-relaxed bg-white p-3.5 rounded-xl border-2 border-[#1B4332]">
                {isKhmer ? explainDifferently.analogyKhmer : explainDifferently.analogyEng}
              </p>

              {/* Visual representation card */}
              <div className="p-4 bg-white rounded-xl border-2 border-[#1B4332] flex flex-col items-center justify-center text-center">
                {explainDifferently.analogyType === 'apples' && (
                  <div className="flex flex-wrap items-center justify-center gap-2 my-2">
                    {[1, 2, 3, 4, 5].map((box) => (
                      <div key={box} className="p-2 bg-[#E8F5E9] border-2 border-[#1B4332] rounded-xl flex items-center justify-center gap-1.5 shadow-[1px_1px_0px_#1B4332]">
                        <span className="text-xs font-black text-[#1B4332]">Box {box}:</span>
                        <span className="text-xs font-black text-white px-2 py-0.5 bg-[#1B4332] rounded-md border border-[#1B4332]">8 Items</span>
                      </div>
                    ))}
                  </div>
                )}

                {explainDifferently.analogyType === 'water' && (
                  <div className="flex items-center justify-center gap-3 my-2 text-sm sm:text-base font-black">
                    <span className="p-2.5 bg-[#A7CDB4] text-[#1B4332] rounded-2xl border-2 border-[#1B4332]">
                      {isKhmer ? 'ទឹកកករឹង' : 'Solid Ice'}
                    </span>
                    <span className="text-xs text-[#1B4332] font-black">&rarr; +Heat &rarr;</span>
                    <span className="p-2.5 bg-[#2D6A4F] text-white rounded-2xl border-2 border-[#1B4332]">
                      {isKhmer ? 'ទឹករាវ' : 'Liquid Water'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dynamic AI Clarification from Backend */}
          {dynamicExplanation && (
            <div className="bg-[#D8F3DC] p-4 rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#1B4332] font-black text-sm">
                <Sparkles className="w-4 h-4 text-[#2D6A4F]" />
                {isKhmer ? 'ការពន្យល់បែបកុមារពិសេសពី AI៖' : 'Child-Friendly AI Analogy from Backend:'}
              </div>
              <p className="text-sm sm:text-base text-[#1B4332] font-black leading-relaxed whitespace-pre-wrap">
                {dynamicExplanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t-3 border-[#1B4332] flex items-center justify-between">
          {sessionId ? (
            <button
              type="button"
              onClick={handleFetchBackendClarification}
              disabled={isLoadingDynamic}
              className="px-4 py-2 bg-[#A7CDB4] hover:bg-[#40916C] disabled:opacity-50 text-[#1B4332] font-black text-xs sm:text-sm rounded-2xl border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {isLoadingDynamic ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{isKhmer ? 'សុំ AI ពន្យល់ថ្មី' : 'Ask AI Analogy'}</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#40916C] text-[#1B4332] font-black text-xs sm:text-sm rounded-2xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] transition-all cursor-pointer"
          >
            {isKhmer ? 'យល់ហើយ!' : 'Got it!'}
          </button>
        </div>
      </div>
    </div>
  );
};
