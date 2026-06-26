import { Router } from "express";
import type { Fighter } from "../services/aiFighterService.js";
import { generateMatchupAnalysis } from "../services/aiFighterService.js";

const router = Router();

router.post("/matchup/generate", async (req, res) => {
  try {
    const { fighter1, fighter2 } = req.body as { fighter1: Fighter; fighter2: Fighter };
    if (!fighter1 || !fighter2) {
      res.status(400).json({ error: "fighter1 and fighter2 are required" });
      return;
    }
    const analysis = await generateMatchupAnalysis(fighter1, fighter2);
    res.json(analysis);
  } catch (err) {
    console.error("generateMatchup error:", err);
    res.status(500).json({ error: "Failed to generate matchup analysis" });
  }
});

export default router;
