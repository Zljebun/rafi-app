import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { SuggestionsRow } from '../components/SuggestionCard';
import { useChatStore } from '../store/chatStore';
import { voiceRecognition } from '../services/voice/recognition';
import { voiceSynthesis } from '../services/voice/synthesis';

export function ChatScreen() {
  const { messages, isLoading, sendMessage } = useChatStore();
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    voiceRecognition.init({
      onResult: (text) => {
        setVoiceText(text);
        setIsListening(false);
      },
      onError: (error) => {
        Alert.alert('Greška', error);
        setIsListening(false);
      },
      onStateChange: setIsListening,
    });

    return () => {
      voiceRecognition.destroy();
    };
  }, []);

  // Auto-send when voice recognition completes with text
  useEffect(() => {
    if (voiceText && !isListening) {
      handleSend(voiceText);
      setVoiceText('');
    }
  }, [voiceText, isListening]);

  // Speak RAFI's responses
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && messages.length > 1) {
      // Only speak if the previous message before this was voice-triggered
      // For now, we don't auto-speak to avoid annoyance
      // User can enable this in settings later
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  const handleMicPress = async () => {
    try {
      if (isListening) {
        await voiceRecognition.stopListening();
      } else {
        await voiceRecognition.startListening();
      }
    } catch {
      Alert.alert(
        'Mikrofon',
        'Nije moguće pristupiti mikrofonu. Provjeri dozvole u postavkama.'
      );
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            role={item.role}
            content={item.content}
            timestamp={item.timestamp}
          />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListFooterComponent={
          showSuggestions ? (
            <SuggestionsRow onSuggestionPress={handleSend} />
          ) : null
        }
      />

      <ChatInput
        onSend={handleSend}
        onMicPress={handleMicPress}
        isLoading={isLoading}
        isListening={isListening}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messageList: {
    paddingVertical: 12,
  },
});
