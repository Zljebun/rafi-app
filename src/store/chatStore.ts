import { create } from 'zustand';
import { claude, Message } from '../services/ai/claude';
import { agentCore } from '../agent/core';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { voiceSynthesis } from '../services/voice/synthesis';
import { whisperVoice } from '../services/voice/whisper';

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
  ttsEnabled: boolean;
  conversationMode: boolean;
  isListening: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  exportChat: () => Promise<void>;
  toggleTTS: () => void;
  toggleConversationMode: () => void;
  setIsListening: (val: boolean) => void;
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
  ttsEnabled: false,
  conversationMode: false,
  isListening: false,

  setIsListening: (val: boolean) => set({ isListening: val }),

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
      // Track user action for routine learning
      const now = new Date();
      agentCore.trackAction({
        type: 'chat_message',
        data: { hour: now.getHours(), dayOfWeek: now.getDay() },
      }).catch(() => {}); // Fire and forget

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

      // Speak response if TTS or conversation mode is enabled
      const { ttsEnabled, conversationMode } = get();
      if (ttsEnabled || conversationMode) {
        await voiceSynthesis.speak(response);
        // After speaking, auto-listen again in conversation mode
        if (get().conversationMode) {
          setTimeout(() => {
            whisperVoice.startRecording().catch(() => {});
          }, 300);
        }
      }
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Greška u komunikaciji sa AI',
      });
      // Even on error, restart listening in conversation mode
      if (get().conversationMode) {
        setTimeout(() => {
          whisperVoice.startRecording().catch(() => {});
        }, 1000);
      }
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

  toggleTTS: () => {
    const newState = !get().ttsEnabled;
    if (!newState) {
      voiceSynthesis.stop();
    }
    set({ ttsEnabled: newState });
  },

  toggleConversationMode: () => {
    const newState = !get().conversationMode;
    if (newState) {
      // Enable: turn on TTS and start listening
      set({ conversationMode: true, ttsEnabled: true });
      whisperVoice.startRecording().catch(() => {});
    } else {
      // Disable: stop everything
      voiceSynthesis.stop();
      whisperVoice.stopRecording().catch(() => {});
      set({ conversationMode: false, isListening: false });
    }
  },

  exportChat: async () => {
    const { messages } = get();
    const lines = messages.map((m) => {
      const time = m.timestamp.toLocaleString();
      const who = m.role === 'user' ? 'Ti' : 'RAFI';
      return `[${time}] ${who}:\n${m.content}\n`;
    });
    const text = lines.join('\n---\n\n');
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `RAFI-chat-${date}.txt`;
    const filePath = `${documentDirectory}${fileName}`;

    await writeAsStringAsync(filePath, text, {
      encoding: EncodingType.UTF8,
    });

    await Sharing.shareAsync(filePath, {
      mimeType: 'text/plain',
      dialogTitle: 'Sačuvaj konverzaciju',
    });
  },
}));
