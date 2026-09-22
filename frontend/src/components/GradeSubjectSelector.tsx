import React from 'react';
import { Grade, Language, Subject } from '../types';
import { BookOpen, GraduationCap, Sparkles, Calculator, Atom, Languages, CheckCircle } from 'lucide-react';

interface GradeSubjectSelectorProps {
  currentGrade: Grade;
  currentSubject?: Subject;
  language?: Language;
  onSelectGrade: (grade: Grade) => void;
  onSelectSubject?: (subject: Subject) => void;
}

export const GradeSubjectSelector: React.FC<GradeSubjectSelectorProps> = ({
  currentGrade,
  currentSubject = 'math',
  language = 'km',
  onSelectGrade,
  onSelectSubject,
}) => {
  const isKhmer = language === 'km';
  const grades: Grade[] = [1, 2, 3, 4, 5, 6];

  const subjects: { id: Subject; nameKhmer: string; nameEng: string; icon: any; bgColor: string }[] = [
    {
      id: 'math',
      nameKhmer: 'គណិតវិទ្យា',
      nameEng: 'Mathematics',
      icon: Calculator,
      bgColor: 'bg-[#A7CDB4]',
    },
    {
      id: 'science',
      nameKhmer: 'វិទ្យាសាស្ត្រ',
      nameEng: 'Science',
      icon: Atom,
      bgColor: 'bg-[#2D6A4F]',
    },
    {
      id: 'english',
      nameKhmer: 'ភាសាអង់គ្លេស',
      nameEng: 'English',
      icon: Languages,
      bgColor: 'bg-[#40916C]',
    }
  ];

  return (
    <div className="w-full bg-white rounded-3xl border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] p-5 sm:p-7 space-y-6">
      {/* Grade Selector (3x2 Grid of Chips) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-sm sm:text-base font-black text-[#1B4332] font-heading flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#1B4332] shrink-0" />
            <span>{isKhmer ? 'ជ្រើសរើសថ្នាក់សិក្សា' : 'Select Grade'}</span>
          </label>
          <span className="text-[11px] sm:text-xs font-black text-[#1B4332] bg-[#40916C] px-2.5 sm:px-3 py-1 rounded-full border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1B4332]" />
            {isKhmer ? `ថ្នាក់ទី ${currentGrade}` : `Grade ${currentGrade}`}
          </span>
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3.5">
          {grades.map((g) => {
            const isSelected = currentGrade === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => onSelectGrade(g)}
                aria-pressed={isSelected}
                className={`py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-2xl font-black text-xs sm:text-base border-3 transition-all flex items-center justify-center cursor-pointer min-w-0 ${
                  isSelected
                    ? 'bg-[#2D6A4F] border-[#1B4332] text-white shadow-[2.5px_2.5px_0px_#1B4332] -translate-y-0.5'
                    : 'bg-[#E8F5E9] border-[#1B4332] text-[#1B4332] hover:bg-[#40916C] shadow-[2px_2px_0px_#1B4332]'
                }`}
              >
                <span className="truncate">{isKhmer ? `ថ្នាក់ទី ${g}` : `Grade ${g}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selectable Subject Cards */}
      <div className="space-y-3 pt-4 border-t-2 border-[#1B4332]/20">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-sm sm:text-base font-black text-[#1B4332] font-heading flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1B4332] shrink-0" />
            <span>{isKhmer ? 'មុខវិជ្ជាចម្បង' : 'Primary Subject'}</span>
          </label>
          <span className="text-[10px] sm:text-xs font-black text-[#1B4332] bg-[#A7CDB4] px-2.5 py-1 rounded-full border-2 border-[#1B4332] shadow-[1.5px_1.5px_0px_#1B4332] flex items-center gap-1">
            {isKhmer ? 'ចុចដើម្បីប្តូរ' : 'Click to Select'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {subjects.map((sub) => {
            const Icon = sub.icon;
            const isSelected = currentSubject === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubject?.(sub.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border-3 border-[#1B4332] transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#2D6A4F] text-white shadow-[4px_4px_0px_#1B4332] -translate-y-0.5 scale-[1.02]'
                    : `${sub.bgColor} text-[#1B4332] hover:scale-[1.01] shadow-[2px_2px_0px_#1B4332]`
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-xl border-2 border-[#1B4332] shadow-[1px_1px_0px_#1B4332] shrink-0 ${isSelected ? 'bg-white text-[#1B4332]' : 'bg-white text-[#1B4332]'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-black text-sm sm:text-base truncate">
                    {isKhmer ? sub.nameKhmer : sub.nameEng}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle className="w-5 h-5 text-white shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

