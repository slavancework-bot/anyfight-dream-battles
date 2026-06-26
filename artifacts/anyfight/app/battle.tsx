import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBattle } from "@/context/BattleContext";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";
import { useBattleSounds } from "@/hooks/useBattleSounds";
import { useTTS } from "@/hooks/useTTS";
import { BattlePortrait } from "@/components/FighterPortrait";

interface GameState {
  f1HP: number;
  f2HP: number;
  f1Stamina: number;
  f2Stamina: number;
  f1Blocking: boolean;
  f2Blocking: boolean;
  isGameOver: boolean;
  roundTime: number;
  currentRound: number;
  lastAction: string;
  fightStartTime: number;
}

type AttackType = "light" | "heavy" | "special" | "ultimate";

const STAMINA_COST: Record<AttackType, number> = { light: 10, heavy: 18, special: 25, ultimate: 40 };

function calcDamage(power: number, type: AttackType) {
  const base: Record<AttackType, number> = { light: 8, heavy: 16, special: 28, ultimate: 45 };
  return (base[type] * (0.7 + power / 100 * 0.6)) + (Math.random() * 4 - 2);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Stat-driven action selection.
 * - power  (0-100): biases toward heavy/special/ultimate over light
 * - defense (0-100): biases toward blocking
 * - speed is used for timing, not action choice
 */
function pickAction(
  hp: number,
  stamina: number,
  power: number,
  defense: number,
): AttackType | "block" {
  // Low HP: lean heavily on defense stat for block probability
  if (hp < 25) {
    return Math.random() < 0.25 + (defense / 100) * 0.35 ? "block" : "light";
  }
  // Out of stamina: always block to recover
  if (stamina < 20) return "block";

  const rand = Math.random();
  // Block chance: 10%–30% depending on defense (0–100)
  const pBlock   = 0.10 + (defense / 100) * 0.20;
  // Light chance: 30%–15% as power rises
  const pLight   = 0.30 - (power  / 100) * 0.15;
  // Heavy chance: 20%–28% as power rises
  const pHeavy   = 0.20 + (power  / 100) * 0.08;
  // Special chance: 20%–28% as power rises
  const pSpecial = 0.20 + (power  / 100) * 0.08;
  // Ultimate: whatever remains (~5%–18%)

  if (rand < pLight) return "light";
  if (rand < pLight + pHeavy) return "heavy";
  if (rand < pLight + pHeavy + pBlock) return "block";
  if (rand < pLight + pHeavy + pBlock + pSpecial) return "special";
  return "ultimate";
}

/**
 * Stat-driven action timing.
 * speed (0-100): higher speed → shorter interval.
 * At speed=100: 1500ms base. At speed=50: ~2250ms base. At speed=0: ~3000ms base.
 * +0–500ms random jitter to feel organic.
 */
function getActionDelay(speed: number, fastForward: boolean): number {
  if (fastForward) return 280 + Math.random() * 80;
  const base = 1500 + (1 - speed / 100) * 1500;
  return base + Math.random() * 500;
}

const roundPhrase = (round: number) => pick([
  `ROUND ${round}! LET'S FIGHT!`,
  `Round ${round} is underway!`,
  `ROUND ${round} — FIGHT!`,
]);

const specialPhrase = (name: string, move: string) => pick([
  `${name} LANDS the ${move}! What a shot!`,
  `DEVASTATING! ${move} from ${name}!`,
  `${name} with the ${move}! OH!`,
]);

const ultimatePhrase = (name: string, move: string) => pick([
  `ULTIMATE FINISHER! ${name} unleashes ${move}!`,
  `OH MY! ${move} from ${name}! INCREDIBLE!`,
  `${name}'s ${move}! THE CROWD GOES WILD!`,
]);

const koPhrase = (winner: string) => pick([
  `KNOCKOUT! ${winner} wins! THE CROWD GOES INSANE!`,
  `IT'S OVER! ${winner} takes the victory!`,
  `K-K-KNOCKOUT! ${winner} wins this fight!`,
]);

export default function BattleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fighter1, fighter2, setRecap } = useBattle();
  const { voiceEnabled } = useStorage();
  const { play: playSound } = useBattleSounds();

  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  const { speak, stop } = useTTS(domain);

  const speakRef = useRef(speak);
  const stopRef = useRef(stop);
  const voiceEnabledRef = useRef(voiceEnabled);
  const fastForwardRef = useRef(false);
  const [fastForward, setFastForward] = useState(false);

  useEffect(() => { speakRef.current = speak; }, [speak]);
  useEffect(() => { stopRef.current = stop; }, [stop]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  const announce = useCallback((text: string) => {
    if (!voiceEnabledRef.current) return;
    stopRef.current();
    speakRef.current(text, "onyx");
  }, []);

  const gameRef = useRef<GameState>({
    f1HP: 100, f2HP: 100,
    f1Stamina: 100, f2Stamina: 100,
    f1Blocking: false, f2Blocking: false,
    isGameOver: false, roundTime: 90, currentRound: 1,
    lastAction: "Fight begins!", fightStartTime: Date.now(),
  });

  const [display, setDisplay] = useState({
    f1HP: 100, f2HP: 100,
    f1Stamina: 100, f2Stamina: 100,
    roundTime: 90, currentRound: 1,
    lastAction: "Fight begins!", isGameOver: false,
    f1Blocking: false, f2Blocking: false,
  });

  const [announcementText, setAnnouncementText] = useState("");

  const f1HPAnim = useRef(new Animated.Value(100)).current;
  const f2HPAnim = useRef(new Animated.Value(100)).current;

  const f1Flash = useRef(new Animated.Value(0)).current;
  const f2Flash = useRef(new Animated.Value(0)).current;

  const hitShake = useRef(new Animated.Value(0)).current;

  const f1EntryX = useRef(new Animated.Value(-320)).current;
  const f2EntryX = useRef(new Animated.Value(320)).current;
  const f1EntryOpacity = useRef(new Animated.Value(0)).current;
  const f2EntryOpacity = useRef(new Animated.Value(0)).current;

  const f1Lunge = useRef(new Animated.Value(0)).current;
  const f2Lunge = useRef(new Animated.Value(0)).current;

  const announcementOpacity = useRef(new Animated.Value(0)).current;
  const announcementScale = useRef(new Animated.Value(1.5)).current;

  const actionLogScale = useRef(new Animated.Value(1)).current;
  const actionLogOpacity = useRef(new Animated.Value(1)).current;

  const showAnnouncement = useCallback((text: string) => {
    setAnnouncementText(text);
    announcementScale.setValue(1.6);
    announcementOpacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(announcementOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(announcementScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 7 }),
      ]),
      Animated.delay(900),
      Animated.timing(announcementOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [announcementOpacity, announcementScale]);

  const popActionLog = useCallback(() => {
    actionLogOpacity.setValue(0);
    actionLogScale.setValue(0.85);
    Animated.parallel([
      Animated.timing(actionLogOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.spring(actionLogScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start();
  }, [actionLogOpacity, actionLogScale]);

  const syncDisplay = useCallback(() => {
    const g = gameRef.current;
    setDisplay({
      f1HP: Math.max(0, Math.round(g.f1HP)),
      f2HP: Math.max(0, Math.round(g.f2HP)),
      f1Stamina: Math.max(0, Math.round(g.f1Stamina)),
      f2Stamina: Math.max(0, Math.round(g.f2Stamina)),
      roundTime: Math.max(0, g.roundTime),
      currentRound: g.currentRound,
      lastAction: g.lastAction,
      isGameOver: g.isGameOver,
      f1Blocking: g.f1Blocking,
      f2Blocking: g.f2Blocking,
    });
    Animated.timing(f1HPAnim, { toValue: g.f1HP, duration: 200, useNativeDriver: false }).start();
    Animated.timing(f2HPAnim, { toValue: g.f2HP, duration: 200, useNativeDriver: false }).start();
  }, [f1HPAnim, f2HPAnim]);

  const triggerHit = useCallback((isF1Hit: boolean, attackType: AttackType = "light") => {
    const flashAnim = isF1Hit ? f1Flash : f2Flash;

    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();

    const shakeAmt = attackType === "ultimate" ? 12 : attackType === "special" ? 9 : attackType === "heavy" ? 7 : 5;
    Animated.sequence([
      Animated.timing(hitShake, { toValue: shakeAmt, duration: 35, useNativeDriver: true }),
      Animated.timing(hitShake, { toValue: -shakeAmt, duration: 35, useNativeDriver: true }),
      Animated.timing(hitShake, { toValue: shakeAmt * 0.6, duration: 35, useNativeDriver: true }),
      Animated.timing(hitShake, { toValue: -shakeAmt * 0.3, duration: 35, useNativeDriver: true }),
      Animated.timing(hitShake, { toValue: 0, duration: 35, useNativeDriver: true }),
    ]).start();

    const lungeAnim = isF1Hit ? f2Lunge : f1Lunge;
    const lungeDir = isF1Hit ? -55 : 55;
    const lungeDuration = attackType === "ultimate" ? 80 : attackType === "heavy" ? 70 : 60;
    Animated.sequence([
      Animated.timing(lungeAnim, { toValue: lungeDir, duration: lungeDuration, useNativeDriver: true }),
      Animated.spring(lungeAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }),
    ]).start();
  }, [f1Flash, f2Flash, hitShake, f1Lunge, f2Lunge]);

  const endGame = useCallback(async (winner: "f1" | "f2") => {
    if (!fighter1 || !fighter2) return;
    gameRef.current.isGameOver = true;
    syncDisplay();
    showAnnouncement("K.O.!");
    playSound("ko");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const winnerFighter = winner === "f1" ? fighter1 : fighter2;
    const loserFighter = winner === "f1" ? fighter2 : fighter1;
    announce(koPhrase(winnerFighter.name));
    const elapsed = Math.round((Date.now() - gameRef.current.fightStartTime) / 1000);
    const rounds = gameRef.current.currentRound;
    try {
      const res = await fetch(`https://${domain}/api/battle/recap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner: winnerFighter, loser: loserFighter, fightDurationSeconds: elapsed, rounds }),
      });
      const recap = await res.json();
      setRecap(recap, winnerFighter, loserFighter, elapsed, rounds);
    } catch {
      setRecap({
        winner: winnerFighter.name,
        fightTime: `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`,
        fightRating: "★★★★☆ Great Fight", methodOfVictory: "Knockout",
        crowdReaction: "The crowd erupts!", memorableMoment: `${winnerFighter.name}'s decisive blow`,
        fullRecap: `${winnerFighter.name} defeats ${loserFighter.name} in an epic battle!`,
      }, winnerFighter, loserFighter, elapsed, rounds);
    }
    setTimeout(() => router.replace("/recap"), 1400);
  }, [fighter1, fighter2, domain, setRecap, syncDisplay, showAnnouncement, playSound, announce]);

  // Entry animations + round 1 announcement
  useEffect(() => {
    if (!fighter1 || !fighter2) return;
    f1EntryX.setValue(-320);
    f2EntryX.setValue(320);
    f1EntryOpacity.setValue(0);
    f2EntryOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(f1EntryX, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(f2EntryX, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(f1EntryOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(f2EntryOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      playSound("roundStart");
      showAnnouncement("ROUND 1\nFIGHT!");
      announce(roundPhrase(1));
    });
  }, []);

  // Announcer intro on mount
  useEffect(() => {
    if (!fighter1 || !fighter2 || !voiceEnabled) return;
    const text = `Ladies and gentlemen... LEEEEET'S GET READY TO RUMBLEEEEEEE! ${fighter1.name}... versus... ${fighter2.name}!`;
    speak(text, "onyx");
    return () => { stop(); };
  }, []);

  // Game timer and stamina regen
  const currentRoundRef = useRef(1);
  useEffect(() => {
    if (!fighter1 || !fighter2) return;
    const interval = setInterval(() => {
      const g = gameRef.current;
      if (g.isGameOver) return;
      g.roundTime = Math.max(0, g.roundTime - 1);
      g.f1Stamina = Math.min(100, g.f1Stamina + 3);
      g.f2Stamina = Math.min(100, g.f2Stamina + 3);
      if (g.roundTime <= 0) {
        if (g.currentRound < 3) {
          g.currentRound++;
          g.roundTime = 90;
          if (g.currentRound !== currentRoundRef.current) {
            currentRoundRef.current = g.currentRound;
            playSound("roundStart");
            showAnnouncement(`ROUND ${g.currentRound}\nFIGHT!`);
            announce(roundPhrase(g.currentRound));
          }
        } else {
          endGame(g.f1HP >= g.f2HP ? "f1" : "f2");
          return;
        }
      }
      syncDisplay();
    }, 1000);
    return () => clearInterval(interval);
  }, [fighter1, fighter2, syncDisplay, endGame, showAnnouncement, playSound, announce]);

  // Fighter 1 auto-AI
  useEffect(() => {
    if (!fighter1 || !fighter2) return;
    let aiTimer: ReturnType<typeof setTimeout>;

    const aiTurn = () => {
      const g = gameRef.current;
      if (g.isGameOver) return;

      const action = pickAction(g.f1HP, g.f1Stamina, fighter1.stats.power, fighter1.stats.defense);

      if (action === "block") {
        g.f1Blocking = true;
        g.lastAction = `${fighter1.name} braces for impact...`;
        popActionLog();
        setTimeout(() => { gameRef.current.f1Blocking = false; }, 1500);
      } else {
        const cost = STAMINA_COST[action];
        if (g.f1Stamina < cost) { scheduleAI(); return; }
        let dmg = calcDamage(fighter1.stats.power, action);
        const blocked = g.f2Blocking;
        if (blocked) dmg *= (1 - (fighter2.stats.defense / 100) * 0.65);
        g.f2HP = Math.max(0, g.f2HP - dmg);
        g.f1Stamina = Math.max(0, g.f1Stamina - cost);
        const moveNames: Record<AttackType, string> = {
          light: fighter1.signatureMove?.split(" ").slice(0, 2).join(" ") ?? "Quick Strike",
          heavy: "Power Blow",
          special: fighter1.signatureMove ?? "Signature Move",
          ultimate: fighter1.ultimateFinisher ?? "Ultimate Finisher",
        };
        g.lastAction = blocked
          ? `${fighter2.name} blocks! (${Math.round(dmg)} dmg)`
          : `${fighter1.name}: ${moveNames[action]}! (${Math.round(dmg)} dmg)`;
        if (blocked) {
          playSound("block");
        } else {
          playSound(action);
          if (action === "ultimate") {
            announce(ultimatePhrase(fighter1.name, fighter1.ultimateFinisher ?? "Ultimate Finisher"));
          } else if (action === "special") {
            announce(specialPhrase(fighter1.name, fighter1.signatureMove ?? "Signature Move"));
          }
        }
        triggerHit(false, action);
        popActionLog();
        if (g.f2HP <= 0) { endGame("f1"); return; }
      }
      syncDisplay();
      scheduleAI();
    };

    const scheduleAI = () => {
      aiTimer = setTimeout(aiTurn, getActionDelay(fighter1.stats.speed, fastForwardRef.current));
    };
    scheduleAI();
    return () => clearTimeout(aiTimer);
  }, [fighter1, fighter2, syncDisplay, endGame, triggerHit, popActionLog, playSound, announce]);

  // Fighter 2 auto-AI
  useEffect(() => {
    if (!fighter1 || !fighter2) return;
    let aiTimer: ReturnType<typeof setTimeout>;

    const aiTurn = () => {
      const g = gameRef.current;
      if (g.isGameOver) return;

      const action = pickAction(g.f2HP, g.f2Stamina, fighter2.stats.power, fighter2.stats.defense);

      if (action === "block") {
        g.f2Blocking = true;
        g.lastAction = `${fighter2.name} braces for impact...`;
        popActionLog();
        setTimeout(() => { gameRef.current.f2Blocking = false; }, 1500);
      } else {
        const cost = STAMINA_COST[action];
        if (g.f2Stamina < cost) { scheduleAI(); return; }
        let dmg = calcDamage(fighter2.stats.power, action);
        const blocked = g.f1Blocking;
        if (blocked) dmg *= (1 - (fighter1.stats.defense / 100) * 0.65);
        g.f1HP = Math.max(0, g.f1HP - dmg);
        g.f2Stamina = Math.max(0, g.f2Stamina - cost);
        const moveNames: Record<AttackType, string> = {
          light: "Quick Jab",
          heavy: fighter2.signatureMove?.split(" ").slice(0, 2).join(" ") ?? "Heavy Strike",
          special: fighter2.signatureMove ?? "Special Move",
          ultimate: fighter2.ultimateFinisher ?? "Ultimate",
        };
        g.lastAction = blocked
          ? `${fighter1.name} blocks! (${Math.round(dmg)} dmg)`
          : `${fighter2.name}: ${moveNames[action]}! (${Math.round(dmg)} dmg)`;
        if (blocked) {
          playSound("block");
        } else {
          playSound(action);
          if (action === "ultimate") {
            announce(ultimatePhrase(fighter2.name, fighter2.ultimateFinisher ?? "Ultimate"));
          } else if (action === "special") {
            announce(specialPhrase(fighter2.name, fighter2.signatureMove ?? "Special Move"));
          }
        }
        triggerHit(true, action);
        popActionLog();
        if (g.f1HP <= 0) { endGame("f2"); return; }
      }
      syncDisplay();
      scheduleAI();
    };

    const scheduleAI = () => {
      aiTimer = setTimeout(aiTurn, getActionDelay(fighter2.stats.speed, fastForwardRef.current));
    };
    scheduleAI();
    return () => clearTimeout(aiTimer);
  }, [fighter1, fighter2, syncDisplay, endGame, triggerHit, popActionLog, playSound, announce]);

  if (!fighter1 || !fighter2) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No battle data</Text>
      </View>
    );
  }

  const f1HPWidth = f1HPAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" });
  const f2HPWidth = f2HPAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"], extrapolate: "clamp" });
  const f1HPColor = display.f1HP > 50 ? colors.healthBar : display.f1HP > 25 ? colors.neonYellow : colors.accent;
  const f2HPColor = display.f2HP > 50 ? colors.healthBar : display.f2HP > 25 ? colors.neonYellow : colors.accent;

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      {/* Health Bars */}
      <View style={[styles.hpArea, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 8), backgroundColor: "rgba(0,0,0,0.9)", borderBottomColor: colors.border }]}>
        <View style={styles.roundInfo}>
          <Text style={[styles.roundText, { color: colors.text }]}>ROUND {display.currentRound}</Text>
          <Text style={[styles.timerText, { color: display.roundTime <= 10 ? colors.accent : colors.neonYellow }]}>
            {display.roundTime}
          </Text>
          <Pressable
            onPress={() => {
              const newVal = !fastForwardRef.current;
              fastForwardRef.current = newVal;
              setFastForward(newVal);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[styles.ffBtn, {
              borderColor: fastForward ? colors.neonYellow : colors.border,
              backgroundColor: fastForward ? colors.neonYellow + "22" : "transparent",
            }]}
            hitSlop={8}
          >
            <Text style={[styles.ffText, { color: fastForward ? colors.neonYellow : colors.mutedForeground }]}>⏩</Text>
          </Pressable>
        </View>

        <View style={styles.bothBars}>
          <View style={styles.hpSection}>
            <View style={styles.hpLabelRow}>
              <Text style={[styles.hpName, { color: colors.neonBlue }]} numberOfLines={1}>{fighter1.name.split(" ")[0]}</Text>
              <Text style={[styles.hpNum, { color: f1HPColor }]}>{display.f1HP}</Text>
            </View>
            <View style={[styles.hpTrack, { backgroundColor: colors.muted }]}>
              <Animated.View style={[styles.hpFill, { width: f1HPWidth, backgroundColor: f1HPColor }]} />
            </View>
            <View style={[styles.staminaTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.staminaFill, { width: `${display.f1Stamina}%`, backgroundColor: colors.staminaBar }]} />
            </View>
          </View>

          <Text style={[styles.vsSmall, { color: colors.accent }]}>VS</Text>

          <View style={styles.hpSection}>
            <View style={[styles.hpLabelRow, { flexDirection: "row-reverse" }]}>
              <Text style={[styles.hpName, { color: colors.neonPurple }]} numberOfLines={1}>{fighter2.name.split(" ")[0]}</Text>
              <Text style={[styles.hpNum, { color: f2HPColor }]}>{display.f2HP}</Text>
            </View>
            <View style={[styles.hpTrack, { backgroundColor: colors.muted }]}>
              <Animated.View style={[styles.hpFill, { width: f2HPWidth, backgroundColor: f2HPColor, alignSelf: "flex-end" }]} />
            </View>
            <View style={[styles.staminaTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.staminaFill, { width: `${display.f2Stamina}%`, backgroundColor: colors.staminaBar, alignSelf: "flex-end" }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Arena — fills all remaining space */}
      <Animated.View style={[styles.arena, { transform: [{ translateX: hitShake }] }]}>
        <View style={styles.fighterSlot}>
          <BattlePortrait
            fighter={fighter1}
            size={180}
            accentColor={colors.neonBlue}
            isBlocking={display.f1Blocking}
            blockColor={colors.neonGreen}
            flashAnim={f1Flash}
            entryOpacity={f1EntryOpacity}
            entryX={f1EntryX}
            lunge={f1Lunge}
          />
        </View>

        <View style={styles.fighterSlot}>
          <BattlePortrait
            fighter={fighter2}
            size={180}
            accentColor={colors.neonPurple}
            isBlocking={display.f2Blocking}
            blockColor={colors.neonGreen}
            flashAnim={f2Flash}
            entryOpacity={f2EntryOpacity}
            entryX={f2EntryX}
            lunge={f2Lunge}
          />
        </View>

        {/* Action log */}
        <Animated.View style={[styles.actionLog, {
          backgroundColor: "rgba(0,0,0,0.82)",
          borderColor: colors.border,
          opacity: actionLogOpacity,
          transform: [{ scale: actionLogScale }],
        }]}>
          <Text style={[styles.actionText, { color: colors.neonYellow }]}>{display.lastAction}</Text>
        </Animated.View>

        {/* Round / KO announcement overlay */}
        <Animated.View
          style={[styles.announcementOverlay, {
            opacity: announcementOpacity,
            transform: [{ scale: announcementScale }],
            pointerEvents: "none",
          }]}
        >
          <Text style={styles.announcementText}>{announcementText}</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hpArea: { paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1 },
  roundInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  roundText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  timerText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  ffBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  ffText: { fontSize: 14 },
  bothBars: { flexDirection: "row", alignItems: "center", gap: 8 },
  hpSection: { flex: 1 },
  hpLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  hpName: { fontSize: 11, fontFamily: "Inter_700Bold" },
  hpNum: { fontSize: 11, fontFamily: "Inter_700Bold" },
  hpTrack: { height: 10, borderRadius: 5, overflow: "hidden", marginBottom: 3 },
  hpFill: { height: "100%", borderRadius: 5 },
  staminaTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  staminaFill: { height: "100%", borderRadius: 2 },
  vsSmall: { fontSize: 12, fontFamily: "Inter_700Bold" },
  arena: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: "#050510",
    overflow: "hidden",
  },
  fighterSlot: { alignItems: "center", justifyContent: "flex-end" },
  actionLog: {
    position: "absolute",
    bottom: 24,
    left: "50%",
    transform: [{ translateX: -130 }],
    width: 260,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  actionText: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  announcementOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  announcementText: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 4,
  },
});
