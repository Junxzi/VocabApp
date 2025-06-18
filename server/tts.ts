import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type AccentType = 'us' | 'uk' | 'au';

// Map accents to appropriate TTS voices with better accent matching
const ACCENT_VOICE_MAP: Record<AccentType, TTSVoice> = {
  us: 'alloy',    // Clear, natural American accent
  uk: 'shimmer',  // More sophisticated voice suitable for British accent
  au: 'nova'      // Crisp voice that works well for Australian variant
};

export interface TTSRequest {
  text: string;
  accent: AccentType;
}

export async function generateTTS(text: string, accent: AccentType): Promise<Buffer> {
  try {
    const voice = ACCENT_VOICE_MAP[accent];
    
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