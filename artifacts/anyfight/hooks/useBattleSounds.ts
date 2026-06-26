import { Platform } from "react-native";

type SoundType = "light" | "heavy" | "special" | "ultimate" | "ko" | "roundStart" | "block";

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== "web") return null;
  try {
    const ctx = (window as any).__battleAudioCtx;
    if (ctx && ctx.state !== "closed") return ctx;
    const newCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    (window as any).__battleAudioCtx = newCtx;
    return newCtx;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  gainPeak: number,
  duration: number,
  freqEnd?: number,
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  }
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.01);
}

function playNoise(ctx: AudioContext, gainPeak: number, duration: number, cutoffFreq: number) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoffFreq;
  const gainNode = ctx.createGain();
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  gainNode.gain.setValueAtTime(gainPeak, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.start(ctx.currentTime);
  source.stop(ctx.currentTime + duration + 0.01);
}

function synthesize(type: SoundType) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().then(() => synthesize(type));
    return;
  }

  switch (type) {
    case "light":
      playNoise(ctx, 0.25, 0.08, 2200);
      playTone(ctx, "square", 320, 0.15, 0.07);
      break;
    case "heavy":
      playNoise(ctx, 0.45, 0.15, 800);
      playTone(ctx, "sawtooth", 180, 0.3, 0.14, 60);
      break;
    case "special":
      playNoise(ctx, 0.35, 0.12, 3500);
      playTone(ctx, "square", 520, 0.2, 0.12, 200);
      playTone(ctx, "sine", 880, 0.15, 0.18, 440);
      break;
    case "ultimate":
      playNoise(ctx, 0.6, 0.25, 600);
      playTone(ctx, "sawtooth", 120, 0.5, 0.22, 40);
      playTone(ctx, "sine", 1200, 0.25, 0.3, 300);
      break;
    case "block":
      playTone(ctx, "triangle", 440, 0.2, 0.12, 380);
      playNoise(ctx, 0.1, 0.06, 1500);
      break;
    case "ko":
      playTone(ctx, "sawtooth", 220, 0.5, 0.6, 40);
      playNoise(ctx, 0.4, 0.4, 400);
      playTone(ctx, "sine", 880, 0.3, 0.8, 110);
      break;
    case "roundStart":
      playTone(ctx, "sine", 660, 0.3, 0.15);
      setTimeout(() => playTone(ctx!, "sine", 880, 0.4, 0.25), 160);
      break;
  }
}

export function useBattleSounds() {
  const play = (type: SoundType) => {
    try {
      synthesize(type);
    } catch {
    }
  };
  return { play };
}
