import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { secureStore } from '../services/storage/secureStore';
import { claude } from '../services/ai/claude';
import { whisperVoice } from '../services/voice/whisper';
import { voiceSynthesis } from '../services/voice/synthesis';
import { googleSearch } from '../services/search/google';

export function SettingsScreen() {
  const [claudeKey, setClaudeKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleCx, setGoogleCx] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasClaudeKey, setHasClaudeKey] = useState(false);
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false);
  const [hasGoogleKey, setHasGoogleKey] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const [savedClaude, savedOpenai, savedGoogle] = await Promise.all([
        secureStore.getClaudeKey(),
        secureStore.getOpenAIKey(),
        secureStore.getGoogleSearchKeys(),
      ]);
      if (savedClaude) {
        setClaudeKey(savedClaude);
        setHasClaudeKey(true);
      }
      if (savedOpenai) {
        setOpenaiKey(savedOpenai);
        setHasOpenaiKey(true);
      }
      if (savedGoogle.apiKey) {
        setGoogleApiKey(savedGoogle.apiKey);
        setHasGoogleKey(true);
      }
      if (savedGoogle.cx) {
        setGoogleCx(savedGoogle.cx);
      }
    } catch {
      // First launch, no keys saved
    }
    setLoading(false);
  }

  async function saveKeys() {
    setSaving(true);
    try {
      const trimmedClaude = claudeKey.trim();
      const trimmedOpenai = openaiKey.trim();
      const trimmedGoogleKey = googleApiKey.trim();
      const trimmedGoogleCx = googleCx.trim();

      if (trimmedClaude) {
        await secureStore.saveClaudeKey(trimmedClaude);
        claude.configure(trimmedClaude);
        setHasClaudeKey(true);
      }

      if (trimmedOpenai) {
        await secureStore.saveOpenAIKey(trimmedOpenai);
        whisperVoice.configure(trimmedOpenai);
        voiceSynthesis.configure(trimmedOpenai);
        setHasOpenaiKey(true);
      }

      if (trimmedGoogleKey && trimmedGoogleCx) {
        await secureStore.saveGoogleSearchKeys(trimmedGoogleKey, trimmedGoogleCx);
        googleSearch.configure(trimmedGoogleKey, trimmedGoogleCx);
        setHasGoogleKey(true);
      }

      Alert.alert('Uspješno', 'API ključevi su sačuvani.');
    } catch (error) {
      Alert.alert('Greška', 'Nije moguće sačuvati ključeve.');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#6C63FF" />
          <Text style={styles.sectionTitle}>Claude AI (Chat)</Text>
          {hasClaudeKey && (
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
          )}
        </View>
        <Text style={styles.description}>
          Anthropic API ključ za AI chat funkcionalnost.
        </Text>
        <TextInput
          style={styles.input}
          value={claudeKey}
          onChangeText={setClaudeKey}
          placeholder="sk-ant-api03-..."
          placeholderTextColor="#999"
          secureTextEntry={hasClaudeKey && claudeKey.length > 10}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="mic" size={20} color="#6C63FF" />
          <Text style={styles.sectionTitle}>OpenAI Whisper (Voice)</Text>
          {hasOpenaiKey && (
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
          )}
        </View>
        <Text style={styles.description}>
          OpenAI API ključ za voice-to-text (Whisper).
        </Text>
        <TextInput
          style={styles.input}
          value={openaiKey}
          onChangeText={setOpenaiKey}
          placeholder="sk-..."
          placeholderTextColor="#999"
          secureTextEntry={hasOpenaiKey && openaiKey.length > 10}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="search" size={20} color="#6C63FF" />
          <Text style={styles.sectionTitle}>Google Search</Text>
          {hasGoogleKey && (
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
          )}
        </View>
        <Text style={styles.description}>
          Google Custom Search za pretragu interneta. Besplatno do 100 pretraga dnevno.
        </Text>
        <TextInput
          style={styles.input}
          value={googleApiKey}
          onChangeText={setGoogleApiKey}
          placeholder="AIzaSy..."
          placeholderTextColor="#999"
          secureTextEntry={hasGoogleKey && googleApiKey.length > 10}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.fieldLabel}>Search Engine ID (cx)</Text>
        <TextInput
          style={styles.input}
          value={googleCx}
          onChangeText={setGoogleCx}
          placeholder="a1b2c3d4e5..."
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={saveKeys}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="save" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Sačuvaj</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={18} color="#6C63FF" />
        <Text style={styles.infoText}>
          Ključevi se čuvaju šifrovano na tvom uređaju. Nikada se ne šalju
          nigdje osim na odgovarajuće API servere.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#F8F8FC',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A2E',
    fontFamily: 'monospace',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F0F0FF',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
