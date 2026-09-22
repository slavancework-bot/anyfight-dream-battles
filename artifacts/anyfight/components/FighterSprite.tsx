import React, { useEffect, useMemo, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Circle, G, Path, Polygon, Rect } from "react-native-svg";
import type { BodyType, EffectType, FighterAccessories, HeldPropType } from "@/lib/fighter-profile";

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
  | "winner"
  | "cast"
  | "roar"
  | "slam"
  | "dodge"
  | "useProp";

interface FighterSpriteProps {
  color: string;
  pose: FighterPose;
  mirrored?: boolean;
  size?: number;
  bodyType?: BodyType;
  skinTone?: string;
  trunksColor?: string;
  gloveColor?: string;
  bootColor?: string;
  idleBehavior?: "guard" | "dance" | "stalk" | "hop" | "breathe" | "clap" | "bounce" | "stumble";
  accessories?: FighterAccessories;
  heldProp?: HeldPropType;
  activeEffect?: EffectType;
  paused?: boolean;
  reducedMotion?: boolean;
  testID?: string;
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
  bodyType = "normal",
  skinTone = "#b87855",
  trunksColor,
  gloveColor,
  bootColor = "#f1efe2",
  idleBehavior = "bounce",
  accessories,
  heldProp = "none",
  activeEffect = "none",
  paused = false,
  reducedMotion = false,
  testID,
}: FighterSpriteProps) {
  const bounce = useRef(new Animated.Value(0)).current;
  const activePose = normalizePose(pose);
  const trunks = trunksColor ?? color;
  const gloves = gloveColor ?? color;

  useEffect(() => {
    if (activePose !== "idle" && activePose !== "block") {
      bounce.stopAnimation();
      bounce.setValue(0);
      return;
    }
    if (paused) {
      bounce.stopAnimation();
      return;
    }
    if (reducedMotion) {
      bounce.stopAnimation();
      bounce.setValue(0);
      return;
    }
    const lift = idleBehavior === "hop" ? -10 : idleBehavior === "dance" || idleBehavior === "bounce" ? -5 : idleBehavior === "stumble" ? -7 : idleBehavior === "stalk" ? -2 : -3;
    const speed = idleBehavior === "breathe" ? 1200 : idleBehavior === "stalk" ? 620 : 420;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: lift, duration: speed, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: idleBehavior === "stumble" ? 3 : 0, duration: speed, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [activePose, bounce, idleBehavior, paused, reducedMotion]);

  const poseOffset = activePose === "stepForward" ? 8 : activePose === "stepBack" || activePose === "hit" ? -7 : activePose === "stagger" ? -12 : 0;
  const bodyTilt = activePose === "stagger" ? "-7 52 74" : activePose === "uppercut" || activePose === "roar" ? "-3 52 74" : activePose === "hook" || activePose === "slam" ? "4 52 74" : activePose === "dodge" ? "-10 52 90" : undefined;
  const wrapStyle = mirrored ? { transform: [{ scaleX: -1 }] } : undefined;

  const sprite = useMemo(() => {
    const outfitFill = accessories?.armor || accessories?.suit || accessories?.robe || accessories?.shirt || skinTone;
    const lowerFill = accessories?.pants || accessories?.suit || accessories?.robe || trunks;

    if (activePose === "knockdown") {
      const kTorsoW = bodyType === "broad" ? 50 : bodyType === "slim" ? 30 : 40;
      return (
        <Svg width={size * 1.28} height={size * 0.78} viewBox="0 0 150 96" style={wrapStyle} testID={testID}>
          <G>
            <Rect x={16} y={72} width={108} height={10} fill={SHADOW} />
            <G transform="translate(12 18)">
              {pixelRect(18, 32, kTorsoW, 24, outfitFill)}
              {pixelRect(8, 36, 18, 16, gloves)}
              {pixelRect(54, 36, 18, 16, gloves)}
              {pixelRect(56, 24, 18, 22, accessories?.helmet || skinTone)}
              {!accessories?.helmet && <Rect x={61} y={28} width={4} height={4} fill={OUTLINE} />}
              {accessories?.helmet ? (
                <Rect x={54} y={21} width={24} height={10} fill="#111" />
              ) : accessories?.hair ? (
                <Path d="M50 20 Q 70 10 75 30 Z" fill={accessories.hair} stroke={OUTLINE} strokeWidth={2} />
              ) : (
                <Rect x={54} y={21} width={24} height={7} fill="#3a2018" />
              )}
              {pixelRect(18, 54, 34, 18, lowerFill)}
              {pixelRect(50, 58, 34, 14, lowerFill)}
              {pixelRect(78, 60, 26, 12, accessories?.pants || accessories?.suit || accessories?.armor || accessories?.robe || skinTone)}
              {pixelRect(100, 58, 28, 12, bootColor)}
              {pixelRect(18, 70, 24, 10, accessories?.pants || accessories?.suit || accessories?.armor || accessories?.robe || skinTone)}
              {pixelRect(2, 68, 28, 12, bootColor)}
              <Rect x={22} y={56} width={24} height={4} fill={accessories?.suit ? "#111" : "#fff"} opacity={0.8} />
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
            : activePose === "block" || activePose === "dodge"
              ? { x: 58, y: 35, w: 20, h: 22 }
              : activePose === "cast"
                ? { x: 70, y: 10, w: 20, h: 20 }
                : activePose === "roar"
                  ? { x: 80, y: 40, w: 20, h: 20 }
                  : activePose === "slam"
                    ? { x: 80, y: 70, w: 20, h: 20 }
                    : activePose === "useProp"
                      ? { x: 85, y: 30, w: 24, h: 24 }
                      : { x: 70, y: 52, w: 20, h: 20 };

    const rearGlove =
      activePose === "block" || activePose === "dodge"
        ? { x: 37, y: 37, w: 20, h: 22 }
        : activePose === "winner" || activePose === "cast"
          ? { x: 36, y: 4, w: 21, h: 21 }
          : activePose === "hit" || activePose === "stagger"
            ? { x: 20, y: 46, w: 20, h: 20 }
            : activePose === "roar"
              ? { x: 30, y: 60, w: 20, h: 20 }
              : activePose === "slam"
                ? { x: 50, y: 70, w: 20, h: 20 }
                : activePose === "useProp"
                  ? { x: 40, y: 20, w: 20, h: 20 }
                  : { x: 38, y: 48, w: 20, h: 20 };

    const torsoPoints = bodyType === "broad"
      ? "38,52 77,52 92,92 25,92"
      : bodyType === "slim"
        ? "48,52 67,52 74,92 43,92"
        : "44,52 71,52 82,92 35,92";

    const suitFillPoints = bodyType === "broad"
      ? "40,52 75,52 57,75"
      : bodyType === "slim"
        ? "50,52 65,52 57,75"
        : "46,52 69,52 57,75";

    const tiePoints = bodyType === "broad"
      ? "52,60 62,60 57,75"
      : bodyType === "slim"
        ? "55,60 59,60 57,75"
        : "54,60 60,60 57,75";

    const trunksPoints = bodyType === "broad"
      ? "24,88 93,88 87,122 31,122"
      : bodyType === "slim"
        ? "42,88 75,88 69,122 49,122"
        : "34,88 83,88 77,122 41,122";

    const renderProp = (gloveBox: any) => {
      if (heldProp === "lightsaber") {
        return (
          <G transform={`translate(${gloveBox.x + gloveBox.w/2} ${gloveBox.y})`}>
            <Rect x={-4} y={-50} width={8} height={50} fill="#f00" opacity={0.8} />
            <Rect x={-2} y={-48} width={4} height={46} fill="#fff" />
            <Rect x={-3} y={0} width={6} height={12} fill="#333" />
          </G>
        );
      }
      if (heldProp === "staff") {
        return (
          <G transform={`translate(${gloveBox.x + gloveBox.w/2} ${gloveBox.y})`}>
            <Rect x={-3} y={-50} width={6} height={90} fill="#5c4033" />
            <Circle cx={0} cy={-50} r={6} fill="#aaddff" opacity={0.9} />
          </G>
        );
      }
      if (heldProp === "wand") {
        return (
          <G transform={`translate(${gloveBox.x + gloveBox.w / 2} ${gloveBox.y})`}>
            <Rect x={-2} y={-40} width={4} height={48} fill="#5c4033" />
            <Circle cx={0} cy={-41} r={5} fill="#dff7ff" opacity={0.95} />
          </G>
        );
      }
      if (heldProp === "sword") {
        return (
          <G transform={`translate(${gloveBox.x + gloveBox.w / 2} ${gloveBox.y})`}>
            <Polygon points="0,-58 6,-8 0,0 -6,-8" fill="#dce5ec" stroke={OUTLINE} strokeWidth={2} />
            <Rect x={-9} y={-7} width={18} height={5} fill="#b89235" stroke={OUTLINE} strokeWidth={1} />
            <Rect x={-3} y={-2} width={6} height={14} fill="#4b3022" />
          </G>
        );
      }
      if (heldProp === "shield") {
        return (
          <G transform={`translate(${gloveBox.x + gloveBox.w / 2} ${gloveBox.y})`}>
            <Path d="M-18 -30 Q0 -42 18 -30 L14 4 Q0 18 -14 4 Z" fill="#637589" stroke={OUTLINE} strokeWidth={3} />
            <Circle cx={0} cy={-13} r={6} fill="#d2a62c" />
          </G>
        );
      }
      if (heldProp === "hammer") {
        return (
          <G transform={`translate(${gloveBox.x + gloveBox.w / 2} ${gloveBox.y})`}>
            <Rect x={-3} y={-42} width={6} height={52} fill="#60402b" />
            <Rect x={-17} y={-52} width={34} height={15} fill="#62666b" stroke={OUTLINE} strokeWidth={2} />
          </G>
        );
      }
      if (heldProp === "teddy") {
        return (
          <G transform={`translate(${gloveBox.x + gloveBox.w/2} ${gloveBox.y})`}>
            <Circle cx={0} cy={-15} r={8} fill="#8b5a2b" />
            <Circle cx={-7} cy={-20} r={4} fill="#8b5a2b" />
            <Circle cx={7} cy={-20} r={4} fill="#8b5a2b" />
            <Rect x={-8} y={-8} width={16} height={16} fill="#8b5a2b" />
          </G>
        );
      }
      return null;
    };

    const renderEffect = () => {
      if (activeEffect === "barrier") {
        return <Circle cx={60} cy={70} r={50} fill="#aaddff" opacity={0.3} stroke="#aaddff" strokeWidth={3} />;
      }
      if (activeEffect === "roar") {
        return (
          <G transform="translate(75 30)">
            <Path d="M0 -10 Q 15 -15 20 -25 M5 0 Q 20 0 30 -5 M0 10 Q 15 15 20 25" stroke="#fff" strokeWidth={3} fill="none" opacity={0.7} />
          </G>
        );
      }
      if (activeEffect === "energy") {
        return <Circle cx={leadGlove.x + leadGlove.w/2 + 5} cy={leadGlove.y + leadGlove.h/2} r={25} fill="#ffcc00" opacity={0.6} />;
      }
      if (activeEffect === "shockwave") {
        return (
          <G opacity={0.75}>
            <Path d="M8 135 Q58 112 110 135" stroke="#f2b92f" strokeWidth={6} fill="none" />
            <Path d="M18 148 Q58 131 100 148" stroke="#fff2a8" strokeWidth={3} fill="none" />
          </G>
        );
      }
      if (activeEffect === "projectile") {
        return (
          <G transform="translate(91 55)">
            <Path d="M0 0 L28 -8 L20 3 L36 8 L18 12 Z" fill="#f2b92f" stroke={OUTLINE} strokeWidth={2} />
          </G>
        );
      }
      if (activeEffect === "sparkle") {
        return (
          <G fill="#fff3a6" stroke="#f2b92f" strokeWidth={2}>
            <Path d="M90 20 L94 30 L104 34 L94 38 L90 49 L86 38 L76 34 L86 30 Z" />
            <Path d="M20 65 L23 72 L30 75 L23 78 L20 85 L17 78 L10 75 L17 72 Z" />
          </G>
        );
      }
      return null;
    };

    return (
      <Svg width={size} height={size * 1.55} viewBox="0 0 120 176" style={wrapStyle} testID={testID}>
        <G transform={`translate(${poseOffset} 0)`}>
          <Rect x={25} y={158} width={70} height={9} fill={SHADOW} />
          <G transform={bodyTilt ? `rotate(${bodyTilt})` : undefined}>
            {accessories?.cape && (
              <Path d={activePose === "winner" || activePose === "cast" ? "M45 35 L10 130 L70 130 Z" : "M40 30 L20 130 L80 130 Z"} fill={accessories.cape} stroke={OUTLINE} strokeWidth={2} />
            )}
            <Polygon points={torsoPoints} fill={outfitFill} stroke={OUTLINE} strokeWidth={3} />
            {accessories?.vest && (
              <Path d="M41 53 L53 55 L57 87 L33 88 Z M73 53 L62 55 L58 87 L83 88 Z" fill={accessories.vest} stroke={OUTLINE} strokeWidth={2} />
            )}
            {accessories?.suit && (
              <G>
                <Polygon points={suitFillPoints} fill="#ffffff" stroke={OUTLINE} strokeWidth={1} />
                {accessories.tie && <Polygon points={tiePoints} fill={accessories.tie} />}
              </G>
            )}
            <Rect x={48} y={47} width={18} height={9} fill={skinTone} stroke={OUTLINE} strokeWidth={2} />

            {accessories?.ears === "ogre" && (
              <G>
                <Path d="M30 20 Q 20 10 25 30 Z" fill={skinTone} stroke={OUTLINE} strokeWidth={2} />
                <Path d="M70 20 Q 80 10 75 30 Z" fill={skinTone} stroke={OUTLINE} strokeWidth={2} />
              </G>
            )}
            {accessories?.ears === "elf" && (
              <G>
                <Path d="M40 24 L22 14 L37 34 Z" fill={skinTone} stroke={OUTLINE} strokeWidth={2} />
                <Path d="M70 24 L88 14 L73 34 Z" fill={skinTone} stroke={OUTLINE} strokeWidth={2} />
              </G>
            )}

            <Rect x={40} y={16} width={30} height={34} fill={accessories?.helmet || skinTone} stroke={OUTLINE} strokeWidth={3} />

            {accessories?.helmet ? (
              <G>
                <Rect x={35} y={12} width={40} height={14} fill="#222" stroke={OUTLINE} strokeWidth={2} />
                <Polygon points="40,26 70,26 65,45 45,45" fill={accessories.helmet} />
                <Rect x={45} y={30} width={20} height={6} fill="#000" />
              </G>
            ) : accessories?.wizardHat ? (
              <G>
                <Path d="M34 17 Q54 -15 68 16 L80 25 L30 25 Z" fill={accessories.wizardHat} stroke={OUTLINE} strokeWidth={3} />
                <Rect x={28} y={21} width={54} height={7} fill={accessories.wizardHat} stroke={OUTLINE} strokeWidth={2} />
              </G>
            ) : accessories?.hair ? (
              <Path d="M35 25 Q 55 -5 75 25 Z" fill={accessories.hair} stroke={OUTLINE} strokeWidth={2} />
            ) : (
              <Rect x={35} y={14} width={36} height={12} fill="#3a2018" stroke={OUTLINE} strokeWidth={2} />
            )}

            {!accessories?.helmet && (
              <G>
                <Rect x={65} y={28} width={6} height={8} fill={skinTone} stroke={OUTLINE} strokeWidth={2} />
                <Rect x={61} y={31} width={5} height={5} fill={OUTLINE} />
                <Rect x={50} y={43} width={12} height={4} fill={OUTLINE} opacity={0.7} />
              </G>
            )}

            {accessories?.beard && !accessories?.helmet && (
              <Path d="M40 40 Q 55 60 70 40 Z" fill={accessories.beard} stroke={OUTLINE} strokeWidth={2} />
            )}

            <Path d="M39 58 L24 70 L31 83 L48 68 Z" fill={outfitFill} stroke={OUTLINE} strokeWidth={3} />
            <Path d={activePose === "winner" || activePose === "cast" ? "M45 59 L48 25 L59 28 L57 61 Z" : "M70 58 L85 69 L79 83 L62 68 Z"} fill={outfitFill} stroke={OUTLINE} strokeWidth={3} />

            {pixelRect(rearGlove.x, rearGlove.y, rearGlove.w, rearGlove.h, gloves)}
            {pixelRect(leadGlove.x, leadGlove.y, leadGlove.w, leadGlove.h, gloves)}
            {heldProp && heldProp !== "none" && renderProp(leadGlove)}

            {accessories?.robe ? (
              <Path d="M34 86 L82 86 L94 145 L22 145 Z" fill={accessories.robe} stroke={OUTLINE} strokeWidth={3} />
            ) : (
              <Polygon points={trunksPoints} fill={lowerFill} stroke={OUTLINE} strokeWidth={3} />
            )}
            {!accessories?.robe && !accessories?.suit && !accessories?.pants && (
              <Rect x={41} y={88} width={35} height={7} fill="#fff" opacity={0.9} />
            )}
            <Path d="M42 119 L33 146 L46 150 L60 121 Z" fill={accessories?.pants || accessories?.suit || accessories?.armor || accessories?.robe || skinTone} stroke={OUTLINE} strokeWidth={3} />
            <Path d="M73 119 L83 145 L69 150 L57 121 Z" fill={accessories?.pants || accessories?.suit || accessories?.armor || accessories?.robe || skinTone} stroke={OUTLINE} strokeWidth={3} />
            <Rect x={26} y={144} width={25} height={18} fill={bootColor} stroke={OUTLINE} strokeWidth={3} />
            <Rect x={64} y={144} width={27} height={18} fill={bootColor} stroke={OUTLINE} strokeWidth={3} />
            <Rect x={28} y={151} width={21} height={4} fill={lowerFill} opacity={0.9} />
            <Rect x={66} y={151} width={23} height={4} fill={lowerFill} opacity={0.9} />

            {activePose === "hit" || activePose === "stagger" ? (
              <G>
                <Path d="M77 18 L90 8 L86 24" stroke="#f4d44c" strokeWidth={4} fill="none" strokeLinejoin="round" />
                <Path d="M82 39 L101 36" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="square" />
              </G>
            ) : null}
            {activePose === "block" || activePose === "dodge" ? (
              <G opacity={0.6}>
                <Rect x={32} y={28} width={52} height={44} fill="#ffffff" opacity={0.14} stroke="#ffffff" strokeWidth={2} />
              </G>
            ) : null}
            {activePose === "idle" && idleBehavior === "breathe" && !paused && !reducedMotion ? (
              <G opacity={0.8}>
                <Rect x={77} y={23} width={6} height={4} fill="#bfc7d5" />
                <Rect x={85} y={20} width={4} height={4} fill="#bfc7d5" />
              </G>
            ) : null}
            {activePose === "idle" && idleBehavior === "clap" && !paused && !reducedMotion ? (
              <G opacity={0.9}>
                <Path d="M24 42 L16 38 M83 42 L94 38" stroke="#f4d44c" strokeWidth={3} strokeLinecap="square" />
              </G>
            ) : null}
            {activePose === "idle" && idleBehavior === "guard" ? (
              <Rect x={31} y={35} width={52} height={7} fill="#111" opacity={0.55} />
            ) : null}

            {renderEffect()}
          </G>
        </G>
      </Svg>
    );
  }, [activePose, bootColor, gloves, poseOffset, size, skinTone, trunks, wrapStyle, bodyTilt, bodyType, accessories, heldProp, idleBehavior, paused, reducedMotion, activeEffect, testID]);

  if (activePose === "idle" || activePose === "block") {
    return <Animated.View style={{ transform: [{ translateY: bounce }] }}>{sprite}</Animated.View>;
  }

  return sprite;
}