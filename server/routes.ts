import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import {
  insertVocabularyWordSchema,
  updateVocabularyWordSchema,
  insertCategorySchema,
  Category
} from '../shared/schema';
import { z } from 'zod';
import { enrichWordData, generatePronunciation } from './openai';
import { calculateNextReview, swipeToQuality, isDueForReview } from './spaced-repetition';
import { syncCategoriesFromNotion, initializeDefaultCategories, syncVocabularyWordsFromNotion } from './setup-categories';
import { generateWordsForCategory, getSampleWordsForCategory } from './word-generator';
import { generateWordGacha, getSampleGachaCategories } from './word-gacha';

// Utility to create tag objects
const makeTagObject = (name: string, color: string | null): { name: string; color: string } => ({
  name,
  color: color ?? '#000000',
});

type CreateCategoryBody = z.infer<typeof insertCategorySchema>;
type GenerateWordsBody = { count?: number };


const getUserId = async (req: Request): Promise<number | null> => {
  return req.user?.id ?? null;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default categories
  try {
    await initializeDefaultCategories();
    console.log('✓ Default categories initialized');
  } catch (error: any) {
    console.warn('⚠ Failed to initialize categories:', error);
  }

  // --- CATEGORY ROUTES ---
  app.get('/api/categories', async (_req, res) => {
    try {
      const cats = await storage.getAllCategories();
      res.json(cats);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch categories', error: String(error) });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const validated = insertCategorySchema.parse(req.body);
      const cat = await storage.createCategory(validated);
      return res.status(201).json(cat);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Invalid category data',
          errors: error.errors,
        });
      }
      return res.status(500).json({
        message: 'Failed to create category',
        error: String(error),
      });
    }
  });

  app.post('/api/categories/sync', async (_req, res) => {
    try {
      await syncCategoriesFromNotion();
      const cats = await storage.getAllCategories();
      res.json({ message: 'Categories synced', categories: cats });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to sync categories from Notion', error: String(error) });
    }
  });

  // --- VOCABULARY SYNC & CRUD ---
  app.post('/api/vocabulary/sync', async (_req, res) => {
    try {
      await syncVocabularyWordsFromNotion();
      const words = await storage.getAllVocabularyWords();
      res.json({ message: 'Vocabulary synced', count: words.length });
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to sync vocabulary from Notion', error: String(error) });
    }
  });

  app.get('/api/vocabulary', async (_req, res) => {
    try {
      const words = await storage.getAllVocabularyWords();
      res.json(words);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch words', error: String(error) });
    }
  });

  app.get('/api/vocabulary/search', async (req, res) => {
    try {
      const q = String(req.query.q || '');
      if (!q.trim()) return res.status(400).json({ message: 'Search query is required' });
      const words = await storage.searchVocabularyWords(q);
      res.json(words);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to search words', error: String(error) });
    }
  });

  app.get('/api/vocabulary/category/:category', async (req, res) => {
    try {
      const words = await storage.getVocabularyWordsByCategory(req.params.category);
      res.json(words);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch by category', error: String(error) });
    }
  });

  app.get('/api/vocabulary/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const w = await storage.getVocabularyWord(id);
      if (!w) return res.status(404).json({ message: 'Word not found' });
      res.json(w);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch word', error: String(error) });
    }
  });

  app.post('/api/vocabulary', async (req, res) => {
    try {
      const data = insertVocabularyWordSchema.parse(req.body);
      let enriched = data;
      try {
        const gpt = await enrichWordData(data.word);
        enriched = {
          ...data,
          pronunciationUs: gpt.pronunciations.us,
          pronunciationUk: gpt.pronunciations.uk,
          pronunciationAu: gpt.pronunciations.au,
          partOfSpeech: Array.isArray(gpt.partsOfSpeech)
            ? gpt.partsOfSpeech
            : [gpt.partsOfSpeech],
          exampleSentences: JSON.stringify(gpt.exampleSentences),
        };
      } catch {
        console.warn('GPT enrichment failed, skipping');
      }
      const created = await storage.createVocabularyWord(enriched);
      res.status(201).json(created);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create word', error: String(error) });
      }
    }
  });

  app.put('/api/vocabulary/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const data = updateVocabularyWordSchema.parse(req.body);
      const updated = await storage.updateVocabularyWord(id, data);
      if (!updated) return res.status(404).json({ message: 'Word not found' });
      res.json(updated);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid input', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to update word', error: String(error) });
      }
    }
  });

  app.delete('/api/vocabulary/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const ok = await storage.deleteVocabularyWord(id);
      if (!ok) return res.status(404).json({ message: 'Word not found' });
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to delete word', error: String(error) });
    }
  });

  // --- CATEGORY WORD GENERATION ---
  app.post<{ categoryName: string }, unknown, GenerateWordsBody>(
    '/api/categories/:categoryName/generate-words',
    async (req, res) => {
      const userId = await getUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { count = 10 } = req.body;
      const catName = req.params.categoryName;
      if (catName === 'TOEFL') {
        return res.status(400).json({ message: 'Not available for TOEFL' });
      }

      const cat = await storage.getCategoryByName(catName);
      if (!cat) return res.status(404).json({ message: 'Category not found' });

      const tagObj = makeTagObject(cat.name, cat.color);

      try {
        const generated = await generateWordsForCategory(catName, count);
        const added = [] as any[];
        for (const w of generated) {
          try {
            const nw = await storage.createVocabularyWord({
              userId,
              word: w.word,
              definition: w.definition,
              tags: [tagObj],
              language: 'en',
            });
            added.push(nw);
          } catch (err: any) {
            console.warn(`Failed to add ${w.word}:`, err);
          }
        }
        res.json({ message: `Generated ${added.length}/${count} words`, words: added });
      } catch (error: any) {
        console.error('Generate category words error:', error);
        res.status(500).json({ message: 'Failed to generate words', error: String(error) });
      }
    }
  );

  // --- WORD GACHA ---
  app.post('/api/word-gacha/generate', async (req, res) => {
    const userId = await getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { tagName, selectedTags = [], count = 30 } = req.body as { tagName: string; selectedTags?: string[]; count?: number };
    if (!tagName || tagName.length > 20) {
      return res.status(400).json({ message: 'Tag name required and ≤20 chars' });
    }

    try {
      let generated = await generateWordGacha(tagName, count);
      if (generated.length < count) {
        const extra = count - generated.length;
        const more = await generateWordGacha(tagName, extra);
        const existing = new Set(generated.map(x => x.word.toLowerCase()));
        generated.push(...more.filter(x => !existing.has(x.word.toLowerCase())));
      }

      // Fetch category colors for tags
      const mainCat = await storage.getCategoryByName(tagName);
      const mainTagObj = makeTagObject(tagName, mainCat?.color ?? null);
      const extraTagObjs = await Promise.all(
        selectedTags.map(async name => {
          const c = await storage.getCategoryByName(name);
          return makeTagObject(name, c?.color ?? null);
        })
      );
      const allTags = [mainTagObj, ...extraTagObjs];

      const added: any[] = [];
      const skipped: string[] = [];
      for (const g of generated) {
        const posArray = Array.isArray(g.partOfSpeech) ? g.partOfSpeech : [g.partOfSpeech];
        try {
          const nw = await storage.createVocabularyWord({
            userId,
            word: g.word,
            definition: g.definition,
            pronunciationUs: g.pronunciationUs,
            pronunciationUk: g.pronunciationUk,
            pronunciationAu: g.pronunciationAu,
            partOfSpeech: posArray,
            exampleSentences: JSON.stringify(g.exampleSentences),
            tags: allTags,
            language: 'en',
            difficulty: 1,
          });
          added.push(nw);
        } catch (err: any) {
          if (err.message.includes('already exists')) skipped.push(g.word);
          else console.warn(`Failed to add ${g.word}:`, err);
        }
      }

      res.json({ message: `Added ${added.length}/${count} words`, words: added, skippedDuplicates: skipped });
    } catch (error: any) {
      console.error('Gacha error:', error);
      res.status(500).json({ message: 'Failed word gacha', error: String(error) });
    }
  });

  // --- AZURE TTS CONFIG ---
  app.get('/api/azure-config', async (_req, res) => {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region) return res.status(404).json({ error: 'Azure not configured' });
    res.json({ speechKey: key, speechRegion: region });
  });

  // --- START SERVER ---
  return createServer(app);
}