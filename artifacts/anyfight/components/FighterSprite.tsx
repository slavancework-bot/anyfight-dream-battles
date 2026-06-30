import React, { useEffect, useMemo, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Circle, G, Path, Polygon, Rect } from "react-native-svg";

export type FighterPose =
  | "idle"
  | "stepForward"
  | "stepBack"
  | "jab"
  | "hook"
  | "uppercut"
  | "attack"
  | "hit"
  | "block"
  | "stagger"
  | "knockdown"
  | "winner";

interface FighterSpriteProps {
  color: string;
  pose: FighterPose;
  mirrored?: boolean;
  size?: number;
  skinTone?: string;
  trunksColor?: string;
  gloveColor?: string;
  bootColor?: string;
}

const OUTLINE = "#1a0d08";
const SHADOW = "rgba(0,0,0,0.35)";

function normalizePose(pose: FighterPose) {
  return pose === "attack" ? "jab" : pose;
}

function pixelRect(x: number, y: number, width: number, height: number, fill: string, stroke = OUTLINE) {
  return <Rect key={`${x}-${y}-${width}-${height}-${fill}`} x={x} y={y} width={width} height={height} fill={fill} stroke={stroke} strokeWidth={2} />;
}

export default function FighterSprite({
  color,
  pose,
  mirrored = false,
  size = 120,
  skinTone = "#b87855",
  trunksColor,
  gloveColor,
  bootColor = "#f1efe2",
}: FighterSpriteProps) {
  const bounce = useRef(new Animated.Value(0)).current;
  const activePose = normalizePose(pose);
  const trunks = trunksColor ?? color;
  const gloves = gloveColor ?? color;

  useEffect(() => {
    if (activePose !== "idle" && activePose !== "block") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -4, duration: 420, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 420, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activePose, bounce]);

  const poseOffset = activePose === "stepForward" ? 8 : activePose === "stepBack" || activePose === "hit" ? -7 : activePose === "stagger" ? -12 : 0;
  const bodyTilt = activePose === "stagger" ? "-7 52 74" : activePose === "uppercut" ? "-3 52 74" : activePose === "hook" ? "4 52 74" : undefined;
  const wrapStyle = mirrored ? { transform: [{ scaleX: -1 }] } : undefined;

  const sprite = useMemo(() => {
    if (activePose === "knockdown") {
      return (
        <Svg width={size * 1.28} height={size * 0.78} viewBox="0 0 150 96" style={wrapStyle}>
          <G>
            <Rect x={16} y={72} width={108} height={10} fill={SHADOW} />
            <G transform="translate(12 18)">
              {pixelRect(18, 32, 40, 24, skinTone)}
              {pixelRect(8, 36, 18, 16, gloves)}
              {pixelRect(54, 36, 18, 16, gloves)}
              {pixelRect(56, 24, 18, 22, skinTone)}
              <Rect x={61} y={28} width={4} height={4} fill={OUTLINE} />
              <Rect x={54} y={21} width={24} height={7} fill="#3a2018" />
              {pixelRect(18, 54, 34, 18, trunks)}
              {pixelRect(50, 58, 34, 14, trunks)}
              {pixelRect(78, 60, 26, 12, skinTone)}
              {pixelRect(100, 58, 28, 12, bootColor)}
              {pixelRect(18, 70, 24, 10, skinTone)}
              {pixelRect(2, 68, 28, 12, bootColor)}
              <Rect x={22} y={56} width={24} height={4} fill="#fff" opacity={0.8} />
            </G>
          </G>
        </Svg>
      );
    }

    const leadGlove =
      activePose === "jab"
        ? { x: 90, y: 50, w: 27, h: 19 }
        : activePose === "hook"
          ? { x: 76, y: 40, w: 25, h: 20 }
          : activePose === "uppercut"
            ? { x: 72, y: 36, w: 22, h: 24 }
            : activePose === "block"
              ? { x: 58, y: 35, w: 20, h: 22 }
              : { x: 70, y: 52, w: 20, h: 20 };

    const rearGlove =
      activePose === "block"
        ? { x: 37, y: 37, w: 20, h: 22 }
        : activePose === "winner"
          ? { x: 36, y: 4, w: 21, h: 21 }
          : activePose === "hit" || activePose === "stagger"
            ? { x: 20, y: 46, w: 20, h: 20 }
            : { x: 38, y: 48, w: 20, h: 20 };

    return (
      <Svg width={size} height={size * 1.55} viewBox="0 0 120 176" style={wrapStyle}>
        <G transform={`translate(${poseOffset} 0)`}>
          <Rect x={25} y={158} width={70} height={9} fill={SHADOW} />
          <G transform={bodyTilt ? `rotate(${bodyTilt})` : undefined}>
            <Polygon points="44,52 71,52 82,92 35,92" fill={skinTone} stroke={OUTLINE} strokeWidth={3} />
            <Rect x={48} y={47} width={18} height={9} fill={skinTone} stroke={OUTLINE} strokeWidth={2} />
            <Rect x={40} y={16} width={30} height={34} fill={skinTone} stroke={OUTLINE} strokeWidth={3} />
            <Rect x={35} y={14} width={36} height={12} fill="#3a2018" stroke={OUTLINE} strokeWidth={2} />
            <Rect x={65} y={28} width={6} height={8} fill={skinTone} stroke={OUTLINE} strokeWidth={2} />
            <Rect x={61} y={31} width={5} height={5} fill={OUTLINE} />
            <Rect x={50} y={43} width={12} height={4} fill={OUTLINE} opacity={0.7} />

            <Path d="M39 58 L24 70 L31 83 L48 68 Z" fill={skinTone} stroke={OUTLINE} strokeWidth={3} />
            <Path d={activePose === "winner" ? "M45 59 L48 25 L59 28 L57 61 Z" : "M70 58 L85 69 L79 83 L62 68 Z"} fill={skinTone} stroke={OUTLINE} strokeWidth={3} />
            {pixelRect(rearGlove.x, rearGlove.y, rearGlove.w, rearGlove.h, gloves)}
            {pixelRect(leadGlove.x, leadGlove.y, leadGlove.w, leadGlove.h, gloves)}

            <Polygon points="34,88 83,88 77,122 41,122" fill={trunks} stroke={OUTLINE} strokeWidth={3} />
            <Rect x={41} y={88} width={35} height={7} fill="#fff" opacity={0.9} />
            <Path d="M42 119 L33 146 L46 150 L60 121 Z" fill={skinTone} stroke={OUTLINE} strokeWidth={3} />
            <Path d="M73 119 L83 145 L69 150 L57 121 Z" fill={skinTone} stroke={OUTLINE} strokeWidth={3} />
            <Rect x={26} y={144} width={25} height={18} fill={bootColor} stroke={OUTLINE} strokeWidth={3} />
            <Rect x={64} y={144} width={27} height={18} fill={bootColor} stroke={OUTLINE} strokeWidth={3} />
            <Rect x={28} y={151} width={21} height={4} fill={trunks} opacity={0.9} />
            <Rect x={66} y={151} width={23} height={4} fill={trunks} opacity={0.9} />

            {activePose === "hit" || activePose === "stagger" ? (
              <G>
                <Path d="M77 18 L90 8 L86 24" stroke="#f4d44c" strokeWidth={4} fill="none" strokeLinejoin="round" />
                <Path d="M82 39 L101 36" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="square" />
              </G>
            ) : null}
            {activePose === "block" ? (
              <G opacity={0.6}>
                <Rect x={32} y={28} width={52} height={44} fill="#ffffff" opacity={0.14} stroke="#ffffff" strokeWidth={2} />
              </G>
            ) : null}
          </G>
        </G>
      </Svg>
    );
  }, [activePose, bootColor, gloves, poseOffset, size, skinTone, trunks, wrapStyle, bodyTilt]);

  if (activePose === "idle" || activePose === "block") {
    return <Animated.View style={{ transform: [{ translateY: bounce }] }}>{sprite}</Animated.View>;
  }

  return sprite;
}
