import type { Fighter } from "@/types";

export type BodyType = "normal" | "broad" | "slim";
export type HeldPropType = "staff" | "wand" | "sword" | "lightsaber" | "shield" | "hammer" | "teddy" | "none";
export type EffectType = "barrier" | "roar" | "energy" | "shockwave" | "projectile" | "sparkle" | "none";
export type MoveType = "spell" | "roar" | "slam" | "dodge" | "melee" | "prop" | "energy";

export interface FighterAccessories {
  helmet?: string;
  wizardHat?: string;
  cape?: string;
  suit?: string;
  tie?: string;
  armor?: string;
  robe?: string;
  vest?: string;
  shirt?: string;
  pants?: string;
  hair?: string;
  beard?: string;
  ears?: "ogre" | "elf" | "normal";
}

export interface FighterVisualProfile {
  skinTone: string;
  trunksColor: string;
  gloveColor: string;
  bootColor: string;
  idleBehavior: "guard" | "dance" | "stalk" | "hop" | "breathe" | "clap" | "bounce" | "stumble";
  accessories: FighterAccessories;
  bodyType: BodyType;
  heldProp: HeldPropType;
  isApproximation: boolean;
  supportLabel: string;
  identityKind: "suited" | "armored" | "wizard" | "ogre" | "martial" | "generic";
}

function withoutOpponentReferences(fighter: Fighter) {
  const opponentName = fighter.archNemesis?.trim().toLowerCase();
  return (fighter.biography || "")
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => {
      const lower = sentence.toLowerCase();
      if (opponentName && lower.includes(opponentName)) return false;
      return !/\b(opponent|enemy|nemesis|rival|versus|vs\.?|fights? against|faces? off against)\b/.test(lower);
    })
    .join(" ");
}

