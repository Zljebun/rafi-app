import * as SecureStore from 'expo-secure-store';

const KEYS = {
  OPENAI_API_KEY: 'rafi_openai_api_key',
  CLAUDE_API_KEY: 'rafi_claude_api_key',
  GOOGLE_API_KEY: 'rafi_google_api_key',
  GOOGLE_CX: 'rafi_google_cx',
} as const;

class SecureStoreService {
  async saveOpenAIKey(key: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.OPENAI_API_KEY, key);
  }

  async getOpenAIKey(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.OPENAI_API_KEY);
  }

  async saveClaudeKey(key: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.CLAUDE_API_KEY, key);
  }

  async getClaudeKey(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.CLAUDE_API_KEY);
  }

  async saveGoogleSearchKeys(apiKey: string, cx: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.GOOGLE_API_KEY, apiKey);
    await SecureStore.setItemAsync(KEYS.GOOGLE_CX, cx);
  }

  async getGoogleSearchKeys(): Promise<{ apiKey: string | null; cx: string | null }> {
    const [apiKey, cx] = await Promise.all([
      SecureStore.getItemAsync(KEYS.GOOGLE_API_KEY),
      SecureStore.getItemAsync(KEYS.GOOGLE_CX),
    ]);
    return { apiKey, cx };
  }

  async hasKeys(): Promise<{ openai: boolean; claude: boolean; google: boolean }> {
    const [openai, claude, google] = await Promise.all([
      this.getOpenAIKey(),
      this.getClaudeKey(),
      SecureStore.getItemAsync(KEYS.GOOGLE_API_KEY),
    ]);
    return {
      openai: !!openai?.trim(),
      claude: !!claude?.trim(),
      google: !!google?.trim(),
    };
  }

  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.OPENAI_API_KEY);
    await SecureStore.deleteItemAsync(KEYS.CLAUDE_API_KEY);
    await SecureStore.deleteItemAsync(KEYS.GOOGLE_API_KEY);
    await SecureStore.deleteItemAsync(KEYS.GOOGLE_CX);
  }
}

export const secureStore = new SecureStoreService();
