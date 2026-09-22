import type { Fighter } from "@/types";
import type { FighterPose } from "@/components/FighterSprite";
import { EffectType, getFighterProfileText, movePresentation } from "./fighter-profile";

export type Step = {
  id: string;
  duration: number;
  f1X: number;
  f2X: number;
  f1Pose: FighterPose;
  f2Pose: FighterPose;
  f1Effect?: EffectType;
  f2Effect?: EffectType;
  commentary?: string;
  f1Health: number;
  f2Health: number;
  prop?: { type: "ref"; x: number; y: number; text: string };
  impact?: { x: number; text: string };
  sound?: "light" | "heavy" | "special" | "ultimate" | "ko" | "crowd" | "roundStart";
  approximationLabel?: string;
  moveName?: string;
  moveTier?: "SIGNATURE MOVE" | "ULTIMATE FINISHER";
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
      id: `arena-step-${this.steps.length + 1}`,
      duration: step.duration,
      f1X: this.f1X,
      f2X: this.f2X,
      f1Pose: step.f1Pose ?? "idle",
      f2Pose: step.f2Pose ?? "idle",
      f1Effect: step.f1Effect,
      f2Effect: step.f2Effect,
      commentary: this.commentary,
      f1Health: this.f1Health,
      f2Health: this.f2Health,
      prop: step.prop,
      impact: step.impact,
      sound: step.sound,
      approximationLabel: step.approximationLabel,
      moveName: step.moveName,
      moveTier: step.moveTier,
    });
  }
}

function sfc32(a: number, b: number, c: number, d: number) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

function seqRefGag(b: ScriptBuilder, hitter: 1 | 2, f1: Fighter, f2: Fighter) {
  b.add({ duration: 1500, f1Pose: "idle", f2Pose: "idle", f1X: 25, f2X: 75, prop: { type: "ref", x: 50, y: 55, text: "WAIT!" }, commentary: `The referee suddenly steps in.` });
  b.add({ duration: 1200, prop: { type: "ref", x: 50, y: 55, text: "NO HITTING!" }, commentary: `They both stare in disbelief.` });
  if (hitter === 1) {
    b.add({ duration: 600, f1Pose: "uppercut", f1X: 35, prop: { type: "ref", x: 40, y: 55, text: "OUCH!" }, commentary: `${f1.name} loses patience and swings.` });
    b.add({ duration: 300, f1Pose: "idle", f2Pose: "idle", prop: { type: "ref", x: 60, y: 55, text: "WHOA!" } });
    b.add({ duration: 450, f1Pose: "idle", f2Pose: "idle", prop: { type: "ref", x: 72, y: 55, text: "INCOMING!" }, commentary: `The official flies toward ${f2.name}.` });
    b.add({ duration: 550, f1Pose: "idle", f2Pose: "stagger", f2Health: b.f2Health - 5, sound: "heavy", prop: { type: "ref", x: 72, y: 55, text: "BAM!" }, impact: { x: 72, text: "REF-BALL!" }, commentary: `The airborne official collides with ${f2.name}!` });
  } else {
    b.add({ duration: 600, f2Pose: "uppercut", f2X: 65, prop: { type: "ref", x: 60, y: 55, text: "OUCH!" }, commentary: `${f2.name} decides negotiations are over.` });
    b.add({ duration: 300, f1Pose: "idle", f2Pose: "idle", prop: { type: "ref", x: 40, y: 55, text: "WHOA!" } });
    b.add({ duration: 450, f1Pose: "idle", f2Pose: "idle", prop: { type: "ref", x: 28, y: 55, text: "INCOMING!" }, commentary: `The official flies toward ${f1.name}.` });
    b.add({ duration: 550, f2Pose: "idle", f1Pose: "stagger", f1Health: b.f1Health - 5, sound: "heavy", prop: { type: "ref", x: 28, y: 55, text: "BAM!" }, impact: { x: 28, text: "REF-BALL!" }, commentary: `The airborne official collides with ${f1.name}!` });
  }
  b.add({ duration: 600, f1Pose: "idle", f2Pose: "idle", f1X: 35, f2X: 65 });
}

