import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBattle } from "@/context/BattleContext";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";
import { FighterPortrait } from "@/components/FighterPortrait";

export default function RecapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { recap, battleWinner, battleLoser, fighter1, fighter2, analysis, fightDurationSeconds, rounds, resetBattle } = useBattle();
  const { addBattleRecord, saveFighter, saveMatchup } = useStorage();
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    if (recap && battleWinner && battleLoser) {
      addBattleRecord({
        winner: battleWinner.name,
        loser: battleLoser.name,
        fightRating: recap.fightRating,
        methodOfVictory: recap.methodOfVictory,
        fightTime: recap.fightTime,
        rounds,
      });
    }
  }, []);

  useEffect(() => {
    if (!recap || !battleWinner || !battleLoser) {
      router.replace("/");
    }
  }, [recap, battleWinner, battleLoser]);

  if (!recap || !battleWinner || !battleLoser) {
    return null;
  }

  const handleSaveWinner = () => {
    if (battleWinner) {
      saveFighter(battleWinner);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSaveBattle = () => {
    if (fighter1 && fighter2 && analysis) {
      saveMatchup({ fighter1, fighter2, analysis });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRematch = () => {
    router.replace("/matchup");
  };

  const handleNewBattle = () => {
    resetBattle();
    router.replace("/");
  };

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <LinearGradient colors={["#000", "#0a0010", "#000508"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Winner announcement */}
        <Animated.View style={[styles.winnerArea, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          {/* Winner portrait — large, prominent */}
          <View style={styles.winnerPortraitWrapper}>
            <FighterPortrait
              fighter={battleWinner}
              size={160}
              nameColor={colors.neonBlue}
              style={styles.winnerPortrait}
            />
            <LinearGradient
              colors={[colors.neonBlue + "00", colors.neonBlue + "55"]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>

          <Text style={[styles.winnerLabel, { color: colors.neonYellow, marginTop: 12 }]}>WINNER!</Text>
          <LinearGradient
            colors={[colors.neonBlue, colors.neonPurple]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.winnerGradient}
          >
            <Text style={styles.winnerName}>{battleWinner.name.toUpperCase()}</Text>
          </LinearGradient>
          <Text style={[styles.winnerNickname, { color: colors.neonYellow }]}>"{battleWinner.nickname}"</Text>
          <Text style={[styles.fightRating, { color: colors.neonYellow }]}>{recap.fightRating}</Text>

          {/* Loser portrait — small, faded */}
          <View style={styles.loserRow}>
            <View style={[styles.loserPortraitWrapper, { borderColor: colors.border }]}>
              <FighterPortrait
                fighter={battleLoser}
                size={64}
                nameColor={colors.mutedForeground}
                style={{ opacity: 0.45 }}
              />
            </View>
            <View style={styles.loserInfo}>
              <Text style={[styles.defeatedLabel, { color: colors.mutedForeground }]}>DEFEATED</Text>
              <Text style={[styles.loserName, { color: colors.text }]}>{battleLoser.name}</Text>
              <Text style={[styles.loserNickname, { color: colors.mutedForeground }]}>"{battleLoser.nickname}"</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatItem icon="time" label="FIGHT TIME" value={recap.fightTime} colors={colors} />
          <StatItem icon="layers" label="ROUNDS" value={String(rounds)} colors={colors} />
          <StatItem icon="flash" label="METHOD" value={recap.methodOfVictory} colors={colors} />
          <StatItem icon="people" label="CROWD" value="SOLD OUT" colors={colors} />
        </View>

        {/* Recap narrative */}
        <View style={[styles.recapBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.recapTitle, { color: colors.text }]}>FIGHT RECAP</Text>
          <Text style={[styles.recapText, { color: colors.mutedForeground }]}>{recap.fullRecap}</Text>
        </View>

        {/* Crowd reaction */}
        <View style={[styles.recapBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.recapTitle, { color: colors.text }]}>CROWD REACTION</Text>
          <Text style={[styles.recapText, { color: colors.mutedForeground }]}>{recap.crowdReaction}</Text>
        </View>

        {/* Memorable moment */}
        <View style={[styles.momentBox, { backgroundColor: colors.neonPurple + "15", borderColor: colors.neonPurple }]}>
          <Ionicons name="star" size={16} color={colors.neonPurple} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.recapTitle, { color: colors.neonPurple }]}>MEMORABLE MOMENT</Text>
            <Text style={[styles.recapText, { color: colors.text }]}>{recap.memorableMoment}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable onPress={handleSaveWinner} style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="heart" size={18} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Save Winner</Text>
          </Pressable>
          <Pressable onPress={handleSaveBattle} style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="albums" size={18} color={colors.neonPurple} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Save Battle</Text>
          </Pressable>
          <Pressable onPress={handleRematch} style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
            <Ionicons name="refresh" size={18} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.text }]}>Rematch</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleNewBattle} style={({ pressed }) => [styles.newBattleBtn, { opacity: pressed ? 0.85 : 1 }]}>
          <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.newBattleGradient}>
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={styles.newBattleText}>NEW BATTLE</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function StatItem({ icon, label, value, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  winnerArea: { alignItems: "center", marginBottom: 24 },
  winnerPortraitWrapper: { borderRadius: 12, overflow: "hidden", shadowColor: "#00f0ff", shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  winnerPortrait: { borderRadius: 12 },
  winnerLabel: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 4, marginBottom: 8 },
  winnerGradient: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginBottom: 8 },
  winnerName: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 3 },
  winnerNickname: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 8 },
  fightRating: { fontSize: 18, marginBottom: 16 },
  loserRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  loserPortraitWrapper: { borderRadius: 8, overflow: "hidden", borderWidth: 1 },
  loserInfo: { gap: 2 },
  defeatedLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  loserName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  loserNickname: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  statItem: { flex: 1, minWidth: "45%", borderRadius: 10, padding: 12, borderWidth: 1, alignItems: "center", gap: 4 },
  statLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  statValue: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },
  recapBox: { borderRadius: 10, padding: 14, borderWidth: 1, marginBottom: 10 },
  recapTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 6 },
  recapText: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  momentBox: { flexDirection: "row", alignItems: "flex-start", borderRadius: 10, padding: 14, borderWidth: 1, marginBottom: 20 },
  actions: { flexDirection: "row", gap: 10, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 14, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  newBattleBtn: { borderRadius: 12, overflow: "hidden", marginBottom: 8 },
  newBattleGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  newBattleText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 2 },
});
