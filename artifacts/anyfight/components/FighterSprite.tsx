import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Polygon } from "react-native-svg";

export type FighterPose = "idle" | "attack" | "hit" | "block";

interface PoseData {
  headCx: number;
  headCy: number;
  torso: [number, number, number, number];
  lUpperArm: [number, number, number, number];
  lForearm: [number, number, number, number];
  rUpperArm: [number, number, number, number];
  rForearm: [number, number, number, number];
  lThigh: [number, number, number, number];
  lShin: [number, number, number, number];
  rThigh: [number, number, number, number];
  rShin: [number, number, number, number];
  fistPoints?: string;
}

const POSES: Record<FighterPose, PoseData> = {
  idle: {
    headCx: 40, headCy: 20,
    torso: [40, 34, 40, 88],
    lUpperArm: [26, 44, 16, 68],
    lForearm: [16, 68, 20, 90],
    rUpperArm: [54, 44, 64, 64],
    rForearm: [64, 64, 60, 86],
    lThigh: [36, 88, 28, 118],
    lShin: [28, 118, 22, 148],
    rThigh: [44, 88, 52, 116],
    rShin: [52, 116, 58, 146],
  },
  attack: {
    headCx: 44, headCy: 18,
    torso: [44, 32, 40, 86],
    lUpperArm: [32, 44, 18, 66],
    lForearm: [18, 66, 14, 84],
    rUpperArm: [52, 40, 70, 38],
    rForearm: [70, 38, 78, 36],
    lThigh: [36, 86, 24, 114],
    lShin: [24, 114, 16, 146],
    rThigh: [44, 86, 56, 112],
    rShin: [56, 112, 64, 144],
    fistPoints: "74,30 82,34 80,42 72,40",
  },
  hit: {
    headCx: 32, headCy: 24,
    torso: [32, 38, 38, 88],
    lUpperArm: [26, 50, 10, 38],
    lForearm: [10, 38, 4, 24],
    rUpperArm: [40, 50, 28, 36],
    rForearm: [28, 36, 18, 22],
    lThigh: [34, 88, 24, 116],
    lShin: [24, 116, 18, 146],
    rThigh: [42, 88, 54, 106],
    rShin: [54, 106, 64, 122],
  },
  block: {
    headCx: 40, headCy: 30,
    torso: [40, 44, 40, 84],
    lUpperArm: [34, 52, 22, 44],
    lForearm: [22, 44, 20, 30],
    rUpperArm: [46, 52, 58, 44],
    rForearm: [58, 44, 60, 30],
    lThigh: [36, 84, 26, 108],
    lShin: [26, 108, 16, 138],
    rThigh: [44, 84, 54, 108],
    rShin: [54, 108, 64, 138],
  },
};

interface FighterSpriteProps {
  color: string;
  pose: FighterPose;
  mirrored?: boolean;
  size?: number;
}

