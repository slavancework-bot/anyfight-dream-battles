import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBattle } from "@/context/BattleContext";
import { useBattleSounds } from "@/hooks/useBattleSounds";
import FighterSprite from "@/components/FighterSprite";
import { HealthBar } from "@/components/ArcadeFight";
import type { Fighter } from "@/types";
import { deriveFighterStyle } from "@/lib/fighter-profile";
import { buildFightScript, Step } from "@/lib/fight-script";

const ARCADE = {
  black: "#030303",
  panel: "#080808",
  gold: "#f2b92f",
  red: "#e52e21",
  blue: "#1267dd",
  white: "#f7efe0",
  border: "#4b4435",
  textMuted: "#b7aa8d",
};

const SAMPLE_FIGHTER_1: Fighter = {
  name: "Mr. Bean",
  nickname: "The Bean",
  category: "Sample",
  biography: "A well-meaning gentleman who accidentally causes catastrophes wherever he goes.",
  stats: { overall: 50, power: 20, speed: 40, defense: 90, stamina: 80, skill: 10, intelligence: 10 },
  strengths: ["Unintentional dodging", "Rubber face"],
  weaknesses: ["No actual boxing skills"],
  fightingStyle: "Clumsy Avoidance",
  signatureMove: "The Accidental Trip",
  ultimateFinisher: "Teddy's Revenge",
  signatureQuote: "Hmm...",
  archNemesis: "Darth Vader",
  archNemesisReason: "Vader hates chaos.",
  estimatedDifficulty: "Rookie",
  funFacts: ["Has never thrown a proper punch.", "Somehow still wins."],
  outfitChoice: "signature",
  outfitDescription: "Brown tweed suit with a red tie.",
  imagePrompt: "",
  personality: { aggression: 10, confidence: 90, cowardice: 80, showmanship: 50, discipline: 10, humor: 90, dirtyFighting: 20, sportsmanship: 50, riskTaking: 90, temper: 10 }
};

const SAMPLE_FIGHTER_2: Fighter = {
  name: "Darth Vader",
  nickname: "Dark Lord",
  category: "Sample",
  biography: "A cyborg Sith Lord with anger issues and breathing problems.",
  stats: { overall: 90, power: 90, speed: 50, defense: 80, stamina: 60, skill: 90, intelligence: 80 },
  strengths: ["Force Choke", "Intimidation"],
  weaknesses: ["Slow movement", "Sand"],
  fightingStyle: "Sith Brutality",
  signatureMove: "Force Push",
  ultimateFinisher: "Lightsaber Throw",
  signatureQuote: "I find your lack of faith disturbing.",
  archNemesis: "Mr. Bean",
  archNemesisReason: "Cannot predict him.",
  estimatedDifficulty: "Legendary",
  funFacts: ["Hates sand.", "Breathes loudly."],
  outfitChoice: "signature",
  outfitDescription: "Black armor, cape, and a life-support helmet.",
  imagePrompt: "",
  personality: { aggression: 80, confidence: 90, cowardice: 10, showmanship: 20, discipline: 90, humor: 10, dirtyFighting: 60, sportsmanship: 10, riskTaking: 40, temper: 80 }
};

function stableMatchupSeed(fighter1: Fighter, fighter2: Fighter) {
  const identity = [
    fighter1.name,
    fighter1.signatureMove,
    fighter1.ultimateFinisher,
    fighter2.name,
    fighter2.signatureMove,
    fighter2.ultimateFinisher,
  ].join("|");
  return identity.split("").reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
}

