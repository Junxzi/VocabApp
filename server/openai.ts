import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PronunciationData {
  us: string;
  uk: string;
  au: string;
}

export interface PartOfSpeechEntry {
  type: string;
  definition: string;
  examples: string[];
}

export interface WordEnrichmentData {
  pronunciations: PronunciationData;
  partsOfSpeech: PartOfSpeechEntry[];
  primaryPartOfSpeech: string;
  combinedDefinition: string;
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
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a comprehensive linguistic expert. For any given English word, analyze ALL its possible parts of speech and provide:

1. IPA pronunciation for American English, British English, and Australian English (without slashes or brackets)
2. ALL parts of speech the word can function as (noun, verb, adjective, adverb, etc.)
3. For EACH part of speech: a clear definition and 2 example sentences
4. A combined comprehensive definition that covers all uses
5. The most common/primary part of speech

Respond with valid JSON in this exact format:
{
  "pronunciations": {
    "us": "raɪt",
    "uk": "raɪt", 
    "au": "raɪt"
  },
  "partsOfSpeech": [
    {
      "type": "verb",
      "definition": "to mark letters or words on a surface with a pen or similar tool",
      "examples": [
        "She likes to write in her diary every evening.",
        "Please write your name at the top of the page."
      ]
    },
    {
      "type": "noun",
      "definition": "the activity or skill of writing",
      "examples": [
        "His write was barely legible.",
        "The write on the wall was fading."
      ]
    }
  ],
  "primaryPartOfSpeech": "verb",
  "combinedDefinition": "To mark letters or words on a surface; can also refer to the act or result of writing",
  "exampleSentences": [
    "I will write a letter to my friend tomorrow.",
    "The write quality of this pen is excellent."
  ]
}

Include ALL possible parts of speech for the word, with accurate definitions and examples. Only include the IPA symbols without any slashes, brackets, or other punctuation.`
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
      partsOfSpeech: Array.isArray(result.partsOfSpeech) ? result.partsOfSpeech : [],
      primaryPartOfSpeech: result.primaryPartOfSpeech || "",
      combinedDefinition: result.combinedDefinition || "",
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