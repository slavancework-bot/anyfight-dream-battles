import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import type { Fighter } from "@/types";

const DIFFICULTY_COLOR: Record<string, string> = {
  Rookie: "#22c55e",
  Challenger: "#3b82f6",
  Veteran: "#8b5cf6",
  Elite: "#f59e0b",
  Legendary: "#ef4444",
  Mythical: "#ff00cc",
};

const STORAGE_PREFIX = "portrait_v1_";
const portraitCache = new Map<string, string>();

function storageKey(prompt: string) {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) - hash + prompt.charCodeAt(i)) | 0;
  }
  return `${STORAGE_PREFIX}${hash >>> 0}`;
}

async function loadFromStorage(prompt: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(storageKey(prompt));
  } catch {
    return null;
  }
}

async function saveToStorage(prompt: string, data: string): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(prompt), data);
  } catch {
  }
}

export function useFighterPortrait(imagePrompt: string) {
  const [imageData, setImageData] = useState<string | null>(() => portraitCache.get(imagePrompt) ?? null);
  const [loading, setLoading] = useState(() => !portraitCache.has(imagePrompt) && !!imagePrompt);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!imagePrompt) {
      setLoading(false);
      return;
    }
    if (portraitCache.has(imagePrompt)) {
      setImageData(portraitCache.get(imagePrompt)!);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    setLoading(true);
    setError(false);
    setImageData(null);

    const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";

    loadFromStorage(imagePrompt).then((cached) => {
      if (cancelled) return;
      if (cached) {
        portraitCache.set(imagePrompt, cached);
        setImageData(cached);
        setLoading(false);
        clearTimeout(timeout);
        return;
      }

      fetch(`https://${domain}/api/fighters/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePrompt }),
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Image generation failed");
          return res.json() as Promise<{ imageData: string }>;
        })
        .then((data) => {
          if (!cancelled) {
            portraitCache.set(imagePrompt, data.imageData);
            saveToStorage(imagePrompt, data.imageData);
            setImageData(data.imageData);
          }
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          clearTimeout(timeout);
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [imagePrompt, retryKey]);

  const retry = () => { setRetryKey((k) => k + 1); };

  return { imageData, loading, error, retry };
}

interface FighterPortraitProps {
  fighter: Fighter;
  size?: number;
  nameColor?: string;
  style?: object;
}

export function FighterPortrait({ fighter, size = 200, nameColor, style }: FighterPortraitProps) {
  const colors = useColors();
  const { imageData, loading, error, retry } = useFighterPortrait(fighter.imagePrompt);
  const diffColor = DIFFICULTY_COLOR[fighter.estimatedDifficulty] ?? colors.primary;
  const accent = nameColor ?? diffColor;

  return (
    <View
      style={[
        styles.portraitContainer,
        {
          width: size,
          height: size,
          backgroundColor: colors.muted,
          borderColor: accent,
        },
        style,
      ]}
    >
      {loading ? (
        <View style={styles.skeleton}>
          <ActivityIndicator color={accent} size={size > 80 ? "large" : "small"} />
          {size > 80 && (
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Generating...
            </Text>
          )}
        </View>
      ) : imageData ? (
        <Image
          source={{ uri: `data:image/png;base64,${imageData}` }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : error ? (
        <View style={styles.skeleton}>
          <Text style={[styles.initial, { color: accent, fontSize: size * 0.36 }]}>
            {fighter.name.charAt(0).toUpperCase()}
          </Text>
          {size > 80 && (
            <Pressable onPress={retry} style={[styles.retryBtn, { borderColor: colors.border }]}>
              <Text style={[styles.retryText, { color: colors.mutedForeground }]}>↻ Retry</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.skeleton}>
          <Text style={[styles.initial, { color: accent, fontSize: size * 0.36 }]}>
            {fighter.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

interface BattlePortraitProps {
  fighter: Fighter;
  size?: number;
  accentColor: string;
  isBlocking?: boolean;
  blockColor?: string;
  flashAnim?: Animated.Value;
  entryOpacity?: Animated.Value;
  entryX?: Animated.Value;
  lunge?: Animated.Value;
}

export function BattlePortrait({
  fighter,
  size = 120,
  accentColor,
  isBlocking = false,
  blockColor = "#22c55e",
  flashAnim,
  entryOpacity,
  entryX,
  lunge,
}: BattlePortraitProps) {
  const colors = useColors();
  const { imageData, loading } = useFighterPortrait(fighter.imagePrompt);

  const translateX =
    entryX && lunge ? Animated.add(entryX, lunge) : entryX ?? lunge ?? new Animated.Value(0);

  const content = (
    <Animated.View
      style={[
        styles.battleAvatarBorder,
        {
          width: size,
          height: size,
          borderRadius: size * 0.12,
          backgroundColor: accentColor + "22",
          borderColor: isBlocking ? blockColor : accentColor,
        },
      ]}
    >
      {loading ? (
        <View style={styles.skeleton}>
          <ActivityIndicator color={accentColor} size="small" />
        </View>
      ) : imageData ? (
        <Image
          source={{ uri: `data:image/png;base64,${imageData}` }}
          style={[styles.image, { borderRadius: size * 0.1 }]}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.skeleton}>
          <Text style={[styles.initial, { color: accentColor, fontSize: size * 0.36 }]}>
            {fighter.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text
        style={[styles.battleName, { color: accentColor }]}
        numberOfLines={1}
      >
        {fighter.name.split(" ")[0]}
      </Text>
      {isBlocking && (
        <Text style={[styles.blockBadge, { color: blockColor }]}>BLOCK</Text>
      )}
      {flashAnim && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.accent,
              borderRadius: size * 0.12,
              opacity: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.65] }),
            },
          ]}
          pointerEvents="none"
        />
      )}
    </Animated.View>
  );

  return (
    <Animated.View
      style={{
        opacity: entryOpacity ?? 1,
        transform: [{ translateX }],
        alignItems: "center",
      }}
    >
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  portraitContainer: {
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
  },
  skeleton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
  initial: {
    fontFamily: "Inter_700Bold",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  retryText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  battleAvatarBorder: {
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  battleName: {
    position: "absolute",
    bottom: 4,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 2,
  },
  blockBadge: {
    position: "absolute",
    top: 4,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
});
