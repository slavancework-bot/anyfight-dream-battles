import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StatBarProps {
  label: string;
  value: number;
  color?: string;
  showValue?: boolean;
  height?: number;
}

export function StatBar({ label, value, color, showValue = true, height = 6 }: StatBarProps) {
  const colors = useColors();
  const barColor = color ?? colors.primary;
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: value,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [value, animWidth]);

  const widthInterp = animWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        {showValue && <Text style={[styles.value, { color: colors.text }]}>{value}</Text>}
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted, height }]}>
        <Animated.View
          style={[
            styles.fill,
            { width: widthInterp, backgroundColor: barColor, height },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.5, textTransform: "uppercase" },
  value: { fontSize: 11, fontFamily: "Inter_700Bold" },
  track: { borderRadius: 3, overflow: "hidden" },
  fill: { borderRadius: 3 },
});
