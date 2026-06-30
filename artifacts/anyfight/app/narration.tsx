import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBattle } from "@/context/BattleContext";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";
import { useTTS } from "@/hooks/useTTS";
import { Ionicons } from "@expo/vector-icons";
import { FighterPortrait } from "@/components/FighterPortrait";

const ARCADE = {
  black: "#030303",
  panel: "#080808",
  gold: "#f2b92f",
  red: "#e52e21",
  white: "#f7efe0",
  border: "#4b4435",
};

export default function NarrationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fighter1, fighter2, narration } = useBattle();
  const { voiceEnabled } = useStorage();
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  const { speak, stop, isPlaying, isLoading } = useTTS(domain);
  const [revealed, setRevealed] = useState(0);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const lines = narration
    ? [
        narration.intro,
        narration.fighter1Intro,
        narration.fighter2Intro,
        narration.crowdAtmosphere,
      ]
    : [];

  const fullNarrationText = lines.join(" ... ");

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setRevealed(current);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (current >= lines.length) clearInterval(interval);
    }, 2200);
    return () => clearInterval(interval);
  }, [lines.length]);

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

  // Auto-read narration when voice is enabled and all lines are revealed
  useEffect(() => {
    if (voiceEnabled && revealed >= lines.length && lines.length > 0) {
      speak(fullNarrationText, "nova");
    }
  }, [voiceEnabled, revealed, lines.length]);

  const handleBegin = () => {
    stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start(() => router.replace("/battle"));
  };

  const handleToggleRead = () => {
    if (isPlaying) {
      stop();
    } else {
      speak(fullNarrationText, "nova");
    }
  };

  if (!fighter1 || !fighter2) {
    router.replace("/");
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: flashAnim }]} />

      <LinearGradient colors={["#050505", "#0b0b0d", "#050505"]} style={StyleSheet.absoluteFill} />
      <View style={styles.scanlines} pointerEvents="none" />

      <View style={[styles.glowLine, { top: insets.top + (Platform.OS === "web" ? 67 : 16) }]} />

      {/* Speaker icon — top-right corner */}
      <Pressable
        onPress={handleToggleRead}
        style={[styles.speakerBtn, { top: insets.top + (Platform.OS === "web" ? 74 : 14) }]}
        hitSlop={12}
      >
        <Ionicons
          name={isLoading ? "hourglass-outline" : isPlaying ? "volume-high" : "volume-mute"}
          size={24}
          color={isPlaying ? colors.neonPurple : colors.mutedForeground}
        />
      </Pressable>

      <View style={[styles.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40), paddingBottom: insets.bottom + 100 }]}>
        {/* Fighters */}
        <View style={styles.fightersRow}>
          <View style={styles.fighterPortraitCol}>
            <FighterPortrait fighter={fighter1} size={80} nameColor={colors.neonBlue} />
            <Text style={[styles.fighterName, { color: colors.neonBlue }]} numberOfLines={1}>{fighter1.name.toUpperCase()}</Text>
          </View>
          <Text style={styles.vsLabel}>VS</Text>
          <View style={styles.fighterPortraitCol}>
            <FighterPortrait fighter={fighter2} size={80} nameColor={colors.neonPurple} />
            <Text style={[styles.fighterName, { color: colors.neonPurple }]} numberOfLines={1}>{fighter2.name.toUpperCase()}</Text>
          </View>
        </View>

        {/* Narration Lines */}
        <View style={styles.narrationArea}>
          {lines.map((line, i) => (
            <NarrationLine key={i} text={line} visible={i < revealed} delay={i * 100} colors={colors} />
          ))}
        </View>
      </View>

      {/* Begin Button */}
      {revealed >= lines.length && (
        <Animated.View style={[styles.beginArea, { transform: [{ scale: pulseAnim }], paddingBottom: insets.bottom + 20 }]}>
          <Pressable onPress={handleBegin} style={({ pressed }) => [styles.beginBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <LinearGradient
              colors={[colors.accent, "#cc0000"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.beginGradient}
            >
              <Text style={styles.beginText}>PRESS START</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

function NarrationLine({ text, visible, delay, colors }: { text: string; visible: boolean; delay: number; colors: ReturnType<typeof useColors> }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, delay, opacity, translateY]);

  return (
    <Animated.Text style={[styles.narrationLine, { color: colors.text, opacity, transform: [{ translateY }] }]}>
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  glowLine: { position: "absolute", left: 0, right: 0, height: 2, opacity: 0.9, backgroundColor: ARCADE.gold },
  fightersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  fighterPortraitCol: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  fighterName: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    textAlign: "center",
  },
  vsLabel: {
    color: ARCADE.gold,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    marginHorizontal: 8,
  },
  narrationArea: { gap: 16 },
  narrationLine: {
    backgroundColor: ARCADE.panel,
    borderWidth: 2,
    borderColor: ARCADE.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  speakerBtn: {
    position: "absolute",
    right: 18,
    zIndex: 10,
    padding: 6,
  },
  beginArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  beginBtn: { borderRadius: 0, overflow: "hidden", borderWidth: 2, borderColor: ARCADE.gold },
  beginGradient: { paddingVertical: 18, alignItems: "center" },
  beginText: { fontSize: 18, fontFamily: "Inter_700Bold", color: ARCADE.white, letterSpacing: 3 },
  scanlines: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.035)", opacity: 0.35 },
});
