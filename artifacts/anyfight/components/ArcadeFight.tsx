import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FighterSprite, { type FighterPose } from "@/components/FighterSprite";
import type { BattleEvent, Fighter } from "@/types";

const RED = "#e52e21";
const BLUE = "#1267dd";
const GOLD = "#f2b92f";
const WHITE = "#f7efe0";
const BLACK = "#030303";
const CANVAS = "#5b9bd6";
const RING_DARK = "#102e51";
const OUTLINE = "#1a0d08";

export const arcade = {
  gold: GOLD,
  goldDark: "#7d4a08",
  red: RED,
  blue: BLUE,
  green: "#4bd65c",
  panel: "#060606",
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
  type Side = "fighter1" | "fighter2";
  type Template = {
    eventType: BattleEvent["eventType"];
    overlayText: string;
    damage: number;
    staminaDamage: number;
    embarrassmentDamage?: number;
    specialGain?: number;
    movement?: BattleEvent["movement"];
    comboCount?: number;
    line: (attacker: Fighter, defender: Fighter) => string;
  };

  const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
  const getFighter = (side: Side) => (side === "fighter1" ? fighter1 : fighter2);
  const edge = (fighter: Fighter) => safeNumber(fighter.stats.power) + safeNumber(fighter.stats.speed) + safeNumber(fighter.stats.skill) + safeNumber(fighter.stats.intelligence);
  const favorite: Side = edge(fighter1) >= edge(fighter2) ? "fighter1" : "fighter2";
  const underdog: Side = favorite === "fighter1" ? "fighter2" : "fighter1";
  const strength = (fighter: Fighter) => pick(fighter.strengths?.length ? fighter.strengths : ["mysterious confidence"]);
  const weakness = (fighter: Fighter) => pick(fighter.weaknesses?.length ? fighter.weaknesses : ["dramatic overthinking"]);
  const nickname = (fighter: Fighter) => fighter.nickname || shortName(fighter.name);
  const move = (fighter: Fighter) => fighter.signatureMove || "Suspiciously Legal Haymaker";

  const templates: Template[] = [
    { eventType: "jab", overlayText: "PEPPER JAB!", damage: 7, staminaDamage: 5, specialGain: 12, movement: "advance", line: (a, d) => `${shortName(a.name)} flicks a jab and ${shortName(d.name)} blinks like the controller disconnected.` },
    { eventType: "hook", overlayText: "BIG DAMAGE!", damage: 13, staminaDamage: 8, specialGain: 16, movement: "close", comboCount: 2, line: (a, d) => `${nickname(a)} whips a hook around the guard and the front row starts counting teeth.` },
    { eventType: "uppercut", overlayText: "TO THE MOON!", damage: 15, staminaDamage: 10, specialGain: 18, movement: "inside", line: (a, d) => `${shortName(a.name)} ducks inside with an uppercut that makes ${shortName(d.name)} briefly reconsider gravity.` },
    { eventType: "heavy_hit", overlayText: "BIG DAMAGE!", damage: 16, staminaDamage: 11, specialGain: 18, movement: "lunge", line: (a, d) => `${shortName(a.name)} lands a cartoon power shot powered by ${strength(a)}.` },
    { eventType: "critical_hit", overlayText: "CRITICAL HIT!", damage: 21, staminaDamage: 13, embarrassmentDamage: 4, specialGain: 22, movement: "lunge", comboCount: 3, line: (a, d) => `${nickname(a)} finds the perfect angle and ${shortName(d.name)} gets reviewed by three imaginary judges.` },
    { eventType: "counter", overlayText: "MOMENTUM SHIFT!", damage: 14, staminaDamage: 9, specialGain: 18, movement: "slip", line: (a, d) => `${shortName(a.name)} slips the shot and counters like they read ${shortName(d.name)}'s diary.` },
    { eventType: "block", overlayText: "NOPE!", damage: 2, staminaDamage: 4, specialGain: 10, movement: "hold", line: (a, d) => `${shortName(a.name)} hides behind the gloves and lets ${shortName(d.name)} punch the concept of defense.` },
    { eventType: "slip", overlayText: "WHIFF!", damage: 1, staminaDamage: 6, embarrassmentDamage: 6, specialGain: 12, movement: "slip", line: (a, d) => `${shortName(a.name)} slips sideways and ${shortName(d.name)} attacks the empty air with confidence.` },
    { eventType: "taunt", overlayText: "CROWD CONFUSED!", damage: 0, staminaDamage: 3, embarrassmentDamage: 8, specialGain: 14, movement: "celebrate", line: (a, d) => `${nickname(a)} points at ${shortName(d.name)} and shouts something only the hot dog vendor understands.` },
    { eventType: "crowd_chant", overlayText: "CROWD NOISE!", damage: 0, staminaDamage: 4, embarrassmentDamage: 3, specialGain: 16, movement: "bounce", line: (a, d) => `The crowd chants ${shortName(a.name)} so loudly that ${shortName(d.name)} starts checking if it is a home game.` },
    { eventType: "ref_warning", overlayText: "REF SQUINTS!", damage: 0, staminaDamage: 3, embarrassmentDamage: 4, specialGain: 8, movement: "hold", line: (a, d) => `The ref warns ${shortName(a.name)} for excessive swagger and possibly inventing a new rule.` },
    { eventType: "comeback", overlayText: "COMEBACK?!", damage: 12, staminaDamage: 7, embarrassmentDamage: 2, specialGain: 24, movement: "advance", line: (a, d) => `${shortName(a.name)} remembers ${strength(a)} and suddenly the scoreboard looks nervous.` },
    { eventType: "panic_retreat", overlayText: "PANIC RETREAT!", damage: 0, staminaDamage: 8, embarrassmentDamage: 7, specialGain: 10, movement: "retreat", line: (a, d) => `${shortName(a.name)} moonwalks away from danger and calls it footwork.` },
    { eventType: "rope_pressure", overlayText: "ON THE ROPES!", damage: 9, staminaDamage: 10, embarrassmentDamage: 3, specialGain: 14, movement: "cornered", line: (a, d) => `${shortName(a.name)} crowds ${shortName(d.name)} into the ropes like the ring owes them rent.` },
    { eventType: "wardrobe_malfunction", overlayText: "GEAR DRAMA!", damage: 0, staminaDamage: 5, embarrassmentDamage: 12, specialGain: 12, movement: "wobble", line: (a, d) => `${shortName(a.name)}'s ${a.outfitChoice} outfit becomes a tactical distraction. Nobody is proud.` },
    { eventType: "mascot_confusion", overlayText: "CROWD CONFUSED!", damage: 2, staminaDamage: 4, embarrassmentDamage: 9, specialGain: 10, movement: "wobble", line: (a, d) => `A fake league mascot points at ${shortName(d.name)} and ${shortName(a.name)} uses the confusion professionally.` },
    { eventType: "wrong_corner", overlayText: "WRONG CORNER!", damage: 0, staminaDamage: 5, embarrassmentDamage: 10, specialGain: 8, movement: "retreat", line: (a, d) => `${shortName(a.name)} returns to ${shortName(d.name)}'s corner and asks why the towels feel hostile.` },
    { eventType: "emotional_damage", overlayText: "EMOTIONAL DAMAGE!", damage: 5, staminaDamage: 4, embarrassmentDamage: 15, specialGain: 18, movement: "wobble", line: (a, d) => `${nickname(a)} weaponizes the nickname and ${shortName(d.name)} takes emotional splash damage.` },
    { eventType: "illegal_but_awesome", overlayText: "ILLEGAL BUT AWESOME!", damage: 18, staminaDamage: 12, embarrassmentDamage: 8, specialGain: 6, movement: "lunge", line: (a, d) => `${shortName(a.name)} tries something the rulebook calls no and the crowd calls encore.` },
    { eventType: "signature_fakeout", overlayText: "FAKEOUT!", damage: 8, staminaDamage: 6, embarrassmentDamage: 7, specialGain: 20, movement: "slip", line: (a, d) => `${shortName(a.name)} fakes ${move(a)} and ${shortName(d.name)} blocks a ghost.` },
    { eventType: "nickname_powerup", overlayText: "NICKNAME POWER!", damage: 10, staminaDamage: 6, embarrassmentDamage: 5, specialGain: 25, movement: "bounce", line: (a, d) => `The announcer screams "${nickname(a)}" and somehow that counts as training.` },
    { eventType: "weakness_exposed", overlayText: "WEAKNESS EXPOSED!", damage: 11, staminaDamage: 8, embarrassmentDamage: 10, specialGain: 18, movement: "advance", line: (a, d) => `${shortName(a.name)} spots ${weakness(d)} and attacks it with extremely questionable science.` },
    { eventType: "strength_showcase", overlayText: "SHOWBOAT!", damage: 12, staminaDamage: 7, embarrassmentDamage: 4, specialGain: 18, movement: "celebrate", line: (a, d) => `${shortName(a.name)} turns ${strength(a)} into a highlight reel nobody asked for.` },
    { eventType: "arch_nemesis_flashback", overlayText: "FLASHBACK!", damage: 9, staminaDamage: 7, embarrassmentDamage: 9, specialGain: 20, movement: "wobble", line: (a, d) => `${shortName(a.name)} thinks about ${a.archNemesis || "their arch nemesis"} and punches with unresolved subplot energy.` },
    { eventType: "outfit_bonus", overlayText: "STYLE BONUS!", damage: 7, staminaDamage: 4, embarrassmentDamage: 6, specialGain: 18, movement: "celebrate", line: (a, d) => `${shortName(a.name)}'s ${a.outfitChoice} look gets a style bonus from two judges and one confused barber.` },
    { eventType: "camera_flash", overlayText: "CAMERA FLASH!", damage: 4, staminaDamage: 3, embarrassmentDamage: 7, specialGain: 12, movement: "wobble", line: (a, d) => `Camera flashes pop and ${shortName(d.name)} accidentally poses during a punch exchange.` },
    { eventType: "announcer_meltdown", overlayText: "ANNOUNCER MELTDOWN!", damage: 3, staminaDamage: 4, embarrassmentDamage: 8, specialGain: 10, movement: "bounce", line: (a, d) => `The announcer mispronounces both names, then gives ${shortName(a.name)} credit anyway.` },
    { eventType: "bell_fakeout", overlayText: "BELL FAKEOUT!", damage: 6, staminaDamage: 5, embarrassmentDamage: 6, specialGain: 14, movement: "advance", line: (a, d) => `${shortName(d.name)} hears a bell that did not happen and ${shortName(a.name)} accepts the gift.` },
    { eventType: "shoe_squeak", overlayText: "SQUEAK!", damage: 2, staminaDamage: 4, embarrassmentDamage: 5, specialGain: 9, movement: "slip", line: (a, d) => `${shortName(a.name)} squeaks across the canvas with elite sneaker-based intimidation.` },
    { eventType: "stagger", overlayText: "WOBBLE!", damage: 10, staminaDamage: 12, embarrassmentDamage: 5, specialGain: 14, movement: "recoil", line: (a, d) => `${shortName(a.name)} staggers ${shortName(d.name)} so hard the crowd leans left.` },
  ];

  const events: BattleEvent[] = [];
  let attacker: Side = Math.random() < 0.58 ? favorite : underdog;
  let defender: Side = attacker === "fighter1" ? "fighter2" : "fighter1";
  let f1Special = 18;
  let f2Special = 18;
  let f1Health = 100;
  let f2Health = 100;
  let momentum: Side = favorite;
  const eventCount = 12 + Math.floor(Math.random() * 6);

  for (let index = 0; index < eventCount; index++) {
    const a = getFighter(attacker);
    const d = getFighter(defender);
    const closeRange = index > 3 || Math.abs(f1Health - f2Health) < 26;
    const hurtSide: Side | null = f1Health < 36 ? "fighter1" : f2Health < 36 ? "fighter2" : null;
    const specialReady = attacker === "fighter1" ? f1Special >= 100 : f2Special >= 100;
    const pool = templates.filter((template) => {
      if (!closeRange && ["hook", "uppercut", "rope_pressure"].includes(template.eventType)) return false;
      if (hurtSide === attacker && ["panic_retreat", "comeback", "block", "slip"].includes(template.eventType)) return true;
      return true;
    });
    const specialTemplate: Template = { eventType: "special_move", overlayText: "CUSTOM SPECIAL!", damage: 24, staminaDamage: 16, embarrassmentDamage: 12, specialGain: -100, movement: "lunge", comboCount: 4, line: (specialA: Fighter, specialD: Fighter) => `${shortName(specialA.name)} cashes in a full meter for ${move(specialA)} and ${shortName(specialD.name)} files a formal complaint with gravity.` };
    const template = specialReady
      ? specialTemplate
      : pick(pool);
    const timeLeft = Math.max(7, 90 - index * Math.max(4, Math.floor(80 / eventCount)));
    const event: BattleEvent = {
      round: 1,
      time: `0${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`,
      attacker,
      defender,
      eventType: template.eventType,
      damage: template.damage,
      staminaDamage: template.staminaDamage,
      embarrassmentDamage: template.embarrassmentDamage,
      specialGain: template.specialGain,
      movement: template.movement,
      comboCount: template.comboCount,
      overlayText: template.overlayText,
      commentary: template.line(a, d),
    };
    events.push(event);

    if (defender === "fighter1") f1Health = Math.max(0, f1Health - event.damage);
    else f2Health = Math.max(0, f2Health - event.damage);
    if (attacker === "fighter1") f1Special = Math.max(0, Math.min(100, f1Special + (event.specialGain ?? 12)));
    else f2Special = Math.max(0, Math.min(100, f2Special + (event.specialGain ?? 12)));

    if (["counter", "comeback", "momentum_shift", "critical_hit", "special_move"].includes(event.eventType)) momentum = attacker;
    const shouldSwitch = Math.random() < (momentum === attacker ? 0.36 : 0.58);
    attacker = shouldSwitch ? defender : (Math.random() < 0.68 ? momentum : attacker);
    defender = attacker === "fighter1" ? "fighter2" : "fighter1";
  }

  const winner: Side = f1Health === f2Health ? favorite : f1Health > f2Health ? "fighter1" : "fighter2";
  const loser: Side = winner === "fighter1" ? "fighter2" : "fighter1";
  events.push({
    round: 1,
    time: "00:05",
    attacker: winner,
    defender: loser,
    eventType: "knockdown",
    damage: 24,
    staminaDamage: 16,
    embarrassmentDamage: 12,
    movement: "fall",
    comboCount: 4,
    overlayText: "KNOCKDOWN!",
    commentary: `${shortName(getFighter(winner).name)} sends ${shortName(getFighter(loser).name)} into a dramatic canvas meeting. The crowd has no idea if this is sport or theater.`,
  });
  events.push({
    round: 1,
    time: "00:01",
    attacker: winner,
    defender: loser,
    eventType: "finishing_blow",
    damage: 100,
    staminaDamage: 20,
    embarrassmentDamage: 18,
    movement: "celebrate",
    overlayText: "WINNER!",
    commentary: `${nickname(getFighter(winner))} finishes the bout with maximum nonsense and legally questionable charisma.`,
  });

  return events;
}

