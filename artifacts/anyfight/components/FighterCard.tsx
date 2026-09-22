import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FighterPortrait } from "@/components/FighterPortrait";
import { useColors } from "@/hooks/useColors";
import type { Fighter } from "@/types";

export function FighterCard({ fighter }: { fighter: Fighter }) {
  const colors = useColors();
  const accent = colors.neonBlue;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient colors={[accent + "22", "transparent"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.topRow}>
        <FighterPortrait fighter={fighter} size={74} nameColor={accent} style={styles.portrait} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{fighter.name}</Text>
          <Text style={[styles.nickname, { color: colors.neonYellow }]} numberOfLines={1}>"{fighter.nickname || "The Unknown"}"</Text>
          <Text style={[styles.style, { color: colors.mutedForeground }]} numberOfLines={2}>{fighter.fightingStyle || "Street Fighter"}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <MiniStat label="PWR" value={fighter.stats.power} color={colors.neonRed} />
        <MiniStat label="SPD" value={fighter.stats.speed} color={colors.neonBlue} />
        <MiniStat label="DEF" value={fighter.stats.defense} color={colors.neonGreen} />
        <MiniStat label="IQ" value={fighter.stats.intelligence} color={colors.neonYellow} />
      </View>
      <View style={styles.moveRow}>
        <Ionicons name="flash" size={14} color={colors.neonYellow} />
        <Text style={[styles.moveText, { color: colors.text }]} numberOfLines={2}>{fighter.signatureMove || "Power Strike"}</Text>
      </View>
    </View>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniValue, { color }]}>{Math.round(value ?? 50)}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 10, overflow: "hidden" },
  topRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  portrait: { borderRadius: 8 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 17, fontFamily: "Inter_700Bold" },
  nickname: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  style: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 6, lineHeight: 16 },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  miniStat: { flex: 1, alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 7, paddingVertical: 7 },
  miniValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  miniLabel: { color: "#9ca3af", fontSize: 9, fontFamily: "Inter_700Bold", marginTop: 1 },
  moveRow: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 10 },
  moveText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 16 },
});
