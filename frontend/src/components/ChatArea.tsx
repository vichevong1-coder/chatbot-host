import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { sendChatQuery } from '../api';
import { Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface ChatAreaProps {
  sessionId: string;
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

export default function ChatArea({ sessionId, onMenuClick, isSidebarOpen }: ChatAreaProps) {
  const { sessions, addMessage, language, gradeLevel } = useAppStore();
  const session = sessions[sessionId];
  const messages = session?.messages || [];
  
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    // Add user message
    addMessage(sessionId, {
      role: 'user',
      content: text,
    });

    setIsLoading(true);

    try {
      const response = await sendChatQuery({
        query: text,
        session_id: sessionId,
        language: language,
        grade_level: gradeLevel,
      });

      // Add bot message
      addMessage(sessionId, {
        role: 'assistant',
        content: response.solution,
        category: response.category,
        steps: response.steps,
        current_step_index: response.current_step_index,
        hint_count: response.hint_count,
        practice_mode: response.practice_mode,
      });
    } catch (error) {
      console.error('Failed to get response:', error);
      addMessage(sessionId, {
        role: 'assistant',
        content: `**Error:** Failed to connect to the tutor. Please try again. \n\n*${error instanceof Error ? error.message : 'Unknown error'}*`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black relative">
      <header className="py-3 px-4 md:px-6  bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-10 flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-1 -ml-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none transition-colors"
          title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
        </button>
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{session.title}</h2>
      </header>
      
      <div className="flex-1 overflow-y-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center w-full max-w-4xl mx-auto">
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-8">What's on your mind today?</h1>
            <div className="w-full">
              <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-transparent pb-4 max-w-4xl mx-auto w-full">
            {messages.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))}
            
            {isLoading && (
              <div className="py-6 px-4 md:px-8 flex gap-4 bg-transparent">
                <div className="flex items-center text-gray-500 dark:text-gray-400 gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      )}
    </div>
  );
}
