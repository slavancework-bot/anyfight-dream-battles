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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBattle } from "@/context/BattleContext";
import { useBattleSounds } from "@/hooks/useBattleSounds";
import FighterSprite, { type FighterPose } from "@/components/FighterSprite";
import { HealthBar, personalityFor } from "@/components/ArcadeFight";
import type { Fighter } from "@/types";

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

function deriveFighterStyle(f: Fighter) {
  const text = (f.name + " " + f.outfitDescription + " " + f.imagePrompt + " " + f.biography + " " + f.category).toLowerCase();
  const identityHash = text.split("").reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
  
  let skinTone = "#b87855";
  let trunksColor = "#e52e21";
  let gloveColor = "#e52e21";
  let bootColor = "#f1efe2";
  let idleBehavior: any = "bounce";
  let accessories: any = {};
  
  if (text.includes("bean")) {
    accessories = { suit: "#5c4033", tie: "#cc0000", hair: "#1a1a1a" };
    gloveColor = "#d2b48c";
    bootColor = "#1a1a1a";
    idleBehavior = "stumble";
  } else if (text.includes("vader")) {
    accessories = { armor: "#111111", helmet: "#000000", cape: "#0a0a0a" };
    skinTone = "#222222";
    trunksColor = "#111111";
    gloveColor = "#000000";
    bootColor = "#000000";
    idleBehavior = "breathe";
  } else if (text.includes("batman")) {
    accessories = { armor: "#222222", cape: "#111111", helmet: "#1a1a1a" };
    trunksColor = "#222222";
    gloveColor = "#1a1a1a";
    bootColor = "#1a1a1a";
    idleBehavior = "guard";
  } else if (text.includes("tyson")) {
    trunksColor = "#111111";
    bootColor = "#111111";
    idleBehavior = "stalk";
  } else if (text.includes("ali")) {
    trunksColor = "#f7efe0";
    idleBehavior = "dance";
  } else {
    const isBlue = identityHash % 2 === 0;
    const recordColor =
      text.includes("green") ? "#268a48"
        : text.includes("purple") ? "#6f3ca7"
          : text.includes("gold") || text.includes("yellow") ? "#d9a61f"
            : text.includes("white") ? "#e9e5da"
              : text.includes("black") ? "#171717"
                : isBlue ? "#1267dd" : "#e52e21";
    trunksColor = recordColor;
    gloveColor = recordColor;
    if (/(helmet|mask|hood)/.test(text)) accessories.helmet = "#20242b";
    if (/(cape|cloak)/.test(text)) accessories.cape = "#171717";
    if (/(armor|armour|robot|cyborg)/.test(text)) accessories.armor = "#343942";
    if (/(suit|tuxedo|formal)/.test(text)) accessories.suit = recordColor;
    if (text.includes("tie")) accessories.tie = "#b51f1f";
    if (/(robe|wizard|monk)/.test(text)) accessories.robe = recordColor;
    if (/(hair|afro|mohawk|ponytail)/.test(text)) accessories.hair = "#2a1710";
    if (f.outfitChoice === "wrestling") {
      gloveColor = "#f2b92f";
      bootColor = "#f7efe0";
    }
  }
  
  return { skinTone, trunksColor, gloveColor, bootColor, idleBehavior, accessories };
}

export type Step = {
  id: string;
  duration: number;
  f1X: number;
  f2X: number;
  f1Pose: FighterPose;
  f2Pose: FighterPose;
  commentary?: string;
  f1Health: number;
  f2Health: number;
  prop?: { type: "ref"; x: number; y: number; text: string };
  sound?: "light" | "heavy" | "special" | "ultimate" | "ko" | "crowd" | "roundStart";
};

class ScriptBuilder {
  steps: Step[] = [];
  f1X = 15;
  f2X = 85;
  f1Health = 100;
  f2Health = 100;
  commentary = "";

