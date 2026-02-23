import * as Speech from 'expo-speech';

class VoiceSynthesisService {
  private speaking = false;

  async speak(text: string): Promise<void> {
    if (this.speaking) {
      await this.stop();
    }

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
