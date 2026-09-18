import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  category?: string;
  steps?: any[];
  current_step_index?: number;
  hint_count?: number;
  practice_mode?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}

interface AppState {
  language: 'en' | 'khmer';
  gradeLevel: 'grade_1_3' | 'grade_4_6';
  theme: 'light' | 'dark';
  sessions: Record<string, ChatSession>;
  currentSessionId: string | null;
  setLanguage: (lang: 'en' | 'khmer') => void;
  setGradeLevel: (grade: 'grade_1_3' | 'grade_4_6') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  createSession: () => string;
  setCurrentSession: (id: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  deleteSession: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      language: 'en',
      gradeLevel: 'grade_4_6',
      theme: 'light',
      sessions: {},
      currentSessionId: null,
      
      setLanguage: (language) => set({ language }),
      setGradeLevel: (gradeLevel) => set({ gradeLevel }),
      setTheme: (theme) => set({ theme }),
      
      createSession: () => {
        const id = crypto.randomUUID();
        const newSession: ChatSession = {
          id,
          title: `Maths Homework 1`,
          createdAt: Date.now(),
          messages: [
            {
              role: 'user',
              content: 'Can you help me with my homework? Add the numbers and write the answers: 4 + 5 + 6 = ?'
            },
            {
              role: 'assistant',
              content: 'Of course! Let\'s solve $4 + 5 + 6$ together.\n\nA great way to add three numbers is to look for **pairs that make 10** or to add the first two numbers together.\n\nFirst, let\'s add $4$ and $5$:\n$$ 4 + 5 = 9 $$\n\nNow, we take that $9$ and add the last number, which is $6$:\n$$ 9 + 6 = 15 $$\n\nSo, the final answer is **$15$**! Great job!',
              category: 'addition',
              steps: [
                { content: 'Add the first two numbers: $4 + 5 = 9$' },
                { content: 'Add the third number to the result: $9 + 6 = 15$' }
              ]
            }
          ],
        };
        set((state) => ({
          sessions: { ...state.sessions, [id]: newSession },
          currentSessionId: id,
        }));
        return id;
      },
      
      setCurrentSession: (id) => set({ currentSessionId: id }),
      
      addMessage: (sessionId, message) => set((state) => {
        const session = state.sessions[sessionId];
        if (!session) return state;
        
        // Auto-generate title from first user message
        let title = session.title;
        if (session.messages.length === 0 && message.role === 'user') {
          title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
        }

        return {
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...session,
              title,
              messages: [...session.messages, message],
            },
          },
        };
      }),
      
      deleteSession: (id) => set((state) => {
        const newSessions = { ...state.sessions };
        delete newSessions[id];
        return {
          sessions: newSessions,
          currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
        };
      }),
    }),
    {
      name: 'weg-chatbot-storage',
    }
  )
);
