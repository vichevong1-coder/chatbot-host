import React from 'react';
import { UserProfile } from '../types';
import { TunsayAvatar } from './TunsayAvatar';
import { Home, BookOpen, User } from 'lucide-react';

import logoWhiteImg from '../assets/logo_white.png';

interface HeaderProps {
  profile: UserProfile;
  activeTab: 'home' | 'chat' | 'profile';
  onSelectTab: (tab: 'home' | 'chat' | 'profile') => void;
}

const NAV_ITEMS = [
  { key: 'home' as const, labelKhmer: 'ទំព័រដើម', labelEng: 'Home', icon: Home },
  { key: 'chat' as const, labelKhmer: 'លំហាត់', labelEng: 'Homework', icon: BookOpen },
  { key: 'profile' as const, labelKhmer: 'ប្រូហ្វាល', labelEng: 'Profile', icon: User },
];

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeTab,
  onSelectTab,
}) => {
  const isKhmer = profile.language === 'km';

  return (
    <header className="sticky top-0 z-40 bg-[#1B4332] border-b-[3px] border-[#1B4332] shadow-[0_4px_0px_#2D6A4F]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => onSelectTab('home')}>
            <img src={logoWhiteImg} alt="ReanMore AI Tutor" className="h-8 sm:h-9 w-auto object-contain hover:scale-105 transition-transform drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelectTab(item.key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer border-2 ${
                    isActive
                      ? 'bg-[#40916C] text-white border-[#A7CDB4] shadow-[2px_2px_0px_#A7CDB4]'
                      : 'bg-[#2D6A4F] text-[#A7CDB4] border-[#1B4332] hover:bg-[#40916C] hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : ''}`} />
                  <span className="hidden min-[360px]:inline truncate">
                    {isKhmer ? item.labelKhmer : item.labelEng}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#A7CDB4] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Language removed — change via Profile Settings */}
          <div className="shrink-0 w-8 sm:w-10" />
        </div>
      </div>
    </header>
  );
};
