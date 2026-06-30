import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FighterPortrait } from "@/components/FighterPortrait";
import FighterSprite, { type FighterPose } from "@/components/FighterSprite";
import type { BattleEvent, Fighter } from "@/types";

const GOLD = "#d8a632";
const GOLD_DARK = "#6b430d";
const RED = "#f04a32";
const BLUE = "#3aa7ff";
const GREEN = "#4ad35f";
const BLACK = "#050506";
const PANEL = "rgba(8, 9, 12, 0.92)";

export const arcade = {
  gold: GOLD,
  goldDark: GOLD_DARK,
  red: RED,
  blue: BLUE,
  green: GREEN,
  panel: PANEL,
  black: BLACK,
};

export function safeNumber(value: number | undefined, fallback = 50) {
  return Number.isFinite(value) ? Math.max(1, Math.min(100, Math.round(value ?? fallback))) : fallback;
}

export function shortName(name: string | undefined) {
  const clean = (name || "Fighter").trim();
  return clean.split(/\s+/)[0] || "Fighter";
}

export function fighterStars(fighter: Fighter) {
  const overall = safeNumber(fighter.stats?.overall, 50);
  const count = Math.max(1, Math.min(5, Math.round(overall / 20)));
  return "*".repeat(count).padEnd(5, "*");
}

export function getDerivedStat(fighter: Fighter, key: string) {
  const stats = fighter.stats;
  switch (key) {
    case "Power":
      return safeNumber(stats?.power);
    case "Speed":
      return safeNumber(stats?.speed);
    case "Intelligence":
      return safeNumber(stats?.intelligence);
    case "Defense":
      return safeNumber(stats?.defense);
    case "Stamina":
      return safeNumber(stats?.stamina);
    case "Luck":
      return Math.round((safeNumber(stats?.speed) + safeNumber(stats?.intelligence)) / 2);
    case "Durability":
      return Math.round((safeNumber(stats?.defense) + safeNumber(stats?.stamina)) / 2);
    case "Aggression":
      return Math.round((safeNumber(stats?.power) + safeNumber(stats?.skill)) / 2);
    case "Experience":
      return Math.round((safeNumber(stats?.skill) + safeNumber(stats?.intelligence)) / 2);
    case "Charisma":
      return Math.round((safeNumber(stats?.overall) + (fighter.strengths?.length ?? 0) * 6) / 1.25);
    default:
      return 50;
  }
}

