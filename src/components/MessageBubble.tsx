import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      {!isUser && <Text style={styles.name}>RAFI</Text>}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.text,
            isUser ? styles.userText : styles.assistantText,
          ]}
        >
          {content}
        </Text>
      </View>
      <Text
        style={[
          styles.time,
          isUser ? styles.userTime : styles.assistantTime,
        ]}
      >
        {timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
    marginBottom: 2,
    marginLeft: 12,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#6C63FF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#F0F0F5',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1A1A2E',
  },
  time: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  userTime: {
    textAlign: 'right',
    marginRight: 4,
  },
  assistantTime: {
    textAlign: 'left',
    marginLeft: 12,
  },
});