  add(step: Partial<Step> & { duration: number }) {
    this.f1X = step.f1X ?? this.f1X;
    this.f2X = step.f2X ?? this.f2X;
    this.f1Health = Math.max(0, Math.min(100, step.f1Health ?? this.f1Health));
    this.f2Health = Math.max(0, Math.min(100, step.f2Health ?? this.f2Health));
    this.commentary = step.commentary ?? this.commentary;
    this.steps.push({
      id: Math.random().toString(),
      duration: step.duration,
      f1X: this.f1X,
      f2X: this.f2X,
      f1Pose: step.f1Pose ?? "idle",
      f2Pose: step.f2Pose ?? "idle",
      commentary: this.commentary,
      f1Health: this.f1Health,
      f2Health: this.f2Health,
      prop: step.prop,
      sound: step.sound,
    });
  }
}

function buildFightScript(f1: Fighter, f2: Fighter, seed: number): Step[] {
  const b = new ScriptBuilder();
  const p1 = personalityFor(f1);
  const p2 = personalityFor(f2);
  
  // Use seed to determine flow
  const r = (idx: number) => {
    const x = Math.sin(seed + idx) * 10000;
    return x - Math.floor(x);
  };
  
  b.add({
    duration: 3000,
    f1Pose: "idle", f2Pose: "idle",
    commentary: `The crowd settles as ${f1.name} and ${f2.name} take their corners.`,
    sound: "roundStart"
  });

  const order = ["approach"];
  const traitWeight: Record<string, number> = {
    showboat: p1.showmanship + p2.showmanship,
    retreat: p1.cowardice + p2.cowardice,
    fakeout: f1.stats.intelligence + f2.stats.intelligence + p1.discipline + p2.discipline,
    refGag: p1.humor + p2.humor + p1.dirtyFighting + p2.dirtyFighting + p1.temper + p2.temper,
  };
  const personalityOrder = Object.keys(traitWeight).sort(
      (left, right) => traitWeight[right] * (0.65 + r(right.length)) - traitWeight[left] * (0.65 + r(left.length)),
  );
  order.push(...personalityOrder);
  order.push(personalityOrder[0]);
  order.push("knockdown");

  const p1Aggr = (f1.stats.power + f1.stats.speed + p1.aggression) * (0.7 + r(10));
  const p2Aggr = (f2.stats.power + f2.stats.speed + p2.aggression) * (0.7 + r(11));

  for (let i = 0; i < order.length; i++) {
    const seq = order[i];
    if (seq === "approach") {
      b.add({ duration: 800, f1X: 30, f2X: 70, f1Pose: "stepForward", f2Pose: "stepForward", commentary: `They step into contact range...` });
      b.add({ duration: 800, f1X: 35, f2X: 65, f1Pose: "idle", f2Pose: "idle" });
      if (p1Aggr > p2Aggr) {
        b.add({ duration: 300, f1X: 45, f1Pose: "jab", f2Pose: "hit", f2Health: b.f2Health - 4, sound: "light" });
        b.add({ duration: 1500, f1Pose: "idle", f2Pose: "stagger", f2X: 70, commentary: `${f1.name} strikes first with a quick jab.` });
      } else {
        b.add({ duration: 300, f2X: 55, f2Pose: "jab", f1Pose: "hit", f1Health: b.f1Health - 4, sound: "light" });
        b.add({ duration: 1500, f2Pose: "idle", f1Pose: "stagger", f1X: 30, commentary: `${f2.name} snaps out a fast jab.` });
      }
      b.add({ duration: 600, f1Pose: "idle", f2Pose: "idle", f1X: 35, f2X: 65 });
    }
    else if (seq === "showboat") {
      const showboater = p1.showmanship * (0.7 + r(i)) >= p2.showmanship * (0.7 + r(i + 20)) ? 1 : 2;
      if (showboater === 1) {
        b.add({ duration: 1500, f1Pose: "winner", f2Pose: "idle", commentary: `${f1.name} plays to the crowd.` });
        b.add({ duration: 600, f1Pose: "winner", f2Pose: "stepForward", f2X: 55 });
        b.add({ duration: 400, f2Pose: "hook", f1Pose: "hit", f1Health: b.f1Health - 12, sound: "heavy", commentary: `${f2.name} interrupts the performance with a heavy hook!` });
        b.add({ duration: 1000, f2Pose: "idle", f1Pose: "stagger", f1X: 25 });
      } else {
        b.add({ duration: 1500, f2Pose: "winner", f1Pose: "idle", commentary: `${f2.name} starts grandstanding.` });
        b.add({ duration: 600, f2Pose: "winner", f1Pose: "stepForward", f1X: 45 });
        b.add({ duration: 400, f1Pose: "hook", f2Pose: "hit", f2Health: b.f2Health - 12, sound: "heavy", commentary: `${f1.name} lands a brutal reality check!` });
        b.add({ duration: 1000, f1Pose: "idle", f2Pose: "stagger", f2X: 75 });
      }
      b.add({ duration: 600, f1Pose: "idle", f2Pose: "idle", f1X: 35, f2X: 65 });
    }
    else if (seq === "retreat") {
      const coward = p1.cowardice * (0.7 + r(i)) >= p2.cowardice * (0.7 + r(i + 20)) ? 1 : 2;
      if (coward === 1) {
        b.add({ duration: 1500, f2Pose: "stepForward", f2X: 55, f1Pose: "stepBack", f1X: 25, commentary: `${f1.name} looks nervous and retreats.` });
        b.add({ duration: 600, f2Pose: "stepForward", f2X: 45, f1Pose: "stepBack", f1X: 15 });
        b.add({ duration: 1500, f1Pose: "stagger", commentary: `And stumbles backwards unprovoked.` });
      } else {
        b.add({ duration: 1500, f1Pose: "stepForward", f1X: 45, f2Pose: "stepBack", f2X: 75, commentary: `${f2.name} yields space very quickly.` });
        b.add({ duration: 600, f1Pose: "stepForward", f1X: 55, f2Pose: "stepBack", f2X: 85 });
        b.add({ duration: 1500, f2Pose: "stagger", commentary: `A completely unforced error!` });
      }
      b.add({ duration: 800, f1Pose: "idle", f2Pose: "idle", f1X: 35, f2X: 65 });
    }
    else if (seq === "fakeout") {
      const faker = (f1.stats.intelligence + p1.discipline) * (0.7 + r(i)) >= (f2.stats.intelligence + p2.discipline) * (0.7 + r(i + 20)) ? 1 : 2;
      if (faker === 1) {
        b.add({ duration: 1500, f1Pose: "jab", f2Pose: "block", commentary: `${f1.name} winds up for a massive swing.` });
        b.add({ duration: 600, f1Pose: "idle", f2Pose: "block", commentary: `${f2.name} bites hard on the feint!` });
        b.add({ duration: 500, f1Pose: "uppercut", f2Pose: "hit", f2Health: b.f2Health - 14, sound: "special", commentary: `The real punch lands flush through the guard!` });
        b.add({ duration: 1000, f1Pose: "idle", f2Pose: "stagger", f2X: 75 });
      } else {
        b.add({ duration: 1500, f2Pose: "jab", f1Pose: "block", commentary: `${f2.name} telegraphs a devastating attack.` });
        b.add({ duration: 600, f2Pose: "idle", f1Pose: "block", commentary: `${f1.name} commits to the block!` });
        b.add({ duration: 500, f2Pose: "uppercut", f1Pose: "hit", f1Health: b.f1Health - 14, sound: "special", commentary: `And eats a massive uppercut instead!` });
        b.add({ duration: 1000, f2Pose: "idle", f1Pose: "stagger", f1X: 25 });
      }
      b.add({ duration: 600, f1Pose: "idle", f2Pose: "idle", f1X: 35, f2X: 65 });
    }
    else if (seq === "refGag") {
      b.add({ duration: 1500, f1Pose: "idle", f2Pose: "idle", f1X: 25, f2X: 75, prop: { type: "ref", x: 50, y: 55, text: "WAIT!" }, commentary: `The referee suddenly steps in.` });
      b.add({ duration: 1200, prop: { type: "ref", x: 50, y: 55, text: "NO HITTING!" }, commentary: `They both stare in disbelief.` });
      const hitter = (p1.temper + p1.dirtyFighting) * (0.7 + r(i)) >= (p2.temper + p2.dirtyFighting) * (0.7 + r(i + 20)) ? 1 : 2;
      if (hitter === 1) {
        b.add({ duration: 600, f1Pose: "jab", f1X: 35, prop: { type: "ref", x: 40, y: 55, text: "OUCH!" }, commentary: `${f1.name} loses patience and swings.` });
        b.add({ duration: 1500, f1Pose: "idle", f2Pose: "stagger", f2Health: b.f2Health - 5, sound: "heavy", commentary: `Accidentally hitting the ref into ${f2.name}!` });
      } else {
        b.add({ duration: 600, f2Pose: "jab", f2X: 65, prop: { type: "ref", x: 60, y: 55, text: "OUCH!" }, commentary: `${f2.name} decides negotiations are over.` });
        b.add({ duration: 1500, f2Pose: "idle", f1Pose: "stagger", f1Health: b.f1Health - 5, sound: "heavy", commentary: `Knocking the official right into ${f1.name}!` });
      }
      b.add({ duration: 600, f1Pose: "idle", f2Pose: "idle", f1X: 35, f2X: 65 });
    }
    else if (seq === "knockdown") {
      const winner = b.f1Health >= b.f2Health ? 1 : 2;
      if (winner === 1) {
        b.add({ duration: 1200, f1Pose: "stepForward", f1X: 45, f2Pose: "idle", commentary: `${f1.name} pushes forward for the finish.` });
        b.add({ duration: 600, f1Pose: "attack", f2Pose: "hit", f2Health: 0, sound: "ultimate", commentary: `A devastating final blow connects!` });
        b.add({ duration: 2500, f1Pose: "winner", f2Pose: "knockdown", f2X: 75, sound: "ko", commentary: `The referee waves it off. ${f1.name} stands victorious.` });
      } else {
        b.add({ duration: 1200, f2Pose: "stepForward", f2X: 55, f1Pose: "idle", commentary: `${f2.name} pushes forward for the finish.` });
        b.add({ duration: 600, f2Pose: "attack", f1Pose: "hit", f1Health: 0, sound: "ultimate", commentary: `An absolute thunderbolt connects!` });
        b.add({ duration: 2500, f2Pose: "winner", f1Pose: "knockdown", f1X: 25, sound: "ko", commentary: `It's all over! ${f2.name} takes the dramatic win.` });
      }
    }
  }

  b.add({
    duration: 10000,
    f1Pose: b.f1Health > 0 ? "winner" : "knockdown",
    f2Pose: b.f2Health > 0 ? "winner" : "knockdown",
    commentary: `Bout finished.`
  });

  return b.steps;
}

