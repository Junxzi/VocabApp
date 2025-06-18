import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PronunciationData {
  us: string;
  uk: string;
  au: string;
}

export interface WordEnrichmentData {
  pronunciations: PronunciationData;
  partOfSpeech: string;
  exampleSentences: string[];
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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a linguistic expert. For any given English word, provide:
1. IPA pronunciation for American English, British English, and Australian English
2. Part of speech (noun, verb, adjective, etc.)
3. Exactly 2 practical example sentences that demonstrate different uses of the word

Respond with valid JSON in this exact format:
{
  "pronunciations": {
    "us": "IPA_pronunciation_here",
    "uk": "IPA_pronunciation_here", 
    "au": "IPA_pronunciation_here"
  },
  "partOfSpeech": "noun",
  "exampleSentences": [
    "Example sentence 1 here.",
    "Example sentence 2 here."
  ]
}

Only include the JSON response, no additional text.`
        },
        {
          role: "user",
          content: `Please provide pronunciation and example sentences for the word: "${word}"`
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
      partOfSpeech: result.partOfSpeech || "",
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