export function formatFightTime(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function makeBattleEvents(fighter1: Fighter, fighter2: Fighter): BattleEvent[] {
  const f1Edge = safeNumber(fighter1.stats.power) + safeNumber(fighter1.stats.speed) + safeNumber(fighter1.stats.intelligence);
  const f2Edge = safeNumber(fighter2.stats.power) + safeNumber(fighter2.stats.speed) + safeNumber(fighter2.stats.intelligence);
  const likelyWinner = f1Edge >= f2Edge ? "fighter1" : "fighter2";
  const likelyLoser = likelyWinner === "fighter1" ? "fighter2" : "fighter1";
  const getName = (side: "fighter1" | "fighter2") => (side === "fighter1" ? fighter1 : fighter2).name;
  const getMove = (side: "fighter1" | "fighter2") => (side === "fighter1" ? fighter1 : fighter2).signatureMove || "signature strike";

  const script: Array<Omit<BattleEvent, "commentary"> & { commentary?: string }> = [
    { round: 1, time: "01:27", attacker: likelyLoser, defender: likelyWinner, eventType: "jab", damage: 7, staminaDamage: 5, overlayText: "QUICK SHOT!" },
    { round: 1, time: "01:18", attacker: likelyWinner, defender: likelyLoser, eventType: "counter", damage: 12, staminaDamage: 7, comboCount: 2, overlayText: "COUNTER!" },
    { round: 1, time: "01:04", attacker: likelyWinner, defender: likelyLoser, eventType: "critical_hit", damage: 16, staminaDamage: 9, comboCount: 3, overlayText: "3 HIT COMBO!" },
    { round: 1, time: "00:49", attacker: likelyLoser, defender: likelyWinner, eventType: "stagger", damage: 10, staminaDamage: 12, overlayText: "STAGGERED!" },
    { round: 1, time: "00:32", attacker: likelyWinner, defender: likelyLoser, eventType: "special_move", damage: 18, staminaDamage: 14, overlayText: "SPECIAL!" },
    { round: 1, time: "00:18", attacker: likelyWinner, defender: likelyLoser, eventType: "knockdown", damage: 20, staminaDamage: 16, comboCount: 4, overlayText: "KNOCKDOWN!" },
    { round: 1, time: "00:07", attacker: likelyWinner, defender: likelyLoser, eventType: "finishing_blow", damage: 28, staminaDamage: 20, overlayText: "FINISHING BLOW!" },
  ];

  return script.map((event) => ({
    ...event,
    commentary:
      event.commentary ??
      `${getName(event.attacker)} lands ${event.eventType === "special_move" ? getMove(event.attacker) : "a clean arcade strike"} and ${getName(event.defender)} has to answer back!`,
  }));
}

export function ArcadeFrame({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.frame, style]}>
      <LinearGradient
        colors={["rgba(255,255,255,0.08)", "rgba(214,158,46,0.12)", "rgba(0,0,0,0.35)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

export function ArcadeButton({
  label,
  icon,
  onPress,
  variant = "gold",
  disabled = false,
  compact = false,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  variant?: "gold" | "red" | "blue" | "purple";
  disabled?: boolean;
  compact?: boolean;
}) {
  const colorMap: Record<"gold" | "red" | "blue" | "purple", readonly [string, string, string]> = {
    gold: ["#8d5c0d", "#f2bc38", "#7a4707"],
    red: ["#4a0907", "#d72d1f", "#6a0d08"],
    blue: ["#08284f", "#116bc2", "#06182e"],
    purple: ["#25143b", "#7650b5", "#21102f"],
  };
  const buttonColors = colorMap[variant];

  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.buttonWrap, { opacity: disabled ? 0.45 : pressed ? 0.78 : 1 }]}>
      <LinearGradient colors={buttonColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.button, compact && styles.buttonCompact]}>
        {icon ? <Ionicons name={icon} size={compact ? 14 : 18} color="#100800" /> : null}
        <Text style={[styles.buttonText, compact && styles.buttonTextCompact]} numberOfLines={1}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function FighterPortraitCard({ fighter, side }: { fighter: Fighter; side: "left" | "right" }) {
  const color = side === "left" ? RED : BLUE;
  return (
    <ArcadeFrame style={[styles.portraitCard, { borderColor: color }]}>
      <FighterPortrait fighter={fighter} size={104} nameColor={color} style={styles.cardPortrait} />
      <Text style={[styles.cardName, { color }]} numberOfLines={1}>{fighter.name.toUpperCase()}</Text>
      <Text style={styles.cardNick} numberOfLines={1}>"{fighter.nickname || "The Contender"}"</Text>
      <Text style={styles.cardStars}>{fighterStars(fighter)}</Text>
    </ArcadeFrame>
  );
}

export function MeterBar({
  value,
  color,
  height = 12,
  reverse = false,
}: {
  value: number;
  color: string;
  height?: number;
  reverse?: boolean;
}) {
  const anim = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: Math.max(0, Math.min(100, value)), duration: 320, useNativeDriver: false }).start();
  }, [anim, value]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" });

  return (
    <View style={[styles.meterTrack, { height }]}>
      <Animated.View style={[styles.meterFill, { width, backgroundColor: color, alignSelf: reverse ? "flex-end" : "flex-start" }]} />
      <LinearGradient colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.02)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
    </View>
  );
}