export default function ArenaPreviewScreen() {
  const insets = useSafeAreaInsets();
  const { sample } = useLocalSearchParams();
  const battleCtx = useBattle();
  
  const isSample = sample === "1" || !battleCtx.fighter1 || !battleCtx.fighter2;
  const f1 = isSample ? SAMPLE_FIGHTER_1 : battleCtx.fighter1!;
  const f2 = isSample ? SAMPLE_FIGHTER_2 : battleCtx.fighter2!;
  
  const f1Style = useMemo(() => deriveFighterStyle(f1), [f1]);
  const f2Style = useMemo(() => deriveFighterStyle(f2), [f2]);

  const [seed, setSeed] = useState(Date.now());
  const steps = useMemo(() => buildFightScript(f1, f2, seed), [f1, f2, seed]);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const { play: playSound } = useBattleSounds();

  const f1XAnim = useRef(new Animated.Value(15)).current;
  const f2XAnim = useRef(new Animated.Value(85)).current;
  
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepStartedAtRef = useRef(0);
  const stepDurationRef = useRef(0);
  const remainingDurationRef = useRef<number | null>(null);
  const playSoundRef = useRef(playSound);
  playSoundRef.current = playSound;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReducedMotion);
    return () => sub.remove();
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
      ]).start();
    } else {
      f1XAnim.setValue(step.f1X);
      f2XAnim.setValue(step.f2X);
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
  }, [currentStepIndex, paused, reducedMotion, seed]);

  const handleRematch = () => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    stepStartedAtRef.current = 0;
    stepDurationRef.current = 0;
    remainingDurationRef.current = null;
    setSeed(Date.now());
    setCurrentStepIndex(0);
    f1XAnim.setValue(15);
    f2XAnim.setValue(85);
    setPaused(false);
  };

  const currentStep = steps[currentStepIndex] || steps[steps.length - 1];
  const finished = currentStepIndex >= steps.length - 1;

  if (!currentStep) return <View style={styles.container} />;

  const f1Left = f1XAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const f2Left = f2XAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={ARCADE.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ARENA PREVIEW</Text>
          {isSample && <Text style={styles.sampleBadge}>LOCAL SAMPLE FIXTURE - STYLIZED VECTOR APPROXIMATION (NO AI GENERATION)</Text>}
          {!isSample && <Text style={styles.sampleBadge}>SUPPORTS HUMANOID VECTOR BODIES</Text>}
        </View>
        <View style={{ width: 34 }} />
      </View>

      {/* Health Bars */}
      <View style={styles.meters}>
        <View style={styles.meterSide}>
          <Text style={styles.meterName} numberOfLines={1}>{f1.name.toUpperCase()}</Text>
          <HealthBar value={currentStep.f1Health} side="left" />
        </View>
        <View style={styles.meterCenter}><Text style={styles.vsText}>VS</Text></View>
        <View style={styles.meterSide}>
          <Text style={[styles.meterName, { textAlign: "right" }]} numberOfLines={1}>{f2.name.toUpperCase()}</Text>
          <HealthBar value={currentStep.f2Health} side="right" />
        </View>
      </View>

      {/* Arena */}
      <View style={styles.arenaContainer}>
        <View style={styles.arena}>
          <LinearGradient colors={["#102e51", "#0a1c32"]} style={StyleSheet.absoluteFill} />
          <View style={styles.ringFloor} />
          
          <Animated.View style={[styles.fighterWrap, { left: f1Left }]}>
            <FighterSprite 
              pose={currentStep.f1Pose} 
              color={ARCADE.red} 
              size={130} 
              skinTone={f1Style.skinTone}
              trunksColor={f1Style.trunksColor}
              gloveColor={f1Style.gloveColor}
              bootColor={f1Style.bootColor}
              idleBehavior={f1Style.idleBehavior}
              accessories={f1Style.accessories}
            />
          </Animated.View>
          
          <Animated.View style={[styles.fighterWrap, { left: f2Left }]}>
            <FighterSprite 
              pose={currentStep.f2Pose} 
              color={ARCADE.blue} 
              size={130} 
              mirrored 
              skinTone={f2Style.skinTone}
              trunksColor={f2Style.trunksColor}
              gloveColor={f2Style.gloveColor}
              bootColor={f2Style.bootColor}
              idleBehavior={f2Style.idleBehavior}
              accessories={f2Style.accessories}
            />
          </Animated.View>

          {currentStep.prop && (
            <View style={[styles.propWrap, { left: `${currentStep.prop.x}%`, top: `${currentStep.prop.y}%` }]}>
              <View style={styles.refSprite}>
                <View style={styles.refHead} />
                <View style={styles.refBody} />
              </View>
              <Text style={styles.propText}>{currentStep.prop.text}</Text>
            </View>
          )}

          {(currentStep.f1Pose === "hit" || currentStep.f2Pose === "hit") && (
            <View style={styles.impactBurst}>
              <Text style={styles.impactText}>POW!</Text>
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
        <Text style={styles.commentaryText}>{currentStep.commentary}</Text>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={() => setPaused((value) => !value)} style={styles.controlBtn}>
          <Ionicons name={paused ? "play" : "pause"} size={22} color={ARCADE.gold} />
          <Text style={styles.controlLabel}>{paused ? "RESUME" : "PAUSE"}</Text>
        </Pressable>
        <Pressable onPress={handleRematch} style={styles.controlBtn}>
          <Ionicons name="refresh" size={22} color={ARCADE.gold} />
          <Text style={styles.controlLabel}>REMATCH</Text>
        </Pressable>
        <Pressable onPress={() => setMuted(!muted)} style={styles.controlBtn}>
          <Ionicons name={muted ? "volume-mute" : "volume-high"} size={22} color={ARCADE.gold} />
          <Text style={styles.controlLabel}>{muted ? "UNMUTE" : "MUTE"}</Text>
        </Pressable>
        <Pressable onPress={() => setReducedMotion(!reducedMotion)} style={styles.controlBtn}>
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
  meterCenter: { width: 30, alignItems: "center", justifyContent: "center" },
  vsText: { color: ARCADE.gold, fontSize: 10, fontFamily: "Inter_700Bold" },
  arenaContainer: { flex: 1, alignItems: "center", backgroundColor: "#000" },
  arena: { flex: 1, position: "relative", overflow: "hidden", width: "100%", maxWidth: 600 },
  ringFloor: { position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", backgroundColor: "#5b9bd6", borderTopWidth: 2, borderTopColor: "#fff" },
  fighterWrap: { position: "absolute", bottom: "10%", marginLeft: -65, width: 130, alignItems: "center", justifyContent: "flex-end" },
  propWrap: { position: "absolute", backgroundColor: ARCADE.gold, paddingHorizontal: 8, paddingVertical: 8, marginLeft: -40, width: 80, alignItems: "center", borderWidth: 2, borderColor: ARCADE.panel },
  propText: { color: ARCADE.panel, fontFamily: "Inter_700Bold", fontSize: 11, textAlign: "center", marginTop: 4 },
  refSprite: { width: 30, height: 60, alignItems: "center" },
  refHead: { width: 20, height: 20, backgroundColor: "#e0ac69", borderRadius: 10, marginBottom: 2, borderWidth: 1 },
  refBody: { flex: 1, width: 30, backgroundColor: "#fff", borderWidth: 2, borderStyle: "dashed", borderColor: "#000" },
  impactBurst: { position: "absolute", left: "50%", top: "48%", marginLeft: -34, width: 68, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: ARCADE.gold, borderWidth: 3, borderColor: ARCADE.red, transform: [{ rotate: "-8deg" }] },
  impactText: { color: ARCADE.black, fontFamily: "Inter_700Bold", fontSize: 15, letterSpacing: 1 },
  finishedOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  winnerText: { color: ARCADE.gold, fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: 4, textShadowColor: ARCADE.red, textShadowRadius: 10 },
  commentaryBox: { padding: 16, backgroundColor: ARCADE.panel, borderTopWidth: 2, borderTopColor: ARCADE.border, minHeight: 90, justifyContent: "center" },
  commentaryText: { color: ARCADE.white, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 20, textAlign: "center" },
  controls: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, paddingTop: 16, backgroundColor: ARCADE.black, borderTopWidth: 2, borderTopColor: ARCADE.border },
  controlBtn: { alignItems: "center", justifyContent: "center", padding: 8 },
  controlLabel: { color: ARCADE.gold, fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1, marginTop: 6 },
});