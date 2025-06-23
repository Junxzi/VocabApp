// mobile/src/services/azureTTSService.ts

// 上部に追加
import { encode } from 'base64-arraybuffer';
import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';
import { Platform, Alert } from 'react-native';
import { AZURE_SPEECH_KEY, AZURE_SPEECH_REGION } from '@env';

const AZURE_VOICES = {
  us: 'en-US-JennyNeural',
  uk: 'en-GB-SoniaNeural',
  au: 'en-AU-NatashaNeural',
} as const;

export type AccentType = keyof typeof AZURE_VOICES;

const CACHE_DIR = `${RNFS.CachesDirectoryPath}/tts_cache`;

class AzureTTS {
  private initialized = false;

  async init() {
    if (this.initialized) return;
    const exists = await RNFS.exists(CACHE_DIR);
    if (!exists) {
      await RNFS.mkdir(CACHE_DIR);
    }
    this.initialized = true;
  }

  private getCachePath(text: string, accent: AccentType): string {
    const safe = text.replace(/[^a-zA-Z0-9]/g, '_');
    return `${CACHE_DIR}/${accent}_${safe}.mp3`;
  }

  private getSSML(text: string, voice: string): string {
    return `<speak version='1.0' xml:lang='en-US'><voice name='${voice}'>${text}</voice></speak>`;
  }

  async speak(text: string, accent: AccentType = 'us'): Promise<void> {
    await this.init();
    const cachePath = this.getCachePath(text, accent);

    const cached = await RNFS.exists(cachePath);
    if (cached) {
      console.log('🔈 Using cached audio:', cachePath);
      return this.play(cachePath);
    }

    const url = `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = this.getSSML(text, AZURE_VOICES[accent]);

    console.log('🔁 Azure TTS Request:', { url, voice: AZURE_VOICES[accent], text });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3',
        'User-Agent': 'VocabMasterApp',
      },
      body: ssml,
    });

    console.log('📡 Azure TTS Response status:', res.status);

    if (!res.ok) {
      const msg = `Azure TTS failed: ${res.status} ${res.statusText}`;
      console.warn(msg);
      Alert.alert('Azureエラー', msg); // 👈 画面表示で確認できる
      throw new Error(msg);
    }

    const buffer = await res.arrayBuffer();
    const base64Audio = encode(buffer);
    await RNFS.writeFile(cachePath, base64Audio, 'base64');

    console.log('💾 Audio cached:', cachePath);

    return this.play(cachePath);
  }

  private play(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sound = new Sound(path, '', (error) => {
        if (error) {
          console.error('🔇 Sound load error:', error);
          Alert.alert('再生エラー', '音声の読み込みに失敗しました。');
          return reject(error);
        }
        sound.play((success) => {
          sound.release();
          if (success) {
            console.log('✅ Playback success');
            resolve();
          } else {
            console.warn('⚠️ Playback failed');
            Alert.alert('再生失敗', '音声の再生に失敗しました。');
            reject(new Error('Failed to play audio'));
          }
        });
      });
    });
  }
}

export const azureTTS = new AzureTTS();