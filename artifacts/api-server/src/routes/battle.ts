import { Router } from "express";
import type { Fighter } from "../services/aiFighterService.js";
import { generateBattleNarration, generateFightRecap } from "../services/aiFighterService.js";

const router = Router();

router.post("/battle/narration", async (req, res) => {
  try {
    const { fighter1, fighter2 } = req.body as { fighter1: Fighter; fighter2: Fighter };
    if (!fighter1 || !fighter2) {
      res.status(400).json({ error: "fighter1 and fighter2 are required" });
      return;
    }
    const narration = await generateBattleNarration(fighter1, fighter2);
    res.json(narration);
  } catch (err) {
    console.error("generateBattleNarration error:", err);
    res.status(500).json({ error: "Failed to generate battle narration" });
  }
});

router.post("/battle/recap", async (req, res) => {
  try {
    const { winner, loser, fightDurationSeconds, rounds } = req.body as {
      winner: Fighter;
      loser: Fighter;
      fightDurationSeconds: number;
      rounds: number;
    };
    if (!winner || !loser) {
      res.status(400).json({ error: "winner and loser are required" });
      return;
    }
    const recap = await generateFightRecap(winner, loser, fightDurationSeconds ?? 120, rounds ?? 3);
    res.json(recap);
  } catch (err) {
    console.error("generateFightRecap error:", err);
    res.status(500).json({ error: "Failed to generate fight recap" });
  }
});

export default router;
