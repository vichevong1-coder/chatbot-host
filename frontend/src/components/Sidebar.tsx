import { useState } from 'react';
import { useAppStore } from '../store';
import { SquarePen, MessageSquare, Trash2, Settings, X } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    setCurrentSession, 
    deleteSession,
    language,
    gradeLevel,
    setLanguage,
    setGradeLevel,
    theme,
    setTheme
  } = useAppStore();

  const sessionList = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-64 bg-[#fafafa] dark:bg-black text-gray-900 dark:text-white flex flex-col h-full border-r border-gray-200 dark:border-white/10">
      <div className="p-4  flex items-center justify-between">
        <button 
          onClick={() => {
            createSession();
            onClose?.();
          }}
          className="flex-1 flex items-center justify-start gap-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition-colors font-medium"
        >
          <SquarePen size={18} />
          <span>New Chat</span>
        </button>
        <button onClick={onClose} className="md:hidden ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessionList.map((session) => (
          <div 
            key={session.id}
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
              currentSessionId === session.id ? 'bg-gray-200 dark:bg-[#2f2f2f] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2f2f2f] hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => {
              setCurrentSession(session.id);
              onClose?.();
            }}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <MessageSquare size={16} className="flex-shrink-0" />
              <span className="truncate text-sm font-medium">{session.title}</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
              title="Delete chat"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4  bg-gray-50 dark:bg-black space-y-4">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`w-full flex items-center justify-between text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors ${showSettings ? 'pb-2 ' : ''}`}
        >
          <div className="flex items-center gap-2">
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </button>
        
        {showSettings && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Theme</label>
              <div className="flex bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-1 px-2 text-sm rounded-md transition-colors ${theme === 'light' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-1 px-2 text-sm rounded-md transition-colors ${theme === 'dark' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Dark
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Language</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'khmer')}
                className="w-full bg-white dark:bg-gray-800  text-gray-900 dark:text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
              >
                <option value="en">English</option>
                <option value="khmer">Khmer (ខ្មែរ)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade Level</label>
              <select 
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as 'grade_1_3' | 'grade_4_6')}
                className="w-full bg-white dark:bg-gray-800  text-gray-900 dark:text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
              >
                <option value="grade_1_3">Grade 1-3</option>
                <option value="grade_4_6">Grade 4-6</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