export function ArcadeFrame({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.pixelPanel, style]}>{children}</View>;
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
  const colorMap = {
    gold: ["#4c3104", "#d99a17", "#654203"] as const,
    red: ["#2e0404", "#b61c14", "#4a0605"] as const,
    blue: ["#041f43", "#1559a8", "#06152d"] as const,
    purple: ["#221031", "#67319a", "#16091f"] as const,
  };
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.buttonWrap, { opacity: disabled ? 0.45 : pressed ? 0.72 : 1 }]}>
      <LinearGradient colors={colorMap[variant]} style={[styles.button, compact && styles.buttonCompact]}>
        {icon ? <Ionicons name={icon} size={compact ? 13 : 17} color={WHITE} /> : null}
        <Text style={[styles.buttonText, compact && styles.buttonTextCompact]} numberOfLines={1}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function MeterBar({ value, color, height = 12, reverse = false }: { value: number; color: string; height?: number; reverse?: boolean }) {
  const width = `${Math.max(0, Math.min(100, Math.round(value)))}%` as const;
  return (
    <View style={[styles.meterTrack, { height }]}>
      <View style={[styles.meterFill, { width, backgroundColor: color, alignSelf: reverse ? "flex-end" : "flex-start" }]} />
    </View>
  );
}

export function HealthBar({ value, side }: { value: number; side: "left" | "right" }) {
  const color = value > 42 ? (side === "left" ? "#f1c232" : "#4bd65c") : value > 18 ? "#f27f22" : RED;
  return <MeterBar value={value} color={color} height={12} reverse={side === "right"} />;
}

