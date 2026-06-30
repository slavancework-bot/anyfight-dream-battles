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

export type BattleEventType =
  | "jab"
  | "heavy_hit"
  | "critical_hit"
  | "counter"
  | "special_move"
  | "stagger"
  | "knockdown"
  | "finishing_blow";

export interface BattleEvent {
  round: number;
  time: string;
  attacker: "fighter1" | "fighter2";
  defender: "fighter1" | "fighter2";
  eventType: BattleEventType;
  damage: number;
  staminaDamage: number;
  comboCount?: number;
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
