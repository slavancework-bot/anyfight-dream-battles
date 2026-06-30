import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FightArenaScreen,
  FightCardScreen,
  KOOverlay,
  RoundIntroScreen,
  formatFightTime,
  makeBattleEvents,
  safeNumber,
} from "@/components/ArcadeFight";
import { useBattle } from "@/context/BattleContext";
import { useStorage } from "@/context/StorageContext";
import { useBattleSounds } from "@/hooks/useBattleSounds";
import { useColors } from "@/hooks/useColors";
import { useTTS } from "@/hooks/useTTS";
import type { BattleEvent, FightStats } from "@/types";

type FightPhase = "card" | "roundIntro" | "arena" | "ko";

interface FightMeters {
  f1Health: number;
  f2Health: number;
  f1Stamina: number;
  f2Stamina: number;
  f1Special: number;
  f2Special: number;
}

const INITIAL_METERS: FightMeters = {
  f1Health: 100,
  f2Health: 100,
  f1Stamina: 100,
  f2Stamina: 100,
  f1Special: 18,
  f2Special: 18,
};

function winnerSideFromMeters(meters: FightMeters, fallback: "fighter1" | "fighter2") {
  if (meters.f1Health === meters.f2Health) return fallback;
  return meters.f1Health > meters.f2Health ? "fighter1" : "fighter2";
}

function statFavorite(f1Power: number, f2Power: number): "fighter1" | "fighter2" {
  return f1Power >= f2Power ? "fighter1" : "fighter2";
}

function applyEvent(meters: FightMeters, event: BattleEvent): FightMeters {
  const next = { ...meters };
  if (event.defender === "fighter1") {
    next.f1Health = Math.max(0, next.f1Health - event.damage);
    next.f1Stamina = Math.max(0, next.f1Stamina - event.staminaDamage);
    next.f2Special = Math.min(100, next.f2Special + Math.max(10, event.damage));
    next.f2Stamina = Math.max(12, next.f2Stamina - Math.round(event.staminaDamage * 0.3));
  } else {
    next.f2Health = Math.max(0, next.f2Health - event.damage);
    next.f2Stamina = Math.max(0, next.f2Stamina - event.staminaDamage);
    next.f1Special = Math.min(100, next.f1Special + Math.max(10, event.damage));
    next.f1Stamina = Math.max(12, next.f1Stamina - Math.round(event.staminaDamage * 0.3));
  }

  if (event.eventType === "finishing_blow") {
    if (event.defender === "fighter1") next.f1Health = 0;
    else next.f2Health = 0;
  }

  return next;
}

function buildFightStats(events: BattleEvent[], winnerSide: "fighter1" | "fighter2", finalMeters: FightMeters): FightStats {
  const winnerDamage = events
    .filter((event) => event.attacker === winnerSide)
    .reduce((total, event) => total + event.damage, 0);
  return {
    knockdowns: events.filter((event) => event.eventType === "knockdown" || event.eventType === "finishing_blow").length,
    maxCombo: Math.max(1, ...events.map((event) => event.comboCount ?? 1)),
    damageDealtPercent: Math.max(0, Math.min(100, Math.round(winnerDamage))),
    specialMoves: events.filter((event) => event.attacker === winnerSide && (event.eventType === "special_move" || event.eventType === "finishing_blow")).length,
    punchesLanded: events.filter((event) => event.attacker === winnerSide && event.eventType !== "block" && event.eventType !== "ref_count").length,
    finalHealth: {
      fighter1: Math.max(0, Math.round(finalMeters.f1Health)),
      fighter2: Math.max(0, Math.round(finalMeters.f2Health)),
    },
  };
}