export default function FighterSprite({ color, pose, mirrored = false, size = 120 }: FighterSpriteProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -4, duration: 900, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const p = POSES[pose];
  const sw = 9;
  const swGlow = 18;
  const glowColor = color + "44";
  const lineProps = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  const svgContent = (
    <Svg
      width={size}
      height={size * 2}
      viewBox="0 0 80 160"
      style={mirrored ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      <G>
        {/* Glow layer */}
        <G stroke={glowColor} strokeWidth={swGlow} {...lineProps} fill="none">
          <Line x1={p.torso[0]} y1={p.torso[1]} x2={p.torso[2]} y2={p.torso[3]} />
          <Line x1={p.lUpperArm[0]} y1={p.lUpperArm[1]} x2={p.lUpperArm[2]} y2={p.lUpperArm[3]} />
          <Line x1={p.lForearm[0]} y1={p.lForearm[1]} x2={p.lForearm[2]} y2={p.lForearm[3]} />
          <Line x1={p.rUpperArm[0]} y1={p.rUpperArm[1]} x2={p.rUpperArm[2]} y2={p.rUpperArm[3]} />
          <Line x1={p.rForearm[0]} y1={p.rForearm[1]} x2={p.rForearm[2]} y2={p.rForearm[3]} />
          <Line x1={p.lThigh[0]} y1={p.lThigh[1]} x2={p.lThigh[2]} y2={p.lThigh[3]} />
          <Line x1={p.lShin[0]} y1={p.lShin[1]} x2={p.lShin[2]} y2={p.lShin[3]} />
          <Line x1={p.rThigh[0]} y1={p.rThigh[1]} x2={p.rThigh[2]} y2={p.rThigh[3]} />
          <Line x1={p.rShin[0]} y1={p.rShin[1]} x2={p.rShin[2]} y2={p.rShin[3]} />
        </G>

        {/* Main body */}
        <G stroke={color} strokeWidth={sw} {...lineProps} fill="none">
          <Line x1={p.torso[0]} y1={p.torso[1]} x2={p.torso[2]} y2={p.torso[3]} />
          <Line x1={p.lUpperArm[0]} y1={p.lUpperArm[1]} x2={p.lUpperArm[2]} y2={p.lUpperArm[3]} />
          <Line x1={p.lForearm[0]} y1={p.lForearm[1]} x2={p.lForearm[2]} y2={p.lForearm[3]} />
          <Line x1={p.rUpperArm[0]} y1={p.rUpperArm[1]} x2={p.rUpperArm[2]} y2={p.rUpperArm[3]} />
          <Line x1={p.rForearm[0]} y1={p.rForearm[1]} x2={p.rForearm[2]} y2={p.rForearm[3]} />
          <Line x1={p.lThigh[0]} y1={p.lThigh[1]} x2={p.lThigh[2]} y2={p.lThigh[3]} />
          <Line x1={p.lShin[0]} y1={p.lShin[1]} x2={p.lShin[2]} y2={p.lShin[3]} />
          <Line x1={p.rThigh[0]} y1={p.rThigh[1]} x2={p.rThigh[2]} y2={p.rThigh[3]} />
          <Line x1={p.rShin[0]} y1={p.rShin[1]} x2={p.rShin[2]} y2={p.rShin[3]} />
        </G>

        {/* Joint dots */}
        <G fill={color} opacity={0.7}>
          <Circle cx={p.lUpperArm[2]} cy={p.lUpperArm[3]} r={4} />
          <Circle cx={p.rUpperArm[2]} cy={p.rUpperArm[3]} r={4} />
          <Circle cx={p.lThigh[2]} cy={p.lThigh[3]} r={4} />
          <Circle cx={p.rThigh[2]} cy={p.rThigh[3]} r={4} />
        </G>

        {/* Fist (attack pose) */}
        {p.fistPoints && (
          <Polygon points={p.fistPoints} fill={color} stroke={color} strokeWidth={2} />
        )}

        {/* Head glow */}
        <Circle cx={p.headCx} cy={p.headCy} r={20} fill={glowColor} />

        {/* Head */}
        <Circle cx={p.headCx} cy={p.headCy} r={15} fill={color + "22"} stroke={color} strokeWidth={3} />

        {/* Eye */}
        <Circle cx={p.headCx + 6} cy={p.headCy - 2} r={3} fill={color} />

        {/* Hit effect */}
        {pose === "hit" && (
          <>
            <Path
              d={`M${p.headCx - 2},${p.headCy - 22} L${p.headCx + 4},${p.headCy - 30} L${p.headCx + 8},${p.headCy - 18}`}
              stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.9}
            />
            <Path
              d={`M${p.headCx + 10},${p.headCy - 24} L${p.headCx + 16},${p.headCy - 30} L${p.headCx + 18},${p.headCy - 20}`}
              stroke={color} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.7}
            />
          </>
        )}

        {/* Block shield highlight */}
        {pose === "block" && (
          <Path
            d="M18,26 L30,18 L50,22 L52,46 L34,54 Z"
            fill={color + "33"} stroke={color} strokeWidth={2.5} opacity={0.8}
          />
        )}
      </G>
    </Svg>
  );

  if (pose === "idle") {
    return (
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        {svgContent}
      </Animated.View>
    );
  }

  return svgContent;
}
