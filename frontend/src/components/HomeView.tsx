import React, { useState } from 'react';
import { UserProfile, HomeworkProblem } from '../types';
import { Camera, MessageSquare, BookOpen, Send } from 'lucide-react';
import { getDisplayName } from '../utils/language';

interface HomeViewProps {
  profile: UserProfile;
  onStartScan: () => void;
  onStartChat: (problem?: HomeworkProblem, initialQuery?: string) => void;
  onSelectGrade?: (grade: UserProfile['grade']) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  onStartScan,
  onStartChat,
}) => {
  const isKhmer = profile.language === 'km';
  const [heroChatInput, setHeroChatInput] = useState('');

  const handleHeroChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroChatInput.trim()) {
      onStartChat(undefined, heroChatInput.trim());
      setHeroChatInput('');
    } else {
      onStartChat();
    }
  };

  return (
    <div className="space-y-7 sm:space-y-9 animate-fadeIn pb-12 w-full max-w-full overflow-hidden">
      {/* Hero Section with Chat Input */}
      <div className="bg-[#A7CDB4] rounded-3xl border-3 border-[#1B4332] p-4 sm:p-8 lg:p-9 shadow-[4px_4px_0px_#1B4332] sm:shadow-[6px_6px_0px_#1B4332] relative overflow-hidden transition-all">
        <div className="absolute top-2 right-4 w-10 sm:w-12 h-10 sm:h-12 bg-[#2D6A4F] rounded-full border-2 border-[#1B4332] opacity-40 pointer-events-none" />
        <div className="absolute bottom-2 left-6 w-7 sm:w-8 h-7 sm:h-8 bg-[#40916C] rounded-full border-2 border-[#1B4332] opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-7 text-center">
          <div className="space-y-3 sm:space-y-4 flex-1 text-[#1B4332] min-w-0 w-full py-1 flex flex-col items-center text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#1B4332] text-[#40916C] text-[10px] sm:text-xs font-black border-2 border-[#1B4332] shadow-[2px_2px_0px_#1B4332]">
                <span className="truncate">{isKhmer ? 'គ្រូបង្រៀន AI កិច្ចការផ្ទះ' : 'AI Homework Companion'}</span>
              </div>
              <span className="px-2.5 py-1 bg-white text-[#1B4332] rounded-full border-2 border-[#1B4332] text-[10px] sm:text-xs font-black shadow-[1.5px_1.5px_0px_#1B4332]">
                {isKhmer ? `ថ្នាក់ទី ${profile.grade}` : `Grade ${profile.grade}`}
              </span>
            </div>

            <h2 className="text-lg sm:text-3xl font-black font-heading leading-snug sm:leading-normal text-[#1B4332] drop-shadow-[1px_1px_0px_#FFFFFF] break-words text-center">
              {isKhmer
                ? `សួស្តី ${getDisplayName(profile.name, true)}! តោះដោះស្រាយលំហាត់ជាមួយគ្នា!`
                : `Hello ${getDisplayName(profile.name, false)}! Ready to solve homework together?`}
            </h2>
            <p className="text-xs sm:text-base font-black text-[#1B4332]/85 leading-relaxed text-center">
              {isKhmer
                ? "ទន្សាយនឹងជួយណែនាំអ្នកជាជំហានៗយ៉ាងងាយស្រួល!"
                : "Tunsay will guide you step-by-step with ease!"}
            </p>

            {/* Chat Input Box */}
            <form onSubmit={handleHeroChatSubmit} className="pt-2 sm:pt-3 w-full">
              <div className="flex items-center gap-2 p-1.5 sm:p-2 bg-white rounded-2xl sm:rounded-3xl border-2.5 sm:border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] sm:shadow-[4.5px_4.5px_0px_#1B4332] focus-within:shadow-[5px_5px_0px_#1B4332] focus-within:-translate-y-0.5 transition-all">
                <input
                  type="text"
                  value={heroChatInput}
                  onChange={(e) => setHeroChatInput(e.target.value)}
                  placeholder={
                    isKhmer
                      ? "វាយសំណួរ ឬលំហាត់របស់អ្នកនៅទីនេះ... (ឧ. 15 + 27 = ?)"
                      : "Type your homework question here... (e.g. 15 + 27 = ?)"
                  }
                  className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-base font-black text-[#1B4332] placeholder-[#1B4332]/45 bg-transparent border-none outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#40916C] hover:bg-[#ffd768] text-[#1B4332] rounded-xl sm:rounded-2xl font-black text-xs sm:text-base border-2 sm:border-2.5 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] sm:shadow-[2.5px_2.5px_0px_#1B4332] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <span>{isKhmer ? 'ផ្ញើ' : 'Send'}</span>
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Action Grid: Photo Scan / Chat */}
      <div className="space-y-3.5 sm:space-y-5">
        <h3 className="text-sm sm:text-xl font-black text-[#1B4332] font-heading flex items-center gap-2">
          <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-[#1B4332] shrink-0" />
          <span>{isKhmer ? 'តើអ្នកចង់ធ្វើអ្វីថ្ងៃនេះ?' : 'What would you like to do today?'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          {/* Scan Homework Photo */}
          <button
            type="button"
            onClick={onStartScan}
            className="p-4 sm:p-6 bg-white text-[#1B4332] rounded-2xl sm:rounded-3xl border-2.5 sm:border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] sm:shadow-[5px_5px_0px_#1B4332] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1B4332] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1B4332] text-left transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden"
          >
            <div>
              <div className="p-2.5 sm:p-3 bg-[#A7CDB4] rounded-xl sm:rounded-2xl border-2 sm:border-3 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] w-fit text-[#1B4332] mb-3 sm:mb-5 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-[#1B4332]" />
              </div>
              <h4 className="text-base sm:text-xl font-black font-heading leading-tight mb-1">
                {isKhmer ? 'ស្កែនរូបថតលំហាត់' : 'Scan Homework Photo'}
              </h4>
            </div>
            <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t-2 border-[#1B4332]/30 flex items-center text-xs sm:text-sm font-black gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>{isKhmer ? 'ថតរូបលំហាត់' : 'Take Photo'}</span>
            </div>
          </button>

          {/* Ask via Chat */}
          <button
            type="button"
            onClick={() => onStartChat()}
            className="p-4 sm:p-6 bg-white text-[#1B4332] rounded-2xl sm:rounded-3xl border-2.5 sm:border-3 border-[#1B4332] shadow-[3px_3px_0px_#1B4332] sm:shadow-[5px_5px_0px_#1B4332] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1B4332] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#1B4332] text-left transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden"
          >
            <div>
              <div className="p-2.5 sm:p-3 bg-[#A7CDB4] rounded-xl sm:rounded-2xl border-2 sm:border-3 border-[#1B4332] shadow-[2px_2px_0px_#1B4332] w-fit text-[#1B4332] mb-3 sm:mb-5 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-[#1B4332]" />
              </div>
              <h4 className="text-base sm:text-xl font-black font-heading leading-tight mb-1">
                {isKhmer ? 'វាយសួរ ទន្សាយ' : 'Ask Tunsay via Chat'}
              </h4>
            </div>
            <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t-2 border-[#1B4332]/30 flex items-center text-xs sm:text-sm font-black gap-1.5 group-hover:translate-x-1 transition-transform">
              <span>{isKhmer ? 'សួរទន្សាយ' : 'Ask Tunsay'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