function seqIdentityGag(b: ScriptBuilder, actor: 1 | 2, f1: Fighter, f2: Fighter) {
  const featured = actor === 1 ? f1 : f2;
  const other = actor === 1 ? f2 : f1;
  const text = getFighterProfileText(featured);
  const actorPose = (pose: FighterPose) => ({
    f1Pose: actor === 1 ? pose : "idle" as FighterPose,
    f2Pose: actor === 2 ? pose : "idle" as FighterPose,
  });
  const otherPose = (pose: FighterPose) => ({
    f1Pose: actor === 1 ? "idle" as FighterPose : pose,
    f2Pose: actor === 2 ? "idle" as FighterPose : pose,
  });

  if (/\b(mr\.?\s*bean|bean)\b/.test(text)) {
    b.add({ duration: 1100, ...actorPose("useProp"), commentary: `${featured.name} stops to straighten Teddy's tie. The fight also stops, somehow.` });
    b.add({ duration: 900, ...otherPose("stepForward"), f1X: 38, f2X: 62, commentary: `${other.name} approaches the completely undefended target...` });
    b.add({ duration: 420, ...actorPose("dodge"), commentary: `${featured.name} bends down to retrieve a dropped button.` });
    b.add({ duration: 350, ...otherPose("idle"), prop: { type: "ref", x: actor === 1 ? 72 : 28, y: 55, text: "INCOMING!" }, commentary: `The official cannot find the brakes.` });
    b.add({
      duration: 350,
      ...otherPose("stagger"),
      f1Health: actor === 2 ? b.f1Health - 7 : b.f1Health,
      f2Health: actor === 1 ? b.f2Health - 7 : b.f2Health,
      impact: { x: actor === 1 ? 28 : 72, text: "WHOOPS!" },
      sound: "heavy",
      commentary: `${other.name} sails past and loses an argument with the corner post.`,
    });
  } else if (/\b(shrek|ogre)\b/.test(text)) {
    b.add({ duration: 1000, ...actorPose("roar"), f1Effect: actor === 1 ? "roar" : undefined, f2Effect: actor === 2 ? "roar" : undefined, prop: { type: "ref", x: 50, y: 55, text: "easy..." }, commentary: `${featured.name} fills both lungs. The referee immediately regrets standing nearby.` });
    b.add({ duration: 900, ...actorPose("roar"), prop: { type: "ref", x: actor === 1 ? 68 : 32, y: 48, text: "AAAA!" }, commentary: `The roar sends the official skidding across the canvas.` });
    b.add({
      duration: 700,
      ...otherPose("stagger"),
      f1Health: actor === 2 ? b.f1Health - 6 : b.f1Health,
      f2Health: actor === 1 ? b.f2Health - 6 : b.f2Health,
      prop: { type: "ref", x: actor === 1 ? 72 : 28, y: 55, text: "SORRY!" },
      impact: { x: actor === 1 ? 72 : 28, text: "OGRE-ECHO!" },
      sound: "crowd",
      commentary: `One frightened referee later, ${other.name} takes collateral damage.`,
    });
  } else if (/\b(gandalf|wizard|sorcerer|mage)\b/.test(text)) {
    b.add({ duration: 1100, ...actorPose("cast"), f1Effect: actor === 1 ? "sparkle" : undefined, f2Effect: actor === 2 ? "sparkle" : undefined, commentary: `${featured.name} begins an ancient incantation with excellent posture.` });
    b.add({ duration: 900, ...actorPose("idle"), prop: { type: "ref", x: 50, y: 55, text: "Bless you?" }, commentary: `A dramatic pause. A tiny magical sneeze. The referee checks the rulebook.` });
    b.add({
      duration: 700,
      ...otherPose("hit"),
      f1Health: actor === 2 ? b.f1Health - 6 : b.f1Health,
      f2Health: actor === 1 ? b.f2Health - 6 : b.f2Health,
      f1Effect: actor === 1 ? "energy" : undefined,
      f2Effect: actor === 2 ? "energy" : undefined,
      impact: { x: actor === 1 ? 62 : 38, text: "ACHOO-CANE!" },
      sound: "special",
      commentary: `The sneeze becomes a suspiciously effective spell and catches ${other.name}.`,
    });
  } else {
    b.add({ duration: 1000, ...actorPose("winner"), commentary: `${featured.name} poses for a camera that is not there.` });
    b.add({ duration: 700, ...otherPose("stepForward"), f1X: 38, f2X: 62, commentary: `${other.name} waits politely for the pose to finish.` });
    b.add({
      duration: 500,
      ...otherPose("uppercut"),
      f1Health: actor === 1 ? b.f1Health - 9 : b.f1Health,
      f2Health: actor === 2 ? b.f2Health - 9 : b.f2Health,
      impact: { x: actor === 1 ? 38 : 62, text: "PHOTO-BOMB!" },
      sound: "heavy",
      commentary: `It does not. ${other.name} edits the portrait with an uppercut.`,
    });
  }
  b.add({ duration: 900, f1Pose: actor === 1 ? "idle" : "stagger", f2Pose: actor === 2 ? "idle" : "stagger", f1X: 32, f2X: 68, commentary: `The crowd gives the sequence a confused standing ovation.` });
}