export function HealthBar({ value, side }: { value: number; side: "left" | "right" }) {
  const color = value > 45 ? (side === "left" ? "#f4aa17" : GREEN) : value > 18 ? "#f2c94c" : RED;
  return <MeterBar value={value} color={color} height={16} reverse={side === "right"} />;
}

export function StaminaBar({ value, side }: { value: number; side: "left" | "right" }) {
  return <MeterBar value={value} color={side === "left" ? "#2f8cff" : "#3ca9ff"} height={7} reverse={side === "right"} />;
}

export function SpecialMeter({ value, side }: { value: number; side: "left" | "right" }) {
  return <MeterBar value={value} color="#ff9d00" height={7} reverse={side === "right"} />;
}

export function RoundTimerBadge({ round, time }: { round: number; time: string }) {
  return (
    <View style={styles.timerBadge}>
      <Text style={styles.timerRound}>ROUND {round}</Text>
      <Text style={styles.timerMain}>{time}</Text>
    </View>
  );
}

export function StatComparisonPanel({ fighter1, fighter2 }: { fighter1: Fighter; fighter2: Fighter }) {
  const rows = ["Power", "Speed", "Intelligence", "Defense", "Stamina", "Luck", "Durability", "Aggression", "Experience", "Charisma"];
  return (
    <ArcadeFrame style={styles.statPanel}>
      <Text style={styles.panelTitle}>TALE OF THE TAPE</Text>
      {rows.map((row) => {
        const f1 = getDerivedStat(fighter1, row);
        const f2 = getDerivedStat(fighter2, row);
        return (
          <View key={row} style={styles.statRow}>
            <Text style={[styles.statNum, { color: RED }]}>{f1}</Text>
            <Text style={styles.statLabel}>{row.toUpperCase()}</Text>
            <Text style={[styles.statNum, { color: BLUE }]}>{f2}</Text>
          </View>
        );
      })}
      <InfoRow label="FIGHTING STYLE" left={fighter1.fightingStyle} right={fighter2.fightingStyle} />
      <InfoRow label="SPECIAL MOVE" left={fighter1.signatureMove} right={fighter2.signatureMove} />
      <InfoRow label="WEAKNESS" left={fighter1.weaknesses?.[0] ?? "Unknown"} right={fighter2.weaknesses?.[0] ?? "Unknown"} />
    </ArcadeFrame>
  );
}

function InfoRow({ label, left, right }: { label: string; left: string; right: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoText, { color: RED }]} numberOfLines={2}>{left || "Unknown"}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoText, { color: BLUE }]} numberOfLines={2}>{right || "Unknown"}</Text>
    </View>
  );
}

export function FightCardScreen({ fighter1, fighter2, onStart }: { fighter1: Fighter; fighter2: Fighter; onStart: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fullScreen, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 12 }]}>
      <ArenaBackground />
      <Text style={styles.mainEvent}>***** TONIGHT'S MAIN EVENT *****</Text>
      <View style={styles.cardRow}>
        <FighterPortraitCard fighter={fighter1} side="left" />
        <Text style={styles.vs}>VS</Text>
        <FighterPortraitCard fighter={fighter2} side="right" />
      </View>
      <StatComparisonPanel fighter1={fighter1} fighter2={fighter2} />
      <Pressable onPress={onStart} style={({ pressed }) => [styles.startPress, { opacity: pressed ? 0.75 : 1 }]}>
        <Text style={styles.startText}>PRESS START TO FIGHT!</Text>
      </Pressable>
    </View>
  );
}

export function RoundIntroScreen({ round, onSkip }: { round: number; onSkip: () => void }) {
  const scale = useRef(new Animated.Value(0.72)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Pressable onPress={onSkip} style={[styles.fullScreen, { paddingTop: insets.top, paddingBottom: insets.bottom + 22 }]}>
      <ArenaBackground />
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: "center" }}>
        <Text style={styles.roundIntro}>ROUND {round}</Text>
        <Text style={styles.fightIntro}>FIGHT!</Text>
      </Animated.View>
      <Text style={styles.skipText}>TAP TO SKIP</Text>
    </Pressable>
  );
}

