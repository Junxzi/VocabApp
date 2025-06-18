import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type AccentType = 'us' | 'uk' | 'au';

// Map accents to appropriate TTS voices - using different voices that have more distinct characteristics
const ACCENT_VOICE_MAP: Record<AccentType, TTSVoice> = {
  us: 'alloy',    // Standard American voice
  uk: 'echo',     // More formal voice that works better for British accent
  au: 'fable'     // Different voice with clearer articulation for Australian variant
};

export interface TTSRequest {
  text: string;
  accent: AccentType;
}

export async function generateTTS(text: string, accent: AccentType): Promise<Buffer> {
  try {
    const voice = ACCENT_VOICE_MAP[accent];
    
    // Create accent-specific prompts to encourage proper pronunciation
    let inputText = text;
    if (accent === 'uk') {
      inputText = `[Speaking in British English accent] ${text}`;
    } else if (accent === 'au') {
      inputText = `[Speaking in Australian English accent] ${text}`;
    } else {
      inputText = `[Speaking in American English accent] ${text}`;
    }
    
    const response = await openai.audio.speech.create({
      model: "tts-1-hd", // Use HD model for better quality
      voice: voice,
      input: inputText,
      response_format: "mp3",
      speed: 0.95 // Slightly slower for clearer pronunciation
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    // Fallback to regular model if HD fails
    try {
      const fallbackResponse = await openai.audio.speech.create({
        model: "tts-1",
        voice: ACCENT_VOICE_MAP[accent],
        input: text,
        response_format: "mp3",
        speed: 1.0
      });
      const fallbackBuffer = Buffer.from(await fallbackResponse.arrayBuffer());
      return fallbackBuffer;
    } catch (fallbackError) {
      console.error('OpenAI TTS fallback error:', fallbackError);
      throw new Error('Failed to generate TTS audio');
    }
  }
}

// Generate TTS audio for all accents and return as base64 strings
export async function generateAllAccentsTTS(text: string): Promise<{
  audioDataUs: string;
  audioDataUk: string;
  audioDataAu: string;
}> {
  try {
    const [usBuffer, ukBuffer, auBuffer] = await Promise.all([
      generateTTS(text, 'us'),
      generateTTS(text, 'uk'),
      generateTTS(text, 'au')
    ]);

    return {
      audioDataUs: usBuffer.toString('base64'),
      audioDataUk: ukBuffer.toString('base64'),
      audioDataAu: auBuffer.toString('base64')
    };
  } catch (error) {
    console.error('Failed to generate TTS for all accents:', error);
    throw error;
  }
}

export async function generateTTSWithCustomVoice(text: string, voice: TTSVoice): Promise<Buffer> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
      response_format: "mp3",
      speed: 1.0
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    throw new Error('Failed to generate TTS audio');
  }
}