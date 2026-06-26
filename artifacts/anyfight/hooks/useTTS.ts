import {
  setAudioModeAsync,
  createAudioPlayer,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

export function useTTS(domain: string) {
  const playerRef = useRef<AudioPlayer | null>(null);
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
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.remove();
      } catch {}
      playerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(
    async (text: string, voice: string = "onyx") => {
      if (!domain || !text.trim()) return;
      stop();

      setIsLoading(true);
      try {
        const encoded = encodeURIComponent(text);
        const uri = `https://${domain}/api/tts/speak?text=${encoded}&voice=${voice}`;
        const player = createAudioPlayer({ uri });
        playerRef.current = player;
        player.play();
        setIsPlaying(true);

        const subscription = player.addListener(
          "playbackStatusUpdate",
          (status: AudioStatus) => {
            if (status.didJustFinish) {
              setIsPlaying(false);
              subscription.remove();
              player.remove();
              if (playerRef.current === player) playerRef.current = null;
            }
          }
        );
      } catch {
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    },
    [domain, stop]
  );

  return { speak, stop, isPlaying, isLoading };
}
