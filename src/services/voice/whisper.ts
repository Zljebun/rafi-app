import { Audio } from 'expo-av';
import { getInfoAsync, deleteAsync } from 'expo-file-system/legacy';

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions';
const MODEL = 'whisper-1';

type OnResultCallback = (text: string) => void;
type OnErrorCallback = (error: string) => void;
type OnStateCallback = (recording: boolean) => void;

class WhisperVoiceService {
  private apiKey: string = '';
  private recording: Audio.Recording | null = null;
  private onResult: OnResultCallback | null = null;
  private onError: OnErrorCallback | null = null;
  private onStateChange: OnStateCallback | null = null;
  private isRecording = false;

  configure(apiKey: string) {
    this.apiKey = apiKey;
  }

  init(callbacks: {
    onResult: OnResultCallback;
    onError: OnErrorCallback;
    onStateChange: OnStateCallback;
  }) {
    this.onResult = callbacks.onResult;
    this.onError = callbacks.onError;
    this.onStateChange = callbacks.onStateChange;
  }

  async startRecording(): Promise<void> {
    if (!this.apiKey) {
      this.onError?.('OpenAI API ključ nije podešen. Idi u Postavke.');
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        this.onError?.('Dozvola za mikrofon nije odobrena.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      this.onStateChange?.(true);
    } catch (error) {
      this.onError?.('Greška pri pokretanju snimanja.');
      this.isRecording = false;
      this.onStateChange?.(false);
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.recording) {
      this.isRecording = false;
      this.onStateChange?.(false);
      return;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;
      this.onStateChange?.(false);

      if (uri) {
        await this.transcribe(uri);
      }
    } catch (error) {
      this.isRecording = false;
      this.onStateChange?.(false);
      this.onError?.('Greška pri zaustavljanju snimanja.');
    }
  }

  private async transcribe(audioUri: string): Promise<void> {
    try {
      // Read file as base64 and create form data
      const fileInfo = await getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        this.onError?.('Audio fajl nije pronađen.');
        return;
      }

      // Use fetch with FormData for multipart upload
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', MODEL);
      formData.append('language', 'sr'); // Serbian

      const response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const text = result.text?.trim();

      if (text) {
        this.onResult?.(text);
      } else {
        this.onError?.('Nisam razumio. Pokušaj ponovo.');
      }

      // Clean up audio file
      await deleteAsync(audioUri, { idempotent: true });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Greška u transkripciji';
      this.onError?.(msg);
    }
  }

  async toggle(): Promise<boolean> {
    if (this.isRecording) {
      await this.stopRecording();
      return false;
    } else {
      await this.startRecording();
      return true;
    }
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  async destroy(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch {
        // Ignore
      }
      this.recording = null;
    }
    this.isRecording = false;
  }
}

export const whisperVoice = new WhisperVoiceService();
