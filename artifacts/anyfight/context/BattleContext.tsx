import React, { createContext, useCallback, useContext, useState } from "react";
import type { BattleNarration, BattleRecap, Fighter, MatchupAnalysis } from "@/types";

interface BattleState {
  fighter1: Fighter | null;
  fighter2: Fighter | null;
  analysis: MatchupAnalysis | null;
  narration: BattleNarration | null;
  recap: BattleRecap | null;
  battleWinner: Fighter | null;
  battleLoser: Fighter | null;
  fightDurationSeconds: number;
  rounds: number;
}

interface BattleContextType extends BattleState {
  setFighters: (f1: Fighter, f2: Fighter) => void;
  setAnalysis: (analysis: MatchupAnalysis) => void;
  setNarration: (narration: BattleNarration) => void;
  setRecap: (recap: BattleRecap, winner: Fighter, loser: Fighter, duration: number, rounds: number) => void;
  resetBattle: () => void;
}

const initialState: BattleState = {
  fighter1: null,
  fighter2: null,
  analysis: null,
  narration: null,
  recap: null,
  battleWinner: null,
  battleLoser: null,
  fightDurationSeconds: 0,
  rounds: 0,
};

const BattleContext = createContext<BattleContextType | null>(null);

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BattleState>(initialState);

  const setFighters = useCallback((f1: Fighter, f2: Fighter) => {
    setState((s) => ({ ...s, fighter1: f1, fighter2: f2, analysis: null, narration: null, recap: null }));
  }, []);

  const setAnalysis = useCallback((analysis: MatchupAnalysis) => {
    setState((s) => ({ ...s, analysis }));
  }, []);

  const setNarration = useCallback((narration: BattleNarration) => {
    setState((s) => ({ ...s, narration }));
  }, []);

  const setRecap = useCallback((recap: BattleRecap, winner: Fighter, loser: Fighter, duration: number, rounds: number) => {
    setState((s) => ({ ...s, recap, battleWinner: winner, battleLoser: loser, fightDurationSeconds: duration, rounds }));
  }, []);

  const resetBattle = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <BattleContext.Provider value={{ ...state, setFighters, setAnalysis, setNarration, setRecap, resetBattle }}>
      {children}
    </BattleContext.Provider>
  );
}

export function useBattle() {
  const ctx = useContext(BattleContext);
  if (!ctx) throw new Error("useBattle must be used inside BattleProvider");
  return ctx;
}