function seqComedy(b: ScriptBuilder, r: number, f1: Fighter, f2: Fighter, selectedGag?: number) {
  const actor = r < 0.5 ? 1 : 2;
  const gagType = selectedGag ?? Math.floor(r * 100) % 4;
  if (gagType === 0) {
    seqRefGag(b, actor, f1, f2);
  } else if (gagType === 1) {
    b.add({ duration: 1000, f1Pose: actor === 1 ? "idle" : "block", f2Pose: actor === 2 ? "idle" : "block", commentary: `${actor === 1 ? f1.name : f2.name} points off in the distance!` });
    b.add({ duration: 800, f1Pose: "idle", f2Pose: "idle", commentary: `${actor === 1 ? f2.name : f1.name} turns to look...` });
    b.add({ duration: 350, f1Pose: actor === 1 ? "stepForward" : "idle", f2Pose: actor === 2 ? "stepForward" : "idle", f1X: 42, f2X: 58, commentary: `${actor === 1 ? f1.name : f2.name} closes the distance while nobody is watching.` });
    b.add({ duration: 500, f1Pose: actor === 1 ? "hook" : "hit", f2Pose: actor === 2 ? "hook" : "hit", f1Health: actor === 2 ? b.f1Health - 8 : b.f1Health, f2Health: actor === 1 ? b.f2Health - 8 : b.f2Health, impact: { x: actor === 1 ? 62 : 38, text: "LOOK OVER THERE!" }, sound: "heavy", commentary: `WHACK! The oldest trick in the book works again.` });
    b.add({ duration: 1000, f1Pose: actor === 1 ? "idle" : "stagger", f2Pose: actor === 2 ? "idle" : "stagger", f1X: 35, f2X: 65 });
  } else if (gagType === 2) {
    b.add({ duration: 1500, f1Pose: actor === 1 ? "winner" : "idle", f2Pose: actor === 2 ? "winner" : "idle", commentary: `${actor === 1 ? f1.name : f2.name} starts celebrating way too early.` });
    b.add({ duration: 400, f1X: 45, f2X: 55, f1Pose: actor === 1 ? "winner" : "stepForward", f2Pose: actor === 2 ? "winner" : "stepForward" });
    b.add({ duration: 400, f1Pose: actor === 1 ? "hit" : "uppercut", f2Pose: actor === 2 ? "hit" : "uppercut", f1Health: actor === 1 ? b.f1Health - 12 : b.f1Health, f2Health: actor === 2 ? b.f2Health - 12 : b.f2Health, impact: { x: actor === 1 ? 45 : 55, text: "TOO SOON!" }, sound: "special", commentary: `And immediately pays the price for hubris!` });
    b.add({ duration: 1000, f1Pose: actor === 1 ? "stagger" : "idle", f2Pose: actor === 2 ? "stagger" : "idle", f1X: 35, f2X: 65 });
  } else {
    seqIdentityGag(b, actor, f1, f2);
  }
}