export default function BattleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fighter1, fighter2, setRecap } = useBattle();
  const { voiceEnabled } = useStorage();
  const { play: playSound } = useBattleSounds();
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  const { speak, stop } = useTTS(domain);

  const [phase, setPhase] = useState<FightPhase>("card");
  const [meters, setMeters] = useState<FightMeters>(INITIAL_METERS);
  const [eventIndex, setEventIndex] = useState(-1);
  const [currentEvent, setCurrentEvent] = useState<BattleEvent | null>(null);
  const [paused, setPaused] = useState(false);
  const [fastForward, setFastForward] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [winnerSide, setWinnerSide] = useState<"fighter1" | "fighter2" | null>(null);
  const endedRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const eventLogRef = useRef<BattleEvent[]>([]);

  const events = useMemo(() => {
    if (!fighter1 || !fighter2) return [];
    return makeBattleEvents(fighter1, fighter2);
  }, [fighter1, fighter2]);

  const predictedWinner = useMemo(() => {
    if (!fighter1 || !fighter2) return "fighter1";
    return statFavorite(
      safeNumber(fighter1.stats.power) + safeNumber(fighter1.stats.skill),
      safeNumber(fighter2.stats.power) + safeNumber(fighter2.stats.skill)
    );
  }, [fighter1, fighter2]);

  const announce = useCallback((text: string) => {
    if (!voiceEnabled) return;
    stop();
    speak(text, "onyx");
  }, [speak, stop, voiceEnabled]);

  const finishFight = useCallback(async (side: "fighter1" | "fighter2", finalMeters: FightMeters) => {
    if (!fighter1 || !fighter2 || endedRef.current) return;
    endedRef.current = true;
    const winner = side === "fighter1" ? fighter1 : fighter2;
    const loser = side === "fighter1" ? fighter2 : fighter1;
    const duration = Math.max(12, Math.round((Date.now() - startTimeRef.current) / 1000));
    const fightStats = buildFightStats(eventLogRef.current, side, finalMeters);

    setMeters(finalMeters);
    setWinnerSide(side);
    setPhase("ko");
    playSound("ko");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    announce(`K.O.! ${winner.name} wins!`);

    try {
      const res = await fetch(`https://${domain}/api/battle/recap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner, loser, fightDurationSeconds: duration, rounds: 1 }),
      });
      if (!res.ok) throw new Error("recap failed");
      const recap = await res.json();
      setRecap(recap, winner, loser, duration, 1, fightStats);
    } catch {
      setRecap({
        winner: winner.name,
        fightTime: formatFightTime(duration),
        fightRating: "**** Great Fight",
        methodOfVictory: "Arcade Knockout",
        crowdReaction: "The crowd erupts as the final bell disappears under the roar.",
        memorableMoment: `${winner.name} closed the show with ${winner.signatureMove || "a decisive strike"}.`,
        fullRecap: `${winner.name} defeats ${loser.name} after a wild arcade brawl packed with counters, knockdowns, and a finishing blow.`,
      }, winner, loser, duration, 1, fightStats);
    }

    setTimeout(() => router.replace("/recap"), 1800);
  }, [announce, domain, fighter1, fighter2, playSound, setRecap]);

  const playEvent = useCallback((index: number) => {
    const event = events[index];
    if (!event) {
      const finalSide = winnerSideFromMeters(meters, predictedWinner);
      const finalMeters = finalSide === "fighter1"
        ? { ...meters, f2Health: 0 }
        : { ...meters, f1Health: 0 };
      finishFight(finalSide, finalMeters);
      return;
    }

    setEventIndex(index);
    setCurrentEvent(event);
    eventLogRef.current = [...eventLogRef.current.filter((logged) => logged.time !== event.time || logged.eventType !== event.eventType), event];
    setMeters((previous) => {
      const next = applyEvent(previous, event);
      if (event.eventType === "finishing_blow" || next.f1Health <= 0 || next.f2Health <= 0) {
        const side = event.attacker;
        setTimeout(() => finishFight(side, next), fastForward ? 420 : 900);
      }
      return next;
    });

    if (event.eventType === "knockdown" || event.eventType === "finishing_blow") {
      playSound("ultimate");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (event.eventType === "special_move" || event.eventType === "critical_hit") {
      playSound("special");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      playSound("light");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    announce(event.commentary);
  }, [announce, events, fastForward, finishFight, meters, playSound, predictedWinner]);

  const beginFight = useCallback(() => {
    startTimeRef.current = Date.now();
    endedRef.current = false;
    setMeters(INITIAL_METERS);
    setEventIndex(-1);
    setCurrentEvent(null);
    setWinnerSide(null);
    eventLogRef.current = [];
    setPhase("roundIntro");
    playSound("roundStart");
    announce("Round one. Fight!");
  }, [announce, playSound]);

  const enterArena = useCallback(() => {
    setPhase("arena");
    setTimeout(() => playEvent(0), 260);
  }, [playEvent]);

  const skipToFinish = useCallback(() => {
    if (!fighter1 || !fighter2 || endedRef.current) return;
    const side = predictedWinner;
    eventLogRef.current = events;
    finishFight(side, side === "fighter1" ? { ...meters, f2Health: 0 } : { ...meters, f1Health: 0 });
  }, [events, fighter1, fighter2, finishFight, meters, predictedWinner]);

  useEffect(() => {
    if (phase !== "roundIntro") return;
    const timeout = setTimeout(enterArena, 1700);
    return () => clearTimeout(timeout);
  }, [enterArena, phase]);

  useEffect(() => {
    if (phase !== "arena" || paused || !autoMode || endedRef.current || eventIndex < 0) return;
    const delay = fastForward ? 620 : 1650;
    const timeout = setTimeout(() => playEvent(eventIndex + 1), delay);
    return () => clearTimeout(timeout);
  }, [autoMode, eventIndex, fastForward, paused, phase, playEvent]);

  useEffect(() => {
    if (phase !== "arena" || paused) return;
    const timer = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [paused, phase]);

  useEffect(() => () => stop(), [stop]);

  if (!fighter1 || !fighter2) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        <Text style={{ color: colors.text }}>No battle data</Text>
      </View>
    );
  }

  if (phase === "card") {
    return <FightCardScreen fighter1={fighter1} fighter2={fighter2} onStart={beginFight} />;
  }

  if (phase === "roundIntro") {
    return <RoundIntroScreen round={1} onSkip={enterArena} fighter1={fighter1} fighter2={fighter2} />;
  }

  if (phase === "ko" && winnerSide) {
    const winner = winnerSide === "fighter1" ? fighter1 : fighter2;
    const loser = winnerSide === "fighter1" ? fighter2 : fighter1;
    return <KOOverlay winner={winner} loser={loser} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom }]}>
      <FightArenaScreen
        fighter1={fighter1}
        fighter2={fighter2}
        event={currentEvent}
        f1Health={meters.f1Health}
        f2Health={meters.f2Health}
        f1Stamina={meters.f1Stamina}
        f2Stamina={meters.f2Stamina}
        f1Special={meters.f1Special}
        f2Special={meters.f2Special}
        round={currentEvent?.round ?? 1}
        time={currentEvent?.time ?? formatFightTime(elapsed)}
        paused={paused}
        fastForward={fastForward}
        autoMode={autoMode}
        onPause={() => setPaused((value) => !value)}
        onSpeed={() => setFastForward((value) => !value)}
        onSkip={skipToFinish}
        onAuto={() => setAutoMode((value) => !value)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