export function StaminaBar({ value, side }: { value: number; side: "left" | "right" }) {
  return <MeterBar value={value} color={side === "left" ? RED : BLUE} height={9} reverse={side === "right"} />;
}

export function SpecialMeter({ value, side }: { value: number; side: "left" | "right" }) {
  return <MeterBar value={value} color={GOLD} height={9} reverse={side === "right"} />;
}

export function RoundTimerBadge({ round, time }: { round: number; time: string }) {
  return (
    <View style={styles.timerBox}>
      <Text style={styles.timerLabel}>ROUND</Text>
      <Text style={styles.timerRound}>{round}</Text>
      <Text style={styles.timerLabel}>TIME</Text>
      <Text style={styles.timerMain}>{time}</Text>
    </View>
  );
}

export function FightCardScreen({ fighter1, fighter2, onStart }: { fighter1: Fighter; fighter2: Fighter; onStart: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width < 390;
  return (
    <View style={[styles.fullScreen, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 12 }]}>
      <PixelBackdrop />
      <Text style={styles.matchHeader}>TONIGHT'S MAIN EVENT</Text>
      <View style={styles.matchRow}>
        <IntroCard fighter={fighter1} side="left" compact={compact} />
        <Text style={styles.vs}>VS</Text>
        <IntroCard fighter={fighter2} side="right" compact={compact} />
      </View>
      <TaleOfTape fighter1={fighter1} fighter2={fighter2} />
      <Pressable onPress={onStart} style={({ pressed }) => [styles.startPress, { opacity: pressed ? 0.65 : 1 }]}>
        <Text style={styles.startText}>PRESS START TO FIGHT!</Text>
      </Pressable>
    </View>
  );
}

