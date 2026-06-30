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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBattle } from "@/context/BattleContext";
import { useColors } from "@/hooks/useColors";
import type { Fighter, OutfitChoice } from "@/types";

const OUTFIT_OPTIONS: { key: OutfitChoice; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "plain", label: "Plain", icon: "person-outline" },
  { key: "signature", label: "Signature", icon: "star-outline" },
  { key: "wrestling", label: "Wrestling", icon: "trophy-outline" },
];

const ARCADE = {
  black: "#030303",
  panel: "#080808",
  gold: "#f2b92f",
  red: "#e52e21",
  blue: "#1267dd",
  white: "#f7efe0",
  muted: "#1a1a1a",
  textMuted: "#b7aa8d",
};

async function apiFetchFighter(name: string, outfit: OutfitChoice, domain: string): Promise<Fighter> {
  const res = await fetch(`https://${domain}/api/fighters/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, outfitChoice: outfit }),
  });
  if (!res.ok) throw new Error("Failed to generate fighter");
  return res.json() as Promise<Fighter>;
}

async function apiFetchRandom(domain: string): Promise<Fighter> {
  const res = await fetch(`https://${domain}/api/fighters/random`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to generate random fighter");
  return res.json() as Promise<Fighter>;
}

async function apiGenerateMatchup(f1: Fighter, f2: Fighter, domain: string) {
  const res = await fetch(`https://${domain}/api/matchup/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fighter1: f1, fighter2: f2 }),
  });
  if (!res.ok) throw new Error("Failed to generate matchup");
  return res.json();
}

export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setFighters, setAnalysis } = useBattle();

  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [outfit1, setOutfit1] = useState<OutfitChoice>("signature");
  const [outfit2, setOutfit2] = useState<OutfitChoice>("signature");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";

  const isRandom = (name: string) => name.trim().toLowerCase() === "random" || name.trim() === "";
  const isArchNemesis = (name: string) => name.trim().toLowerCase().includes("arch nemesis") || name.trim().toLowerCase().includes("arch-nemesis");

  const handleGenerate = async () => {
    const trimmed1 = name1.trim();
    if (!trimmed1) {
      Alert.alert("Enter a fighter", "Please enter at least Fighter 1's name.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      setLoadingMsg(`Generating ${trimmed1}...`);
      const fighter1 = await apiFetchFighter(trimmed1, outfit1, domain);

      let fighter2: Fighter;
      const trimmed2 = name2.trim();

      if (!trimmed2 || isRandom(trimmed2)) {
        setLoadingMsg("Summoning a random opponent...");
        fighter2 = await apiFetchRandom(domain);
        fighter2.outfitChoice = outfit2;
      } else if (isArchNemesis(trimmed2)) {
        setLoadingMsg(`Finding ${fighter1.name}'s arch nemesis...`);
        fighter2 = await apiFetchFighter(fighter1.archNemesis, outfit2, domain);
      } else {
        setLoadingMsg(`Generating ${trimmed2}...`);
        fighter2 = await apiFetchFighter(trimmed2, outfit2, domain);
      }

      setLoadingMsg("Analyzing the matchup...");
      const analysis = await apiGenerateMatchup(fighter1, fighter2, domain);

      setFighters(fighter1, fighter2);
      setAnalysis(analysis);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/matchup");
    } catch (e) {
      Alert.alert("Generation Failed", "Could not generate fighters. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#050505", "#0b0b0d", "#050505"]} style={StyleSheet.absoluteFill} />
      <View style={styles.scanlines} pointerEvents="none" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
            paddingBottom: 120,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.leagueBadge}>
            <Text style={styles.leagueText}>A.B.A.</Text>
          </View>
          <Text style={styles.logoText}>ANYFIGHT BOXING</Text>
          <Text style={styles.tagline}>ANY PERSON / ANY CHARACTER / ANY BOUT</Text>
        </View>

        {/* Fighter 1 */}
        <FighterInput
          label="1P CONTENDER"
          placeholder="Batman, Mike Tyson, Zeus..."
          value={name1}
          onChangeText={setName1}
          outfit={outfit1}
          onOutfitChange={setOutfit1}
          accentColor={colors.neonBlue}
        />

        {/* VS Divider */}
        <View style={styles.vsDivider}>
          <View style={styles.vsLine} />
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.vsLine} />
        </View>

        {/* Fighter 2 */}
        <FighterInput
          label="2P CONTENDER"
          placeholder='Iron Man, Goku... or "random"'
          value={name2}
          onChangeText={setName2}
          outfit={outfit2}
          onOutfitChange={setOutfit2}
          accentColor={colors.neonPurple}
          hint='Try: "random" or "arch nemesis"'
        />

        {/* Generate Button */}
        <Pressable
          onPress={handleGenerate}
          disabled={loading}
          style={({ pressed }) => [styles.generateBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={loading ? [ARCADE.muted, ARCADE.muted] : [ARCADE.red, ARCADE.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateGradient}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.generateBtnText}>{loadingMsg || "Generating..."}</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="flash" size={18} color="#fff" />
                <Text style={styles.generateBtnText}>INSERT COIN - GENERATE BOUT</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>

        {/* Quick suggestions */}
        <Text style={styles.suggestTitle}>SELECT DREAM BOUT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
          {SUGGESTIONS.map((s, i) => (
            <Pressable
              key={i}
              onPress={() => {
                setName1(s[0]);
                setName2(s[1]);
              }}
              style={styles.suggestionChip}
            >
              <Text style={styles.suggestionText}>{s[0]} vs {s[1]}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const SUGGESTIONS = [
  ["Batman", "Iron Man"],
  ["Goku", "Superman"],
  ["Mike Tyson", "Muhammad Ali"],
  ["Zeus", "Thor"],
  ["Mario", "Sonic"],
  ["Abraham Lincoln", "Julius Caesar"],
  ["King Kong", "Godzilla"],
  ["Sherlock Holmes", "James Bond"],
];

interface FighterInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  outfit: OutfitChoice;
  onOutfitChange: (o: OutfitChoice) => void;
  accentColor: string;
  hint?: string;
}

function FighterInput({ label, placeholder, value, onChangeText, outfit, onOutfitChange, accentColor, hint }: FighterInputProps) {
  return (
    <View style={[styles.fighterSection, { borderColor: accentColor }]}>
      <Text style={[styles.fighterLabel, { color: accentColor }]}>{label}</Text>
      <TextInput
        style={[styles.textInput, { borderColor: accentColor }]}
        placeholder={placeholder}
        placeholderTextColor="#8f876f"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="words"
        returnKeyType="next"
      />
      {hint && <Text style={styles.hintText}>{hint}</Text>}
      <View style={styles.outfitRow}>
        {OUTFIT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => { onOutfitChange(opt.key); Haptics.selectionAsync(); }}
            style={[
              styles.outfitBtn,
              {
                backgroundColor: outfit === opt.key ? accentColor + "22" : ARCADE.muted,
                borderColor: outfit === opt.key ? accentColor : "#34302a",
              },
            ]}
          >
            <Ionicons name={opt.icon} size={14} color={outfit === opt.key ? accentColor : ARCADE.textMuted} />
            <Text style={[styles.outfitBtnText, { color: outfit === opt.key ? accentColor : ARCADE.textMuted }]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ARCADE.black },
  content: { paddingHorizontal: 16 },
  logoArea: { alignItems: "center", marginBottom: 28, marginTop: 8 },
  leagueBadge: {
    borderWidth: 2,
    borderColor: ARCADE.gold,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginBottom: 8,
    backgroundColor: ARCADE.panel,
  },
  leagueText: {
    color: ARCADE.gold,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  logoText: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: ARCADE.white,
    letterSpacing: 3,
    textAlign: "center",
    textShadowColor: ARCADE.red,
    textShadowRadius: 5,
  },
  tagline: { color: ARCADE.gold, fontSize: 10, letterSpacing: 2, fontFamily: "Inter_700Bold", textTransform: "uppercase", textAlign: "center", marginTop: 6 },
  fighterSection: {
    backgroundColor: ARCADE.panel,
    borderRadius: 0,
    padding: 14,
    borderWidth: 2,
    marginBottom: 8,
  },
  fighterLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 2, marginBottom: 8 },
  textInput: {
    height: 48,
    borderRadius: 0,
    borderWidth: 2,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
    color: ARCADE.white,
    backgroundColor: "#111",
  },
  hintText: { color: ARCADE.textMuted, fontSize: 11, marginBottom: 8, fontFamily: "Inter_400Regular" },
  outfitRow: { flexDirection: "row", gap: 6 },
  outfitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 2,
  },
  outfitBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  vsDivider: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  vsLine: { flex: 1, height: 2, backgroundColor: "#4b4435" },
  vsCircle: {
    width: 40,
    height: 40,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginHorizontal: 12,
    backgroundColor: ARCADE.panel,
    borderColor: ARCADE.gold,
  },
  vsText: { color: ARCADE.gold, fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  generateBtn: { marginTop: 16, borderRadius: 0, overflow: "hidden", borderWidth: 2, borderColor: ARCADE.gold },
  generateGradient: { paddingVertical: 16, alignItems: "center" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  generateBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1, textAlign: "center" },
  suggestTitle: {
    color: ARCADE.gold,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 10,
  },
  suggestions: { marginBottom: 12 },
  suggestionChip: {
    backgroundColor: ARCADE.panel,
    borderColor: "#4b4435",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 2,
    marginRight: 8,
  },
  suggestionText: { color: ARCADE.white, fontSize: 12, fontFamily: "Inter_500Medium" },
  scanlines: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.035)", opacity: 0.35 },
});
