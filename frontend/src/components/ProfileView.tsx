import React, { useState, useEffect } from 'react';
import { UserProfile, Grade, Language } from '../types';
import { TunsayAvatar } from './TunsayAvatar';
import { GradeSubjectSelector } from './GradeSubjectSelector';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Sparkles, Globe, GraduationCap, Save, CheckCircle2, Edit3 } from 'lucide-react';
import { getDisplayName } from '../utils/language';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const [draftName, setDraftName] = useState(profile.name);
  const [draftGrade, setDraftGrade] = useState<Grade>(profile.grade);
  const [draftLanguage, setDraftLanguage] = useState<Language>(profile.language);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setDraftName(profile.name);
    setDraftGrade(profile.grade);
    setDraftLanguage(profile.language);
  }, [profile]);

  const isKhmer = draftLanguage === 'km';

  const hasChanges =
    draftName !== profile.name ||
    draftGrade !== profile.grade ||
    draftLanguage !== profile.language;

  const handleSave = () => {
    onUpdateProfile({
      name: draftName,
      grade: draftGrade,
      language: draftLanguage,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <div className="space-y-7 sm:space-y-9 animate-fadeIn w-full max-w-full overflow-hidden pb-12">
      {/* Profile Hero Card */}
      <div className="bg-[#40916C] rounded-3xl border-3 border-[#1B4332] p-4 sm:p-8 shadow-[5px_5px_0px_#1B4332] sm:shadow-[6px_6px_0px_#1B4332] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-12 sm:w-16 h-12 sm:h-16 bg-[#2D6A4F] rounded-full border-2 border-[#1B4332] opacity-30" />
        <div className="absolute -bottom-4 -left-4 w-12 sm:w-16 h-12 sm:h-16 bg-[#A7CDB4] rounded-full border-2 border-[#1B4332] opacity-30" />

        <div className="p-2.5 sm:p-3 bg-white rounded-3xl border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] sm:shadow-[4px_4px_0px_#1B4332] shrink-0 transform -rotate-3">
          <TunsayAvatar size="lg" state="celebrating" showBadge={false} />
        </div>

        <div className="space-y-2 sm:space-y-3 flex-1 relative z-10 w-full min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 rounded-full bg-[#1B4332] text-[#40916C] text-[11px] sm:text-xs font-black border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332]">
            <Sparkles className="w-3.5 h-3.5 text-[#40916C] shrink-0" />
            <span className="truncate">{isKhmer ? 'សិស្សរៀនជាមួយទន្សាយ' : 'Tunsay Student'}</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-[#1B4332] font-heading drop-shadow-[1px_1px_0px_white] break-words">
            {getDisplayName(profile.name, isKhmer)}
          </h2>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <span className="px-3 py-1 sm:px-3.5 sm:py-1.5 bg-white text-[#1B4332] rounded-full border-2 border-[#1B4332] text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#1B4332]">
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1B4332]" />
              {isKhmer ? `ថ្នាក់ទី ${profile.grade}` : `Grade ${profile.grade}`}
            </span>
            <span className="px-3 py-1 sm:px-3.5 sm:py-1.5 bg-[#A7CDB4] text-[#1B4332] rounded-full border-2 border-[#1B4332] text-xs font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#1B4332]">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isKhmer ? 'រៀនគ្រប់មុខវិជ្ជា' : 'All Subjects AI'}
            </span>
          </div>
        </div>
      </div>

      {/* Save Changes Button — moved to top */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-3 border-[#1B4332] shadow-[5px_5px_0px_#1B4332] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-black text-base sm:text-lg text-[#1B4332] font-heading flex items-center justify-center sm:justify-start gap-2">
            <Save className="w-5 h-5 text-[#1B4332]" />
            <span>{isKhmer ? 'រក្សាទុកការកំណត់' : 'Save Profile Settings'}</span>
          </h4>
          <p className="text-xs font-bold text-[#1B4332]/70">
            {hasChanges
              ? (isKhmer ? 'អ្នកមានការផ្លាស់ប្តូរដែលមិនទាន់បានរក្សាទុក!' : 'You have unsaved changes!')
              : (isKhmer ? 'ការកំណត់ទាំងអស់ទាន់សម័យ' : 'All settings are up to date')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm sm:text-base border-3 border-[#1B4332] transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
            isSaved
              ? 'bg-[#2D6A4F] text-[#1B4332] shadow-[3px_3px_0px_#1B4332]'
              : hasChanges
              ? 'bg-[#2D6A4F] text-white shadow-[4px_4px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1B4332]'
              : 'bg-[#2D6A4F] text-[#1B4332] shadow-[3px_3px_0px_#1B4332] hover:opacity-95'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-[#1B4332]" />
              <span>{isKhmer ? 'បានរក្សាទុកជោគជ័យ!' : 'Saved Successfully!'}</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>{isKhmer ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes'}</span>
            </>
          )}
        </button>
      </div>

      {/* Student Name Card */}
      <div className="bg-white rounded-3xl border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] p-4 sm:p-6 space-y-3">
        <label className="font-black text-base sm:text-lg text-[#1B4332] flex items-center gap-2 font-heading">
          <Edit3 className="w-5 h-5 text-[#1B4332] shrink-0" />
          <span>{isKhmer ? 'ឈ្មោះសិស្ស' : 'Student Name'}</span>
        </label>
        <input
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder={isKhmer ? 'បញ្ចូលឈ្មោះរបស់អ្នក...' : 'Enter your name...'}
          className="w-full px-4 py-3 bg-[#E8F5E9] border-3 border-[#1B4332] rounded-2xl font-black text-sm sm:text-base text-[#1B4332] focus:outline-none focus:ring-4 focus:ring-[#A7CDB4]/40 shadow-[2px_2px_0px_#1B4332]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Language Switcher Card */}
        <div className="bg-white rounded-3xl border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-black text-base sm:text-lg text-[#1B4332] flex items-center gap-2 font-heading">
              <Globe className="w-5 h-5 text-[#1B4332] shrink-0" />
              <span>{isKhmer ? 'ភាសាកម្មវិធី' : 'Language'}</span>
            </h3>
            <LanguageSwitcher
              language={draftLanguage}
              onSelectLanguage={(lang: Language) => setDraftLanguage(lang)}
            />
          </div>
          <p className="text-xs font-bold text-[#1B4332]/80">
            {isKhmer
              ? 'ជ្រើសរើសភាសាដែលអ្នកចង់ប្រើប្រាស់នៅក្នុងកម្មវិធី'
              : 'Select your preferred application display language'}
          </p>
        </div>

        {/* Grade Info Card (read-only display) */}
        <div className="bg-white rounded-3xl border-3 border-[#1B4332] shadow-[4px_4px_0px_#1B4332] p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#2D6A4F] shrink-0" />
            <h3 className="font-black text-base sm:text-lg text-[#1B4332] font-heading">
              {isKhmer ? 'ថ្នាក់រៀន' : 'Grade Level'}
            </h3>
          </div>
          <span className="inline-block px-3 py-1.5 bg-[#A7CDB4] text-[#1B4332] rounded-xl text-xs font-black border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332]">
            {isKhmer ? `ថ្នាក់ទី ${draftGrade}` : `Grade ${draftGrade}`}
          </span>
        </div>
      </div>

      {/* Grade Selector */}
      <GradeSubjectSelector
        currentGrade={draftGrade}
        language={draftLanguage}
        onSelectGrade={(grade: Grade) => setDraftGrade(grade)}
      />
    </div>
  );
};