function IntroCard({ fighter, side, compact }: { fighter: Fighter; side: "left" | "right"; compact: boolean }) {
  const color = side === "left" ? RED : BLUE;
  return (
    <View style={[styles.introCard, { borderColor: color }]}>
      <Text style={[styles.playerTag, { backgroundColor: color }]}>{side === "left" ? "1P" : "2P"}</Text>
      <View style={styles.spritePortrait}>
        <FighterSprite color={color} pose="block" mirrored={side === "right"} size={compact ? 62 : 76} trunksColor={side === "left" ? BLUE : WHITE} gloveColor={RED} />
      </View>
      <Text style={styles.introName} numberOfLines={1}>{shortName(fighter.name).toUpperCase()}</Text>
      <Text style={styles.introNick} numberOfLines={1}>"{fighter.nickname || "The Contender"}"</Text>
      <Text style={styles.recordText}>RECORD {safeNumber(fighter.stats.overall) - 35}-{safeNumber(fighter.stats.skill) - 30}</Text>
    </View>
  );
}

function TaleOfTape({ fighter1, fighter2 }: { fighter1: Fighter; fighter2: Fighter }) {
  const rows = ["Power", "Speed", "Intelligence", "Defense", "Stamina", "Luck", "Durability", "Aggression", "Experience", "Charisma"];
  return (
    <View style={styles.tape}>
      <Text style={styles.tapeTitle}>TALE OF THE TAPE</Text>
      {rows.map((row) => (
        <View key={row} style={styles.tapeRow}>
          <Text style={[styles.tapeValue, { color: RED }]}>{getDerivedStat(fighter1, row)}</Text>
          <Text style={styles.tapeLabel}>{row.toUpperCase()}</Text>
          <Text style={[styles.tapeValue, { color: BLUE }]}>{getDerivedStat(fighter2, row)}</Text>
        </View>
      ))}
    </View>
  );
}

export function RoundIntroScreen({ round, onSkip, fighter1, fighter2 }: { round: number; onSkip: () => void; fighter1?: Fighter; fighter2?: Fighter }) {
  const pop = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, tension: 90, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [opacity, pop]);

  return (
    <Pressable onPress={onSkip} style={styles.fullScreenNoPad}>
      <BoxingScene
        fighter1={fighter1}
        fighter2={fighter2}
        f1Pose="idle"
        f2Pose="idle"
        overlay={
          <Animated.View style={[styles.roundOverlay, { opacity, transform: [{ scale: pop }] }]}>
            <Text style={styles.finalRound}>ROUND {round}</Text>
            <Text style={styles.bigFight}>FIGHT!</Text>
          </Animated.View>
        }
      />
      <Text style={styles.skipText}>TAP TO SKIP</Text>
    </Pressable>
  );
}

export function CommentaryTicker({ text }: { text: string }) {
  return (
    <View style={styles.ticker}>
      <Ionicons name="radio" size={16} color={GOLD} />
      <Text style={styles.tickerText} numberOfLines={2}>{text}</Text>
    </View>
  );
}