function seqSignature(b: ScriptBuilder, attacker: 1 | 2, f1: Fighter, f2: Fighter, isUltimate: boolean) {
  const fA = attacker === 1 ? f1 : f2;
  const fD = attacker === 1 ? f2 : f1;
  const moveDescription = isUltimate ? fA.ultimateFinisher : fA.signatureMove;
  const moveName = moveDescription.split(/\s+[—–]\s+|\s+-\s+/)[0]?.trim() || moveDescription;
  const presentation = movePresentation(fA, moveDescription);
  const moveType = presentation.type;
  const dmg = isUltimate ? 100 : 15;

  const approxLabel = presentation.label;

  const moveTier = isUltimate ? "ULTIMATE FINISHER" as const : "SIGNATURE MOVE" as const;

  b.add({ duration: 1000, f1X: 35, f2X: 65, f1Pose: "idle", f2Pose: "idle", moveName, moveTier, commentary: `${fA.name} prepares for ${isUltimate ? "the finisher" : "their signature"}...` });

  if (moveType === "spell") {
    b.add({
      duration: 1000,
      f1Pose: attacker === 1 ? "cast" : "idle",
      f2Pose: attacker === 2 ? "cast" : "idle",
      f1Effect: attacker === 1 ? presentation.effect : undefined,
      f2Effect: attacker === 2 ? presentation.effect : undefined,
      commentary: `${fA.name} uses ${moveName}!`,
      approximationLabel: approxLabel,
      moveName,
      moveTier,
      sound: "special"
    });
    b.add({
      duration: 800,
      f1Pose: attacker === 1 ? "idle" : isUltimate ? "knockdown" : "stagger",
      f2Pose: attacker === 2 ? "idle" : isUltimate ? "knockdown" : "stagger",
      f1Health: attacker === 2 ? b.f1Health - dmg : b.f1Health,
      f2Health: attacker === 1 ? b.f2Health - dmg : b.f2Health,
      impact: { x: attacker === 1 ? 62 : 38, text: isUltimate ? "ARCANE FINALE!" : "SPELLBOUND!" },
      commentary: `Magic connects with ${fD.name}!`
    });
  } else if (moveType === "roar") {
    b.add({
      duration: 1200,
      f1Pose: attacker === 1 ? "roar" : "idle",
      f2Pose: attacker === 2 ? "roar" : "idle",
      f1Effect: attacker === 1 ? presentation.effect : undefined,
      f2Effect: attacker === 2 ? presentation.effect : undefined,
      commentary: `${fA.name} unleashes ${moveName}!`,
      approximationLabel: approxLabel,
      moveName,
      moveTier,
      sound: "special"
    });
    b.add({ duration: 400, f1X: attacker === 1 ? 55 : 35, f2X: attacker === 2 ? 45 : 65, f1Pose: attacker === 1 ? "stepForward" : "idle", f2Pose: attacker === 2 ? "stepForward" : "idle" });
    b.add({
      duration: 800,
      f1Pose: attacker === 1 ? "idle" : isUltimate ? "knockdown" : "stagger",
      f2Pose: attacker === 2 ? "idle" : isUltimate ? "knockdown" : "stagger",
      f1X: attacker === 2 ? 20 : 55,
      f2X: attacker === 1 ? 80 : 45,
      f1Health: attacker === 2 ? b.f1Health - dmg : b.f1Health,
      f2Health: attacker === 1 ? b.f2Health - dmg : b.f2Health,
      impact: { x: attacker === 1 ? 72 : 28, text: isUltimate ? "OGRE OVERDRIVE!" : "BODY CHECK!" },
      sound: "heavy",
      commentary: `A devastating charge sends ${fD.name} flying!`
    });
    b.add({ duration: 600, f1Pose: attacker === 1 ? "idle" : isUltimate ? "knockdown" : "idle", f2Pose: attacker === 2 ? "idle" : isUltimate ? "knockdown" : "idle", f1X: 35, f2X: 65 });
  } else if (moveType === "prop") {
    b.add({
      duration: 800,
      f1Pose: attacker === 1 ? "useProp" : "idle",
      f2Pose: attacker === 2 ? "useProp" : "idle",
      commentary: `${fA.name} brings out ${moveName}!`,
      approximationLabel: approxLabel,
      moveName,
      moveTier,
    });
    b.add({
      duration: 600,
      f1Pose: attacker === 1 ? "useProp" : isUltimate ? "knockdown" : "hit",
      f2Pose: attacker === 2 ? "useProp" : isUltimate ? "knockdown" : "hit",
      f1Health: attacker === 2 ? b.f1Health - dmg : b.f1Health,
      f2Health: attacker === 1 ? b.f2Health - dmg : b.f2Health,
      f1Effect: attacker === 1 ? presentation.effect : undefined,
      f2Effect: attacker === 2 ? presentation.effect : undefined,
      impact: { x: attacker === 1 ? 62 : 38, text: isUltimate ? "PROP FINALE!" : "BONK!" },
      sound: "special",
      commentary: `${fD.name} feels the impact!`
    });
    b.add({ duration: 800, f1Pose: attacker === 1 ? "idle" : isUltimate ? "knockdown" : "stagger", f2Pose: attacker === 2 ? "idle" : isUltimate ? "knockdown" : "stagger", f1X: 35, f2X: 65 });
  } else if (moveType === "energy") {
    b.add({
      duration: 1000,
      f1Pose: attacker === 1 ? "cast" : "idle",
      f2Pose: attacker === 2 ? "cast" : "idle",
      f1Effect: attacker === 1 ? "energy" : undefined,
      f2Effect: attacker === 2 ? "energy" : undefined,
      commentary: `${fA.name} charges up ${moveName}!`,
      approximationLabel: approxLabel,
      moveName,
      moveTier,
    });
    b.add({
      duration: 600,
      f1Pose: attacker === 1 ? "attack" : isUltimate ? "knockdown" : "hit",
      f2Pose: attacker === 2 ? "attack" : isUltimate ? "knockdown" : "hit",
      f1Health: attacker === 2 ? b.f1Health - dmg : b.f1Health,
      f2Health: attacker === 1 ? b.f2Health - dmg : b.f2Health,
      impact: { x: attacker === 1 ? 62 : 38, text: isUltimate ? "MAXIMUM POWER!" : "ENERGY HIT!" },
      sound: "ultimate",
      commentary: `The blast obliterates the space!`
    });
    b.add({ duration: 800, f1Pose: attacker === 1 ? "idle" : isUltimate ? "knockdown" : "stagger", f2Pose: attacker === 2 ? "idle" : isUltimate ? "knockdown" : "stagger", f1X: 35, f2X: 65 });
  } else if (moveType === "slam") {
    b.add({ duration: 400, f1X: 45, f2X: 55, f1Pose: attacker === 1 ? "stepForward" : "idle", f2Pose: attacker === 2 ? "stepForward" : "idle" });
    b.add({
      duration: 600,
      f1Pose: attacker === 1 ? "slam" : "hit",
      f2Pose: attacker === 2 ? "slam" : "hit",
      commentary: `${fA.name} grabs for ${moveName}!`,
      approximationLabel: approxLabel,
      moveName,
      moveTier,
    });
    b.add({
      duration: 800,
      f1Pose: attacker === 1 ? "idle" : "knockdown",
      f2Pose: attacker === 2 ? "idle" : "knockdown",
      f1Health: attacker === 2 ? b.f1Health - dmg : b.f1Health,
      f2Health: attacker === 1 ? b.f2Health - dmg : b.f2Health,
      f1Effect: attacker === 1 ? presentation.effect : undefined,
      f2Effect: attacker === 2 ? presentation.effect : undefined,
      impact: { x: attacker === 1 ? 55 : 45, text: isUltimate ? "FINAL SLAM!" : "CANVAS, MEET FACE!" },
      sound: "ko",
      commentary: `Slammed straight into the mat!`
    });
    b.add({ duration: 1000, f1Pose: attacker === 1 ? "idle" : isUltimate ? "knockdown" : "idle", f2Pose: attacker === 2 ? "idle" : isUltimate ? "knockdown" : "idle", f1X: 35, f2X: 65 });
  } else if (moveType === "dodge") {
    b.add({ duration: 600, f1Pose: attacker === 1 ? "idle" : "jab", f2Pose: attacker === 2 ? "idle" : "jab", commentary: `${fD.name} strikes first!` });
    b.add({
      duration: 500,
      f1Pose: attacker === 1 ? "dodge" : "idle",
      f2Pose: attacker === 2 ? "dodge" : "idle",
      commentary: `${fA.name} smoothly uses ${moveName}!`,
      approximationLabel: approxLabel,
      moveName,
      moveTier,
      sound: "light"
    });
    b.add({
      duration: 600,
      f1Pose: attacker === 1 ? "uppercut" : isUltimate ? "knockdown" : "hit",
      f2Pose: attacker === 2 ? "uppercut" : isUltimate ? "knockdown" : "hit",
      f1Health: attacker === 2 ? b.f1Health - dmg : b.f1Health,
      f2Health: attacker === 1 ? b.f2Health - dmg : b.f2Health,
      f1Effect: attacker === 1 ? presentation.effect : undefined,
      f2Effect: attacker === 2 ? presentation.effect : undefined,
      impact: { x: attacker === 1 ? 58 : 42, text: isUltimate ? "ACCIDENTAL FINALE!" : "COUNTER!" },
      sound: "special",
      commentary: `And punishes the mistake!`
    });
    b.add({ duration: 800, f1Pose: attacker === 1 ? "idle" : isUltimate ? "knockdown" : "stagger", f2Pose: attacker === 2 ? "idle" : isUltimate ? "knockdown" : "stagger", f1X: 35, f2X: 65 });
  } else {
    b.add({ duration: 400, f1X: 45, f2X: 55, f1Pose: attacker === 1 ? "stepForward" : "idle", f2Pose: attacker === 2 ? "stepForward" : "idle" });
    b.add({
      duration: 800,
      f1Pose: attacker === 1 ? "attack" : isUltimate ? "knockdown" : "hit",
      f2Pose: attacker === 2 ? "attack" : isUltimate ? "knockdown" : "hit",
      f1Health: attacker === 2 ? b.f1Health - dmg : b.f1Health,
      f2Health: attacker === 1 ? b.f2Health - dmg : b.f2Health,
      impact: { x: attacker === 1 ? 58 : 42, text: isUltimate ? "FINISHER!" : "SIGNATURE HIT!" },
      sound: "special",
      commentary: `${fA.name} unleashes ${moveName}!`,
      approximationLabel: approxLabel,
      moveName,
      moveTier,
    });
    b.add({ duration: 1000, f1Pose: attacker === 1 ? "idle" : isUltimate ? "knockdown" : "stagger", f2Pose: attacker === 2 ? "idle" : isUltimate ? "knockdown" : "stagger", f1X: 35, f2X: 65 });
  }
}

