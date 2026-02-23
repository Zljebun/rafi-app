import { create } from 'zustand';
import { claude, Message } from '../services/ai/claude';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [
    {
      id: '0',
      role: 'assistant',
      content:
        'Zdravo! Ja sam RAFI, tvoj lični asistent. 👋\nKako ti mogu pomoći danas?',
      timestamp: new Date(),
    },
  ],
  isLoading: false,
  error: null,

  sendMessage: async (text: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await claude.sendMessage(text);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Greška u komunikaciji sa AI',
      });
    }
  },

  clearChat: () => {
    claude.clearHistory();
    set({
      messages: [
        {
          id: '0',
          role: 'assistant',
          content: 'Chat obrisan. Kako ti mogu pomoći?',
          timestamp: new Date(),
        },
      ],
      error: null,
    });
  },
}));
