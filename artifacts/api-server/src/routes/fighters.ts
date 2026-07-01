import { Router } from "express";
import {
  generateFighterProfile,
  generateRandomFighter,
} from "../services/aiFighterService.js";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";

const router = Router();

const imageCache = new Map<string, string>();

router.post("/fighters/generate", async (req, res) => {
  try {
    const { name, outfitChoice } = req.body as { name: string; outfitChoice: "plain" | "signature" | "wrestling" };
    if (!name || !outfitChoice) {
      res.status(400).json({ error: "name and outfitChoice are required" });
      return;
    }
    const fighter = await generateFighterProfile(name, outfitChoice);
    res.json(fighter);
  } catch (err) {
    console.error("generateFighter error:", err);
    res.status(500).json({ error: "Failed to generate fighter" });
  }
});

router.post("/fighters/random", async (_req, res) => {
  try {
    const fighter = await generateRandomFighter();
    res.json(fighter);
  } catch (err) {
    console.error("generateRandomFighter error:", err);
    res.status(500).json({ error: "Failed to generate random fighter" });
  }
});

router.post("/fighters/image", async (req, res) => {
  try {
    const { imagePrompt } = req.body as { imagePrompt: string };
    if (!imagePrompt) {
      res.status(400).json({ error: "imagePrompt is required" });
      return;
    }

    const cached = imageCache.get(imagePrompt);
    if (cached) {
      res.json({ imageData: cached });
      return;
    }

    const buffer = await generateImageBuffer(imagePrompt, "512x512");
    const base64 = buffer.toString("base64");
    imageCache.set(imagePrompt, base64);
    res.json({ imageData: base64 });
  } catch (err) {
    console.error("generateFighterImage error:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

export default router;
