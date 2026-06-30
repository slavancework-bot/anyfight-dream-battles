export interface FighterStats {
  overall: number;
  power: number;
  speed: number;
  defense: number;
  stamina: number;
  skill: number;
  intelligence: number;
}

export interface WrestlingPersona {
  ringName: string;
  nickname: string;
  entrancePersona: string;
  championshipIntro: string;
  ringGearDescription: string;
}

export interface FighterPersonality {
  aggression: number;
  confidence: number;
  cowardice: number;
  showmanship: number;
  discipline: number;
  humor: number;
  dirtyFighting: number;
  sportsmanship: number;
  riskTaking: number;
  temper: number;
}

export interface Fighter {
  name: string;
  nickname: string;
  category: string;
  biography: string;
  stats: FighterStats;
  strengths: string[];
  weaknesses: string[];
  fightingStyle: string;
  signatureMove: string;
  ultimateFinisher: string;
  signatureQuote: string;
  archNemesis: string;
  archNemesisReason: string;
  estimatedDifficulty: string;
  funFacts: string[];
  outfitChoice: "plain" | "signature" | "wrestling";
  outfitDescription: string;
  wrestlingPersona?: WrestlingPersona;
  personality?: FighterPersonality;
  imagePrompt: string;
}

export interface StatComparison {
  fighter1Value: number;
  fighter2Value: number;
  winner: string;
}

export interface MatchupAnalysis {
  predictedWinner: string;
  winnerWinPercentage: number;
  loserWinPercentage: number;
  fighter1Advantages: string[];
  fighter2Advantages: string[];
  powerComparison: StatComparison;
  speedComparison: StatComparison;
  intelligenceComparison: StatComparison;
  specialMoveComparison: string;
  fightDifficulty: string;
  narrativeExplanation: string;
  fightStyle: string;
}

export interface BattleNarration {
  intro: string;
  fighter1Intro: string;
  fighter2Intro: string;
  crowdAtmosphere: string;
  fullNarration: string;
}

export interface BattleRecap {
  winner: string;
  fightTime: string;
  fightRating: string;
  methodOfVictory: string;
  crowdReaction: string;
  memorableMoment: string;
  fullRecap: string;
}

export interface FightStats {
  knockdowns: number;
  maxCombo: number;
  damageDealtPercent: number;
  specialMoves: number;
  punchesLanded: number;
  finalHealth: {
    fighter1: number;
    fighter2: number;
  };
}

export type BattleEventType =
  | "jab"
  | "hook"
  | "uppercut"
  | "block"
  | "heavy_hit"
  | "critical_hit"
  | "counter"
  | "special_move"
  | "stagger"
  | "knockdown"
  | "ref_count"
  | "finishing_blow"
  | "taunt"
  | "slip"
  | "crowd_chant"
  | "ref_warning"
  | "comeback"
  | "panic_retreat"
  | "rope_pressure"
  | "wardrobe_malfunction"
  | "mascot_confusion"
  | "wrong_corner"
  | "emotional_damage"
  | "illegal_but_awesome"
  | "crowd_confused"
  | "momentum_shift"
  | "signature_fakeout"
  | "nickname_powerup"
  | "weakness_exposed"
  | "strength_showcase"
  | "arch_nemesis_flashback"
  | "outfit_bonus"
  | "camera_flash"
  | "announcer_meltdown"
  | "bell_fakeout"
  | "shoe_squeak"
  | "victory_dance";

export interface BattleEvent {
  round: number;
  time: string;
  attacker: "fighter1" | "fighter2";
  defender: "fighter1" | "fighter2";
  eventType: BattleEventType;
  damage: number;
  staminaDamage: number;
  embarrassmentDamage?: number;
  specialGain?: number;
  movement?: "advance" | "close" | "inside" | "hold" | "recoil" | "fall" | "lunge" | "slip" | "retreat" | "celebrate" | "wobble" | "bounce" | "cornered";
  comboCount?: number;
  momentumOwner?: "fighter1" | "fighter2";
  storyArc?: "Fast Knockout" | "Underdog Comeback" | "Back-and-Forth War" | "Technical Chess Match" | "Comic Disaster" | "Legendary Battle";
  crowdReaction?: string;
  taunt?: string;
  commentary: string;
  overlayText: string;
}

export interface SavedFighter extends Fighter {
  savedId: string;
  savedAt: string;
}

export interface BattleRecord {
  id: string;
  date: string;
  winner: string;
  loser: string;
  fightRating: string;
  methodOfVictory: string;
  fightTime: string;
  rounds: number;
}

export interface SavedMatchup {
  id: string;
  date: string;
  fighter1: Fighter;
  fighter2: Fighter;
  analysis: MatchupAnalysis;
}

export type OutfitChoice = "plain" | "signature" | "wrestling";