export function ComboOverlay({ text }: { text: string }) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pop.setValue(0);
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, tension: 150, friction: 7 }),
      Animated.delay(620),
      Animated.timing(pop, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [pop, text]);

  return (
    <Animated.Text
      style={[
        styles.combo,
        {
          opacity: pop,
          transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.08] }) }, { rotate: "-5deg" }],
        },
      ]}
    >
      {text}
    </Animated.Text>
  );
}

export function KOOverlay({ winner, loser, count = 3 }: { winner: Fighter; loser: Fighter; count?: number }) {
  const flash = useRef(new Animated.Value(0)).current;
  const [displayCount, setDisplayCount] = useState(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]),
      { iterations: 4 }
    ).start();
  }, [flash]);

  useEffect(() => {
    setDisplayCount(1);
    const timer = setInterval(() => {
      setDisplayCount((value) => Math.min(count, value + 1));
    }, 560);
    return () => clearInterval(timer);
  }, [count]);

  return (
    <View style={styles.fullScreenNoPad}>
      <BoxingScene
        fighter1={winner}
        fighter2={loser}
        f1Pose="idle"
        f2Pose="knockdown"
        overlay={
          <>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] }) }]} />
            <View style={styles.referee}>
              <View style={styles.refHead} />
              <View style={styles.refBody} />
              <Text style={styles.refText}>COUNT</Text>
            </View>
            <Text style={styles.countNumber}>{displayCount}</Text>
            <Text style={styles.knockdownText}>KNOCKDOWN!</Text>
          </>
        }
      />
    </View>
  );
}

