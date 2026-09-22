import { useState } from 'react';
import { UserProfile, HomeworkProblem, Grade, Language, ChatMessage } from './types';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { ChatView } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { HomeworkScanner } from './components/HomeworkScanner';

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

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'sayo',
      textKhmer: `សួស្តី សុជា! ខ្ញុំគឺទន្សាយ (Tunsay) គ្រូបង្រៀន AI។ តើអ្នកមានលំហាត់អ្វីចង់ឱ្យខ្ញុំជួយទេ? អ្នកអាចថតរូបស្កែនលំហាត់ ឬវាយបញ្ចូលសំណួរនៅខាងក្រោម!`,
      textEng: `Hi Sochea! I am Tunsay, your AI Tutor. What homework would you like help with? You can scan a photo or type your question below!`,
      timestamp: 'Just now'
    }
  ]);

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev: UserProfile) => ({ ...prev, ...updated }));
  };

  const handleStartChatWithProblem = (problem?: HomeworkProblem, initialQuery?: string) => {
    setActiveProblem(problem);
    setInitialChatQuery(initialQuery);
    setActiveTab('chat');
  };

  const handleHomeworkScanned = (problem: HomeworkProblem) => {
    setActiveProblem(problem);
    setInitialChatQuery(undefined);
    setIsScannerOpen(false);
    setActiveTab('chat');
  };

  return (
    <div className={`bg-white text-[#1B4332] flex flex-col font-sans w-full max-w-full overflow-x-hidden ${activeTab === 'chat' ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
      <Header
        profile={profile}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSelectLanguage={(language: Language) => handleUpdateProfile({ language })}
      />

      <main className={`flex-1 min-h-0 w-full mx-auto ${activeTab === 'chat' ? 'w-full px-2.5 sm:px-5 pt-5 sm:pt-7 pb-2.5 sm:pb-4 h-full overflow-hidden flex flex-col' : 'max-w-7xl p-4 sm:p-6 lg:p-8'}`}>
        {activeTab === 'home' && (
          <HomeView
            profile={profile}
            onStartScan={() => setIsScannerOpen(true)}
            onStartChat={handleStartChatWithProblem}
            onSelectGrade={(grade: Grade) => handleUpdateProfile({ grade })}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            profile={profile}
            initialProblem={activeProblem}
            initialQuery={initialChatQuery}
            onClearInitialQuery={() => setInitialChatQuery(undefined)}
            chatMessages={chatMessages}
            onUpdateMessages={setChatMessages}
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
