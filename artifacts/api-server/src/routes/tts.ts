import { Router } from "express";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";

const router = Router();

const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

function safeVoiceFor(voice: unknown) {
  return validVoices.includes(String(voice))
    ? (voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer")
    : "onyx";
}

router.post("/tts/speak", async (req, res) => {
  try {
    const text = req.body?.text as string;
    const voice = req.body?.voice || "onyx";

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const buffer = await textToSpeech(text.slice(0, 1200), safeVoiceFor(voice), "mp3");

    res.set("Cache-Control", "public, max-age=300");
    res.json({
      contentType: "audio/mpeg",
      audioData: buffer.toString("base64"),
    });
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS generation failed" });
  }
});

router.get("/tts/speak", async (req, res) => {
  try {
    const text = req.query.text as string;
    const voice = (req.query.voice as string) || "onyx";

    if (!text || text.trim().length === 0) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const buffer = await textToSpeech(text.slice(0, 1200), safeVoiceFor(voice), "mp3");

    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "public, max-age=300");
    res.send(buffer);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "TTS generation failed" });
  }
});

export default router;
