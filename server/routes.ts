import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVocabularyWordSchema, updateVocabularyWordSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { enrichWordData, generatePronunciation } from "./openai";
import { calculateNextReview, swipeToQuality, isDueForReview } from "./spaced-repetition";
import { syncCategoriesFromNotion, initializeDefaultCategories, syncVocabularyWordsFromNotion } from "./setup-categories";
import { generateWordsForCategory, getSampleWordsForCategory } from "./word-generator";
import { generateWordGacha, getSampleGachaCategories } from "./word-gacha";
import { requireAuth, optionalAuth, type AuthenticatedRequest } from "./auth-middleware";
import passport from "passport";

export async function registerRoutes(app: Express): Promise<Server> {
  // Google OAuth routes
  app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      // Successful authentication, redirect to app
      res.redirect("/");
    }
  );

  app.get("/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.redirect("/");
    });
  });

  // User authentication status endpoint
  app.get("/api/auth/user", optionalAuth, (req: AuthenticatedRequest, res) => {
    if (req.userId) {
      res.json({
        authenticated: true,
        userId: req.userId,
        userName: req.userName,
        user: req.user
      });
    } else {
      res.json({ authenticated: false });
    }
  });
  // Initialize categories on startup
  try {
    await initializeDefaultCategories();
    console.log("✓ Default categories initialized");
  } catch (error) {
    console.warn("⚠ Failed to initialize categories:", error);
  }

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.post("/api/categories/sync", async (req, res) => {
    try {
      await syncCategoriesFromNotion();
      const categories = await storage.getAllCategories();
      res.json({ message: "Categories synced from Notion", categories });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync categories from Notion" });
    }
  });

  app.post("/api/vocabulary/sync", async (req, res) => {
    try {
      await syncVocabularyWordsFromNotion();
      const words = await storage.getVocabularyWords();
      res.json({ message: "Vocabulary words synced from Notion", count: words.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to sync vocabulary from Notion" });
    }
  });

  // Get all vocabulary words for authenticated user
  app.get("/api/vocabulary", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const words = await storage.getVocabularyWordsByUser(req.userId!);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary words" });
    }
  });

  // Get single vocabulary word by ID
  app.get("/api/vocabulary/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const word = await storage.getVocabularyWord(id);
      if (!word) {
        return res.status(404).json({ message: "Vocabulary word not found" });
      }
      res.json(word);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary word" });
    }
  });

  // Search vocabulary words
  app.get("/api/vocabulary/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const words = await storage.searchVocabularyWords(query);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to search vocabulary words" });
    }
  });

  // Get vocabulary words by category
  app.get("/api/vocabulary/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const words = await storage.getVocabularyWordsByCategory(category);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary words by category" });
    }
  });

  // Get random words for study
  app.get("/api/vocabulary/study/:limit", async (req, res) => {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const words = await storage.getRandomWordsForStudy(limit);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch words for study" });
    }
  });

  // Get random words for study (specific endpoint for swipe study)
  app.get("/api/vocabulary/random/:limit", async (req, res) => {
    try {
      const limit = parseInt(req.params.limit) || 30;
      const words = await storage.getRandomWordsForStudy(limit);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch random words for study" });
    }
  });

  // Get words for spaced repetition review
  app.get("/api/vocabulary/review/:limit", async (req, res) => {
    try {
      const limit = parseInt(req.params.limit) || 10;
      const words = await storage.getWordsForReview(limit);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review words" });
    }
  });

  // Get daily challenge words
  app.get("/api/vocabulary/daily-challenge", async (req, res) => {
    try {
      const words = await storage.getDailyChallengeWords();
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily challenge words" });
    }
  });

  // Check if daily challenge is completed
  app.get("/api/vocabulary/daily-challenge/status", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const status = await storage.getDailyChallengeStatus(req.userId!);
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to check daily challenge status" });
    }
  });

  // Complete daily challenge
  app.post("/api/vocabulary/daily-challenge/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { stats } = req.body;
      await storage.completeDailyChallenge(req.userId!, stats);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete daily challenge" });
    }
  });

  // Update word with spaced repetition algorithm
  app.put("/api/vocabulary/:id/spaced-repetition", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { known } = req.body;
      if (typeof known !== 'boolean') {
        return res.status(400).json({ message: "Known must be a boolean value" });
      }
      const word = await storage.updateWordSpacedRepetition(id, known);
      if (!word) {
        return res.status(404).json({ message: "Vocabulary word not found" });
      }
      res.json(word);
    } catch (error) {
      res.status(500).json({ message: "Failed to update spaced repetition data" });
    }
  });

  // Create vocabulary word
  app.post("/api/vocabulary", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertVocabularyWordSchema.parse(req.body);

      // Automatically enrich new words with GPT-4o data and TTS audio
      let enrichedData = validatedData;
      if (validatedData.word) {
        try {
          const [gptEnrichment, ttsAudio] = await Promise.all([
            enrichWordData(validatedData.word),
            import('./tts').then(tts => tts.generateAllAccentsTTS(validatedData.word))
          ]);
          
          enrichedData = {
            ...validatedData,
            pronunciationUs: gptEnrichment.pronunciations.us,
            pronunciationUk: gptEnrichment.pronunciations.uk,
            pronunciationAu: gptEnrichment.pronunciations.au,
            audioDataUs: ttsAudio.audioDataUs,
            audioDataUk: ttsAudio.audioDataUk,
            audioDataAu: ttsAudio.audioDataAu,
            partOfSpeech: gptEnrichment.primaryPartOfSpeech,
            exampleSentences: JSON.stringify(gptEnrichment.exampleSentences)
          };
        } catch (enrichError) {
          console.warn("Failed to enrich word, proceeding without enrichment:", enrichError);
        }
      }

      const word = await storage.createVocabularyWord({ ...enrichedData, userId: req.userId! });
      res.status(201).json(word);
    } catch (error) {
      console.error("Error creating vocabulary word:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create vocabulary word" });
      }
    }
  });

  // Update vocabulary word
  app.put("/api/vocabulary/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateVocabularyWordSchema.parse(req.body);
      const word = await storage.updateVocabularyWord(id, validatedData);
      if (!word) {
        return res.status(404).json({ message: "Vocabulary word not found" });
      }
      res.json(word);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update vocabulary word" });
      }
    }
  });

  // Update word study stats
  app.put("/api/vocabulary/:id/study", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { difficulty } = req.body;
      if (typeof difficulty !== 'number' || difficulty < 1 || difficulty > 3) {
        return res.status(400).json({ message: "Difficulty must be a number between 1 and 3" });
      }
      const word = await storage.updateWordStudyStats(id, difficulty);
      if (!word) {
        return res.status(404).json({ message: "Vocabulary word not found" });
      }
      res.json(word);
    } catch (error) {
      res.status(500).json({ message: "Failed to update word study stats" });
    }
  });

  // Delete vocabulary word
  app.delete("/api/vocabulary/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVocabularyWord(id);
      if (!success) {
        return res.status(404).json({ message: "Vocabulary word not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vocabulary word" });
    }
  });

  // Enrich word with GPT-4o data (pronunciation + examples + comprehensive parts of speech)
  app.post("/api/vocabulary/:id/enrich", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const word = await storage.getVocabularyWord(id);

      if (!word) {
        return res.status(404).json({ message: "Vocabulary word not found" });
      }

      // Get enriched data from GPT-4o
      const enrichmentData = await enrichWordData(word.word);

      // Update the word with enriched data
      const updatedWord = await storage.updateVocabularyWord(id, {
        pronunciationUs: enrichmentData.pronunciations.us,
        pronunciationUk: enrichmentData.pronunciations.uk,
        pronunciationAu: enrichmentData.pronunciations.au,
        partOfSpeech: enrichmentData.primaryPartOfSpeech,
        exampleSentences: JSON.stringify(enrichmentData.exampleSentences)
      });

      res.json({
        ...updatedWord,
        enrichmentDetails: {
          primaryPartOfSpeech: enrichmentData.primaryPartOfSpeech,
          exampleSentences: enrichmentData.exampleSentences
        }
      });
    } catch (error) {
      console.error("Error enriching word:", error);
      res.status(500).json({ message: "Failed to enrich word data" });
    }
  });

  // Generate words for category
  app.post("/api/categories/:categoryName/generate-words", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const categoryName = req.params.categoryName;
      const { count = 10 } = req.body;

      // Don't allow TOEFL category
      if (categoryName === "TOEFL") {
        return res.status(400).json({ message: "Word generation not available for TOEFL category" });
      }

      // Validate category exists
      const category = await storage.getCategoryByName(categoryName);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Generate words using GPT
      const generatedWords = await generateWordsForCategory(categoryName, count);

      // Add generated words to database
      const addedWords = [];
      for (const wordData of generatedWords) {
        try {
          const newWord = await storage.createVocabularyWord({
            word: wordData.word,
            definition: wordData.definition,
            tags: [wordData.category],
            language: "en",
            userId: req.userId!
          });
          addedWords.push(newWord);
        } catch (error) {
          console.warn(`Failed to add word: ${wordData.word}`, error);
        }
      }

      res.json({
        message: `Successfully generated ${addedWords.length} words for ${categoryName}`,
        words: addedWords,
        totalGenerated: generatedWords.length,
        totalAdded: addedWords.length
      });
    } catch (error) {
      console.error("Error generating words:", error);
      res.status(500).json({ message: "Failed to generate words" });
    }
  });

  // Get sample words for category (preview)
  app.get("/api/categories/:categoryName/sample-words", async (req, res) => {
    try {
      const categoryName = req.params.categoryName;

      if (categoryName === "TOEFL") {
        return res.status(400).json({ message: "Word generation not available for TOEFL category" });
      }

      const sampleWords = getSampleWordsForCategory(categoryName);
      res.json({ sampleWords });
    } catch (error) {
      res.status(500).json({ message: "Failed to get sample words" });
    }
  });

  // Word Gacha - Generate custom tag words
  app.post("/api/word-gacha/generate", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { tagName, selectedTags = [], count = 30 } = req.body;

      if (!tagName) {
        return res.status(400).json({ message: "Tag name is required" });
      }

      // Validate tag name length (max 20 characters)
      if (tagName.length > 20) {
        return res.status(400).json({ message: "Tag name must be 20 characters or less" });
      }

      console.log(`Generating ${count} words for tag: ${tagName}, with additional tags: ${selectedTags.join(", ")}`);

      // Generate words using GPT with full enrichment
      const generatedWords = await generateWordGacha(tagName, count);

      // Add generated words to database with multiple tags
      const addedWords = [];
      const skippedWords = [];
      const allTags = [tagName, ...selectedTags];

      for (const wordData of generatedWords) {
        try {
          const newWord = await storage.createVocabularyWord({
            ...wordData,
            definition: wordData.definition,
            pronunciationUs: wordData.pronunciationUs,
            pronunciationUk: wordData.pronunciationUk,
            pronunciationAu: wordData.pronunciationAu,
            partOfSpeech: wordData.partOfSpeech,
            exampleSentences: JSON.stringify(wordData.exampleSentences),
            tags: allTags, // Multiple tags using new tags column
            language: "en",
            userId: req.userId!
          });
          addedWords.push(newWord);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("already exists")) {
            skippedWords.push(wordData.word);
            console.warn(`Skipped duplicate word: ${wordData.word}`);
          } else {
            console.warn(`Failed to add word: ${wordData.word}`, error);
          }
        }
      }

      res.json({
        message: `Successfully generated ${addedWords.length} words for "${tagName}" tag`,
        words: addedWords,
        totalGenerated: generatedWords.length,
        totalAdded: addedWords.length,
        skippedDuplicates: skippedWords.length,
        duplicateWords: skippedWords,
        tagName,
        selectedTags: allTags
      });
    } catch (error) {
      console.error("Error generating word gacha:", error);
      res.status(500).json({ message: "Failed to generate word gacha" });
    }
  });

  // TTS generation endpoint
  app.post("/api/tts/generate", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { text, accent } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required' });
      }

      if (!accent || !['us', 'uk', 'au'].includes(accent)) {
        return res.status(400).json({ error: 'Valid accent (us, uk, au) is required' });
      }

      const { generateTTS } = await import('./tts');
      const audioBuffer = await generateTTS(text, accent);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      });

      res.send(audioBuffer);
    } catch (error) {
      console.error('TTS generation error:', error);
      res.status(500).json({ error: 'Failed to generate TTS audio' });
    }
  });

  // Get sample gacha categories for inspiration
  app.get("/api/word-gacha/sample-categories", async (req, res) => {
    try {
      const sampleCategories = getSampleGachaCategories();
      res.json({ sampleCategories });
    } catch (error) {
      res.status(500).json({ message: "Failed to get sample categories" });
    }
  });

  // Get random vocabulary for study (SuperMemo-style spaced repetition)
  app.get("/api/vocabulary/random/:count", async (req, res) => {
    try {
      const count = parseInt(req.params.count) || 30;
      const words = await storage.getRandomWordsForStudy(count);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch random vocabulary" });
    }
  });

  // Get vocabulary by specific tag for study
  app.get("/api/vocabulary/tag/:tagName", async (req, res) => {
    try {
      const tagName = req.params.tagName;
      const words = await storage.getVocabularyWordsByTag(tagName);
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary by tag" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}