export function getFighterProfileText(fighter: Fighter) {
  // Only self-describing fields are used. Opponent/nemesis sentences are removed
  // so "fights a green ogre" cannot turn the current fighter green.
  return [
    fighter.name,
    fighter.category,
    fighter.outfitDescription,
    fighter.imagePrompt,
    withoutOpponentReferences(fighter),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function colorFromText(text: string, fallback: string) {
  if (/\bgreen\b/.test(text)) return "#348f48";
  if (/\bpurple\b/.test(text)) return "#6f3ca7";
  if (/\b(gold|golden|yellow)\b/.test(text)) return "#d9a61f";
  if (/\bwhite\b/.test(text)) return "#e9e5da";
  if (/\bblack\b/.test(text)) return "#171717";
  if (/\bblue\b/.test(text)) return "#235faa";
  if (/\b(red|crimson)\b/.test(text)) return "#a92c29";
  if (/\b(brown|tan)\b/.test(text)) return "#6b4c35";
  if (/\b(gray|grey|silver)\b/.test(text)) return "#858b91";
  return fallback;
}

export function deriveFighterStyle(fighter: Fighter): FighterVisualProfile {
  const text = getFighterProfileText(fighter);
  const identityHash = text.split("").reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
  const fallbackColor = identityHash % 2 === 0 ? "#235faa" : "#a92c29";
  const recordColor = colorFromText(`${fighter.outfitDescription} ${fighter.imagePrompt}`, fallbackColor);

  let skinTone = "#b87855";
  let trunksColor = recordColor;
  let gloveColor = recordColor;
  let bootColor = "#27221e";
  let idleBehavior: FighterVisualProfile["idleBehavior"] = "bounce";
  let bodyType: BodyType = "normal";
  let accessories: FighterAccessories = {};
  let heldProp: HeldPropType = "none";
  let isApproximation = false;
  let supportLabel = "HUMANOID VECTOR INTERPRETATION";
  let identityKind: FighterVisualProfile["identityKind"] = "generic";

  if (/\b(mr\.?\s*bean|bean)\b/.test(text)) {
    accessories = {
      suit: "#5a4437",
      pants: "#4b392f",
      shirt: "#eee8dc",
      tie: "#9f201d",
      hair: "#171310",
    };
    trunksColor = "#4b392f";
    gloveColor = "#d0a27f";
    bootColor = "#171310";
    idleBehavior = "stumble";
    heldProp = "teddy";
    bodyType = "slim";
    identityKind = "suited";
    supportLabel = "BESPOKE SUITED COMEDY PROFILE";
  } else if (/\b(vader|sith)\b/.test(text)) {
    accessories = { armor: "#15171b", helmet: "#090a0c", cape: "#08090b", pants: "#111318" };
    skinTone = "#22252a";
    trunksColor = "#111318";
    gloveColor = "#090a0c";
    bootColor = "#090a0c";
    idleBehavior = "breathe";
    heldProp = "lightsaber";
    bodyType = "broad";
    identityKind = "armored";
    supportLabel = "BESPOKE ARMORED PROFILE";
  } else if (/\b(shrek|ogre)\b/.test(text)) {
    skinTone = "#75a843";
    accessories = {
      ears: "ogre",
      vest: "#5b4434",
      shirt: "#d9cfaa",
      pants: "#5c4a35",
    };
    trunksColor = "#5c4a35";
    gloveColor = "#75a843";
    bootColor = "#3a3027";
    bodyType = "broad";
    idleBehavior = "stalk";
    identityKind = "ogre";
    supportLabel = "BESPOKE OGRE PROFILE";
  } else if (/\b(gandalf|wizard|sorcerer|mage)\b/.test(text)) {
    const robeColor = /\bwhite\b/.test(text) ? "#e4e2db" : "#777a80";
    accessories = {
      robe: robeColor,
      pants: robeColor,
      beard: "#e8e6df",
      hair: "#d9d8d2",
      wizardHat: robeColor,
    };
    skinTone = "#d8ad8b";
    trunksColor = robeColor;
    gloveColor = "#d8ad8b";
    bootColor = "#453c34";
    bodyType = "slim";
    heldProp = "staff";
    idleBehavior = "breathe";
    identityKind = "wizard";
    supportLabel = "BESPOKE WIZARD PROFILE";
  } else {
    isApproximation = true;
    if (/\b(green skin|blue skin|red skin|purple skin|gray skin|grey skin)\b/.test(text)) {
      skinTone = colorFromText(text, skinTone);
    }
    if (/(helmet|mask|hood)/.test(text)) accessories.helmet = "#20242b";
    if (/(cape|cloak)/.test(text)) accessories.cape = colorFromText(text, "#34333b");
    if (/(armor|armour|robot|cyborg)/.test(text)) {
      accessories.armor = colorFromText(text, "#4a505b");
      identityKind = "armored";
    }
    if (/(suit|tuxedo|formal)/.test(text)) {
      accessories.suit = recordColor;
      accessories.shirt = "#ece7dc";
      accessories.pants = recordColor;
      bodyType = "slim";
      identityKind = "suited";
    }
    if (/\btie\b/.test(text)) accessories.tie = "#a42121";
    if (/(robe|wizard|monk|mage)/.test(text)) {
      accessories.robe = recordColor;
      accessories.pants = recordColor;
      bodyType = "slim";
      identityKind = "wizard";
    }
    if (/(vest|waistcoat)/.test(text)) accessories.vest = colorFromText(text, "#574333");
    if (/(shirt|tunic)/.test(text)) accessories.shirt = colorFromText(text, "#d8cfb4");
    if (/(hair|afro|mohawk|ponytail|braid)/.test(text)) accessories.hair = /\bwhite hair\b/.test(text) ? "#e5e4df" : "#2a1710";
    if (/(beard|mustache|moustache)/.test(text)) accessories.beard = /\bwhite beard\b/.test(text) ? "#e5e4df" : "#2a1710";
    if (/(pointed ears|elf|elven)/.test(text)) accessories.ears = "elf";
    if (/(ogre ears|ogre)/.test(text)) accessories.ears = "ogre";
    if (/(broad|giant|huge|monster|behemoth|heavy|muscular|stocky)/.test(text)) bodyType = "broad";
    if (/(thin|slim|lanky|tall|elderly)/.test(text)) bodyType = "slim";
    if (/(staff|walking stick|cane)/.test(text)) heldProp = "staff";
    else if (/\bwand\b/.test(text)) heldProp = "wand";
    else if (/(lightsaber|laser sword)/.test(text)) heldProp = "lightsaber";
    else if (/(sword|blade|katana|rapier)/.test(text)) heldProp = "sword";
    else if (/\bshield\b/.test(text)) heldProp = "shield";
    else if (/(hammer|mallet)/.test(text)) heldProp = "hammer";
    else if (/(teddy|bear|doll)/.test(text)) heldProp = "teddy";

    if (fighter.outfitChoice === "wrestling") {
      accessories = {};
      gloveColor = "#f2b92f";
      bootColor = "#f7efe0";
      bodyType = "normal";
      identityKind = "martial";
    }
    supportLabel = `APPROXIMATE ${identityKind === "generic" ? "HUMANOID" : identityKind.toUpperCase()} PROFILE`;
  }

  return {
    skinTone,
    trunksColor,
    gloveColor,
    bootColor,
    idleBehavior,
    accessories,
    bodyType,
    heldProp,
    isApproximation,
    supportLabel,
    identityKind,
  };
}

export function classifyMove(moveName: string): MoveType {
  const text = (moveName || "").toLowerCase();
  if (/(spell|magic|barrier|blast|beam|force|push|curse|hex|shall not pass|shield)/.test(text)) return "spell";
  if (/(roar|bellow|charge|dash|ram|check|stampede|rush)/.test(text)) return "roar";
  if (/(throw|hurl|slam|suplex|toss|chokeslam|drop|smash)/.test(text)) return "slam";
  if (/(dodge|counter|slip|weave|avoid|trip|escape|sidestep)/.test(text)) return "dodge";
  if (/(teddy|lightsaber|staff|chair|table|prop|sword|blade|bat|hammer|wand)/.test(text)) return "prop";
  if (/(energy|ki|chi|wave|explosion|fire|flame|radiance|lightning|thunder)/.test(text)) return "energy";
  return "melee";
}

export function movePresentation(fighter: Fighter, moveName: string) {
  const text = `${fighter.name} ${moveName}`.toLowerCase();
  if (/(gandalf.*shall not pass|shall not pass|arcane barrier)/.test(text)) {
    return { type: "spell" as const, effect: "barrier" as const, label: "BESPOKE BARRIER CHOREOGRAPHY" };
  }
  if (/(shrek|ogre).*(roar|bellow|charge|hurl|swamp|territorial)/.test(text)) {
    return { type: "roar" as const, effect: "roar" as const, label: "BESPOKE ROAR + CHARGE CHOREOGRAPHY" };
  }
  if (/(gandalf|wizard|sorcerer|mage).*(flame|fire|radiance|lightning|thunder|storm)/.test(text)) {
    return { type: "energy" as const, effect: "energy" as const, label: "BESPOKE WIZARD-STORM CHOREOGRAPHY" };
  }
  if (/(bean.*trip|accidental trip)/.test(text)) {
    return { type: "dodge" as const, effect: "sparkle" as const, label: "BESPOKE ACCIDENTAL-DODGE CHOREOGRAPHY" };
  }
  if (/\blightsaber\b/.test(text)) {
    return { type: "prop" as const, effect: "projectile" as const, label: "BESPOKE LIGHTSABER CHOREOGRAPHY" };
  }
  if (/\bforce push\b/.test(text)) {
    return { type: "spell" as const, effect: "energy" as const, label: "BESPOKE FORCE CHOREOGRAPHY" };
  }
  if (/\bteddy\b/.test(text)) {
    return { type: "prop" as const, effect: "projectile" as const, label: "BESPOKE TEDDY CHOREOGRAPHY" };
  }
  const type = classifyMove(moveName);
  const effect: EffectType =
    type === "spell" ? "barrier"
      : type === "roar" ? "roar"
        : type === "energy" ? "energy"
          : type === "slam" ? "shockwave"
            : type === "prop" ? "projectile"
              : "none";
  return { type, effect, label: `STYLIZED ${type.toUpperCase()} APPROXIMATION` };
}