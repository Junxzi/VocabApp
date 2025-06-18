import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PronunciationData {
  us: string;
  uk: string;
  au: string;
}

export interface ExampleSentence {
  english: string;
  japanese: string;
}

export interface WordEnrichmentData {
  pronunciations: PronunciationData;
  primaryPartOfSpeech: string;
  exampleSentences: ExampleSentence[];
}

// Cache to avoid duplicate API calls
const wordDataCache = new Map<string, WordEnrichmentData>();

export async function enrichWordData(word: string): Promise<WordEnrichmentData> {
  // Check cache first
  const cacheKey = word.toLowerCase();
  if (wordDataCache.has(cacheKey)) {
    return wordDataCache.get(cacheKey)!;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a linguistic expert. For any given English word, provide:

1. IPA pronunciation for American English, British English, and Australian English (without slashes or brackets)
2. The most common part of speech in Japanese (名詞, 動詞, 形容詞, 副詞, etc.)
3. Exactly 2 natural, conversational example sentences that native speakers would use in everyday casual situations, with their Japanese translations

For casual/informal words, use very casual, friendly language that friends would use. For formal words, use more polite but still natural language. Match the formality level of the word itself.

Respond with valid JSON in this exact format:
{
  "pronunciations": {
    "us": "ˈbɪtər",
    "uk": "ˈbɪtə", 
    "au": "ˈbɪtə"
  },
  "primaryPartOfSpeech": "形容詞",
  "exampleSentences": [
    {
      "english": "Ugh, this coffee tastes super bitter!",
      "japanese": "うわ、このコーヒーめっちゃ苦い！"
    },
    {
      "english": "I'm still kinda bitter about what she said.",
      "japanese": "彼女が言ったこと、まだちょっと根に持ってる。"
    }
  ]
}

Use contractions, slang, and casual expressions when appropriate. Make it sound like real people talking to friends.`
        },
        {
          role: "user",
          content: `Please provide comprehensive analysis for the word: "${word}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    const enrichmentData: WordEnrichmentData = {
      pronunciations: {
        us: result.pronunciations?.us || "",
        uk: result.pronunciations?.uk || "",
        au: result.pronunciations?.au || ""
      },
      primaryPartOfSpeech: result.primaryPartOfSpeech || "",
      exampleSentences: Array.isArray(result.exampleSentences) ? result.exampleSentences : []
    };

    // Cache the result
    wordDataCache.set(cacheKey, enrichmentData);
    
    return enrichmentData;
  } catch (error) {
    console.error("Error enriching word data:", error);
    throw new Error("Failed to enrich word data");
  }
}

export async function generatePronunciation(word: string): Promise<string> {
  try {
    const data = await enrichWordData(word);
    return data.pronunciations.us; // Return US pronunciation by default
  } catch (error) {
    console.error("Error generating pronunciation:", error);
    return "";
  }
}