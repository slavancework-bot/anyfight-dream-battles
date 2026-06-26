import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { BattleRecord, SavedFighter, SavedMatchup } from "@/types";

const KEYS = {
  savedFighters: "anyfight_saved_fighters",
  savedMatchups: "anyfight_saved_matchups",
  battleHistory: "anyfight_battle_history",
  voiceEnabled: "anyfight_voice_enabled",
};

interface StorageContextType {
  savedFighters: SavedFighter[];
  savedMatchups: SavedMatchup[];
  battleHistory: BattleRecord[];
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => Promise<void>;
  saveFighter: (fighter: Omit<SavedFighter, "savedId" | "savedAt">) => Promise<void>;
  removeFighter: (savedId: string) => Promise<void>;
  saveMatchup: (matchup: Omit<SavedMatchup, "id" | "date">) => Promise<void>;
  removeMatchup: (id: string) => Promise<void>;
  addBattleRecord: (record: Omit<BattleRecord, "id" | "date">) => Promise<void>;
  clearHistory: () => Promise<void>;
  clearSavedFighters: () => Promise<void>;
}

const StorageContext = createContext<StorageContextType | null>(null);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [savedFighters, setSavedFighters] = useState<SavedFighter[]>([]);
  const [savedMatchups, setSavedMatchups] = useState<SavedMatchup[]>([]);
  const [battleHistory, setBattleHistory] = useState<BattleRecord[]>([]);
  const [voiceEnabled, setVoiceEnabledState] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [f, m, h, v] = await Promise.all([
          AsyncStorage.getItem(KEYS.savedFighters),
          AsyncStorage.getItem(KEYS.savedMatchups),
          AsyncStorage.getItem(KEYS.battleHistory),
          AsyncStorage.getItem(KEYS.voiceEnabled),
        ]);
        if (f) setSavedFighters(JSON.parse(f));
        if (m) setSavedMatchups(JSON.parse(m));
        if (h) setBattleHistory(JSON.parse(h));
        if (v) setVoiceEnabledState(JSON.parse(v));
      } catch {}
    };
    load();
  }, []);

  const saveFighter = useCallback(async (fighter: Omit<SavedFighter, "savedId" | "savedAt">) => {
    const saved: SavedFighter = {
      ...fighter,
      savedId: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      savedAt: new Date().toISOString(),
    };
    const updated = [saved, ...savedFighters];
    setSavedFighters(updated);
    await AsyncStorage.setItem(KEYS.savedFighters, JSON.stringify(updated));
  }, [savedFighters]);

  const removeFighter = useCallback(async (savedId: string) => {
    const updated = savedFighters.filter((f) => f.savedId !== savedId);
    setSavedFighters(updated);
    await AsyncStorage.setItem(KEYS.savedFighters, JSON.stringify(updated));
  }, [savedFighters]);

  const saveMatchup = useCallback(async (matchup: Omit<SavedMatchup, "id" | "date">) => {
    const saved: SavedMatchup = {
      ...matchup,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      date: new Date().toISOString(),
    };
    const updated = [saved, ...savedMatchups].slice(0, 50);
    setSavedMatchups(updated);
    await AsyncStorage.setItem(KEYS.savedMatchups, JSON.stringify(updated));
  }, [savedMatchups]);

  const removeMatchup = useCallback(async (id: string) => {
    const updated = savedMatchups.filter((m) => m.id !== id);
    setSavedMatchups(updated);
    await AsyncStorage.setItem(KEYS.savedMatchups, JSON.stringify(updated));
  }, [savedMatchups]);

  const addBattleRecord = useCallback(async (record: Omit<BattleRecord, "id" | "date">) => {
    const saved: BattleRecord = {
      ...record,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      date: new Date().toISOString(),
    };
    const updated = [saved, ...battleHistory].slice(0, 100);
    setBattleHistory(updated);
    await AsyncStorage.setItem(KEYS.battleHistory, JSON.stringify(updated));
  }, [battleHistory]);

  const clearHistory = useCallback(async () => {
    setBattleHistory([]);
    await AsyncStorage.removeItem(KEYS.battleHistory);
  }, []);

  const clearSavedFighters = useCallback(async () => {
    setSavedFighters([]);
    await AsyncStorage.removeItem(KEYS.savedFighters);
  }, []);

  const setVoiceEnabled = useCallback(async (v: boolean) => {
    setVoiceEnabledState(v);
    await AsyncStorage.setItem(KEYS.voiceEnabled, JSON.stringify(v));
  }, []);

  return (
    <StorageContext.Provider value={{
      savedFighters, savedMatchups, battleHistory,
      voiceEnabled, setVoiceEnabled,
      saveFighter, removeFighter, saveMatchup, removeMatchup,
      addBattleRecord, clearHistory, clearSavedFighters,
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used inside StorageProvider");
  return ctx;
}
