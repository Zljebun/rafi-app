import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

class VoiceSynthesisService {
  private speaking = false;
  private audioModeSet = false;

  private async ensureAudioMode(): Promise<void> {
    if (this.audioModeSet) return;
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });
      this.audioModeSet = true;
    } catch {
      // Ignore - will still work in foreground
    }
  }

  async speak(text: string): Promise<void> {
    if (this.speaking) {
      await this.stop();
    }

    await this.ensureAudioMode();
    this.speaking = true;

    return new Promise((resolve) => {
      Speech.speak(text, {
        language: 'sr-Latn-RS', // Serbian Latin
        rate: 0.95,
        pitch: 1.0,
        onDone: () => {
          this.speaking = false;
          resolve();
        },
        onError: () => {
          this.speaking = false;
          resolve();
        },
      });
    });
  }

  async stop(): Promise<void> {
    await Speech.stop();
    this.speaking = false;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }
}

export const voiceSynthesis = new VoiceSynthesisService();