export function CommentaryTicker({ text }: { text: string }) {
  return (
    <ArcadeFrame style={styles.ticker}>
      <View style={styles.commentatorHead}>
        <Ionicons name="mic" size={17} color={GOLD} />
      </View>
      <Text style={styles.tickerText} numberOfLines={2}>{text}</Text>
    </ArcadeFrame>
  );
}

export function ComboOverlay({ text }: { text: string }) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pop.setValue(0);
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, tension: 150, friction: 7 }),
      Animated.delay(640),
      Animated.timing(pop, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [pop, text]);

  return (
    <Animated.Text
      style={[
        styles.combo,
        {
          opacity: pop,
          transform: [
            { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.08] }) },
            { rotate: "-7deg" },
          ],
        },
      ]}
    >
      {text}
    </Animated.Text>
  );
}

export function KOOverlay({ winner, loser }: { winner: Fighter; loser: Fighter }) {
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 130, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]),
      { iterations: 4 }
    ).start();
  }, [flash]);

  return (
    <View style={styles.koOverlay}>
      <ArenaBackground />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] }) }]} />
      <View style={styles.koStage}>
        <View style={styles.koWinner}>
          <FighterSprite color={RED} pose="idle" size={96} />
          <Text style={styles.koName}>{shortName(winner.name).toUpperCase()}</Text>
        </View>
        <View style={styles.koLoser}>
          <View style={{ transform: [{ rotate: "86deg" }] }}>
            <FighterSprite color={BLUE} pose="hit" mirrored size={84} />
          </View>
          <Text style={styles.koName}>{shortName(loser.name).toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.koText}>K.O.!</Text>
    </View>
  );
}

export function WinnerScreen({
  winner,
  stats,
  onRematch,
  onFightAgain,
  onMainMenu,
  onShare,
}: {
  winner: Fighter;
  stats: Array<{ label: string; value: string }>;
  onRematch: () => void;
  onFightAgain: () => void;
  onMainMenu: () => void;
  onShare: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fullScreen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <ArenaBackground />
      <View style={styles.winnerLayout}>
        <View style={styles.winnerSprite}>
          <FighterSprite color={RED} pose="idle" size={118} />
        </View>
        <View style={styles.winnerCopy}>
          <Text style={styles.winnerTitle}>WINNER!</Text>
          <Text style={styles.winnerName}>{winner.name.toUpperCase()}</Text>
          <Text style={styles.winnerNick}>"{winner.nickname || "The Champion"}"</Text>
          <ArcadeFrame style={styles.matchStats}>
            {stats.map((item) => (
              <View key={item.label} style={styles.matchStatRow}>
                <Text style={styles.matchStatLabel}>{item.label}</Text>
                <Text style={styles.matchStatValue}>{item.value}</Text>
              </View>
            ))}
          </ArcadeFrame>
        </View>
      </View>
      <View style={styles.winnerButtons}>
        <ArcadeButton label="REMATCH" variant="red" onPress={onRematch} />
        <ArcadeButton label="FIGHT AGAIN" variant="gold" onPress={onFightAgain} />
        <ArcadeButton label="MAIN MENU" variant="blue" onPress={onMainMenu} />
        <ArcadeButton label="SHARE" variant="purple" onPress={onShare} />
      </View>
    </View>
  );
}

