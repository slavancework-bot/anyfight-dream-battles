import {
  setAudioModeAsync,
  createAudioPlayer,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

interface SpeakOptions {
  quick?: boolean;
  interrupt?: boolean;
}

const audioCache = new Map<string, string>();

function splitIntoChunks(text: string, quick = false) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const sentences = cleaned.match(/[^.!?]+[.!?]?/g)?.map((line) => line.trim()).filter(Boolean) ?? [cleaned];
  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 180) {
      chunks.push(sentence);
    } else {
      for (let i = 0; i < sentence.length; i += 150) {
        chunks.push(sentence.slice(i, i + 150).trim());
      }
    }
  }
  return quick ? chunks.slice(0, 2).map((chunk) => chunk.slice(0, 170)) : chunks;
}

async function fetchChunk(domain: string, text: string, voice: string) {
  const cacheKey = `${voice}:${text}`;
  const cached = audioCache.get(cacheKey);
  if (cached) return cached;

  const res = await fetch(`https://${domain}/api/tts/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) throw new Error("TTS generation failed");
  const data = await res.json() as { audioData: string; contentType?: string };
  const uri = `data:${data.contentType || "audio/mpeg"};base64,${data.audioData}`;
  audioCache.set(cacheKey, uri);
  return uri;
}

export function useTTS(domain: string) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const generationRef = useRef(0);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: false,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, []);

  const clearPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.remove();
      } catch {}
      playerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    generationRef.current += 1;
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = null;
    clearPlayer();
    setIsLoading(false);
    setIsPlaying(false);
  }, [clearPlayer]);

  const playUri = useCallback((uri: string, generation: number, onDone: () => void) => {
    if (generation !== generationRef.current) return;
    clearPlayer();
    const player = createAudioPlayer({ uri });
    playerRef.current = player;
    player.play();
    setIsPlaying(true);
    const subscription = player.addListener("playbackStatusUpdate", (status: AudioStatus) => {
      if (status.didJustFinish) {
        subscription.remove();
        player.remove();
        if (playerRef.current === player) playerRef.current = null;
        onDone();
      }
    });
  }, [clearPlayer]);

  const speak = useCallback(
    async (text: string, voice: string = "onyx", options: SpeakOptions = {}) => {
      if (!domain || !text.trim()) return;
      const chunks = splitIntoChunks(text, options.quick);
      if (!chunks.length) return;

      if (options.interrupt !== false) stop();
      const generation = generationRef.current;
      loadingTimerRef.current = setTimeout(() => setIsLoading(true), 500);

      try {
        const uris = new Map<number, Promise<string>>();
        const preload = (index: number) => {
          if (index >= chunks.length || uris.has(index)) return;
          uris.set(index, fetchChunk(domain, chunks[index], voice));
        };
        preload(0);
        preload(1);

        const playIndex = async (index: number) => {
          if (generation !== generationRef.current || index >= chunks.length) {
            setIsPlaying(false);
            return;
          }
          preload(index + 1);
          const uri = await uris.get(index)!;
          if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
          setIsLoading(false);
          playUri(uri, generation, () => {
            void playIndex(index + 1);
          });
        };

        await playIndex(0);
      } catch {
        if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
        setIsLoading(false);
        setIsPlaying(false);
      }
    },
    [domain, playUri, stop]
  );

  return { speak, stop, isPlaying, isLoading };
}
