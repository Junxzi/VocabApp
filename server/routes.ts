import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVocabularyWordSchema, updateVocabularyWordSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all vocabulary words
  app.get("/api/vocabulary", async (req, res) => {
    try {
      const words = await storage.getAllVocabularyWords();
      res.json(words);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary words" });
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
  app.post("/api/vocabulary", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