export function FightArenaScreen({
  fighter1,
  fighter2,
  event,
  f1Health,
  f2Health,
  f1Stamina,
  f2Stamina,
  f1Special,
  f2Special,
  round,
  time,
  paused,
  fastForward,
  autoMode,
  onPause,
  onSpeed,
  onSkip,
  onAuto,
}: {
  fighter1: Fighter;
  fighter2: Fighter;
  event: BattleEvent | null;
  f1Health: number;
  f2Health: number;
  f1Stamina: number;
  f2Stamina: number;
  f1Special: number;
  f2Special: number;
  round: number;
  time: string;
  paused: boolean;
  fastForward: boolean;
  autoMode: boolean;
  onPause: () => void;
  onSpeed: () => void;
  onSkip: () => void;
  onAuto: () => void;
}) {
  const shake = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const f1Pose: FighterPose = event?.attacker === "fighter1" ? "attack" : event?.defender === "fighter1" ? "hit" : "idle";
  const f2Pose: FighterPose = event?.attacker === "fighter2" ? "attack" : event?.defender === "fighter2" ? "hit" : "idle";

  useEffect(() => {
    if (!event) return;
    const amount = event.eventType === "finishing_blow" || event.eventType === "knockdown" ? 12 : 7;
    Animated.sequence([
      Animated.timing(shake, { toValue: amount, duration: 34, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -amount, duration: 34, useNativeDriver: true }),
      Animated.timing(shake, { toValue: amount * 0.5, duration: 34, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [event, shake]);

  const spriteSize = Math.max(84, Math.min(132, width * 0.25));

  return (
    <View style={styles.arenaScreen}>
      <ArenaBackground />
      <View style={styles.hud}>
        <View style={styles.hudSide}>
          <FighterPortrait fighter={fighter1} size={54} nameColor={RED} style={styles.hudPortrait} />
          <View style={styles.hudInfo}>
            <Text style={[styles.hudName, { color: "#fff" }]} numberOfLines={1}>{fighter1.name.toUpperCase()}</Text>
            <Text style={styles.hudNick} numberOfLines={1}>"{fighter1.nickname || "Contender"}"</Text>
            <HealthBar value={f1Health} side="left" />
            <HudMeter label="STAMINA"><StaminaBar value={f1Stamina} side="left" /></HudMeter>
            <HudMeter label="SPECIAL"><SpecialMeter value={f1Special} side="left" /></HudMeter>
          </View>
        </View>
        <RoundTimerBadge round={round} time={time} />
        <View style={[styles.hudSide, styles.hudSideRight]}>
          <View style={[styles.hudInfo, { alignItems: "flex-end" }]}>
            <Text style={[styles.hudName, { color: "#fff", textAlign: "right" }]} numberOfLines={1}>{fighter2.name.toUpperCase()}</Text>
            <Text style={[styles.hudNick, { textAlign: "right" }]} numberOfLines={1}>"{fighter2.nickname || "Contender"}"</Text>
            <HealthBar value={f2Health} side="right" />
            <HudMeter label="STAMINA" right><StaminaBar value={f2Stamina} side="right" /></HudMeter>
            <HudMeter label="SPECIAL" right><SpecialMeter value={f2Special} side="right" /></HudMeter>
          </View>
          <FighterPortrait fighter={fighter2} size={54} nameColor={BLUE} style={styles.hudPortrait} />
        </View>
      </View>
      <Animated.View style={[styles.ring, { transform: [{ translateX: shake }] }]}>
        <View style={styles.ringRopes} />
        <View style={styles.spriteRow}>
          <FighterSprite color={RED} pose={f1Pose} size={spriteSize} />
          <FighterSprite color={BLUE} pose={f2Pose} mirrored size={spriteSize} />
        </View>
        {event ? <ComboOverlay text={event.overlayText} /> : null}
      </Animated.View>
      <View style={styles.bottomPanel}>
        <CommentaryTicker text={event?.commentary ?? "The crowd is on its feet as the fighters circle the ring."} />
        <View style={styles.controls}>
          <ArcadeButton compact label={paused ? "RESUME" : "PAUSE"} icon={paused ? "play" : "pause"} onPress={onPause} />
          <ArcadeButton compact label={fastForward ? "2X SPEED" : "1X SPEED"} icon="speedometer" onPress={onSpeed} />
          <ArcadeButton compact label="SKIP" icon="play-forward" onPress={onSkip} />
          <ArcadeButton compact label={autoMode ? "AUTO ON" : "AUTO"} icon="repeat" onPress={onAuto} />
        </View>
      </View>
    </View>
  );
}

function HudMeter({ label, right = false, children }: { label: string; right?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.hudMeter}>
      <Text style={[styles.hudMeterLabel, right && { textAlign: "right" }]}>{label}</Text>
      {children}
    </View>
  );
}

function ArenaBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#020205", "#111217", "#05060a"]} style={StyleSheet.absoluteFill} />
      <View style={styles.lightOne} />
      <View style={styles.lightTwo} />
      <View style={styles.scanlines} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: BLACK,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  frame: {
    borderWidth: 1,
    borderColor: GOLD_DARK,
    backgroundColor: PANEL,
    overflow: "hidden",
    borderRadius: 7,
  },
  buttonWrap: { flex: 1, minWidth: 0 },
  button: {
    minHeight: 48,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 8,
  },
  buttonCompact: { minHeight: 36, paddingHorizontal: 5 },
  buttonText: {
    color: "#fff8d2",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: 1,
    textAlign: "center",
  },
  buttonTextCompact: { fontSize: 10 },
  mainEvent: {
    color: GOLD,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 5,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  portraitCard: { flex: 1, alignItems: "center", padding: 8, minHeight: 185 },
  cardPortrait: { borderRadius: 5 },
  cardName: { fontFamily: "Inter_700Bold", fontSize: 14, marginTop: 7, textAlign: "center" },
  cardNick: { color: GOLD, fontFamily: "Inter_600SemiBold", fontSize: 11, textAlign: "center", marginTop: 2 },
  cardStars: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 12, marginTop: 4 },
  vs: {
    color: "#ffb000",
    fontFamily: "Inter_700Bold",
    fontSize: 35,
    textShadowColor: RED,
    textShadowRadius: 12,
  },
  statPanel: { padding: 8, marginTop: 10 },
  panelTitle: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 11, textAlign: "center", marginBottom: 4 },
  statRow: {
    minHeight: 19,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(216,166,50,0.14)",
  },
  statNum: { width: 48, fontFamily: "Inter_700Bold", fontSize: 13, textAlign: "center" },
  statLabel: { flex: 1, color: "#f3eee1", fontFamily: "Inter_600SemiBold", fontSize: 11, textAlign: "center" },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 38,
    borderTopWidth: 1,
    borderTopColor: "rgba(216,166,50,0.18)",
  },
  infoText: { flex: 1, fontFamily: "Inter_700Bold", fontSize: 10, textAlign: "center" },
  infoLabel: { width: 86, color: GOLD, fontFamily: "Inter_700Bold", fontSize: 8, textAlign: "center" },
  startPress: { alignItems: "center", paddingVertical: 9 },
  startText: {
    color: GOLD,
    fontFamily: "Inter_700Bold",
    fontSize: 21,
    letterSpacing: 1,
    textAlign: "center",
    textShadowColor: RED,
    textShadowRadius: 8,
  },
  meterTrack: {
    width: "100%",
    borderRadius: 3,
    backgroundColor: "#101318",
    borderWidth: 1,
    borderColor: "#4b3210",
    overflow: "hidden",
  },
  meterFill: { height: "100%" },
  timerBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: GOLD,
    backgroundColor: "#120b06",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GOLD,
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  timerRound: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 8 },
  timerMain: { color: "#ffcc4d", fontFamily: "Inter_700Bold", fontSize: 24 },
  roundIntro: { color: "#d8361f", fontFamily: "Inter_700Bold", fontSize: 54, letterSpacing: 2, textShadowColor: GOLD, textShadowRadius: 10 },
  fightIntro: { color: "#ffcf48", fontFamily: "Inter_700Bold", fontSize: 58, letterSpacing: 2, textShadowColor: RED, textShadowRadius: 12 },
  skipText: { color: "#c6bba5", fontFamily: "Inter_600SemiBold", fontSize: 14, textAlign: "center", letterSpacing: 1 },
  ticker: { minHeight: 62, flexDirection: "row", alignItems: "center", padding: 8, gap: 10 },
  commentatorHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16120d",
  },
  tickerText: { flex: 1, color: "#f8efe3", fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 19 },
  combo: {
    position: "absolute",
    left: 30,
    top: 128,
    color: "#ffcc32",
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    textShadowColor: RED,
    textShadowRadius: 8,
  },
  koOverlay: { flex: 1, backgroundColor: BLACK, justifyContent: "center", overflow: "hidden" },
  koStage: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", paddingHorizontal: 18 },
  koWinner: { alignItems: "center", justifyContent: "flex-end" },
  koLoser: { alignItems: "center", justifyContent: "flex-end", opacity: 0.68 },
  koName: { color: "#f7eedc", fontFamily: "Inter_700Bold", fontSize: 12, marginTop: 4 },
  koText: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "28%",
    color: "#e42117",
    fontFamily: "Inter_700Bold",
    fontSize: 92,
    textAlign: "center",
    textShadowColor: GOLD,
    textShadowRadius: 14,
  },
  winnerLayout: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  winnerSprite: { flex: 0.86, alignItems: "center", justifyContent: "flex-end", height: "82%" },
  winnerCopy: { flex: 1.18 },
  winnerTitle: { color: "#ffcf48", fontFamily: "Inter_700Bold", fontSize: 44, textShadowColor: GOLD, textShadowRadius: 12 },
  winnerName: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 21, marginTop: 4 },
  winnerNick: { color: "#f1d57d", fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 2, marginBottom: 12 },
  matchStats: { padding: 10 },
  matchStatRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(216,166,50,0.15)", paddingVertical: 4 },
  matchStatLabel: { color: "#d7c7a1", fontFamily: "Inter_600SemiBold", fontSize: 10 },
  matchStatValue: { color: "#ffcf48", fontFamily: "Inter_700Bold", fontSize: 11, textAlign: "right", maxWidth: "52%" },
  winnerButtons: { flexDirection: "row", gap: 7 },
  arenaScreen: { flex: 1, backgroundColor: BLACK, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 },
  hud: { flexDirection: "row", alignItems: "flex-start", gap: 5, zIndex: 2 },
  hudSide: { flex: 1, flexDirection: "row", gap: 6, minWidth: 0 },
  hudSideRight: { justifyContent: "flex-end" },
  hudPortrait: { borderRadius: 5 },
  hudInfo: { flex: 1, minWidth: 0 },
  hudName: { fontFamily: "Inter_700Bold", fontSize: 12 },
  hudNick: { color: "#d8caa8", fontFamily: "Inter_600SemiBold", fontSize: 9, marginBottom: 3 },
  hudMeter: { width: "100%", marginTop: 3 },
  hudMeterLabel: { color: "#d8caa8", fontFamily: "Inter_700Bold", fontSize: 7, marginBottom: 1 },
  ring: { flex: 1, marginTop: 8, justifyContent: "flex-end", overflow: "hidden" },
  ringRopes: {
    position: "absolute",
    left: -20,
    right: -20,
    bottom: 76,
    height: 70,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderColor: "rgba(174,26,22,0.85)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  spriteRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 20 },
  bottomPanel: { gap: 8 },
  controls: { flexDirection: "row", gap: 6 },
  lightOne: {
    position: "absolute",
    top: 40,
    left: 24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(244, 164, 38, 0.12)",
  },
  lightTwo: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(46, 121, 255, 0.11)",
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.025)",
    opacity: 0.48,
  },
});
