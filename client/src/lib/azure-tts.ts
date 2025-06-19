import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

interface AzureVoiceConfig {
  us: string;
  uk: string;
  au: string;
}

// High-quality Azure neural voices for different accents
const AZURE_VOICES: AzureVoiceConfig = {
  us: 'en-US-JennyNeural', // Natural American female voice
  uk: 'en-GB-SoniaNeural', // Natural British female voice
  au: 'en-AU-NatashaNeural' // Natural Australian female voice
};

interface AudioCacheEntry {
  audioData: ArrayBuffer;
  timestamp: number;
}

class AzureTTSService {
  private speechConfig: sdk.SpeechConfig | null = null;
  private isInitialized = false;
  private audioCache: Map<string, string> = new Map(); // In-memory cache for current session
  private db: IDBDatabase | null = null;
  private dbName = 'azure-tts-cache';
  private dbVersion = 1;

  constructor() {
    this.initialize();
    this.initIndexedDB();
  }

  private getCacheKey(text: string, accent: 'us' | 'uk' | 'au'): string {
    return `tts_${text.toLowerCase()}_${accent}`;
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.warn('IndexedDB not available for audio caching');
        resolve();
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Audio cache database initialized');
        resolve();
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('audioCache')) {
          const store = db.createObjectStore('audioCache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private async getFromIndexedDB(key: string): Promise<ArrayBuffer | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['audioCache'], 'readonly');
      const store = transaction.objectStore('audioCache');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.audioData) {
          resolve(result.audioData);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  }

  private async saveToIndexedDB(key: string, audioData: ArrayBuffer): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['audioCache'], 'readwrite');
      const store = transaction.objectStore('audioCache');
      
      const entry: AudioCacheEntry = {
        audioData,
        timestamp: Date.now()
      };
      
      const request = store.put({ key, ...entry });
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  private async playFromCache(cacheKey: string): Promise<void> {
    // Try in-memory cache first
    const cachedUrl = this.audioCache.get(cacheKey);
    if (cachedUrl) {
      return new Promise((resolve, reject) => {
        const audio = new Audio(cachedUrl);
        audio.onended = () => resolve();
        audio.onerror = () => reject('Cached audio playback failed');
        audio.play().catch(reject);
      });
    }

    // Try IndexedDB cache
    const cachedData = await this.getFromIndexedDB(cacheKey);
    if (cachedData) {
      const blob = new Blob([cachedData], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      this.audioCache.set(cacheKey, url);
      
      return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.onended = () => resolve();
        audio.onerror = () => reject('Cached audio playback failed');
        audio.play().catch(reject);
      });
    }

