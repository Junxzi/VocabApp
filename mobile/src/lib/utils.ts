// 品詞のキーからローカライズ済み文字列を返すユーティリティ
export function getLocalizedPartOfSpeech(
  pos: string,
  lang: 'en' | 'ja'
): string {
  const map: Record<string, { en: string; ja: string }> = {
    noun:        { en: 'Noun',        ja: '名詞' },
    verb:        { en: 'Verb',        ja: '動詞' },
    adjective:   { en: 'Adjective',   ja: '形容詞' },
    adverb:      { en: 'Adverb',      ja: '副詞' },
    pronoun:     { en: 'Pronoun',     ja: '代名詞' },
    preposition: { en: 'Preposition', ja: '前置詞' },
    conjunction: { en: 'Conjunction', ja: '接続詞' },
    interjection:{ en: 'Interjection',ja: '感嘆詞' },
    // 必要に応じて追加...
  };

  const entry = map[pos.toLowerCase()];
  return entry ? entry[lang] : pos;
}