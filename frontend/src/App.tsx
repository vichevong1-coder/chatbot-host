import { useState, useCallback, useEffect } from 'react';
import { UserProfile, HomeworkProblem, Grade, ChatSession } from './types';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ChatView } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { HomeworkScanner } from './components/HomeworkScanner';
import { ForestBackground } from './components/ForestBackground';
import { markSessionAbandoned } from './utils/reportUtils';

const STORAGE_KEY = 'reanmore_sessions_v1';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getInitialSessions(profileName: string): ChatSession[] {
  return [
    {
      id: generateId(),
      title: 'New Chat',
      titleKhmer: 'ជជែកថ្មី',
      messages: [
        {
          id: 'init-msg',
          sender: 'sayo',
          textKhmer: `សួស្តី ${profileName}! ខ្ញុំគឺ ReanMore គ្រូបង្រៀន AI។ តើអ្នកមានលំហាត់អ្វីចង់ឱ្យខ្ញុំជួយទេ? អ្នកអាចថតរូបស្កែនលំហាត់ ឬវាយបញ្ចូលសំណួរនៅខាងក្រោម!`,
          textEng: `Hi ${profileName}! I am ReanMore, your AI Tutor. What homework would you like help with? You can scan a photo or type your question below!`,
          timestamp: 'Just now'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'សុជា (Sochea)',
    grade: 4,
    subject: 'math',
    language: 'km',
  });

  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'profile'>('home');
  const [activeProblem, setActiveProblem] = useState<HomeworkProblem | undefined>(undefined);
  const [initialChatQuery, setInitialChatQuery] = useState<string | undefined>(undefined);

  // ── Session state with localStorage persistence ──
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('tunsay_sessions_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSession[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore corrupt storage */ }
    return getInitialSessions('សុជា (Sochea)');
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return (sessions[0] && sessions[0].id) ? sessions[0].id : '';
  });

  // Persist sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch { /* ignore quota errors */ }
  }, [sessions]);

  // Mark in-progress activities as abandoned when leaving chat tab
  useEffect(() => {
    if (activeTab !== 'chat') {
      markSessionAbandoned(activeSessionId);
    }
  }, [activeTab, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? sessions[0];

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev: UserProfile) => ({ ...prev, ...updated }));
  };

  const createNewSession = useCallback((problem?: HomeworkProblem) => {
    const newSession: ChatSession = {
      id: generateId(),
      title: problem?.titleEng ?? 'New Chat',
      titleKhmer: problem?.titleKhmer ?? 'ជជែកថ្មី',
      messages: [
        {
          id: 'init-msg',
          sender: 'sayo',
          textKhmer: `សួស្តី ${profile.name}! ខ្ញុំគឺ ReanMore គ្រូបង្រៀន AI។ តើអ្នកមានលំហាត់អ្វីចង់ឱ្យខ្ញុំជួយទេ? អ្នកអាចថតរូបស្កែនលំហាត់ ឬវាយបញ្ចូលសំណួរនៅខាងក្រោម!`,
          textEng: `Hi ${profile.name}! I am ReanMore, your AI Tutor. What homework would you like help with? You can scan a photo or type your question below!`,
          timestamp: 'Just now'
        }
      ],
      problem,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, [profile.name]);

  const updateSessionMessages = useCallback((sessionId: string, messages: ChatSession['messages']) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      // Auto-update title from first user message if still default
      const firstUserMsg = messages.find(m => m.sender === 'user');
      let title = s.title;
      let titleKhmer = s.titleKhmer;
      if (firstUserMsg && s.title === 'New Chat') {
        const preview = firstUserMsg.textEng.slice(0, 30);
        title = preview + (firstUserMsg.textEng.length > 30 ? '...' : '');
        const khmerPreview = firstUserMsg.textKhmer?.slice(0, 30) ?? '';
        titleKhmer = khmerPreview + ((firstUserMsg.textKhmer?.length ?? 0) > 30 ? '...' : '');
      }
      return {
        ...s,
        messages,
        title,
        titleKhmer,
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const handleStartChatWithProblem = (problem?: HomeworkProblem, initialQuery?: string) => {
    setActiveProblem(problem);
    setInitialChatQuery(initialQuery);
    const sessionId = createNewSession(problem);
    setActiveSessionId(sessionId);
    setActiveTab('chat');
  };

  const handleHomeworkScanned = (problem: HomeworkProblem) => {
    setActiveProblem(problem);
    setInitialChatQuery(undefined);
    setIsScannerOpen(false);
    const sessionId = createNewSession(problem);
    setActiveSessionId(sessionId);
    setActiveTab('chat');
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    setActiveProblem(session?.problem);
    setActiveTab('chat');
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0) {
        const fresh = getInitialSessions(profile.name);
        setActiveSessionId(fresh[0].id);
        return fresh;
      }
      if (activeSessionId === sessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className={`relative bg-[#EDF7EE] text-[#1B4332] flex flex-col font-sans w-full overflow-x-hidden ${activeTab === 'chat' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
      <ForestBackground activeTab={activeTab} />

      <Header
        profile={profile}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <main className={`relative z-10 flex-1 min-h-0 w-full mx-auto ${activeTab === 'chat' ? 'w-full px-2.5 sm:px-5 pt-5 sm:pt-7 pb-2.5 sm:pb-4 h-full overflow-hidden flex flex-col' : 'max-w-7xl p-4 sm:p-6 lg:p-8'}`}>
        {activeTab === 'home' && (
          <HomeView
            profile={profile}
            onStartScan={() => setIsScannerOpen(true)}
            onStartChat={handleStartChatWithProblem}
            onSelectGrade={(grade: Grade) => handleUpdateProfile({ grade })}
          />
        )}

        {activeTab === 'chat' && activeSession && (
          <ChatView
            profile={profile}
            initialProblem={activeProblem}
            initialQuery={initialChatQuery}
            onClearInitialQuery={() => setInitialChatQuery(undefined)}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={() => createNewSession()}
            onDeleteSession={handleDeleteSession}
            onUpdateMessages={(msgs) => updateSessionMessages(activeSessionId, msgs)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B4332]/60 backdrop-blur-sm p-4 animate-fadeIn">
          <HomeworkScanner
            language={profile.language}
            onHomeworkConfirmed={handleHomeworkScanned}
            onCancel={() => setIsScannerOpen(false)}
          />
        </div>
      )}
    </div>
  );
}


