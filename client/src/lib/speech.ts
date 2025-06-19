// Speech synthesis utility using Azure TTS for high-quality pronunciation
export type AccentType = 'us' | 'uk' | 'au';

// Audio cache to avoid repeated API calls
const audioCache = new Map<string, string>();

// Generate cache key for audio
function getCacheKey(text: string, accent: AccentType): string {
  return `${accent}:${text.toLowerCase()}`;
}

// Use Azure TTS API for consistent, high-quality pronunciation
export async function speakWithAzureTTS(text: string, accent: AccentType): Promise<void> {
  const cacheKey = getCacheKey(text, accent);
  
  try {
    let audioData = audioCache.get(cacheKey);
    
    if (!audioData) {
      // Generate audio using Azure TTS API
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

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = btoa(new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
      audioData = `data:audio/mp3;base64,${base64Audio}`;
      
      // Cache the audio data
      audioCache.set(cacheKey, audioData);
    }

    // Play the audio
    const audio = new Audio(audioData);
    audio.volume = 0.8;
    await audio.play();
  } catch (error) {
    console.error('Azure TTS error:', error);
    // Fallback to browser speech synthesis if Azure TTS fails
    fallbackToSpeechSynthesis(text, accent);
  }
}

// Fallback to browser speech synthesis
function fallbackToSpeechSynthesis(text: string, accent: AccentType): void {
  const voices = speechSynthesis.getVoices();
  let selectedVoice: SpeechSynthesisVoice | null = null;

  // Voice selection logic for fallback
  switch (accent) {
    case 'us':
      selectedVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Samantha')) ||
                    voices.find(v => v.lang === 'en-US') ||
                    voices.find(v => v.lang.startsWith('en-US')) ||
                    null;
      break;
    case 'uk':
      selectedVoice = voices.find(v => v.lang === 'en-GB' && v.name.includes('Daniel')) ||
                    voices.find(v => v.lang === 'en-GB') ||
                    voices.find(v => v.lang.startsWith('en-GB')) ||
                    null;
      break;
    case 'au':
      selectedVoice = voices.find(v => v.lang === 'en-AU' && v.name.includes('Karen')) ||
                    voices.find(v => v.lang === 'en-AU') ||
                    voices.find(v => v.lang.startsWith('en-AU')) ||
                    null;
      break;
  }

  if (selectedVoice) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    speechSynthesis.speak(utterance);
  }
}

// Main function to speak text with specified accent
export async function speak(text: string, accent: AccentType = 'us'): Promise<void> {
  // Always try Azure TTS first for consistent quality
  await speakWithAzureTTS(text, accent);
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

// Initialize speech synthesis and load voices
export function initializeSpeech(): Promise<void> {
  return new Promise((resolve) => {
    if (speechSynthesis.getVoices().length !== 0) {
      resolve();
    } else {
      speechSynthesis.addEventListener('voiceschanged', () => {
        resolve();
      });
    }
  });
}