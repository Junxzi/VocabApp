import OpenAI from "openai";
import { enrichWordData } from "./openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GachaGeneratedWord {
  word: string;
  definition: string; // Japanese definition
  pronunciationUs: string;
  pronunciationUk: string;
  pronunciationAu: string;
  partOfSpeech: string;
  exampleSentences: Array<{
    english: string;
    japanese: string;
  }>;
}

export async function generateWordGacha(tagName: string, count: number = 30): Promise<GachaGeneratedWord[]> {
  try {
    const allWords: GachaGeneratedWord[] = [];
    let remainingCount = count;
    let attempts = 0;
    const maxAttempts = 5;

    while (allWords.length < count && attempts < maxAttempts) {
      attempts++;
      const currentBatchSize = Math.min(15, remainingCount); // Larger batch size for better efficiency
      
      console.log(`Word generation attempt ${attempts}: requesting ${currentBatchSize} words, current total: ${allWords.length}`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `あなたは英語学習の専門家です。指定されたタグ・テーマの英単語を正確に${currentBatchSize}個生成してください。

重要: 必ず${currentBatchSize}個の単語を生成し、レスポンスのwords配列に含めてください。

タグ: "${tagName}"

要件:
1. このタグに最も関連性の高い英単語を選択
2. 各単語の意味は日本語で簡潔に説明
3. 中級〜上級レベルの実用的な単語を優先
4. 重複しない単語を選択
5. IPA発音記号（米/英/豪）を提供
6. 日本語での品詞表記（名詞、動詞、形容詞など）
7. 面白くて記憶に残る例文を英語と日本語で2つずつ

JSON形式で以下のように回答してください。必ずwords配列に${currentBatchSize}個の要素を含めてください:
{
  "words": [
    {
      "word": "英単語",
      "definition": "日本語での意味・定義",
      "pronunciationUs": "ˈɛɡzæmpəl",
      "pronunciationUk": "ɪɡˈzɑːmpəl", 
      "pronunciationAu": "ɪɡˈzæmpəl",
      "partOfSpeech": "名詞",
      "exampleSentences": [
        {
          "english": "Funny example sentence in English.",
          "japanese": "面白い日本語の例文。"
        },
        {
          "english": "Another memorable example.",
          "japanese": "もう一つの印象的な例文。"
        }
      ]
    }
  ]
}`
          },
          {
            role: "user",
            content: `"${tagName}"タグの英単語を正確に${currentBatchSize}個生成してください。現在${allWords.length}個の単語を取得済みです。重複を避けて、このテーマに最も適した実用的で面白い単語を選んでください。`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8, // Add some creativity while maintaining consistency
      });

      let result;
      try {
        result = JSON.parse(response.choices[0].message.content || '{"words": []}');
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Raw response:", response.choices[0].message.content);
        continue; // Skip this batch and try again
      }

      const batchWords = result.words || [];
      console.log(`Received ${batchWords.length} words in batch ${attempts}`);

      // Validate each word has required fields
      const validWords = batchWords.filter((word: any) => 
        word.word && 
        word.definition && 
        word.pronunciationUs && 
        word.pronunciationUk && 
        word.pronunciationAu && 
        word.partOfSpeech && 
        word.exampleSentences && 
        Array.isArray(word.exampleSentences) && 
        word.exampleSentences.length >= 2
      );

      console.log(`${validWords.length} valid words after validation`);

      // Remove duplicates from current batch
      const existingWords = new Set(allWords.map(w => w.word.toLowerCase()));
      const newWords = validWords.filter((word: any) => 
        !existingWords.has(word.word.toLowerCase())
      );

      console.log(`${newWords.length} new words after duplicate removal`);

      allWords.push(...newWords);
      remainingCount = count - allWords.length;

      // If we got fewer words than expected, continue to next attempt
      if (newWords.length < currentBatchSize && remainingCount > 0) {
        console.log(`Got ${newWords.length} words, expected ${currentBatchSize}. Continuing...`);
        continue;
      }

      // If we have enough words, break
      if (allWords.length >= count) {
        break;
      }
    }

    console.log(`Word generation completed: ${allWords.length}/${count} words generated`);

    // If we still don't have enough words, log a warning but return what we have
    if (allWords.length < count) {
      console.warn(`Warning: Only generated ${allWords.length} words out of requested ${count}`);
    }

    return allWords.slice(0, count); // Ensure we don't return more than requested

  } catch (error) {
    console.error("Error generating word gacha:", error);
    throw new Error("Failed to generate word gacha with AI");
  }
}

// Get sample categories for inspiration
export function getSampleGachaCategories(): string[] {
  return [
    "料理・グルメ",
    "スポーツ・フィットネス", 
    "音楽・楽器",
    "映画・エンターテイメント",
    "旅行・観光",
    "ファッション・美容",
    "自然・環境",
    "科学・テクノロジー",
    "アート・デザイン",
    "健康・医療",
    "動物・ペット",
    "趣味・レジャー",
    "心理学・感情",
    "建築・インテリア",
    "ビジネス・起業"
  ];
}