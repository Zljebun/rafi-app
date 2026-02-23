import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputProps {
  onSend: (text: string) => void;
  onMicPress: () => void;
  isLoading: boolean;
  isListening: boolean;
}

export function ChatInput({
  onSend,
  onMicPress,
  isLoading,
  isListening,
}: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed && !isLoading) {
      onSend(trimmed);
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[
            styles.micButton,
            isListening && styles.micButtonActive,
          ]}
          onPress={onMicPress}
          disabled={isLoading}
        >
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={22}
            color={isListening ? '#FFFFFF' : '#6C63FF'}
          />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, isListening && styles.inputListening]}
          value={text}
          onChangeText={setText}
          placeholder={isListening ? 'Slušam...' : 'Piši RAFI-ju...'}
          placeholderTextColor={isListening ? '#FF4444' : '#999'}
          multiline
          maxLength={1000}
          editable={!isLoading && !isListening}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        {isLoading ? (
          <View style={styles.sendButton}>
            <ActivityIndicator size="small" color="#6C63FF" />
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.sendButton,
              text.trim() ? styles.sendButtonActive : null,
            ]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={text.trim() ? '#FFFFFF' : '#CCC'}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E8E8EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: '#FF4444',
  },
  inputListening: {
    borderWidth: 1,
    borderColor: '#FF4444',
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    backgroundColor: '#F5F5FA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A2E',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#6C63FF',
  },
});
