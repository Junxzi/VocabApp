// Speech synthesis utility using OpenAI TTS for high-quality pronunciation
export type AccentType = 'us' | 'uk' | 'au';

interface VoiceInfo {
  voice: SpeechSynthesisVoice;
  quality: number; // Higher is better
}

// Get available voices and rank them by quality for each accent
export function getVoicesForAccent(accent: AccentType): VoiceInfo[] {
  const voices = speechSynthesis.getVoices();
  const voiceInfos: VoiceInfo[] = [];

  for (const voice of voices) {
    let quality = 0;
    
    switch (accent) {
      case 'us':
        if (voice.lang === 'en-US') {
          quality += 100;
          // Premium quality voices
          if (voice.name.includes('Enhanced') || voice.name.includes('Premium')) quality += 50;
          if (voice.name.includes('Samantha')) quality += 40;
          if (voice.name.includes('Alex')) quality += 35;
          if (voice.name.includes('Allison')) quality += 30;
          if (voice.name.includes('Ava')) quality += 25;
          if (voice.localService) quality += 20;
          if (voice.name.includes('Natural') || voice.name.includes('Neural')) quality += 15;
        } else if (voice.lang.startsWith('en-US')) {
          quality += 50;
        }
        break;
        
      case 'uk':
        if (voice.lang === 'en-GB') {
          quality += 100;
          // Premium quality voices
          if (voice.name.includes('Enhanced') || voice.name.includes('Premium')) quality += 50;
          if (voice.name.includes('Daniel')) quality += 40;
          if (voice.name.includes('Kate')) quality += 35;
          if (voice.name.includes('Serena')) quality += 30;
          if (voice.name.includes('Oliver')) quality += 25;
          if (voice.localService) quality += 20;
          if (voice.name.includes('Natural') || voice.name.includes('Neural')) quality += 15;
        } else if (voice.lang.startsWith('en-GB')) {
          quality += 50;
        }
        break;
        
      case 'au':
        if (voice.lang === 'en-AU') {
          quality += 100;
          if (voice.name.includes('Enhanced') || voice.name.includes('Premium')) quality += 50;
          if (voice.name.includes('Karen')) quality += 40;
          if (voice.name.includes('Lee')) quality += 35;
          if (voice.localService) quality += 20;
          if (voice.name.includes('Natural') || voice.name.includes('Neural')) quality += 15;
        } else if (voice.lang.startsWith('en-AU')) {
          quality += 50;
        }
        break;
    }
    
    if (quality > 0) {
      voiceInfos.push({ voice, quality });
    }
  }
  
  // Sort by quality (highest first)
  return voiceInfos.sort((a, b) => b.quality - a.quality);
}

// Debug function to log available voices
export function logAvailableVoices() {
  const voices = speechSynthesis.getVoices();
  console.log('Available voices:', voices.length);
  
  const usVoices = voices.filter(v => v.lang.startsWith('en-US'));
  const ukVoices = voices.filter(v => v.lang.startsWith('en-GB'));
  const auVoices = voices.filter(v => v.lang.startsWith('en-AU'));
  
  console.log('US voices:', usVoices.map(v => `${v.name} (${v.lang})`));
  console.log('UK voices:', ukVoices.map(v => `${v.name} (${v.lang})`));
  console.log('AU voices:', auVoices.map(v => `${v.name} (${v.lang})`));
}

// Audio cache for TTS responses
const audioCache = new Map<string, string>();

// Generate cache key for TTS requests
function getCacheKey(text: string, accent: AccentType): string {
  return `${text}-${accent}`;
}

// Main speech function using stored audio data or API fallback
export async function speakWithAccent(text: string, accent: AccentType, audioData?: string | null): Promise<void> {
  try {
    let audioUrl: string;

    if (audioData) {
      // Use stored audio data (base64 encoded MP3)
      const audioBlob = new Blob([Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], {
        type: 'audio/mpeg'
      });
      audioUrl = URL.createObjectURL(audioBlob);
    } else {
      // Fallback to API if no stored audio data
      const cacheKey = getCacheKey(text, accent);
      
      // Check cache first
      let cachedUrl = audioCache.get(cacheKey);
      
      if (!cachedUrl) {
        // Generate TTS audio via API
        const response = await fetch('/api/tts/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, accent }),
        });

        if (!response.ok) {
          throw new Error(`TTS API error: ${response.status}`);
        }

        // Create blob URL for audio playback
        const audioBlob = await response.blob();
        cachedUrl = URL.createObjectURL(audioBlob);
        
        // Cache the audio URL
        audioCache.set(cacheKey, cachedUrl);
      }
      
      audioUrl = cachedUrl;
    }

    // Play the audio
    const audio = new Audio(audioUrl);
    audio.volume = 0.8;
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        // Clean up blob URL if it was created from stored data
        if (audioData) {
          URL.revokeObjectURL(audioUrl);
        }
        resolve();
      };
      audio.onerror = () => {
        // Clean up blob URL if it was created from stored data
        if (audioData) {
          URL.revokeObjectURL(audioUrl);
        }
        reject(new Error('Audio playback error'));
      };
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('Audio playback error:', error);
    // Fallback to browser speech synthesis
    return fallbackToWebSpeech(text, accent);
  }
}

// Fallback to browser speech synthesis if OpenAI TTS fails
function fallbackToWebSpeech(text: string, accent: AccentType): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    utterance.pitch = 1.0;

    const setVoiceAndSpeak = () => {
      const voiceInfos = getVoicesForAccent(accent);
      
      if (voiceInfos.length > 0) {
        const bestVoice = voiceInfos[0].voice;
        utterance.voice = bestVoice;
        console.log(`Fallback using voice: ${bestVoice.name} (${bestVoice.lang}) for ${accent.toUpperCase()}`);
      } else {
        const langMap = { us: 'en-US', uk: 'en-GB', au: 'en-AU' };
        utterance.lang = langMap[accent];
        console.log(`Fallback to language: ${utterance.lang} for ${accent.toUpperCase()}`);
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error('Speech synthesis error'));
      
      speechSynthesis.speak(utterance);
    };

    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      setVoiceAndSpeak();
    } else {
      const handleVoicesChanged = () => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        setVoiceAndSpeak();
      };
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      setTimeout(() => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        setVoiceAndSpeak();
      }, 1000);
    }
  });
}