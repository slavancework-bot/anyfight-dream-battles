import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBattle } from "@/context/BattleContext";
import { useColors } from "@/hooks/useColors";
import { useTTS } from "@/hooks/useTTS";
import { FighterCard } from "@/components/FighterCard";
import { FighterPortrait } from "@/components/FighterPortrait";

const ARCADE = {
  black: "#030303",
  panel: "#080808",
  gold: "#f2b92f",
  red: "#e52e21",
  white: "#f7efe0",
  border: "#4b4435",
};

export default function MatchupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fighter1, fighter2, analysis, setNarration } = useBattle();
  const [loading, setLoading] = useState(false);

  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  const { speak, stop, isPlaying, isLoading: ttsLoading } = useTTS(domain);

  if (!fighter1 || !fighter2 || !analysis) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No matchup loaded</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleToggleRead = () => {
    if (!analysis) return;
    if (isPlaying) {
      stop();
    } else {
      const text = [
        analysis.narrativeExplanation,
        `Fight style: ${analysis.fightStyle}.`,
        `Special moves: ${analysis.specialMoveComparison}`,
        `Predicted winner: ${analysis.predictedWinner} with ${analysis.winnerWinPercentage}% win chance.`,
      ].join(" ");
      speak(text, "nova");
    }
  };

  const handleFight = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    try {
      const res = await fetch(`https://${domain}/api/battle/narration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fighter1, fighter2 }),
      });
      if (!res.ok) throw new Error();
      const narration = await res.json();
      setNarration(narration);
      router.push("/narration");
    } catch {
      Alert.alert("Error", "Failed to generate battle intro. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = analysis.winnerWinPercentage + analysis.loserWinPercentage;
  const f1Pct = analysis.predictedWinner === fighter1.name ? analysis.winnerWinPercentage : analysis.loserWinPercentage;
  const f2Pct = analysis.predictedWinner === fighter2.name ? analysis.winnerWinPercentage : analysis.loserWinPercentage;

  const difficultyColor: Record<string, string> = {
    "Quick Knockout": colors.neonGreen,
    "Close Fight": colors.neonYellow,
    "Epic Battle": colors.neonPurple,
    "Legendary Clash": colors.neonRed,
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#050505", "#0b0b0d", "#050505"]} style={StyleSheet.absoluteFill} />
      <View style={styles.scanlines} pointerEvents="none" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={ARCADE.white} />
        </Pressable>
        <Text style={styles.headerTitle}>MATCHUP CARD</Text>
        <Pressable onPress={handleToggleRead} style={styles.speakerBtn} hitSlop={10}>
          <Ionicons
            name={ttsLoading ? "hourglass-outline" : isPlaying ? "volume-high" : "volume-mute"}
            size={22}
            color={isPlaying ? colors.neonPurple : colors.mutedForeground}
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Prediction Banner */}
        <View style={styles.predictionBanner}>
          {/* Side-by-side portraits */}
          <View style={styles.portraitsRow}>
            <View style={styles.portraitSide}>
              <FighterPortrait fighter={fighter1} size={90} nameColor={colors.neonBlue} />
              <Text style={[styles.portraitLabel, { color: colors.neonBlue }]} numberOfLines={1}>
                {fighter1.name.split(" ")[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.portraitCenter}>
              <Text style={styles.predictionLabel}>ODDS BOARD</Text>
              <Text style={[styles.predictedWinner, { color: colors.neonYellow }]}>{analysis.predictedWinner.split(" ")[0].toUpperCase()} WINS</Text>
              <View style={[styles.diffBadge, { backgroundColor: (difficultyColor[analysis.fightDifficulty] ?? colors.primary) + "22", borderColor: difficultyColor[analysis.fightDifficulty] ?? colors.primary }]}>
                <Text style={[styles.diffText, { color: difficultyColor[analysis.fightDifficulty] ?? colors.primary }]}>{analysis.fightDifficulty}</Text>
              </View>
            </View>
            <View style={styles.portraitSide}>
              <FighterPortrait fighter={fighter2} size={90} nameColor={colors.neonPurple} />
              <Text style={[styles.portraitLabel, { color: colors.neonPurple }]} numberOfLines={1}>
                {fighter2.name.split(" ")[0].toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.predictionRow}>
            <Text style={[styles.fighterPct, { color: f1Pct >= f2Pct ? colors.neonGreen : colors.mutedForeground }]}>
              {f1Pct}%
            </Text>
            <View style={styles.predictionCenter}>
              <Text style={styles.predictionLabel}>WIN CHANCE</Text>
            </View>
            <Text style={[styles.fighterPct, { color: f2Pct >= f1Pct ? colors.neonGreen : colors.mutedForeground }]}>
              {f2Pct}%
            </Text>
          </View>
          {/* Win probability bar */}
          <View style={[styles.probBar, { backgroundColor: colors.muted }]}>
            <View style={[styles.probFill1, { flex: f1Pct, backgroundColor: colors.neonBlue }]} />
            <View style={[styles.probFill2, { flex: f2Pct, backgroundColor: colors.neonPurple }]} />
          </View>
          <View style={styles.probLabels}>
            <Text style={[styles.probLabel, { color: colors.neonBlue }]}>{fighter1.name}</Text>
            <Text style={[styles.probLabel, { color: colors.neonPurple }]}>{fighter2.name}</Text>
          </View>
        </View>

        {/* Narrative */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FIGHT ANALYSIS</Text>
          <Text style={[styles.narrative, { color: colors.mutedForeground }]}>{analysis.narrativeExplanation}</Text>
          <Text style={[styles.fightStyle, { color: colors.secondary }]}>
            <Ionicons name="flash" size={12} color={colors.secondary} /> {analysis.fightStyle}
          </Text>
        </View>

        {/* Stat Comparisons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TALE OF THE TAPE</Text>
          <ComparisonRow
            label="POWER"
            f1Name={fighter1.name}
            f2Name={fighter2.name}
            f1Val={analysis.powerComparison.fighter1Value}
            f2Val={analysis.powerComparison.fighter2Value}
            color={colors.neonRed}
            colors={colors}
          />
          <ComparisonRow
            label="SPEED"
            f1Name={fighter1.name}
            f2Name={fighter2.name}
            f1Val={analysis.speedComparison.fighter1Value}
            f2Val={analysis.speedComparison.fighter2Value}
            color={colors.neonBlue}
            colors={colors}
          />
          <ComparisonRow
            label="INTELLIGENCE"
            f1Name={fighter1.name}
            f2Name={fighter2.name}
            f1Val={analysis.intelligenceComparison.fighter1Value}
            f2Val={analysis.intelligenceComparison.fighter2Value}
            color={colors.neonYellow}
            colors={colors}
          />
          <View style={styles.specialMove}>
            <Text style={[styles.smLabel, { color: colors.mutedForeground }]}>SPECIAL MOVES</Text>
            <Text style={[styles.smText, { color: colors.text }]}>{analysis.specialMoveComparison}</Text>
          </View>
        </View>

        {/* Advantages */}
        <View style={styles.advantagesRow}>
          <View style={styles.advantageCol}>
            <Text style={[styles.advHeader, { color: colors.neonBlue }]}>{fighter1.name.split(" ")[0].toUpperCase()}</Text>
            {analysis.fighter1Advantages.map((a, i) => (
              <View key={i} style={styles.advItem}>
                <Ionicons name="checkmark-circle" size={13} color={colors.neonGreen} />
                <Text style={[styles.advText, { color: colors.mutedForeground }]}>{a}</Text>
              </View>
            ))}
          </View>
          <View style={styles.advantageCol}>
            <Text style={[styles.advHeader, { color: colors.neonPurple }]}>{fighter2.name.split(" ")[0].toUpperCase()}</Text>
            {analysis.fighter2Advantages.map((a, i) => (
              <View key={i} style={styles.advItem}>
                <Ionicons name="checkmark-circle" size={13} color={colors.neonGreen} />
                <Text style={[styles.advText, { color: colors.mutedForeground }]}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Fighter 1 Card */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <FighterCard fighter={fighter1} />
        </View>
        {/* Fighter 2 Card */}
        <View style={{ paddingHorizontal: 16 }}>
          <FighterCard fighter={fighter2} />
        </View>
      </ScrollView>

      {/* Fight Button */}
      <View style={[styles.fightButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handleFight} disabled={loading} style={({ pressed }) => [styles.fightBtn, { opacity: pressed ? 0.85 : 1 }]}>
          <LinearGradient colors={[ARCADE.red, ARCADE.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fightGradient}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.fightRow}>
                <Ionicons name="flame" size={20} color="#fff" />
                <Text style={styles.fightText}>PRESS START TO FIGHT</Text>
                <Ionicons name="flame" size={20} color="#fff" />
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function ComparisonRow({ label, f1Name, f2Name, f1Val, f2Val, color, colors }: {
  label: string; f1Name: string; f2Name: string;
  f1Val: number; f2Val: number; color: string;
  colors: ReturnType<typeof useColors>;
}) {
  const winner = f1Val >= f2Val ? f1Name : f2Name;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: f1Val >= f2Val ? color : colors.mutedForeground, fontSize: 13, fontFamily: "Inter_700Bold" }}>{f1Val}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 }}>{label}</Text>
        <Text style={{ color: f2Val >= f1Val ? color : colors.mutedForeground, fontSize: 13, fontFamily: "Inter_700Bold" }}>{f2Val}</Text>
      </View>
      <View style={{ flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", backgroundColor: colors.muted }}>
        <View style={{ flex: f1Val, backgroundColor: f1Val >= f2Val ? color : colors.border }} />
        <View style={{ flex: 0.5, backgroundColor: colors.background }} />
        <View style={{ flex: f2Val, backgroundColor: f2Val >= f1Val ? color : colors.border }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ARCADE.black },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  backBtn: { marginTop: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: ARCADE.black,
    borderBottomWidth: 2,
    borderBottomColor: ARCADE.gold,
  },
  backButton: { padding: 6 },
  speakerBtn: { padding: 6 },
  headerTitle: { color: ARCADE.gold, fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  predictionBanner: { padding: 16, borderBottomWidth: 2, borderBottomColor: ARCADE.border, backgroundColor: ARCADE.panel },
  portraitsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  portraitSide: { alignItems: "center", gap: 6, flex: 1 },
  portraitCenter: { alignItems: "center", flex: 1 },
  portraitLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  predictionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  fighterPct: { fontSize: 22, fontFamily: "Inter_700Bold" },
  predictionCenter: { alignItems: "center" },
  predictionLabel: { color: ARCADE.gold, fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 2 },
  predictedWinner: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 4 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 0, borderWidth: 2 },
  diffText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  probBar: { height: 8, borderRadius: 0, flexDirection: "row", overflow: "hidden", marginBottom: 6 },
  probFill1: { height: "100%" },
  probFill2: { height: "100%" },
  probLabels: { flexDirection: "row", justifyContent: "space-between" },
  probLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  section: { margin: 16, marginBottom: 0, padding: 16, borderRadius: 0, borderWidth: 2, borderColor: ARCADE.border, backgroundColor: ARCADE.panel },
  sectionTitle: { color: ARCADE.gold, fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 10 },
  narrative: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", marginBottom: 8 },
  fightStyle: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  advantagesRow: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 16 },
  advantageCol: { flex: 1, padding: 12, borderRadius: 0, borderWidth: 2, borderColor: ARCADE.border, backgroundColor: ARCADE.panel },
  advHeader: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginBottom: 8 },
  advItem: { flexDirection: "row", alignItems: "flex-start", gap: 4, marginBottom: 4 },
  advText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 15 },
  specialMove: { padding: 10, marginTop: 4, backgroundColor: "#111", borderWidth: 1, borderColor: ARCADE.border },
  smLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 3 },
  smText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  fightButtonContainer: { padding: 16, borderTopWidth: 2, borderTopColor: ARCADE.gold, backgroundColor: ARCADE.black },
  fightBtn: { borderRadius: 0, overflow: "hidden", borderWidth: 2, borderColor: ARCADE.gold },
  fightGradient: { paddingVertical: 16, alignItems: "center" },
  fightRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  fightText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 3 },
  scanlines: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.035)", opacity: 0.35 },
});
