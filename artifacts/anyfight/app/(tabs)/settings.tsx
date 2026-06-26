import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { clearHistory, clearSavedFighters, battleHistory, savedFighters, voiceEnabled, setVoiceEnabled } = useStorage();

  const handleClearHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Clear Battle History", `This will permanently delete all ${battleHistory.length} battle records.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => { clearHistory(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
    ]);
  };

  const handleClearFighters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Clear Saved Fighters", `This will permanently remove all ${savedFighters.length} saved fighters.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => { clearSavedFighters(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
    ]);
  };

  const handleVoiceToggle = (v: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVoiceEnabled(v);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>SETTINGS</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.appInfo}>
            <Text style={[styles.appName, { color: colors.text }]}>ANYFIGHT</Text>
            <Text style={[styles.appTagline, { color: colors.neonBlue }]}>Dream Battles</Text>
            <Text style={[styles.appVersion, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
            <Text style={[styles.appDesc, { color: colors.mutedForeground }]}>Any Person. Any Character. Any Battle.</Text>
          </View>
        </View>

        {/* Voice */}
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>VOICE & AUDIO</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <Ionicons name="mic" size={18} color={colors.neonPurple} />
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Voice Narration</Text>
              <Text style={[styles.toggleSublabel, { color: colors.mutedForeground }]}>
                AI reads fight narration & announces battles
              </Text>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={handleVoiceToggle}
              trackColor={{ false: colors.border, true: colors.neonPurple + "80" }}
              thumbColor={voiceEnabled ? colors.neonPurple : colors.mutedForeground}
            />
          </View>
        </View>

        {/* Stats */}
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>YOUR STATS</Text>
        <View style={[styles.statsGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StatCell icon="flash" label="BATTLES" value={String(battleHistory.length)} colors={colors} />
          <StatCell icon="heart" label="SAVED FIGHTERS" value={String(savedFighters.length)} colors={colors} />
        </View>

        {/* Data Management */}
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>DATA</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="list-outline"
            label="Battle History"
            sublabel={`${battleHistory.length} records`}
            actionLabel="Clear"
            actionColor={colors.destructive}
            onPress={handleClearHistory}
            disabled={battleHistory.length === 0}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <SettingRow
            icon="heart-outline"
            label="Saved Fighters"
            sublabel={`${savedFighters.length} fighters`}
            actionLabel="Clear"
            actionColor={colors.destructive}
            onPress={handleClearFighters}
            disabled={savedFighters.length === 0}
            colors={colors}
          />
        </View>

        {/* About */}
        <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>
            AnyFight: Dream Battles uses AI to generate fighters for any person, character, or entity you can imagine. All fighter profiles are AI-generated and designed for entertainment purposes only.{"\n\n"}
            Generated content is original and inspired — not intended to copy exact likenesses, trademarks, or copyrighted material.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCell({ icon, label, value, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.statCell}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={[styles.statVal, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function SettingRow({ icon, label, sublabel, actionLabel, actionColor, onPress, disabled, colors }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; sublabel: string;
  actionLabel: string; actionColor: string; onPress: () => void; disabled: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.settingRow}>
      <Ionicons name={icon} size={18} color={colors.mutedForeground} />
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.settingSubLabel, { color: colors.mutedForeground }]}>{sublabel}</Text>
      </View>
      <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.actionBtn, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}>
        <Text style={[styles.actionBtnText, { color: actionColor }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  sectionHeader: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 8, marginTop: 20, paddingHorizontal: 4 },
  section: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 4 },
  appInfo: { alignItems: "center" },
  appName: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 4 },
  appTagline: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 4 },
  appVersion: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  appDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statsGrid: { flexDirection: "row", borderRadius: 12, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
  statCell: { flex: 1, alignItems: "center", padding: 16, gap: 4 },
  statVal: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  divider: { height: 1, marginVertical: 4 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  toggleSublabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  settingSubLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  aboutText: { fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" },
});