export function WinnerScreen({
  winner,
  loser,
  stats,
  onRematch,
  onFightAgain,
  onMainMenu,
  onShare,
}: {
  winner: Fighter;
  loser?: Fighter;
  stats: Array<{ label: string; value: string }>;
  onRematch: () => void;
  onFightAgain: () => void;
  onMainMenu: () => void;
  onShare: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.winnerScreen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 10 }]}>
      <BoxingScene
        fighter1={winner}
        fighter2={loser}
        f1Pose="winner"
        f2Pose={loser ? "stagger" : "idle"}
        overlay={
          <View style={styles.winnerCopy}>
            <Text style={styles.winnerTitle}>WINNER!</Text>
            <Text style={styles.winnerName} numberOfLines={1}>{winner.name.toUpperCase()}</Text>
            <Text style={styles.winnerNick} numberOfLines={1}>"{winner.nickname || "The Champion"}"</Text>
          </View>
        }
      />
      <View style={styles.statsBar}>
        {stats.map((item) => (
          <View key={item.label} style={styles.statCell}>
            <Text style={styles.statCellLabel}>{item.label}</Text>
            <Text style={styles.statCellValue}>{item.value}</Text>
          </View>
        ))}
      </View>
      <View style={styles.winnerButtons}>
        <ArcadeButton label="REMATCH" variant="red" onPress={onRematch} compact />
        <ArcadeButton label="FIGHT AGAIN" variant="gold" onPress={onFightAgain} compact />
        <ArcadeButton label="MAIN MENU" variant="blue" onPress={onMainMenu} compact />
        <ArcadeButton label="SHARE" variant="purple" onPress={onShare} compact />
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
  f1Embarrassment,
  f2Embarrassment,
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
  f1Embarrassment: number;
  f2Embarrassment: number;
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
  const f1Pose = poseFor("fighter1", event);
  const f2Pose = poseFor("fighter2", event);
  const f1Score = scoreFor(fighter1, f2Health);
  const f2Score = scoreFor(fighter2, f1Health);

  useEffect(() => {
    if (!event) return;
    const amount = event.eventType === "finishing_blow" || event.eventType === "knockdown" ? 12 : 6;
    Animated.sequence([
      Animated.timing(shake, { toValue: amount, duration: 34, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -amount, duration: 34, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [event, shake]);

  return (
    <View style={styles.arenaScreen}>
      <TopHud fighter1={fighter1} fighter2={fighter2} f1Score={f1Score} f2Score={f2Score} status={paused ? "PAUSED" : autoMode ? "PRESS START" : "READY"} />
      <Animated.View style={[styles.sceneWrap, { transform: [{ translateX: shake }] }]}>
        <BoxingScene fighter1={fighter1} fighter2={fighter2} f1Pose={f1Pose} f2Pose={f2Pose} overlay={event ? <ComboOverlay text={event.overlayText} /> : null} />
      </Animated.View>
      <BottomHud
        fighter1={fighter1}
        fighter2={fighter2}
        f1Power={Math.max(f1Stamina, f1Special)}
        f2Power={Math.max(f2Stamina, f2Special)}
        f1Embarrassment={f1Embarrassment}
        f2Embarrassment={f2Embarrassment}
        round={round}
        time={time}
      />
      <View style={styles.bottomTools}>
        <CommentaryTicker text={event?.commentary ?? "The bell rings as the boxers bounce under the arena lights."} />
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

function poseFor(side: "fighter1" | "fighter2", event: BattleEvent | null): FighterPose {
  if (!event) return "idle";
  if (event.defender === side) {
    if (event.eventType === "knockdown" || event.eventType === "finishing_blow") return "knockdown";
    if (["stagger", "critical_hit", "emotional_damage", "weakness_exposed", "wardrobe_malfunction", "wrong_corner", "crowd_confused"].includes(event.eventType)) return "stagger";
    if (event.eventType === "block" || event.eventType === "ref_warning") return "block";
    return "hit";
  }
  if (event.attacker !== side) return "idle";
  if (["hook", "critical_hit", "heavy_hit", "illegal_but_awesome", "strength_showcase"].includes(event.eventType)) return "hook";
  if (["uppercut", "special_move", "finishing_blow", "nickname_powerup", "arch_nemesis_flashback"].includes(event.eventType)) return "uppercut";
  if (["counter", "comeback", "momentum_shift", "rope_pressure"].includes(event.eventType)) return "stepForward";
  if (["slip", "panic_retreat", "shoe_squeak"].includes(event.eventType)) return "stepBack";
  if (["taunt", "crowd_chant", "outfit_bonus", "announcer_meltdown", "camera_flash", "victory_dance"].includes(event.eventType)) return "winner";
  return "jab";
}

function scoreFor(fighter: Fighter, opponentHealth: number) {
  return Math.max(1000, Math.round((safeNumber(fighter.stats.overall) * 850) + ((100 - opponentHealth) * 730)));
}

function TopHud({ fighter1, fighter2, f1Score, f2Score, status }: { fighter1: Fighter; fighter2: Fighter; f1Score: number; f2Score: number; status: string }) {
  const highScore = Math.max(f1Score, f2Score, 1037500);
  return (
    <View style={styles.topHud}>
      <View style={styles.hudColumn}>
        <Text style={styles.hudLabel}>1UP</Text>
        <Text style={styles.hudName} numberOfLines={1}>{shortName(fighter1.name).toUpperCase()}</Text>
        <Text style={styles.hudScore}>{f1Score}</Text>
      </View>
      <View style={styles.hudCenter}>
        <Text style={styles.hudLabel}>HIGH SCORE</Text>
        <Text style={styles.hudScore}>{highScore}</Text>
      </View>
      <View style={[styles.hudColumn, { alignItems: "flex-end" }]}>
        <Text style={styles.hudLabel}>2UP</Text>
        <Text style={[styles.hudName, { textAlign: "right" }]} numberOfLines={1}>{shortName(fighter2.name).toUpperCase()}</Text>
        <Text style={styles.hudStatus}>{status}</Text>
      </View>
    </View>
  );
}

function BottomHud({
  fighter1,
  fighter2,
  f1Power,
  f2Power,
  f1Embarrassment,
  f2Embarrassment,
  round,
  time,
}: {
  fighter1: Fighter;
  fighter2: Fighter;
  f1Power: number;
  f2Power: number;
  f1Embarrassment: number;
  f2Embarrassment: number;
  round: number;
  time: string;
}) {
  return (
    <View style={styles.bottomHud}>
      <PowerPanel side="left" fighter={fighter1} power={f1Power} embarrassment={f1Embarrassment} />
      <RoundTimerBadge round={round} time={time} />
      <PowerPanel side="right" fighter={fighter2} power={f2Power} embarrassment={f2Embarrassment} />
    </View>
  );
}

function PowerPanel({ side, fighter, power, embarrassment }: { side: "left" | "right"; fighter: Fighter; power: number; embarrassment: number }) {
  const color = side === "left" ? RED : BLUE;
  return (
    <View style={[styles.powerPanel, side === "right" && { alignItems: "flex-end" }]}>
      <View style={[styles.powerTitleRow, side === "right" && { flexDirection: "row-reverse" }]}>
        <View style={[styles.boxerIcon, { backgroundColor: color }]}>
          <Ionicons name="body" size={18} color={BLACK} />
        </View>
        <Text style={styles.powerName} numberOfLines={1}>{shortName(fighter.name).toUpperCase()}</Text>
      </View>
      <View style={styles.powerMeterRow}>
        <Text style={styles.powerText}>POWER</Text>
        <MeterBar value={power} color={color} height={11} reverse={side === "right"} />
        <Text style={styles.powerPercent}>{Math.round(power)}%</Text>
        <Text style={styles.embarrassText}>SHAME {Math.round(embarrassment)}%</Text>
        <MeterBar value={embarrassment} color="#d744d8" height={7} reverse={side === "right"} />
      </View>
    </View>
  );
}

function BoxingScene({
  fighter1,
  fighter2,
  f1Pose,
  f2Pose,
  overlay,
}: {
  fighter1?: Fighter;
  fighter2?: Fighter;
  f1Pose: FighterPose;
  f2Pose: FighterPose;
  overlay?: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const sceneHeight = Math.max(260, Math.min(520, height * 0.58));
  const spriteSize = Math.max(74, Math.min(132, Math.min(width * 0.24, sceneHeight * 0.3)));
  const f2Down = f2Pose === "knockdown";

  return (
    <View style={[styles.scene, { minHeight: sceneHeight }]}>
      <PixelBackdrop />
      <Crowd />
      <Spotlights />
      <View style={styles.ropes}>
        <View style={[styles.rope, { backgroundColor: RED, top: 12 }]} />
        <View style={[styles.rope, { backgroundColor: WHITE, top: 35 }]} />
        <View style={[styles.rope, { backgroundColor: BLUE, top: 58 }]} />
      </View>
      <View style={styles.ringPostLeft} />
      <View style={styles.ringPostRight} />
      <View style={styles.canvas}>
        <View style={styles.canvasLogo}>
          <Text style={styles.canvasLogoText}>AFB</Text>
        </View>
      </View>
      <View style={styles.fighters}>
        <View style={styles.fighterSlot}>
          <FighterSprite color={RED} pose={f1Pose} size={spriteSize} trunksColor={BLUE} gloveColor={RED} skinTone={skinFor(fighter1, "left")} />
        </View>
        <View style={[styles.fighterSlot, f2Down && styles.knockedSlot]}>
          <FighterSprite color={BLUE} pose={f2Pose} mirrored size={f2Down ? spriteSize * 1.12 : spriteSize} trunksColor={WHITE} gloveColor={RED} skinTone={skinFor(fighter2, "right")} bootColor="#e8e4d8" />
        </View>
      </View>
      {overlay}
    </View>
  );
}

function skinFor(fighter: Fighter | undefined, side: "left" | "right") {
  const seed = (fighter?.name || side).length + safeNumber(fighter?.stats.power, 50);
  const tones = ["#c78963", "#a96e49", "#8a5a3a", "#d19b76"];
  return tones[seed % tones.length];
}

function PixelBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={["#050505", "#111113", "#050505"]} style={StyleSheet.absoluteFill} />
      <View style={styles.scanlines} pointerEvents="none" />
    </View>
  );
}

function Crowd() {
  const dots = useMemo(() => Array.from({ length: 84 }, (_, index) => index), []);
  return (
    <View style={styles.crowd}>
      {dots.map((dot) => (
        <View
          key={dot}
          style={[
            styles.crowdDot,
            {
              left: `${(dot * 13) % 98}%`,
              top: `${Math.floor(dot / 14) * 14 + 5}%`,
              backgroundColor: dot % 5 === 0 ? "#5d3821" : dot % 3 === 0 ? "#24334f" : "#2f241f",
            },
          ]}
        />
      ))}
    </View>
  );
}

function Spotlights() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.spotlight, { left: "8%" }]} />
      <View style={[styles.spotlight, { left: "43%" }]} />
      <View style={[styles.spotlight, { right: "8%" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: BLACK,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  fullScreenNoPad: { flex: 1, backgroundColor: BLACK, overflow: "hidden" },
  pixelPanel: {
    backgroundColor: "#060606",
    borderWidth: 2,
    borderColor: "#c78a1b",
  },
  buttonWrap: { flex: 1, minWidth: 0 },
  button: {
    minHeight: 44,
    borderWidth: 2,
    borderColor: "#f0c24c",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 7,
  },
  buttonCompact: { minHeight: 32, paddingHorizontal: 4 },
  buttonText: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 14, textAlign: "center" },
  buttonTextCompact: { fontSize: 9 },
  matchHeader: {
    color: GOLD,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    textAlign: "center",
    marginTop: 6,
    textShadowColor: RED,
    textShadowRadius: 4,
  },
  matchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  introCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 184,
    borderWidth: 3,
    backgroundColor: "#080808",
    alignItems: "center",
    padding: 7,
  },
  playerTag: {
    alignSelf: "flex-start",
    color: WHITE,
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  spritePortrait: { height: 106, justifyContent: "flex-end", alignItems: "center", overflow: "hidden" },
  introName: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 14, marginTop: 3, textAlign: "center" },
  introNick: { color: GOLD, fontFamily: "Inter_600SemiBold", fontSize: 9, textAlign: "center", marginTop: 2 },
  recordText: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 10, marginTop: 5 },
  vs: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 32, textShadowColor: GOLD, textShadowRadius: 5 },
  tape: { borderWidth: 2, borderColor: "#c78a1b", backgroundColor: "#050505", padding: 8, marginTop: 8 },
  tapeTitle: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "center", marginBottom: 4 },
  tapeRow: { minHeight: 18, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#1e1e1e" },
  tapeValue: { width: 54, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "center" },
  tapeLabel: { flex: 1, color: WHITE, fontFamily: "Inter_600SemiBold", fontSize: 10, textAlign: "center" },
  startPress: { alignItems: "center", paddingVertical: 8 },
  startText: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center", textShadowColor: RED, textShadowRadius: 5 },
  scene: { flex: 1, backgroundColor: BLACK, overflow: "hidden", justifyContent: "flex-end" },
  crowd: { position: "absolute", top: "12%", left: 0, right: 0, height: "34%", opacity: 0.9 },
  crowdDot: { position: "absolute", width: 7, height: 9, borderWidth: 1, borderColor: "#080808" },
  spotlight: {
    position: "absolute",
    top: 0,
    width: 86,
    height: 94,
    borderBottomLeftRadius: 43,
    borderBottomRightRadius: 43,
    backgroundColor: "rgba(245,242,210,0.16)",
  },
  ropes: { position: "absolute", left: 18, right: 18, bottom: "31%", height: 82, zIndex: 5 },
  rope: { position: "absolute", left: 0, right: 0, height: 4, borderWidth: 1, borderColor: "#130b08" },
  ringPostLeft: { position: "absolute", left: 18, bottom: "24%", width: 12, height: 92, backgroundColor: RED, borderWidth: 2, borderColor: "#220303", zIndex: 6 },
  ringPostRight: { position: "absolute", right: 18, bottom: "24%", width: 12, height: 92, backgroundColor: BLUE, borderWidth: 2, borderColor: "#030b22", zIndex: 6 },
  canvas: {
    position: "absolute",
    left: -20,
    right: -20,
    bottom: 0,
    height: "36%",
    backgroundColor: CANVAS,
    borderTopWidth: 5,
    borderTopColor: RING_DARK,
  },
  canvasLogo: {
    position: "absolute",
    alignSelf: "center",
    bottom: "22%",
    width: 112,
    height: 54,
    borderWidth: 3,
    borderColor: WHITE,
    backgroundColor: "#bc3024",
    alignItems: "center",
    justifyContent: "center",
  },
  canvasLogoText: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 31, textShadowColor: "#65140e", textShadowRadius: 2 },
  fighters: { position: "absolute", left: 28, right: 28, bottom: "15%", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", zIndex: 10 },
  fighterSlot: { width: "43%", alignItems: "center", justifyContent: "flex-end" },
  knockedSlot: { transform: [{ translateY: 24 }] },
  roundOverlay: { position: "absolute", top: "12%", left: 0, right: 0, alignItems: "center", zIndex: 20 },
  finalRound: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 28, textAlign: "center", textShadowColor: BLACK, textShadowRadius: 4 },
  bigFight: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 60, textAlign: "center", textShadowColor: RED, textShadowRadius: 7 },
  skipText: { position: "absolute", bottom: 24, left: 0, right: 0, color: "#cfc4aa", fontFamily: "Inter_700Bold", fontSize: 13, textAlign: "center" },
  combo: {
    position: "absolute",
    left: 24,
    top: "28%",
    color: GOLD,
    fontFamily: "Inter_700Bold",
    fontSize: 31,
    textShadowColor: RED,
    textShadowRadius: 5,
    zIndex: 24,
  },
  referee: { position: "absolute", right: "34%", bottom: "34%", alignItems: "center", zIndex: 20 },
  refHead: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#d29a73", borderWidth: 2, borderColor: OUTLINE },
  refBody: { width: 28, height: 46, backgroundColor: WHITE, borderWidth: 2, borderColor: OUTLINE },
  refText: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 9, marginTop: 2 },
  countNumber: { position: "absolute", right: "10%", top: "13%", color: GOLD, fontFamily: "Inter_700Bold", fontSize: 72, textShadowColor: RED, textShadowRadius: 6, zIndex: 22 },
  knockdownText: { position: "absolute", left: 0, right: 0, top: "18%", color: "#d744d8", fontFamily: "Inter_700Bold", fontSize: 32, textAlign: "center", textShadowColor: BLACK, textShadowRadius: 5, zIndex: 22 },
  arenaScreen: { flex: 1, backgroundColor: BLACK, overflow: "hidden" },
  topHud: {
    minHeight: 64,
    backgroundColor: BLACK,
    borderBottomWidth: 2,
    borderBottomColor: "#d8d0bf",
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: "center",
  },
  hudColumn: { flex: 1, minWidth: 0 },
  hudCenter: { flex: 0.8, minWidth: 0, alignItems: "center" },
  hudLabel: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 13 },
  hudName: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 12, marginTop: 1 },
  hudScore: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 1 },
  hudStatus: { color: RED, fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 1, textAlign: "right" },
  sceneWrap: { flex: 1, minHeight: 0 },
  bottomHud: {
    minHeight: 84,
    backgroundColor: BLACK,
    borderTopWidth: 2,
    borderTopColor: "#d8d0bf",
    borderBottomWidth: 2,
    borderBottomColor: "#2e2e2e",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 8,
  },
  powerPanel: { flex: 1, minWidth: 0, gap: 5 },
  powerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  boxerIcon: { width: 30, height: 26, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: WHITE },
  powerName: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 11, flex: 1 },
  powerMeterRow: { gap: 3 },
  powerText: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 11 },
  powerPercent: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 16 },
  embarrassText: { color: "#d744d8", fontFamily: "Inter_700Bold", fontSize: 9, marginTop: 1 },
  meterTrack: { width: "100%", backgroundColor: "#161616", borderWidth: 2, borderColor: WHITE, overflow: "hidden" },
  meterFill: { height: "100%" },
  timerBox: { width: 72, minHeight: 68, borderWidth: 2, borderColor: WHITE, backgroundColor: "#060606", alignItems: "center", justifyContent: "center", paddingVertical: 3 },
  timerLabel: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 9 },
  timerRound: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 20, lineHeight: 21 },
  timerMain: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 18, lineHeight: 20 },
  bottomTools: { backgroundColor: BLACK, padding: 7, gap: 6 },
  ticker: { minHeight: 42, borderWidth: 2, borderColor: "#8d681b", backgroundColor: "#050505", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8 },
  tickerText: { flex: 1, color: WHITE, fontFamily: "Inter_600SemiBold", fontSize: 12, lineHeight: 16 },
  controls: { flexDirection: "row", gap: 6 },
  winnerScreen: { flex: 1, backgroundColor: BLACK, overflow: "hidden" },
  winnerCopy: { position: "absolute", right: 10, top: "10%", width: "52%", alignItems: "center", zIndex: 20 },
  winnerTitle: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 44, textAlign: "center", textShadowColor: RED, textShadowRadius: 5 },
  winnerName: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "center" },
  winnerNick: { color: GOLD, fontFamily: "Inter_600SemiBold", fontSize: 12, textAlign: "center", marginTop: 3 },
  statsBar: { minHeight: 62, backgroundColor: BLACK, borderTopWidth: 2, borderTopColor: WHITE, flexDirection: "row" },
  statCell: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center", borderRightWidth: 1, borderRightColor: "#7a7a7a", paddingHorizontal: 2 },
  statCellLabel: { color: WHITE, fontFamily: "Inter_700Bold", fontSize: 8, textAlign: "center" },
  statCellValue: { color: GOLD, fontFamily: "Inter_700Bold", fontSize: 13, textAlign: "center", marginTop: 2 },
  winnerButtons: { flexDirection: "row", gap: 6, paddingHorizontal: 8, paddingTop: 7 },
  scanlines: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.035)", opacity: 0.45 },
});