    return Promise.reject('Not in cache');
  }

  private async cacheAudioData(key: string, audioData: ArrayBuffer): Promise<void> {
    // Save to IndexedDB
    await this.saveToIndexedDB(key, audioData);
    
    // Save to in-memory cache
    const blob = new Blob([audioData], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    this.audioCache.set(key, url);
    
    // Clean up old in-memory cache if needed
    if (this.audioCache.size > 50) {
      const entries = Array.from(this.audioCache.entries());
      const toRemove = entries.slice(0, 10);
      toRemove.forEach(([cacheKey, blobUrl]) => {
        URL.revokeObjectURL(blobUrl);
        this.audioCache.delete(cacheKey);
      });
    }
  }

  private async initialize() {
    try {
      // Get Azure credentials from server
      const response = await fetch('/api/azure-config');
      if (!response.ok) {
        console.warn('Azure Speech Services credentials not available, falling back to browser TTS');
        return;
      }
      
      const { speechKey, speechRegion } = await response.json();
      
      if (!speechKey || !speechRegion) {
        console.warn('Azure Speech Services credentials not found, falling back to browser TTS');
        return;
      }

      this.speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);

      // Set audio output format for better quality
      this.speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
      
      this.isInitialized = true;
      console.log('Azure TTS service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure TTS service:', error);
      this.isInitialized = false;
    }
  }

  async speak(text: string, accent: 'us' | 'uk' | 'au' = 'us'): Promise<void> {
    const cacheKey = this.getCacheKey(text, accent);
    
    // Try to play from cache first
    try {
      await this.playFromCache(cacheKey);
      console.log(`Played ${text} (${accent.toUpperCase()}) from cache`);
      return;
    } catch (error) {
      // Not in cache, proceed with synthesis
    }

    if (!this.isInitialized || !this.speechConfig) {
      // Fallback to browser TTS
      return this.fallbackToWebTTS(text, accent);
    }

    try {
      const voiceName = AZURE_VOICES[accent];
      this.speechConfig.speechSynthesisVoiceName = voiceName;

      // Create audio config to get raw audio data
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      
      // Create synthesizer
      const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, audioConfig);

      return new Promise((resolve, reject) => {
        synthesizer.speakTextAsync(
          text,
          (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              console.log(`Azure TTS: Successfully synthesized ${text} with ${accent.toUpperCase()} accent`);
              
              // Cache the audio data asynchronously (don't wait)
              if (result.audioData) {
                this.cacheAudioData(cacheKey, result.audioData)
                  .then(() => console.log(`Cached audio for ${text} (${accent.toUpperCase()})`))
                  .catch(error => console.warn('Failed to cache audio:', error));
              }
              
              resolve();
            } else {
              console.error(`Azure TTS synthesis failed: ${result.errorDetails}`);
              // Fallback to web TTS on Azure failure
              this.fallbackToWebTTS(text, accent).then(resolve).catch(reject);
            }
            synthesizer.close();
          },
          (error) => {
            console.error(`Azure TTS error: ${error}`);
            synthesizer.close();
            // Fallback to web TTS on error
            this.fallbackToWebTTS(text, accent).then(resolve).catch(reject);
          }
        );
      });
    } catch (error) {
      console.error('Azure TTS speak error:', error);
      return this.fallbackToWebTTS(text, accent);
    }
  }

  private async fallbackToWebTTS(text: string, accent: 'us' | 'uk' | 'au'): Promise<void> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.volume = 0.7;

        // Set language based on accent
        const languageMap = {
          us: 'en-US',
          uk: 'en-GB',
          au: 'en-AU'
        };
        utterance.lang = languageMap[accent];

        // Try to find accent-specific voice
        const voices = speechSynthesis.getVoices();
        const targetVoice = voices.find(voice => 
          voice.lang.startsWith(languageMap[accent]) ||
          voice.name.toLowerCase().includes(accent)
        );
        
        if (targetVoice) {
          utterance.voice = targetVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve(); // Still resolve on error
        
        speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }

  // Create SSML for more advanced control
  private createSSML(text: string, voice: string, rate: number = 1.0): string {
    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${voice}">
          <prosody rate="${rate}">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;
  }

  async speakWithSSML(text: string, accent: 'us' | 'uk' | 'au' = 'us', options?: { rate?: number }): Promise<void> {
    if (!this.isInitialized || !this.speechConfig) {
      return this.fallbackToWebTTS(text, accent);
    }

    try {
      const voiceName = AZURE_VOICES[accent];
      const ssml = this.createSSML(text, voiceName, options?.rate || 1.0);

      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, audioConfig);

      return new Promise((resolve, reject) => {
        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              console.log(`Azure TTS SSML: Successfully synthesized ${text} with ${accent.toUpperCase()} accent`);
              resolve();
            } else {
              console.error(`Azure TTS SSML synthesis failed: ${result.errorDetails}`);
              this.fallbackToWebTTS(text, accent).then(resolve).catch(reject);
            }
            synthesizer.close();
          },
          (error) => {
            console.error(`Azure TTS SSML error: ${error}`);
            synthesizer.close();
            this.fallbackToWebTTS(text, accent).then(resolve).catch(reject);
          }
        );
      });
    } catch (error) {
      console.error('Azure TTS SSML speak error:', error);
      return this.fallbackToWebTTS(text, accent);
    }
  }
}

// Export singleton instance
export const azureTTS = new AzureTTSService();