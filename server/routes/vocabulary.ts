import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertVocabularyWordSchema, updateVocabularyWordSchema } from "../../shared/schema";
import { enrichWordData } from "../openai";

const router = Router();

// Get all vocabulary words
router.get("/", async (req, res) => {
  try {
    const words = await storage.getVocabularyWords();
    res.json(words);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch vocabulary words" });
  }
});

// Get single vocabulary word by ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid word ID" });
    }

    // Set cache headers for better performance
    res.set('Cache-Control', 'private, max-age=300'); // 5 minutes

    const word = await storage.getVocabularyWord(id);
    if (!word) {
      return res.status(404).json({ message: "Vocabulary word not found" });
    }
    res.json(word);
  } catch (error) {
    console.error('Error fetching vocabulary word:', error);
    res.status(500).json({ message: "Failed to fetch vocabulary word" });
  }
});

// Create vocabulary word
router.post("/", async (req, res) => {
  try {
    const validatedData = insertVocabularyWordSchema.parse(req.body);
    const word = await storage.createVocabularyWord(validatedData);
    res.status(201).json(word);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid input data", errors: error.errors });
    } else {
      res.status(500).json({ message: "Failed to create vocabulary word" });
    }
  }
});

// Update vocabulary word
router.put("/:id", async (req, res) => {
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

// Delete vocabulary word
router.delete("/:id", async (req, res) => {
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

// Get random words for study
router.get("/study/:limit", async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const words = await storage.getRandomWordsForStudy(limit);
    res.json(words);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch words for study" });
  }
});

// Get words for spaced repetition review
router.get("/review/:limit", async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 10;
    const words = await storage.getWordsForReview(limit);
    res.json(words);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch review words" });
  }
});

// Update word study stats
router.put("/:id/study", async (req, res) => {
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

// Update word with spaced repetition algorithm
router.put("/:id/spaced-repetition", async (req, res) => {
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

// Enrich word with GPT-4o data
router.post("/:id/enrich", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const word = await storage.getVocabularyWord(id);

    if (!word) {
      return res.status(404).json({ message: "Vocabulary word not found" });
    }

    const enrichmentData = await enrichWordData(word.word);

    const updatedWord = await storage.updateVocabularyWord(id, {
      pronunciationUs: enrichmentData.pronunciations.us,
      pronunciationUk: enrichmentData.pronunciations.uk,
      pronunciationAu: enrichmentData.pronunciations.au,
      partOfSpeech: enrichmentData.primaryPartOfSpeech,
      exampleSentences: JSON.stringify(enrichmentData.exampleSentences)
    });

    res.json(updatedWord);
  } catch (error) {
    res.status(500).json({ message: "Failed to enrich word data" });
  }
});

export { router as vocabularyRouter };