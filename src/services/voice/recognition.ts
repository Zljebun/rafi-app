import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { Platform } from 'react-native';

type OnResultCallback = (text: string) => void;
type OnErrorCallback = (error: string) => void;
type OnStateCallback = (listening: boolean) => void;

class VoiceRecognitionService {
  private onResult: OnResultCallback | null = null;
  private onError: OnErrorCallback | null = null;
  private onStateChange: OnStateCallback | null = null;
  private isInitialized = false;

  init(callbacks: {
    onResult: OnResultCallback;
    onError: OnErrorCallback;
    onStateChange: OnStateCallback;
  }) {
    if (this.isInitialized) return;

    this.onResult = callbacks.onResult;
    this.onError = callbacks.onError;
    this.onStateChange = callbacks.onStateChange;

    Voice.onSpeechResults = this.handleResults;
    Voice.onSpeechError = this.handleError;
    Voice.onSpeechStart = () => this.onStateChange?.(true);
    Voice.onSpeechEnd = () => this.onStateChange?.(false);

    this.isInitialized = true;
  }

  private handleResults = (e: SpeechResultsEvent) => {
    const text = e.value?.[0];
    if (text) {
      this.onResult?.(text);
    }
  };

  private handleError = (e: SpeechErrorEvent) => {
    this.onStateChange?.(false);
    this.onError?.(e.error?.message || 'Greška u prepoznavanju govora');
  };

  async startListening(): Promise<void> {
    try {
      await Voice.start(Platform.OS === 'ios' ? 'sr-Latn-RS' : 'sr-RS');
    } catch (error) {
      // Fallback to generic locale
      try {
        await Voice.start('en-US');
      } catch {
        this.onError?.('Nije moguće pokrenuti prepoznavanje govora');
      }
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
    } catch {
      // Ignore stop errors
    }
    this.onStateChange?.(false);
  }

  async toggle(): Promise<boolean> {
    const isListening = await Voice.isRecognizing();
    if (isListening) {
      await this.stopListening();
      return false;
    } else {
      await this.startListening();
      return true;
    }
  }

  async destroy(): Promise<void> {
    try {
      await Voice.destroy();
    } catch {
      // Ignore
    }
    this.isInitialized = false;
  }
}

export const voiceRecognition = new VoiceRecognitionService();
