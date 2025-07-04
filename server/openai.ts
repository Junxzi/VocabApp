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
  partsOfSpeech: string[];
  exampleSentences: ExampleSentence[];
}

// Cache to avoid duplicate API calls
const wordDataCache = new Map<string, WordEnrichmentData>();

export async function enrichWordData(word: string): Promise<WordEnrichmentData> {
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
          content: `
You are a linguistic expert. For any given English word, provide:

1. IPA pronunciation for American English, British English, and Australian English (without slashes or brackets)
2. **All applicable parts of speech in Japanese** (名詞, 動詞, 形容詞, 副詞, etc.), not just the most common one
3. Exactly 2 natural, funny, and memorable example sentences that are humorous and entertaining, with their Japanese translations

Make the examples funny, quirky, or amusing—like something that would make people chuckle or smile. Use casual language with humor, wit, or amusing situations that help people remember the word better.

Respond with valid JSON in this exact format:
\`\`\`json
{
  "pronunciations": {
    "us": "ˈbɪtər",
    "uk": "ˈbɪtə",
    "au": "ˈbɪtə"
  },
  "partsOfSpeech": ["形容詞", "副詞"],
  "exampleSentences": [
    {
      "english": "My ex's cooking was so bitter, even the flies wouldn't touch it!",
      "japanese": "元カノの料理は苦すぎて、ハエも近寄らなかった！"
    },
    {
      "english": "I'm still bitter that my cat gets more Instagram likes than me.",
      "japanese": "うちの猫の方がInstagramでいいねもらってるのがまだ悔しい。"
    }
  ]
}
\`\`\`

Be creative, funny, and memorable. Use situations that are relatable but amusing.
`
        },
        {
          role: "user",
          content: `Please provide comprehensive analysis for the word: "${word}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    // Parse the GPT response
    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Normalize and filter partsOfSpeech
    let parts: string[] = [];
    if (result.partsOfSpeech) {
      parts = Array.isArray(result.partsOfSpeech)
        ? result.partsOfSpeech
        : [result.partsOfSpeech];
    }
    parts = parts.filter((s: string) => typeof s === "string" && s.trim().length > 0);

    const enrichmentData: WordEnrichmentData = {
      pronunciations: {
        us: result.pronunciations?.us || "",
        uk: result.pronunciations?.uk || "",
        au: result.pronunciations?.au || ""
      },
      partsOfSpeech: parts,
      exampleSentences: Array.isArray(result.exampleSentences)
        ? result.exampleSentences
        : []
    };

    // Cache and return
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