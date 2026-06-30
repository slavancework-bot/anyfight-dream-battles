import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { Platform } from "react-native";

type SoundType = "light" | "heavy" | "special" | "ultimate" | "ko" | "roundStart" | "block" | "crowd" | "bell" | "camera" | "announcer";

const nativePlayers = new Set<AudioPlayer>();

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

function playTone(ctx: AudioContext, type: OscillatorType, freq: number, gainPeak: number, duration: number, freqEnd?: number) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
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
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
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

function synthesizeWeb(type: SoundType) {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === "suspended") {
    ctx.resume().then(() => synthesizeWeb(type));
    return true;
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
    case "bell":
      playTone(ctx, "sine", 660, 0.3, 0.15);
      setTimeout(() => playTone(ctx, "sine", 880, 0.4, 0.25), 160);
      break;
    case "camera":
      playNoise(ctx, 0.18, 0.04, 5000);
      playTone(ctx, "square", 1200, 0.08, 0.04);
      break;
    case "announcer":
      playTone(ctx, "sawtooth", 260, 0.18, 0.12, 520);
      setTimeout(() => playTone(ctx, "square", 640, 0.16, 0.14, 320), 90);
      break;
    case "crowd":
      playNoise(ctx, 0.16, 0.55, 950);
      break;
  }
  return true;
}

function base64FromBytes(bytes: number[]) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    output += chars[(triple >> 18) & 63] + chars[(triple >> 12) & 63] + (i + 1 < bytes.length ? chars[(triple >> 6) & 63] : "=") + (i + 2 < bytes.length ? chars[triple & 63] : "=");
  }
  return output;
}

function wavUri(freqs: number[], duration = 0.18, volume = 0.22) {
  const sampleRate = 8000;
  const samples = Math.floor(sampleRate * duration);
  const dataSize = samples * 2;
  const bytes: number[] = [];
  const writeString = (value: string) => value.split("").forEach((char) => bytes.push(char.charCodeAt(0)));
  const write32 = (value: number) => bytes.push(value & 255, (value >> 8) & 255, (value >> 16) & 255, (value >> 24) & 255);
  const write16 = (value: number) => bytes.push(value & 255, (value >> 8) & 255);

  writeString("RIFF");
  write32(36 + dataSize);
  writeString("WAVEfmt ");
  write32(16);
  write16(1);
  write16(1);
  write32(sampleRate);
  write32(sampleRate * 2);
  write16(2);
  write16(16);
  writeString("data");
  write32(dataSize);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - i / samples);
    const sample = freqs.reduce((sum, freq) => sum + Math.sin(2 * Math.PI * freq * t), 0) / freqs.length;
    const pcm = Math.max(-1, Math.min(1, sample * volume * envelope));
    write16(pcm < 0 ? 0x10000 + Math.floor(pcm * 32768) : Math.floor(pcm * 32767));
  }

  return `data:audio/wav;base64,${base64FromBytes(bytes)}`;
}

function synthesizeNative(type: SoundType) {
  const map: Record<SoundType, string> = {
    light: wavUri([420], 0.08, 0.18),
    heavy: wavUri([130, 90], 0.16, 0.28),
    special: wavUri([520, 880], 0.22, 0.22),
    ultimate: wavUri([120, 260, 740], 0.42, 0.3),
    ko: wavUri([90, 160, 440], 0.7, 0.32),
    roundStart: wavUri([660, 880], 0.32, 0.26),
    block: wavUri([380, 440], 0.12, 0.16),
    crowd: wavUri([180, 210, 260, 310], 0.55, 0.12),
    bell: wavUri([660, 990], 0.28, 0.28),
    camera: wavUri([1400], 0.05, 0.2),
    announcer: wavUri([260, 520, 640], 0.28, 0.2),
  };
  const player = createAudioPlayer({ uri: map[type] });
  nativePlayers.add(player);
  player.play();
  setTimeout(() => {
    try {
      player.remove();
    } catch {}
    nativePlayers.delete(player);
  }, 1200);
}

export function useBattleSounds() {
  const play = (type: SoundType) => {
    try {
      if (!synthesizeWeb(type)) synthesizeNative(type);
    } catch {
    }
  };
  return { play };
}
