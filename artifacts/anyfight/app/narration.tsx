import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FighterPortrait } from "@/components/FighterPortrait";
import { useBattle } from "@/context/BattleContext";
import { useStorage } from "@/context/StorageContext";
import { useBattleSounds } from "@/hooks/useBattleSounds";
import { useColors } from "@/hooks/useColors";
import { useTTS } from "@/hooks/useTTS";
import type { Fighter } from "@/types";

const ARCADE = {
  black: "#030303",
  panel: "#080808",
  gold: "#f2b92f",
  red: "#e52e21",
  blue: "#1267dd",
  white: "#f7efe0",
  border: "#4b4435",
};

export default function NarrationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { fighter1, fighter2, narration } = useBattle();
  const { voiceEnabled } = useStorage();
  const { play } = useBattleSounds();
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  const { speak, stop, isPlaying, isLoading } = useTTS(domain);
  const [revealed, setRevealed] = useState(0);
  const [currentSpokenLineIndex, setCurrentSpokenLineIndex] = useState(-1);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const lines = useMemo(() => narration ? [
    narration.intro,
    narration.fighter1Intro,
    narration.fighter2Intro,
    narration.crowdAtmosphere,
  ].filter(Boolean) : [], [narration]);

  useEffect(() => {
    play("crowd");
    setTimeout(() => play("camera"), 320);
    setTimeout(() => play("announcer"), 680);
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setRevealed(current);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      play(current === 1 ? "bell" : current % 2 === 0 ? "camera" : "announcer");
      if (current >= lines.length) clearInterval(interval);
    }, 1800);
    return () => clearInterval(interval);
  }, [lines.length, play]);

  useEffect(() => {
    if (!voiceEnabled) return;
    const index = revealed - 1;
    if (index < 0 || index >= lines.length || index === currentSpokenLineIndex) return;
    setCurrentSpokenLineIndex(index);
    speak(lines[index], "nova", { quick: true });
  }, [currentSpokenLineIndex, lines, revealed, speak, voiceEnabled]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleBegin = () => {
    stop();
    play("roundStart");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start(() => router.replace("/battle"));
  };

  const handleToggleRead = () => {
    if (isPlaying) {
      stop();
    } else if (revealed > 0) {
      speak(lines[Math.min(revealed - 1, lines.length - 1)], "nova", { quick: true });
    }
  };

  if (!fighter1 || !fighter2) {
    router.replace("/");
    return null;
  }

  const compact = width < 390;

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: flashAnim }]} />
      <LinearGradient colors={["#050505", "#0b0b0d", "#050505"]} style={StyleSheet.absoluteFill} />
      <View style={styles.scanlines} pointerEvents="none" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12) }]}>
        <View>
          <Text style={styles.headerTitle}>TONIGHT'S MAIN EVENT</Text>
          <Text style={styles.headerSub}>ANYFIGHT BOXING</Text>
        </View>
        <Pressable onPress={handleToggleRead} style={styles.speakerBtn} hitSlop={12}>
          <Ionicons
            name={isLoading ? "hourglass-outline" : isPlaying ? "volume-high" : "volume-mute"}
            size={23}
            color={isPlaying ? ARCADE.gold : ARCADE.white}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.fightersRow}>
          <IntroFighterCard fighter={fighter1} side="left" compact={compact} />
          <Text style={styles.vsLabel}>VS</Text>
          <IntroFighterCard fighter={fighter2} side="right" compact={compact} />
        </View>

        <View style={styles.tape}>
          <TapeRow label="POWER" left={fighter1.stats.power} right={fighter2.stats.power} />
          <TapeRow label="SPEED" left={fighter1.stats.speed} right={fighter2.stats.speed} />
          <TapeRow label="DEFENSE" left={fighter1.stats.defense} right={fighter2.stats.defense} />
        </View>

        <View style={styles.announcerPanel}>
          <Text style={styles.announcerLabel}>RINGSIDE ANNOUNCER</Text>
          {lines.map((line, index) => (
            <NarrationLine key={`${index}-${line}`} text={line} visible={index < revealed} delay={index * 60} />
          ))}
        </View>
      </ScrollView>

      {revealed >= lines.length && (
        <Animated.View style={[styles.beginArea, { transform: [{ scale: pulseAnim }], paddingBottom: insets.bottom + 16 }]}>
          <Pressable onPress={handleBegin} style={({ pressed }) => [styles.beginBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <LinearGradient colors={[ARCADE.red, ARCADE.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.beginGradient}>
              <Text style={styles.beginText}>BEGIN FIGHT</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

function IntroFighterCard({ fighter, side, compact }: { fighter: Fighter; side: "left" | "right"; compact: boolean }) {
  const color = side === "left" ? ARCADE.red : ARCADE.blue;
  return (
    <View style={[styles.fighterCard, { borderColor: color }]}>
      <Text style={[styles.playerTag, { backgroundColor: color }]}>{side === "left" ? "1P" : "2P"}</Text>
      <FighterPortrait fighter={fighter} size={compact ? 74 : 94} nameColor={color} />
      <Text style={styles.fighterName} numberOfLines={1}>{fighter.name.toUpperCase()}</Text>
      <Text style={styles.fighterNick} numberOfLines={1}>"{fighter.nickname || "The Contender"}"</Text>
    </View>
  );
}

function TapeRow({ label, left, right }: { label: string; left: number; right: number }) {
  return (
    <View style={styles.tapeRow}>
      <Text style={[styles.tapeValue, { color: ARCADE.red }]}>{left}</Text>
      <Text style={styles.tapeLabel}>{label}</Text>
      <Text style={[styles.tapeValue, { color: ARCADE.blue }]}>{right}</Text>
    </View>
  );
}

function NarrationLine({ text, visible, delay }: { text: string; visible: boolean; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, delay, opacity, translateY]);

  return (
    <Animated.Text style={[styles.narrationLine, { opacity, transform: [{ translateY }] }]}>
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ARCADE.black },
  header: {
    minHeight: 92,
    backgroundColor: ARCADE.black,
    borderBottomWidth: 2,
    borderBottomColor: ARCADE.gold,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerTitle: { color: ARCADE.gold, fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 1, textAlign: "center" },
  headerSub: { color: ARCADE.white, fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 2, marginTop: 3 },
  speakerBtn: { padding: 7, borderWidth: 2, borderColor: ARCADE.border, backgroundColor: ARCADE.panel },
  content: { paddingHorizontal: 14, paddingTop: 12 },
  fightersRow: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  fighterCard: { flex: 1, minWidth: 0, backgroundColor: ARCADE.panel, borderWidth: 3, padding: 8, alignItems: "center" },
  playerTag: { alignSelf: "flex-start", color: ARCADE.white, fontFamily: "Inter_700Bold", fontSize: 11, paddingHorizontal: 5, paddingVertical: 2, marginBottom: 6 },
  fighterName: { color: ARCADE.white, fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 7, textAlign: "center" },
  fighterNick: { color: ARCADE.gold, fontSize: 9, fontFamily: "Inter_600SemiBold", marginTop: 3, textAlign: "center" },
  vsLabel: { alignSelf: "center", color: ARCADE.gold, fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  tape: { marginTop: 10, backgroundColor: ARCADE.panel, borderWidth: 2, borderColor: ARCADE.gold, padding: 8 },
  tapeRow: { flexDirection: "row", alignItems: "center", minHeight: 24, borderTopWidth: 1, borderTopColor: "#24211c" },
  tapeValue: { width: 56, textAlign: "center", fontSize: 13, fontFamily: "Inter_700Bold" },
  tapeLabel: { flex: 1, color: ARCADE.white, textAlign: "center", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  announcerPanel: { marginTop: 10, backgroundColor: ARCADE.panel, borderWidth: 2, borderColor: ARCADE.border, padding: 10, gap: 8 },
  announcerLabel: { color: ARCADE.gold, fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2, textAlign: "center" },
  narrationLine: {
    color: ARCADE.white,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2d2922",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  beginArea: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 18, backgroundColor: ARCADE.black },
  beginBtn: { borderRadius: 0, overflow: "hidden", borderWidth: 2, borderColor: ARCADE.gold },
  beginGradient: { paddingVertical: 16, alignItems: "center" },
  beginText: { color: ARCADE.white, fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  scanlines: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.035)", opacity: 0.35 },
});
