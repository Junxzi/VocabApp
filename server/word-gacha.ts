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
    // Split into smaller batches for better performance
    const batchSize = 10;
    const numBatches = Math.ceil(count / batchSize);
    const allWords: GachaGeneratedWord[] = [];

    for (let i = 0; i < numBatches; i++) {
      const currentBatchSize = Math.min(batchSize, count - (i * batchSize));
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `あなたは英語学習の専門家です。指定されたタグ・テーマの英単語を${currentBatchSize}個生成してください。

タグ: "${tagName}"

要件:
1. このタグに最も関連性の高い英単語を選択
2. 各単語の意味は日本語で簡潔に説明
3. 中級〜上級レベルの実用的な単語を優先
4. 重複しない単語を選択
5. IPA発音記号（米/英/豪）を提供
6. 日本語での品詞表記（名詞、動詞、形容詞など）
7. 面白くて記憶に残る例文を英語と日本語で2つずつ

JSON形式で以下のように回答してください:
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
            content: `"${tagName}"タグの英単語を${currentBatchSize}個生成してください。バッチ${i + 1}/${numBatches}。このテーマに最も適した実用的で面白い単語を選んでください。`
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"words": []}');
      allWords.push(...(result.words || []));
    }

    return allWords;

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