import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GeneratedWord {
  word: string;
  definition: string; // Japanese definition
  category: string;
}

export async function generateWordsForCategory(category: string, count: number = 10): Promise<GeneratedWord[]> {
  try {
    const categoryPrompts = {
      "Academic": "学術的で大学レベルの英単語。論文や研究でよく使われる単語。",
      "Business": "ビジネスや仕事で使われる英単語。会議、プレゼン、メールなどで使用される。",
      "Daily Life": "日常生活でよく使われる英単語。家庭、友達、趣味などの場面で使用される。",
      "Technical": "技術的な英単語。IT、工学、科学技術分野で使われる専門用語。"
    };

    const categoryDescription = categoryPrompts[category as keyof typeof categoryPrompts] || "一般的な英単語";

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `あなたは英語学習の専門家です。指定されたカテゴリの英単語を${count}個生成してください。

要件:
1. ${categoryDescription}
2. 各単語の意味は日本語で簡潔に説明
3. 中級〜上級レベルの単語を選択
4. 重複しない単語を選択
5. 一般的で実用的な単語を優先

JSON形式で以下のように回答してください:
{
  "words": [
    {
      "word": "英単語",
      "definition": "日本語での意味・定義",
      "category": "${category}"
    }
  ]
}`
        },
        {
          role: "user",
          content: `${category}カテゴリの英単語を${count}個生成してください。`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"words": []}');
    return result.words || [];

  } catch (error) {
    console.error("Error generating words:", error);
    throw new Error("Failed to generate words with AI");
  }
}

// Get sample words for each category (for preview)
export function getSampleWordsForCategory(category: string): string[] {
  const samples = {
    "Academic": ["hypothesis", "analyze", "synthesize", "methodology", "criterion"],
    "Business": ["negotiate", "stakeholder", "revenue", "strategy", "efficiency"],
    "Daily Life": ["grocery", "laundry", "commute", "neighborhood", "routine"],
    "Technical": ["algorithm", "database", "framework", "debugging", "optimization"]
  };

  return samples[category as keyof typeof samples] || [];
}