export function buildFightScript(f1: Fighter, f2: Fighter, seed: number): Step[] {
  const rng = sfc32(seed, seed + 1, seed + 2, seed + 3);
  const b = new ScriptBuilder();

  b.add({
    duration: 3000,
    f1Pose: "idle", f2Pose: "idle",
    commentary: `The crowd settles as ${f1.name} and ${f2.name} take their corners.`,
    sound: "roundStart"
  });

  const fighterAdvantage = (fighter: Fighter) =>
    (fighter.stats?.overall || 50) * 2
    + (fighter.stats?.power || 50)
    + (fighter.stats?.skill || 50)
    + (fighter.stats?.intelligence || 50)
    + (fighter.personality?.confidence || 50) / 2;
  const p1Adv = fighterAdvantage(f1);
  const p2Adv = fighterAdvantage(f2);
  const winner = p1Adv >= p2Adv ? 1 : 2;
  const loser = winner === 1 ? 2 : 1;

  b.add({ duration: 800, f1X: 30, f2X: 70, f1Pose: "stepForward", f2Pose: "stepForward", commentary: `They step into contact range...` });
  b.add({ duration: 800, f1X: 35, f2X: 65, f1Pose: "idle", f2Pose: "idle" });

  if (rng() > 0.5) {
    b.add({ duration: 260, f1X: 45, f1Pose: "jab", f2Pose: "block", commentary: `${f1.name} tests the defense.` });
    b.add({ duration: 120, f1Pose: "jab", f2Pose: "block", sound: "light", commentary: `${f2.name} catches the jab on the guard.` });
    b.add({ duration: 800, f1Pose: "idle", f2Pose: "idle", f1X: 35 });
    b.add({ duration: 260, f2X: 55, f2Pose: "jab", f1Pose: "idle", commentary: `${f2.name} fires the counter.` });
    b.add({ duration: 140, f2Pose: "jab", f1Pose: "hit", f1Health: b.f1Health - 4, impact: { x: 42, text: "COUNTER!" }, sound: "light", commentary: `${f2.name} counters quickly!` });
    b.add({ duration: 800, f1Pose: "stagger", f2Pose: "idle", f2X: 65 });
  } else {
    b.add({ duration: 260, f2X: 55, f2Pose: "jab", f1Pose: "block", commentary: `${f2.name} probes with a jab.` });
    b.add({ duration: 120, f2Pose: "jab", f1Pose: "block", sound: "light", commentary: `${f1.name} catches it on the guard.` });
    b.add({ duration: 800, f1Pose: "idle", f2Pose: "idle", f2X: 65 });
    b.add({ duration: 260, f1X: 45, f1Pose: "hook", f2Pose: "idle", commentary: `${f1.name} swings a heavy hook in return!` });
    b.add({ duration: 140, f1Pose: "hook", f2Pose: "hit", f2Health: b.f2Health - 6, impact: { x: 58, text: "HOOK!" }, sound: "heavy", commentary: `The hook lands flush.` });
    b.add({ duration: 800, f1Pose: "idle", f2Pose: "stagger", f1X: 35 });
  }
  b.add({ duration: 600, f1Pose: "idle", f2Pose: "idle", f1X: 35, f2X: 65 });

  const comedyVariant = Math.abs(seed) % 4;
  seqComedy(b, rng(), f1, f2, comedyVariant);
  seqSignature(b, loser, f1, f2, false);
  seqComedy(b, rng(), f1, f2, (comedyVariant + 2) % 4);
  seqSignature(b, winner, f1, f2, false);
  seqSignature(b, winner, f1, f2, true);

  b.add({
    duration: 2500,
    f1Pose: winner === 1 ? "winner" : "knockdown",
    f2Pose: winner === 2 ? "winner" : "knockdown",
    f1Health: loser === 1 ? 0 : b.f1Health,
    f2Health: loser === 2 ? 0 : b.f2Health,
    f1X: winner === 1 ? 35 : 25,
    f2X: winner === 2 ? 65 : 75,
    sound: "ko",
    commentary: `The referee waves it off! ${winner === 1 ? f1.name : f2.name} takes the victory!`
  });

  b.add({
    duration: 10000,
    f1Pose: winner === 1 ? "winner" : "knockdown",
    f2Pose: winner === 2 ? "winner" : "knockdown",
    commentary: `Bout finished.`
  });

  return b.steps;
}