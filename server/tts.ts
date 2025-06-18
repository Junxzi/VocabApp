export type AccentType = 'us' | 'uk' | 'au';

// Azure Speech Service voices with authentic regional accents
const AZURE_VOICE_MAP: Record<AccentType, string> = {
  us: 'en-US-AriaNeural',      // Clear American female voice
  uk: 'en-GB-SoniaNeural',     // British female voice with clear RP accent
  au: 'en-AU-NatashaNeural'    // Australian female voice with clear Aussie accent
};

// Alternative male voices for variety
const AZURE_VOICE_MAP_MALE: Record<AccentType, string> = {
  us: 'en-US-GuyNeural',       // American male voice
  uk: 'en-GB-RyanNeural',      // British male voice
  au: 'en-AU-WilliamNeural'    // Australian male voice
};

export interface TTSRequest {
  text: string;
  accent: AccentType;
}

export async function generateTTS(text: string, accent: AccentType): Promise<Buffer> {
  try {
    const voice = AZURE_VOICE_MAP[accent];
    
    // Create SSML for Azure Speech Service with proper accent
    const xmlLang = accent === 'uk' ? 'en-GB' : accent === 'au' ? 'en-AU' : 'en-US';
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${xmlLang}">
        <voice name="${voice}">
          <prosody rate="0.9" pitch="+0%">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;

    // Use Azure Speech Service REST API
    const subscriptionKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!subscriptionKey) {
      throw new Error('Azure Speech Service key not configured');
    }

    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'VocabularyApp'
      },
      body: ssml
    });

    if (!response.ok) {
      throw new Error(`Azure TTS API error: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  } catch (error) {
    console.error('Azure TTS error:', error);
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

export async function generateTTSWithCustomVoice(text: string, accent: AccentType, useMaleVoice: boolean = false): Promise<Buffer> {
  try {
    const voice = useMaleVoice ? AZURE_VOICE_MAP_MALE[accent] : AZURE_VOICE_MAP[accent];
    
    // Create SSML for Azure Speech Service
    const xmlLang = accent === 'uk' ? 'en-GB' : accent === 'au' ? 'en-AU' : 'en-US';
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${xmlLang}">
        <voice name="${voice}">
          <prosody rate="0.9" pitch="+0%">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;

    const subscriptionKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'eastus';

    if (!subscriptionKey) {
      throw new Error('Azure Speech Service key not configured');
    }

    const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'VocabularyApp'
      },
      body: ssml
    });

    if (!response.ok) {
      throw new Error(`Azure TTS API error: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  } catch (error) {
    console.error('Azure TTS custom voice error:', error);
    throw new Error('Failed to generate TTS audio with custom voice');
  }
}