export default function ArenaPreviewScreen() {
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const { sample } = useLocalSearchParams();
  const battleCtx = useBattle();

  const isSample = sample === "1" || !battleCtx.fighter1 || !battleCtx.fighter2;
  const f1 = isSample ? SAMPLE_FIGHTER_1 : battleCtx.fighter1!;
  const f2 = isSample ? SAMPLE_FIGHTER_2 : battleCtx.fighter2!;

  const f1Style = useMemo(() => deriveFighterStyle(f1), [f1]);
  const f2Style = useMemo(() => deriveFighterStyle(f2), [f2]);

  const baseSeed = useMemo(() => stableMatchupSeed(f1, f2), [f1, f2]);
  const [rematchNumber, setRematchNumber] = useState(0);
  const scriptSeed = (baseSeed + rematchNumber) >>> 0;
  const steps = useMemo(() => buildFightScript(f1, f2, scriptSeed), [f1, f2, scriptSeed]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const { play: playSound, stop: stopSound } = useBattleSounds();

  const f1XAnim = useRef(new Animated.Value(15)).current;
  const f2XAnim = useRef(new Animated.Value(85)).current;
  const refXAnim = useRef(new Animated.Value(50)).current;

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepStartedAtRef = useRef(0);
  const stepDurationRef = useRef(0);
  const remainingDurationRef = useRef<number | null>(null);
  const playSoundRef = useRef(playSound);
  const stopSoundRef = useRef(stopSound);
  playSoundRef.current = playSound;
  stopSoundRef.current = stopSound;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => {
      sub.remove();
      stopSoundRef.current();
    };
  }, []);

  const runStep = (index: number, remainder?: number) => {
    if (index >= steps.length) return;
    const step = steps[index];

    if (!remainder && step.sound && !muted) {
      playSoundRef.current(step.sound);
    }

    const duration = remainder ?? step.duration;
    stepStartedAtRef.current = Date.now();
    stepDurationRef.current = duration;

    if (!reducedMotion) {
      Animated.parallel([
        Animated.timing(f1XAnim, { toValue: step.f1X, duration, useNativeDriver: false }),
        Animated.timing(f2XAnim, { toValue: step.f2X, duration, useNativeDriver: false }),
        ...(step.prop
          ? [Animated.timing(refXAnim, { toValue: step.prop.x, duration, useNativeDriver: false })]
          : []),
      ]).start();
    } else {
      f1XAnim.setValue(step.f1X);
      f2XAnim.setValue(step.f2X);
      if (step.prop) refXAnim.setValue(step.prop.x);
    }

    stepTimerRef.current = setTimeout(() => {
      stepTimerRef.current = null;
      remainingDurationRef.current = null;
      setCurrentStepIndex(index + 1);
    }, duration);
  };

  useEffect(() => {
    if (paused) {
      f1XAnim.stopAnimation();
      f2XAnim.stopAnimation();
      refXAnim.stopAnimation();
      stopSoundRef.current();
      return;
    }

    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    const remainder = remainingDurationRef.current ?? undefined;
    remainingDurationRef.current = null;
    runStep(currentStepIndex, remainder);

    return () => {
      if (stepTimerRef.current) {
        if (!paused && stepStartedAtRef.current > 0) {
          const elapsed = Date.now() - stepStartedAtRef.current;
          remainingDurationRef.current = Math.max(80, stepDurationRef.current - elapsed);
        }
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, [currentStepIndex, paused, reducedMotion, scriptSeed]);

  const handleRematch = () => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    stepStartedAtRef.current = 0;
    stepDurationRef.current = 0;
    remainingDurationRef.current = null;
    stopSoundRef.current();
    setRematchNumber((value) => value + 1);
    setCurrentStepIndex(0);
    f1XAnim.setValue(15);
    f2XAnim.setValue(85);
    refXAnim.setValue(50);
    setPaused(false);
  };

  const handleMute = () => {
    if (!muted) stopSoundRef.current();
    setMuted((value) => !value);
  };

  const currentStep = steps[currentStepIndex] || steps[steps.length - 1];
  const finished = currentStepIndex >= steps.length - 1;

  if (!currentStep) return <View style={styles.container} />;

  const f1Left = f1XAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const f2Left = f2XAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const refLeft = refXAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const fighterSize = viewportWidth >= 900 ? 190 : viewportWidth >= 600 ? 175 : 150;

  return (
    <View style={styles.container} testID="arena-preview-screen">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} testID="control-back" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={ARCADE.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ARENA PREVIEW</Text>
          {isSample && <Text style={styles.sampleBadge}>LOCAL SAMPLE FIXTURE - STYLIZED VECTOR APPROXIMATION (NO AI GENERATION)</Text>}
          {(!isSample && (f1Style.isApproximation || f2Style.isApproximation)) && (
            <Text style={styles.sampleBadge}>GENERATED RECORDS READY BEFORE BELL · APPROXIMATE VECTOR FEATURES MARKED</Text>
          )}
          {(!isSample && !f1Style.isApproximation && !f2Style.isApproximation) && (
            <Text style={styles.sampleBadge}>GENERATED RECORDS READY BEFORE BELL · BESPOKE HUMANOID PROFILES</Text>
          )}
        </View>
        <View style={{ width: 34 }} />
      </View>

      {/* Health Bars */}
      <View style={styles.meters}>
        <View style={styles.meterSide}>
          <Text style={styles.meterName} numberOfLines={1}>{f1.name.toUpperCase()}</Text>
          <Text style={styles.profileLabel} numberOfLines={1}>{f1Style.supportLabel}</Text>
          <HealthBar value={currentStep.f1Health} side="left" />
        </View>
        <View style={styles.meterCenter}><Text style={styles.vsText}>VS</Text></View>
        <View style={styles.meterSide}>
          <Text style={[styles.meterName, { textAlign: "right" }]} numberOfLines={1}>{f2.name.toUpperCase()}</Text>
          <Text style={[styles.profileLabel, { textAlign: "right" }]} numberOfLines={1}>{f2Style.supportLabel}</Text>
          <HealthBar value={currentStep.f2Health} side="right" />
        </View>
      </View>

      {/* Arena */}
      <View style={styles.arenaContainer}>
        <View style={styles.arena} testID="spectator-arena" accessibilityLabel={`${f1.name} versus ${f2.name} autonomous spectator arena`}>
          <LinearGradient colors={["#102e51", "#0a1c32"]} style={StyleSheet.absoluteFill} />
          <View style={styles.ringFloor} />

          <Animated.View style={[styles.fighterWrap, { left: f1Left }]}>
            <FighterSprite
              pose={currentStep.f1Pose}
              color={ARCADE.red}
              size={fighterSize}
              skinTone={f1Style.skinTone}
              trunksColor={f1Style.trunksColor}
              gloveColor={f1Style.gloveColor}
              bootColor={f1Style.bootColor}
              idleBehavior={f1Style.idleBehavior}
              accessories={f1Style.accessories}
              bodyType={f1Style.bodyType}
              heldProp={f1Style.heldProp}
              activeEffect={currentStep.f1Effect}
              paused={paused}
              reducedMotion={reducedMotion}
              testID="fighter-1-sprite"
            />
          </Animated.View>

          <Animated.View style={[styles.fighterWrap, { left: f2Left }]}>
            <FighterSprite
              pose={currentStep.f2Pose}
              color={ARCADE.blue}
              size={fighterSize}
              mirrored
              skinTone={f2Style.skinTone}
              trunksColor={f2Style.trunksColor}
              gloveColor={f2Style.gloveColor}
              bootColor={f2Style.bootColor}
              idleBehavior={f2Style.idleBehavior}
              accessories={f2Style.accessories}
              bodyType={f2Style.bodyType}
              heldProp={f2Style.heldProp}
              activeEffect={currentStep.f2Effect}
              paused={paused}
              reducedMotion={reducedMotion}
              testID="fighter-2-sprite"
            />
          </Animated.View>

          {currentStep.prop && (
            <Animated.View style={[styles.propWrap, { left: refLeft, top: `${currentStep.prop.y}%` }]} testID="referee-prop" accessibilityLabel={`Referee: ${currentStep.prop.text}`}>
              <View style={styles.refSprite}>
                <View style={styles.refHead} />
                <View style={styles.refBody} />
              </View>
              <Text style={styles.propText}>{currentStep.prop.text}</Text>
            </Animated.View>
          )}

          {currentStep.impact && (
            <View style={[styles.impactBurst, { left: `${currentStep.impact.x}%` }]} testID="impact-burst">
              <Text style={styles.impactText}>{currentStep.impact.text}</Text>
            </View>
          )}

          {finished && (
            <View style={styles.finishedOverlay}>
              <Text style={styles.winnerText}>
                {(currentStep.f1Health >= currentStep.f2Health ? f1.name : f2.name).toUpperCase()} WINS
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Captions */}
      <View style={styles.commentaryBox}>
        {currentStep.moveName && (
          <View style={styles.moveBanner} testID="move-banner" accessibilityLabel={`${currentStep.moveTier}: ${currentStep.moveName}`}>
            <Text style={styles.moveTier}>{currentStep.moveTier}</Text>
            <Text style={styles.moveName} numberOfLines={1}>{currentStep.moveName.toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.commentaryText}>{currentStep.commentary}</Text>
        {currentStep.approximationLabel && (
          <Text style={styles.approxLabel}>{currentStep.approximationLabel}</Text>
        )}
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={() => setPaused((value) => !value)} style={styles.controlBtn} testID="control-pause" accessibilityLabel={paused ? "Resume playback" : "Pause playback"}>
          <Ionicons name={paused ? "play" : "pause"} size={22} color={ARCADE.gold} />
          <Text style={styles.controlLabel}>{paused ? "RESUME" : "PAUSE"}</Text>
        </Pressable>
        <Pressable onPress={handleRematch} style={styles.controlBtn} testID="control-rematch" accessibilityLabel="Rematch">
          <Ionicons name="refresh" size={22} color={ARCADE.gold} />
          <Text style={styles.controlLabel}>REMATCH</Text>
        </Pressable>
        <Pressable onPress={handleMute} style={styles.controlBtn} testID="control-mute" accessibilityLabel={muted ? "Unmute audio" : "Mute audio"}>
          <Ionicons name={muted ? "volume-mute" : "volume-high"} size={22} color={ARCADE.gold} />
          <Text style={styles.controlLabel}>{muted ? "UNMUTE" : "MUTE"}</Text>
        </Pressable>
        <Pressable onPress={() => setReducedMotion(!reducedMotion)} style={styles.controlBtn} testID="control-reduce-motion" accessibilityLabel={reducedMotion ? "Enable full motion" : "Reduce motion"}>
          <Ionicons name={reducedMotion ? "accessibility" : "accessibility-outline"} size={22} color={ARCADE.gold} />
          <Text style={styles.controlLabel}>{reducedMotion ? "REDUCED" : "MOTION"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ARCADE.black },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: ARCADE.panel, borderBottomWidth: 2, borderBottomColor: ARCADE.border },
  backButton: { padding: 6 },
  headerCenter: { alignItems: "center", flex: 1, paddingHorizontal: 10 },
  headerTitle: { color: ARCADE.gold, fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 2, textAlign: "center" },
  sampleBadge: { color: ARCADE.textMuted, fontSize: 8, fontFamily: "Inter_700Bold", letterSpacing: 1, marginTop: 4, textAlign: "center" },
  meters: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: ARCADE.panel, borderBottomWidth: 2, borderBottomColor: ARCADE.border },
  meterSide: { flex: 1 },
  meterName: { color: ARCADE.white, fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 4 },
  profileLabel: { color: ARCADE.textMuted, fontSize: 7, fontFamily: "Inter_700Bold", letterSpacing: 0.6, marginBottom: 5 },
  meterCenter: { width: 30, alignItems: "center", justifyContent: "center" },
  vsText: { color: ARCADE.gold, fontSize: 10, fontFamily: "Inter_700Bold" },
  arenaContainer: { flex: 1, alignItems: "center", backgroundColor: "#000" },
  arena: { flex: 1, position: "relative", overflow: "hidden", width: "100%", maxWidth: 900 },
  ringFloor: { position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", backgroundColor: "#5b9bd6", borderTopWidth: 2, borderTopColor: "#fff" },
  fighterWrap: { position: "absolute", bottom: "4%", marginLeft: -95, width: 190, alignItems: "center", justifyContent: "flex-end" },
  propWrap: { position: "absolute", backgroundColor: ARCADE.gold, paddingHorizontal: 8, paddingVertical: 8, marginLeft: -40, width: 80, alignItems: "center", borderWidth: 2, borderColor: ARCADE.panel },
  propText: { color: ARCADE.panel, fontFamily: "Inter_700Bold", fontSize: 11, textAlign: "center", marginTop: 4 },
  refSprite: { width: 30, height: 60, alignItems: "center" },
  refHead: { width: 20, height: 20, backgroundColor: "#e0ac69", borderRadius: 10, marginBottom: 2, borderWidth: 1 },
  refBody: { flex: 1, width: 30, backgroundColor: "#fff", borderWidth: 2, borderStyle: "dashed", borderColor: "#000" },
  impactBurst: { position: "absolute", top: "43%", marginLeft: -48, minWidth: 96, minHeight: 48, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", backgroundColor: ARCADE.gold, borderWidth: 3, borderColor: ARCADE.red, transform: [{ rotate: "-8deg" }] },
  impactText: { color: ARCADE.black, fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 0.8, textAlign: "center" },
  finishedOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  winnerText: { color: ARCADE.gold, fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: 4, textShadowColor: ARCADE.red, textShadowRadius: 10 },
  commentaryBox: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: ARCADE.panel, borderTopWidth: 2, borderTopColor: ARCADE.border, minHeight: 96, justifyContent: "center" },
  moveBanner: { alignSelf: "center", minWidth: 210, maxWidth: "94%", paddingHorizontal: 12, paddingVertical: 5, marginBottom: 6, backgroundColor: "#17130b", borderWidth: 1, borderColor: ARCADE.gold, alignItems: "center" },
  moveTier: { color: ARCADE.gold, fontSize: 7, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  moveName: { color: ARCADE.white, fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.8, marginTop: 2 },
  commentaryText: { color: ARCADE.white, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 20, textAlign: "center" },
  approxLabel: { color: ARCADE.gold, fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1, marginTop: 4, textAlign: "center", opacity: 0.8 },
  controls: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, paddingTop: 16, backgroundColor: ARCADE.black, borderTopWidth: 2, borderTopColor: ARCADE.border },
  controlBtn: { alignItems: "center", justifyContent: "center", padding: 8 },
  controlLabel: { color: ARCADE.gold, fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1, marginTop: 6 },
});