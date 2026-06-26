import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";
import type { BattleRecord } from "@/types";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { battleHistory, clearHistory } = useStorage();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>BATTLE HISTORY</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{battleHistory.length} battles</Text>
      </View>

      {battleHistory.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="list-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No battle history</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Your battles will appear here after you fight.
          </Text>
        </View>
      ) : (
        <FlatList
          data={battleHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Pressable onPress={clearHistory} style={[styles.clearBtn, { borderColor: colors.destructive }]}>
              <Ionicons name="trash-outline" size={14} color={colors.destructive} />
              <Text style={[styles.clearBtnText, { color: colors.destructive }]}>Clear History</Text>
            </Pressable>
          }
          renderItem={({ item }) => <BattleItem item={item} colors={colors} formatDate={formatDate} />}
        />
      )}
    </View>
  );
}

function BattleItem({ item, colors, formatDate }: { item: BattleRecord; colors: ReturnType<typeof useColors>; formatDate: (s: string) => string }) {
  return (
    <View style={[styles.battleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.battleTop}>
        <View style={styles.battleFighters}>
          <Text style={[styles.winnerText, { color: colors.neonYellow }]}>{item.winner}</Text>
          <Text style={[styles.defeatText, { color: colors.mutedForeground }]}>defeated</Text>
          <Text style={[styles.loserText, { color: colors.text }]}>{item.loser}</Text>
        </View>
        <Text style={[styles.ratingText, { color: colors.neonYellow }]}>{item.fightRating.charAt(0) === "★" ? item.fightRating.split(" ")[0] : "★★★"}</Text>
      </View>
      <View style={styles.battleBottom}>
        <View style={styles.battleStat}>
          <Ionicons name="flash" size={11} color={colors.primary} />
          <Text style={[styles.battleStatText, { color: colors.mutedForeground }]}>{item.methodOfVictory}</Text>
        </View>
        <View style={styles.battleStat}>
          <Ionicons name="time" size={11} color={colors.primary} />
          <Text style={[styles.battleStatText, { color: colors.mutedForeground }]}>{item.fightTime}</Text>
        </View>
        <View style={styles.battleStat}>
          <Ionicons name="calendar" size={11} color={colors.primary} />
          <Text style={[styles.battleStatText, { color: colors.mutedForeground }]}>{formatDate(item.date)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 2 },
  count: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 18, fontFamily: "Inter_400Regular" },
  battleCard: { borderRadius: 10, padding: 14, borderWidth: 1, marginBottom: 10 },
  battleTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  battleFighters: { flex: 1 },
  winnerText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  defeatText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  loserText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ratingText: { fontSize: 14 },
  battleBottom: { flexDirection: "row", gap: 16 },
  battleStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  battleStatText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  clearBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  clearBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
