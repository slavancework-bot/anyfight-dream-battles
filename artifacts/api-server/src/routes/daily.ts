import { Router } from "express";
import { getDailyChallenge } from "../services/aiFighterService.js";

const router = Router();

// In-memory votes (resets on server restart — acceptable for V1)
const dailyVotes: Map<string, { fighter1: number; fighter2: number }> = new Map();

router.get("/daily-challenge", async (_req, res) => {
  try {
    const challenge = await getDailyChallenge() as { date: string; votesForFighter1: number; votesForFighter2: number };
    const today = new Date().toISOString().split("T")[0];
    const votes = dailyVotes.get(today) ?? { fighter1: 0, fighter2: 0 };
    challenge.votesForFighter1 = votes.fighter1;
    challenge.votesForFighter2 = votes.fighter2;
    res.json(challenge);
  } catch (err) {
    console.error("getDailyChallenge error:", err);
    res.status(500).json({ error: "Failed to get daily challenge" });
  }
});

router.post("/daily-challenge/vote", async (req, res) => {
  try {
    const { fighter } = req.body as { fighter: 1 | 2 };
    const today = new Date().toISOString().split("T")[0];
    const votes = dailyVotes.get(today) ?? { fighter1: 0, fighter2: 0 };
    if (fighter === 1) votes.fighter1++;
    else if (fighter === 2) votes.fighter2++;
    dailyVotes.set(today, votes);
    res.json({ success: true, votes });
  } catch (err) {
    console.error("vote error:", err);
    res.status(500).json({ error: "Failed to record vote" });
  }
});

export default router;
