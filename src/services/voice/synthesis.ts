import { Audio } from 'expo-av';
import { documentDirectory, writeAsStringAsync, EncodingType, deleteAsync } from 'expo-file-system/legacy';

const TTS_API_URL = 'https://api.openai.com/v1/audio/speech';

class VoiceSynthesisService {
  private apiKey: string = '';
  private speaking = false;
  private sound: Audio.Sound | null = null;

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }

  async speak(text: string): Promise<void> {
    if (!this.apiKey) return;

    if (this.speaking) {
      await this.stop();
    }

    this.speaking = true;
    const cleanedText = cleanTextForSpeech(text);
    const filePath = `${documentDirectory}rafi-tts-${Date.now()}.mp3`;

    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      const response = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: cleanedText.substring(0, 4096),
          voice: 'alloy',
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        this.speaking = false;
        return;
      }

      // Convert response to base64
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      if (!base64 || base64.length < 100) {
        this.speaking = false;
        return;
      }

      // Write to file
      await writeAsStringAsync(filePath, base64, {
        encoding: EncodingType.Base64,
      });

      // Play audio
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: filePath },
          { shouldPlay: true, volume: 1.0 }
        );
        this.sound = sound;

        // Wait for playback to finish
        await new Promise<void>((resolve) => {
          sound.setOnPlaybackStatusUpdate((s) => {
            if ('didJustFinish' in s && s.didJustFinish) {
              resolve();
            }
          });
        });

        // Cleanup
        await sound.unloadAsync();
        this.sound = null;
      } catch {
        // Playback error - ignore
      }
      await deleteAsync(filePath, { idempotent: true });
    } catch {
      await deleteAsync(filePath, { idempotent: true }).catch(() => {});
    }

    this.speaking = false;
  }

  async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {
        // Ignore
      }
      this.sound = null;
    }
    this.speaking = false;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }
}

function cleanTextForSpeech(text: string): string {
  let cleaned = text;

  // Remove emojis
  cleaned = cleaned.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '');

  // Remove markdown formatting
  cleaned = cleaned
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '');

  return cleaned.trim();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      const base64 = commaIdx >= 0 ? result.substring(commaIdx + 1) : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

export const voiceSynthesis = new VoiceSynthesisService();
