import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FighterCard } from "@/components/FighterCard";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";
import type { SavedFighter, SavedMatchup } from "@/types";

type Tab = "fighters" | "matchups";

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedFighters, removeFighter, savedMatchups, removeMatchup } = useStorage();
  const [activeTab, setActiveTab] = useState<Tab>("fighters");

  const handleDeleteFighter = (fighter: SavedFighter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Remove Fighter", `Remove ${fighter.name} from saved?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeFighter(fighter.savedId) },
    ]);
  };

  const handleDeleteMatchup = (matchup: SavedMatchup) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Remove Battle", `Remove ${matchup.fighter1.name} vs ${matchup.fighter2.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeMatchup(matchup.id) },
    ]);
  };

  const tabBg = (tab: Tab) =>
    activeTab === tab ? colors.primary : "transparent";
  const tabText = (tab: Tab) =>
    activeTab === tab ? "#fff" : colors.mutedForeground;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>SAVED</Text>
        <View style={[styles.tabs, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Pressable onPress={() => setActiveTab("fighters")} style={[styles.tab, { backgroundColor: tabBg("fighters") }]}>
            <Text style={[styles.tabText, { color: tabText("fighters") }]}>
              Fighters {savedFighters.length > 0 ? `(${savedFighters.length})` : ""}
            </Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab("matchups")} style={[styles.tab, { backgroundColor: tabBg("matchups") }]}>
            <Text style={[styles.tabText, { color: tabText("matchups") }]}>
              Battles {savedMatchups.length > 0 ? `(${savedMatchups.length})` : ""}
            </Text>
          </Pressable>
        </View>
      </View>

      {activeTab === "fighters" ? (
        savedFighters.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="person-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved fighters</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              After a battle, save your favorite fighters here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedFighters}
            keyExtractor={(item) => item.savedId}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View>
                <FighterCard fighter={item} />
                <Pressable
                  onPress={() => handleDeleteFighter(item)}
                  style={[styles.deleteBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive }]}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                  <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Remove</Text>
                </Pressable>
              </View>
            )}
          />
        )
      ) : (
        savedMatchups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved battles</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              After a fight, tap "Save Battle" on the recap screen.
            </Text>
          </View>
        ) : (
          <FlatList
            data={savedMatchups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.matchupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.matchupFighters}>
                  <View style={styles.matchupFighter}>
                    <Text style={[styles.fighterName, { color: colors.text }]}>{item.fighter1.name}</Text>
                    <Text style={[styles.fighterNick, { color: colors.mutedForeground }]}>"{item.fighter1.nickname}"</Text>
                  </View>
                  <View style={[styles.vsCircle, { backgroundColor: colors.primary + "30", borderColor: colors.primary }]}>
                    <Text style={[styles.vsText, { color: colors.primary }]}>VS</Text>
                  </View>
                  <View style={[styles.matchupFighter, { alignItems: "flex-end" }]}>
                    <Text style={[styles.fighterName, { color: colors.text }]}>{item.fighter2.name}</Text>
                    <Text style={[styles.fighterNick, { color: colors.mutedForeground }]}>"{item.fighter2.nickname}"</Text>
                  </View>
                </View>
                <View style={[styles.matchupMeta, { borderTopColor: colors.border }]}>
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                    {item.analysis.predictedWinner} predicted to win
                  </Text>
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteMatchup(item)}
                  style={[styles.deleteBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive }]}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                  <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Remove</Text>
                </Pressable>
              </View>
            )}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  tabs: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 18, fontFamily: "Inter_400Regular" },
  matchupCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  matchupFighters: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 8,
  },
  matchupFighter: { flex: 1 },
  fighterName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  fighterNick: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  matchupMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  metaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    margin: 12,
    marginTop: 4,
  },
  deleteBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
