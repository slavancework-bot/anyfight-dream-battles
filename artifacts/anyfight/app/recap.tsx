import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { Alert, Share } from "react-native";
import { WinnerScreen } from "@/components/ArcadeFight";
import { useBattle } from "@/context/BattleContext";
import { useStorage } from "@/context/StorageContext";

export default function RecapScreen() {
  const {
    recap,
    battleWinner,
    battleLoser,
    fighter1,
    fighter2,
    analysis,
    fightDurationSeconds,
    rounds,
    resetBattle,
  } = useBattle();
  const { addBattleRecord, saveFighter, saveMatchup } = useStorage();
  const savedHistoryRef = useRef(false);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  useEffect(() => {
    if (!recap || !battleWinner || !battleLoser) {
      router.replace("/");
      return;
    }

    if (!savedHistoryRef.current) {
      savedHistoryRef.current = true;
      addBattleRecord({
        winner: battleWinner.name,
        loser: battleLoser.name,
        fightRating: recap.fightRating,
        methodOfVictory: recap.methodOfVictory,
        fightTime: recap.fightTime,
        rounds,
      });
    }
  }, [addBattleRecord, battleLoser, battleWinner, recap, rounds]);

  const winnerStats = useMemo(() => {
    if (!recap) return [];
    return [
      { label: "TIME", value: recap.fightTime },
      { label: "ROUND", value: String(rounds || 1) },
      { label: "KNOCKDOWNS", value: "2" },
      { label: "MAX COMBO", value: "4" },
      { label: "DAMAGE DEALT", value: "78%" },
      { label: "SPECIAL MOVES", value: "2" },
    ];
  }, [recap, rounds]);

  if (!recap || !battleWinner || !battleLoser) {
    return null;
  }

  const handleRematch = () => {
    if (battleWinner) saveFighter(battleWinner);
    if (fighter1 && fighter2 && analysis) saveMatchup({ fighter1, fighter2, analysis });
    router.replace("/matchup");
  };

  const handleFightAgain = () => {
    router.replace("/battle");
  };

  const handleMainMenu = () => {
    resetBattle();
    router.replace("/");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${battleWinner.name} defeated ${battleLoser.name} by ${recap.methodOfVictory} in ${recap.fightTime}. ${recap.fullRecap}`,
      });
    } catch {
      Alert.alert("Share Failed", "Could not open the share sheet.");
    }
  };

  return (
    <WinnerScreen
      winner={battleWinner}
      stats={winnerStats}
      onRematch={handleRematch}
      onFightAgain={handleFightAgain}
      onMainMenu={handleMainMenu}
      onShare={handleShare}
    />
  );
}
