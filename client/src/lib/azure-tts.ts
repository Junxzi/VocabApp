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
  private currentAudio: HTMLAudioElement | null = null; // Track current playing audio
  private isPlaying = false; // Track if audio is currently playing
  private currentSynthesizer: sdk.SpeechSynthesizer | null = null; // Track current synthesizer
  private playbackQueue: Array<() => Promise<void>> = []; // Queue for audio requests
  private isProcessingQueue = false;
  private cacheHits = 0; // Track cache efficiency
  private cacheMisses = 0; // Track cache misses
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached items
  private readonly CACHE_EXPIRY_DAYS = 30; // Cache expiry in days

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
          // Check if cache entry has expired
          const expiryTime = result.timestamp + (this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
          if (Date.now() > expiryTime) {
            // Cache expired, remove it
            this.removeFromIndexedDB(key);
            resolve(null);
          } else {
            resolve(result.audioData);
          }
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['audioCache'], 'readwrite');
      const store = transaction.objectStore('audioCache');
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
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
      this.cacheHits++;
      console.log(`🎯 Playing from memory cache (Hit rate: ${(this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(1)}%)`);
      
      return new Promise((resolve, reject) => {
        // Create fresh audio element each time to avoid replay issues
        const audio = new Audio();
        this.currentAudio = audio;
        
        audio.onloadeddata = () => {
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise) {
            playPromise.catch((error) => {
              this.currentAudio = null;
              reject(error);
            });
          }
        };
        
        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };
        
        audio.onerror = () => {
          this.currentAudio = null;
          reject('Cached audio playback failed');
        };
        
        audio.onabort = () => {
          this.currentAudio = null;
          reject('Audio playback aborted');
        };
        
        // Set source after setting up event handlers
        audio.src = cachedUrl;
        audio.load();
      });
    }

    // Try IndexedDB cache
    const cachedData = await this.getFromIndexedDB(cacheKey);
    if (cachedData) {
      this.cacheHits++;
      console.log(`💾 Playing from persistent cache (Hit rate: ${(this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(1)}%)`);
      
      const blob = new Blob([cachedData], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      this.audioCache.set(cacheKey, url);
      
      return new Promise((resolve, reject) => {
        // Create fresh audio element each time to avoid replay issues
        const audio = new Audio();
        this.currentAudio = audio;
        
        audio.onloadeddata = () => {
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise) {
            playPromise.catch((error) => {
              this.currentAudio = null;
              reject(error);
            });
          }
        };
        
        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };
        
        audio.onerror = () => {
          this.currentAudio = null;
          reject('Cached audio playback failed');
        };
        
        audio.onabort = () => {
          this.currentAudio = null;
          reject('Audio playback aborted');
        };
        
        // Set source after setting up event handlers
        audio.src = url;
        audio.load();
      });
    }

    // Not found in cache
    this.cacheMisses++;
    return Promise.reject('Not in cache');
  }

  private stopCurrentAudio(): void {
    // Stop any current audio playback
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.src = '';
      this.currentAudio.load(); // Reset the audio element
      this.currentAudio = null;
    }
    
    // Stop any current synthesis
    if (this.currentSynthesizer) {
      try {
        this.currentSynthesizer.close();
      } catch (error) {
        console.warn('Error closing synthesizer:', error);
      }
      this.currentSynthesizer = null;
    }
    
    // Reset playing state
    this.isPlaying = false;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.playbackQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    while (this.playbackQueue.length > 0) {
      const request = this.playbackQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  private queueAudioRequest(requestFn: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      // Clear any existing queue to prioritize the latest request
      this.playbackQueue.length = 0;
      
      this.playbackQueue.push(async () => {
        try {
          await requestFn();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async cacheAudioData(key: string, audioData: ArrayBuffer): Promise<void> {
    // Save to IndexedDB
    await this.saveToIndexedDB(key, audioData);
    
    // Save to in-memory cache
    const blob = new Blob([audioData], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    this.audioCache.set(key, url);
    
    // Clean up old in-memory cache if needed
    if (this.audioCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.audioCache.entries());
      const toRemove = entries.slice(0, 20); // Remove 20 oldest entries
      toRemove.forEach(([cacheKey, blobUrl]) => {
        URL.revokeObjectURL(blobUrl);
        this.audioCache.delete(cacheKey);
      });
      console.log(`🧹 Cleaned up ${toRemove.length} old cache entries`);
    }
  }

  // Public method to get cache statistics
  getCacheStats(): { hits: number; misses: number; hitRate: string; memoryCacheSize: number } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total * 100).toFixed(1) : '0.0';
    
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`,
      memoryCacheSize: this.audioCache.size
    };
  }

  // Public method to clear all caches
  async clearCache(): Promise<void> {
    // Clear memory cache
    this.audioCache.forEach((url) => URL.revokeObjectURL(url));
    this.audioCache.clear();
    
    // Clear IndexedDB cache
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(['audioCache'], 'readwrite');
        const store = transaction.objectStore('audioCache');
        const request = store.clear();
        request.onsuccess = () => {
          console.log('🗑️ Audio cache cleared');
          resolve();
        };
        request.onerror = () => resolve();
      });
    }
    
    // Reset statistics
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  // Public method to clean expired entries
  async cleanExpiredCache(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['audioCache'], 'readwrite');
      const store = transaction.objectStore('audioCache');
      const request = store.openCursor();
      
      let cleanedCount = 0;
      const expiryThreshold = Date.now() - (this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const entry = cursor.value;
          if (entry.timestamp < expiryThreshold) {
            cursor.delete();
            cleanedCount++;
          }
          cursor.continue();
        } else {
          if (cleanedCount > 0) {
            console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
          }
          resolve();
        }
      };
      
      request.onerror = () => resolve();
    });
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
    console.log(`Speaking "${text}" with ${accent.toUpperCase()} accent`);
    
    return this.queueAudioRequest(async () => {
      // Prevent multiple simultaneous requests
      if (this.isPlaying) {
        this.stopCurrentAudio();
      }
      
      this.isPlaying = true;
      const cacheKey = this.getCacheKey(text, accent);
      
      try {
        // Try to play from cache first
        await this.playFromCache(cacheKey);
        console.log(`✓ Azure TTS successful for "${text}"`);
        this.isPlaying = false;
        return;
      } catch (error) {
        // Not in cache, proceed with synthesis
      }

      if (!this.isInitialized || !this.speechConfig) {
        // Fallback to browser TTS
        await this.fallbackToWebTTS(text, accent);
        this.isPlaying = false;
        return;
      }

      try {
        const voiceName = AZURE_VOICES[accent];
        this.speechConfig.speechSynthesisVoiceName = voiceName;

        // Create audio config to get raw audio data
        const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        
        // Create synthesizer and track it
        const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, audioConfig);
        this.currentSynthesizer = synthesizer;

        await new Promise<void>((resolve, reject) => {
          synthesizer.speakTextAsync(
            text,
            (result) => {
              this.currentSynthesizer = null;
              
              if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                console.log(`Azure TTS: Successfully synthesized ${text} with ${accent.toUpperCase()} accent`);
                console.log(`✓ Azure TTS successful for "${text}"`);
                
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
              this.currentSynthesizer = null;
              console.error(`Azure TTS error: ${error}`);
              synthesizer.close();
              // Fallback to web TTS on error
              this.fallbackToWebTTS(text, accent).then(resolve).catch(reject);
            }
          );
        });
      } catch (error) {
        console.error('Azure TTS speak error:', error);
        await this.fallbackToWebTTS(text, accent);
      } finally {
        this.isPlaying = false;
      }
    });
  }

  private async fallbackToWebTTS(text: string, accent: 'us' | 'uk' | 'au'): Promise<void> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        // Stop any ongoing speech synthesis
        speechSynthesis.cancel();
        
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

        utterance.onend = () => {
          console.log(`✓ Browser TTS fallback completed`);
          resolve();
        };
        
        utterance.onerror = () => {
          console.warn('Browser TTS error, but continuing');
          resolve(); // Still resolve on error
        };
        
        speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not available');
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