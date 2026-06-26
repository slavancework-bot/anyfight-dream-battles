import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetDailyChallenge } from "@workspace/api-client-react";
import { FighterCard } from "@/components/FighterCard";
import { useColors } from "@/hooks/useColors";

export default function DailyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [voted, setVoted] = useState<1 | 2 | null>(null);

  const { data: challenge, isLoading, error } = useGetDailyChallenge();

  const handleVote = async (fighter: 1 | 2) => {
    if (voted) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVoted(fighter);
    const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
    await fetch(`https://${domain}/api/daily-challenge/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fighter }),
    }).catch(() => {});
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.card, colors.background]}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), borderBottomColor: colors.border }]}
      >
        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{today.toUpperCase()}</Text>
        <Text style={[styles.title, { color: colors.text }]}>TODAY'S DREAM BATTLE</Text>
      </LinearGradient>

      {isLoading && (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Generating today's matchup...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorArea}>
          <Ionicons name="warning-outline" size={40} color={colors.accent} />
          <Text style={[styles.errorText, { color: colors.text }]}>Failed to load daily challenge</Text>
        </View>
      )}

      {challenge && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        >
          {/* Matchup prediction */}
          <View style={[styles.predictionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.predLabel, { color: colors.mutedForeground }]}>AI PREDICTION</Text>
            <Text style={[styles.predWinner, { color: colors.neonYellow }]}>{challenge.analysis.predictedWinner} WINS</Text>
            <Text style={[styles.predPct, { color: colors.mutedForeground }]}>
              {challenge.analysis.winnerWinPercentage}% of the time
            </Text>
            <Text style={[styles.predNarrative, { color: colors.mutedForeground }]}>{challenge.analysis.narrativeExplanation}</Text>
          </View>

          {/* Vote section */}
          <View style={[styles.voteSection, { backgroundColor: colors.card, borderColor: colors.neonPurple }]}>
            <Text style={[styles.voteTitle, { color: colors.neonPurple }]}>WHO DO YOU THINK WINS?</Text>
            <View style={styles.voteButtons}>
              <VoteButton
                name={challenge.fighter1.name}
                votes={challenge.votesForFighter1}
                total={challenge.votesForFighter1 + challenge.votesForFighter2}
                onPress={() => handleVote(1)}
                voted={voted === 1}
                disabled={!!voted}
                color={colors.neonBlue}
                colors={colors}
              />
              <Text style={[styles.voteVs, { color: colors.accent }]}>VS</Text>
              <VoteButton
                name={challenge.fighter2.name}
                votes={challenge.votesForFighter2}
                total={challenge.votesForFighter1 + challenge.votesForFighter2}
                onPress={() => handleVote(2)}
                voted={voted === 2}
                disabled={!!voted}
                color={colors.neonPurple}
                colors={colors}
              />
            </View>
            {voted && (
              <Text style={[styles.votedMsg, { color: colors.neonGreen }]}>
                ✓ Vote recorded!
              </Text>
            )}
          </View>

          {/* Fighter cards */}
          <FighterCard fighter={challenge.fighter1} />
          <FighterCard fighter={challenge.fighter2} />
        </ScrollView>
      )}
    </View>
  );
}

function VoteButton({ name, votes, total, onPress, voted, disabled, color, colors }: {
  name: string; votes: number; total: number;
  onPress: () => void; voted: boolean; disabled: boolean;
  color: string; colors: ReturnType<typeof useColors>;
}) {
  const pct = total > 0 ? Math.round((votes / total) * 100) : 50;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.voteBtn,
        {
          backgroundColor: voted ? color + "22" : colors.muted,
          borderColor: voted ? color : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[styles.voteBtnName, { color: voted ? color : colors.text }]} numberOfLines={2}>{name}</Text>
      {(voted || disabled) && <Text style={[styles.votePct, { color: color }]}>{pct}%</Text>}
      <Text style={[styles.voteCount, { color: colors.mutedForeground }]}>{votes} votes</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  dateText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  loadingArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  errorText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  predictionBox: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 12 },
  predLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 4 },
  predWinner: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 2 },
  predPct: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  predNarrative: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
  voteSection: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 16 },
  voteTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2, textAlign: "center", marginBottom: 12 },
  voteButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
  voteBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 2, alignItems: "center" },
  voteBtnName: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 4 },
  votePct: { fontSize: 20, fontFamily: "Inter_700Bold" },
  voteCount: { fontSize: 10, fontFamily: "Inter_400Regular" },
  voteVs: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  votedMsg: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center", marginTop: 10 },
});
