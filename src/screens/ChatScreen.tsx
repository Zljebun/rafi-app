import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { SuggestionsRow } from '../components/SuggestionCard';
import { useChatStore } from '../store/chatStore';
import { whisperVoice } from '../services/voice/whisper';

export function ChatScreen() {
  const { messages, isLoading, sendMessage, exportChat } = useChatStore();
  const [isListening, setIsListening] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleExport}
          style={{ marginRight: 12, padding: 4 }}
        >
          <Ionicons name="share-outline" size={22} color="#6C63FF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    whisperVoice.init({
      onResult: (text) => {
        setIsListening(false);
        handleSend(text);
      },
      onError: (error) => {
        Alert.alert('Greška', error);
        setIsListening(false);
      },
      onStateChange: setIsListening,
    });

    return () => {
      whisperVoice.destroy();
    };
  }, []);

  const handleSend = async (text: string) => {
    await sendMessage(text);
  };

  const handleMicPress = async () => {
    try {
      await whisperVoice.toggle();
    } catch {
      Alert.alert(
        'Mikrofon',
        'Nije moguće pristupiti mikrofonu. Provjeri dozvole u postavkama.'
      );
    }
  };

  const handleExport = async () => {
    try {
      await exportChat();
    } catch {
      Alert.alert('Greška', 'Nije moguće eksportovati konverzaciju.');
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
