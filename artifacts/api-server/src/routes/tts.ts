import { Router } from "express";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";

const router = Router();

router.get("/tts/speak", async (req, res) => {
  try {
    const text = req.query.text as string;
    const voice = (req.query.voice as string) || "onyx";

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    const safeVoice = validVoices.includes(voice)
      ? (voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer")
      : "onyx";

    const buffer = await textToSpeech(text.slice(0, 4096), safeVoice, "mp3");

    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "public, max-age=300");
    res.send(buffer);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS generation failed" });
  }
});

export default router;
