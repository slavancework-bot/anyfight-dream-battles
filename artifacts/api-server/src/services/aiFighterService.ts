import { openai } from "@workspace/integrations-openai-ai-server";

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

export interface FighterPersonality {
  aggression: number;
  confidence: number;
  cowardice: number;
  showmanship: number;
  discipline: number;
  humor: number;
  dirtyFighting: number;
  sportsmanship: number;
  riskTaking: number;
  temper: number;
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
  personality?: FighterPersonality;
  imagePrompt: string;
}

export interface MatchupAnalysis {
  predictedWinner: string;
  winnerWinPercentage: number;
  loserWinPercentage: number;
  fighter1Advantages: string[];
  fighter2Advantages: string[];
  powerComparison: { fighter1Value: number; fighter2Value: number; winner: string };
  speedComparison: { fighter1Value: number; fighter2Value: number; winner: string };
  intelligenceComparison: { fighter1Value: number; fighter2Value: number; winner: string };
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

const OUTFIT_GUIDANCE = {
  plain:
    "Plain everyday clothes — jeans, t-shirt, casual attire. No special costume.",
  signature:
    "Their most iconic/signature look — inspired by their known style, original designs not copying exact logos or trademarks.",
  wrestling:
    "Professional wrestling attire — create an original ring persona with dramatic entrance gear.",
};

function calculateOverall(stats: Omit<FighterStats, "overall">): number {
  return Math.round(
    (stats.power + stats.speed + stats.defense + stats.stamina + stats.skill + stats.intelligence) / 6
  );
}

export async function generateFighterProfile(
  name: string,
  outfitChoice: "plain" | "signature" | "wrestling"
): Promise<Fighter> {
  const prompt = `You are a creative AI for a premium fighting game called "AnyFight: Dream Battles". Generate a detailed fighter profile for: "${name}"

This can be ANY person, fictional character, historical figure, athlete, celebrity, mythological figure, animal, or original character.

Outfit mode: ${outfitChoice} — ${OUTFIT_GUIDANCE[outfitChoice]}

CRITICAL — lean hard into their REAL personality, quirks, and iconic traits:
- Stats must reflect their ACTUAL known abilities and personality (e.g. Batman has near-max intelligence and prep time; SpongeBob has insane stamina from fry cooking; Elon Musk has high intelligence but questionable impulse control)
- signatureMove must reference something they are ACTUALLY known for doing (e.g. Kanye's "Mic Grab" for Kanye West, "The Prep Time Protocol" for Batman)
- ultimateFinisher must be their most iconic, over-the-top ability or trait pushed to the extreme
- signatureQuote must sound EXACTLY like how this character actually talks — use their real speech patterns, catchphrases, or known quotes
- weaknesses must be their REAL personality flaws or vulnerabilities (e.g. Tony Stark: "Crippling ego"; Superman: "Kryptonite and emotional manipulation")
- funFacts must be genuinely surprising, funny, and based on real facts about them — no generic fluff
- archNemesis must be someone they ACTUALLY have beef with (canonical or obvious real-world rival)
- biography must highlight what makes them funny/interesting as a fighter, not just who they are
- If name is vague (like "random"), create a completely original fictional character
- Create original, inspired designs — do NOT copy exact copyrights or logos

Respond ONLY with valid JSON matching this exact structure:
{
  "name": "display name",
  "nickname": "fighting nickname that plays on their personality",
  "category": "one of: Superhero, Villain, Athlete, Musician, Politician, Historical Figure, Mythological, Fictional Character, Animal, Original Character, Celebrity, Scientist",
  "biography": "2-3 sentence bio that highlights what makes them hilarious/compelling as a fighter — reference their real personality",
  "stats": {
    "power": <1-100>,
    "speed": <1-100>,
    "defense": <1-100>,
    "stamina": <1-100>,
    "skill": <1-100>,
    "intelligence": <1-100>
  },
  "strengths": ["strength1 tied to their real traits", "strength2", "strength3"],
  "weaknesses": ["real personality flaw or vulnerability", "another real weakness"],
  "fightingStyle": "their fighting style in 3-5 words, reflecting their actual personality",
  "signatureMove": "a move NAME and brief description rooted in something they are actually famous for",
  "ultimateFinisher": "their most iconic ability pushed to the extreme — dramatic name and description",
  "signatureQuote": "a quote that sounds EXACTLY like this character — their real speech patterns/catchphrases",
  "archNemesis": "their actual rival or the most obvious nemesis",
  "archNemesisReason": "1-2 funny/insightful sentences about why this rivalry exists — reference real events or canonical lore",
  "estimatedDifficulty": "one of: Rookie, Challenger, Veteran, Elite, Legendary, Mythical",
  "funFacts": ["genuinely surprising real fact twisted for fighting context", "another real fun fact", "a third one"],
  "personality": {
    "aggression": <1-100>,
    "confidence": <1-100>,
    "cowardice": <1-100>,
    "showmanship": <1-100>,
    "discipline": <1-100>,
    "humor": <1-100>,
    "dirtyFighting": <1-100>,
    "sportsmanship": <1-100>,
    "riskTaking": <1-100>,
    "temper": <1-100>
  },
  "outfitChoice": "${outfitChoice}",
  "outfitDescription": "detailed description of what they are wearing",
  ${
    outfitChoice === "wrestling"
      ? `"wrestlingPersona": {
    "ringName": "The [adjective] [noun]",
    "nickname": "wrestling nickname",
    "entrancePersona": "description of their entrance style",
    "championshipIntro": "dramatic ring announcer intro speech",
    "ringGearDescription": "detailed description of ring attire"
  },`
      : ""
  }
  "imagePrompt": "detailed image generation prompt for this fighter's portrait in their outfit"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const data = JSON.parse(content);

  const statsWithoutOverall = {
    power: data.stats?.power ?? 50,
    speed: data.stats?.speed ?? 50,
    defense: data.stats?.defense ?? 50,
    stamina: data.stats?.stamina ?? 50,
    skill: data.stats?.skill ?? 50,
    intelligence: data.stats?.intelligence ?? 50,
  };
  const personality: FighterPersonality = {
    aggression: data.personality?.aggression ?? Math.round((statsWithoutOverall.power + statsWithoutOverall.skill) / 2),
    confidence: data.personality?.confidence ?? Math.max(35, statsWithoutOverall.skill),
    cowardice: data.personality?.cowardice ?? Math.max(5, 100 - statsWithoutOverall.defense),
    showmanship: data.personality?.showmanship ?? Math.max(20, statsWithoutOverall.skill),
    discipline: data.personality?.discipline ?? Math.round((statsWithoutOverall.defense + statsWithoutOverall.intelligence) / 2),
    humor: data.personality?.humor ?? 50,
    dirtyFighting: data.personality?.dirtyFighting ?? Math.max(10, 100 - statsWithoutOverall.intelligence),
    sportsmanship: data.personality?.sportsmanship ?? Math.max(15, statsWithoutOverall.defense),
    riskTaking: data.personality?.riskTaking ?? Math.round((statsWithoutOverall.power + statsWithoutOverall.speed) / 2),
    temper: data.personality?.temper ?? Math.max(15, 100 - statsWithoutOverall.defense),
  };

  return {
    name: data.name ?? name,
    nickname: data.nickname ?? "The Unknown",
    category: data.category ?? "Original Character",
    biography: data.biography ?? "",
    stats: {
      ...statsWithoutOverall,
      overall: calculateOverall(statsWithoutOverall),
    },
    strengths: data.strengths ?? [],
    weaknesses: data.weaknesses ?? [],
    fightingStyle: data.fightingStyle ?? "Street Fighter",
    signatureMove: data.signatureMove ?? "Power Strike",
    ultimateFinisher: data.ultimateFinisher ?? "Final Blow",
    signatureQuote: data.signatureQuote ?? "Let's fight!",
    archNemesis: data.archNemesis ?? "Unknown Rival",
    archNemesisReason: data.archNemesisReason ?? "Their rivalry goes back ages.",
    estimatedDifficulty: data.estimatedDifficulty ?? "Challenger",
    funFacts: data.funFacts ?? [],
    outfitChoice,
    outfitDescription: data.outfitDescription ?? "",
    wrestlingPersona: data.wrestlingPersona,
    personality,
    imagePrompt: data.imagePrompt ?? `Fighter portrait of ${name}`,
  };
}

export async function generateRandomFighter(): Promise<Fighter> {
  const categories = [
    "a legendary historical warrior",
    "a mythological deity",
    "a famous athlete",
    "a beloved fictional hero",
    "a notorious villain",
    "a powerful animal",
    "a beloved musician",
    "an original martial arts master",
  ];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];

  const prompt = `Generate a completely random, creative fighter for a fighting game. Choose ${randomCategory}. Make them interesting and memorable. Return ONLY their name as a JSON string: {"name": "chosen name"}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 50,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? '{"name": "Shadow Warrior"}';
  const data = JSON.parse(content);
  const outfits: ("plain" | "signature" | "wrestling")[] = ["plain", "signature", "wrestling"];
  const randomOutfit = outfits[Math.floor(Math.random() * outfits.length)];

  return generateFighterProfile(data.name ?? "Shadow Warrior", randomOutfit);
}

export async function generateMatchupAnalysis(
  fighter1: Fighter,
  fighter2: Fighter
): Promise<MatchupAnalysis> {
  const prompt = `You are a hilarious, deeply knowledgeable analyst for "AnyFight: Dream Battles" — think Bill Simmons meets Joe Rogan. Analyze this dream matchup with wit and genuine insight into each character's REAL personality and traits.

Fighter 1: ${fighter1.name} (${fighter1.nickname})
- Bio: ${fighter1.biography}
- Stats: Power ${fighter1.stats.power}, Speed ${fighter1.stats.speed}, Defense ${fighter1.stats.defense}, Intelligence ${fighter1.stats.intelligence}, Overall ${fighter1.stats.overall}
- Fighting Style: ${fighter1.fightingStyle}
- Signature Move: ${fighter1.signatureMove}
- Ultimate: ${fighter1.ultimateFinisher}
- Strengths: ${fighter1.strengths.join(", ")}
- Weaknesses: ${fighter1.weaknesses.join(", ")}
- Signature Quote: "${fighter1.signatureQuote}"
- Personality Traits: aggression ${fighter1.personality?.aggression ?? "unknown"}, cowardice ${fighter1.personality?.cowardice ?? "unknown"}, showmanship ${fighter1.personality?.showmanship ?? "unknown"}, humor ${fighter1.personality?.humor ?? "unknown"}, dirty fighting ${fighter1.personality?.dirtyFighting ?? "unknown"}, sportsmanship ${fighter1.personality?.sportsmanship ?? "unknown"}, risk taking ${fighter1.personality?.riskTaking ?? "unknown"}, temper ${fighter1.personality?.temper ?? "unknown"}
- Fun Facts: ${fighter1.funFacts.join("; ")}

Fighter 2: ${fighter2.name} (${fighter2.nickname})
- Bio: ${fighter2.biography}
- Stats: Power ${fighter2.stats.power}, Speed ${fighter2.stats.speed}, Defense ${fighter2.stats.defense}, Intelligence ${fighter2.stats.intelligence}, Overall ${fighter2.stats.overall}
- Fighting Style: ${fighter2.fightingStyle}
- Signature Move: ${fighter2.signatureMove}
- Ultimate: ${fighter2.ultimateFinisher}
- Strengths: ${fighter2.strengths.join(", ")}
- Weaknesses: ${fighter2.weaknesses.join(", ")}
- Signature Quote: "${fighter2.signatureQuote}"
- Personality Traits: aggression ${fighter2.personality?.aggression ?? "unknown"}, cowardice ${fighter2.personality?.cowardice ?? "unknown"}, showmanship ${fighter2.personality?.showmanship ?? "unknown"}, humor ${fighter2.personality?.humor ?? "unknown"}, dirty fighting ${fighter2.personality?.dirtyFighting ?? "unknown"}, sportsmanship ${fighter2.personality?.sportsmanship ?? "unknown"}, risk taking ${fighter2.personality?.riskTaking ?? "unknown"}, temper ${fighter2.personality?.temper ?? "unknown"}
- Fun Facts: ${fighter2.funFacts.join("; ")}

CRITICAL RULES:
- Every advantage must reference their ACTUAL personality, known traits, or real abilities — no generic "he's strong"
- narrativeExplanation must be funny, personality-driven, and reference specific quirks (e.g. "Batman's decade of prep time means he already has a contingency plan for THIS exact fight")
- fightStyle must describe how their personalities would actually clash — the comedy and drama of their specific matchup
- specialMoveComparison must be funny and insightful about what makes each move iconic to WHO THEY ARE
- advantages must feel earned and specific, not generic

Respond ONLY with JSON:
{
  "predictedWinner": "name of predicted winner",
  "winnerWinPercentage": <51-85>,
  "loserWinPercentage": <15-49>,
  "fighter1Advantages": ["specific personality/trait-based advantage", "another real one", "a third"],
  "fighter2Advantages": ["specific personality/trait-based advantage", "another real one", "a third"],
  "powerComparison": {"fighter1Value": ${fighter1.stats.power}, "fighter2Value": ${fighter2.stats.power}, "winner": "name of winner"},
  "speedComparison": {"fighter1Value": ${fighter1.stats.speed}, "fighter2Value": ${fighter2.stats.speed}, "winner": "name of winner"},
  "intelligenceComparison": {"fighter1Value": ${fighter1.stats.intelligence}, "fighter2Value": ${fighter2.stats.intelligence}, "winner": "name of winner"},
  "specialMoveComparison": "funny, personality-driven 1 sentence comparing their signature moves and what it says about who they are",
  "fightDifficulty": "one of: Quick Knockout, Close Fight, Epic Battle, Legendary Clash",
  "narrativeExplanation": "2-3 sentence funny and insightful narrative rooted in their real personalities — make it shareable",
  "fightStyle": "a punchy description of how this specific personality clash would play out in the ring"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const data = JSON.parse(content);

  return {
    predictedWinner: data.predictedWinner ?? fighter1.name,
    winnerWinPercentage: data.winnerWinPercentage ?? 60,
    loserWinPercentage: data.loserWinPercentage ?? 40,
    fighter1Advantages: data.fighter1Advantages ?? [],
    fighter2Advantages: data.fighter2Advantages ?? [],
    powerComparison: data.powerComparison ?? { fighter1Value: fighter1.stats.power, fighter2Value: fighter2.stats.power, winner: fighter1.name },
    speedComparison: data.speedComparison ?? { fighter1Value: fighter1.stats.speed, fighter2Value: fighter2.stats.speed, winner: fighter1.name },
    intelligenceComparison: data.intelligenceComparison ?? { fighter1Value: fighter1.stats.intelligence, fighter2Value: fighter2.stats.intelligence, winner: fighter1.name },
    specialMoveComparison: data.specialMoveComparison ?? "",
    fightDifficulty: data.fightDifficulty ?? "Close Fight",
    narrativeExplanation: data.narrativeExplanation ?? "",
    fightStyle: data.fightStyle ?? "",
  };
}

export async function generateBattleNarration(
  fighter1: Fighter,
  fighter2: Fighter
): Promise<BattleNarration> {
  const f1Name = fighter1.outfitChoice === "wrestling" && fighter1.wrestlingPersona
    ? `${fighter1.name} as "${fighter1.wrestlingPersona.ringName}"`
    : fighter1.name;
  const f2Name = fighter2.outfitChoice === "wrestling" && fighter2.wrestlingPersona
    ? `${fighter2.name} as "${fighter2.wrestlingPersona.ringName}"`
    : fighter2.name;

  const prompt = `You are JOE ROGAN calling the greatest dream fight in history for "AnyFight: Dream Battles". You are COMPLETELY LOSING YOUR MIND with excitement. Channel full Joe Rogan UFC commentary energy — hyperbolic, passionate, funny, and deeply knowledgeable about each fighter's real personality and abilities.

Fighter 1: ${f1Name} — "${fighter1.nickname}"
- Style: ${fighter1.fightingStyle}
- Known for: ${fighter1.strengths.join(", ")}
- Weakness: ${fighter1.weaknesses.join(", ")}
- Their quote: "${fighter1.signatureQuote}"
- Fun facts: ${fighter1.funFacts.join("; ")}

Fighter 2: ${f2Name} — "${fighter2.nickname}"
- Style: ${fighter2.fightingStyle}
- Known for: ${fighter2.strengths.join(", ")}
- Weakness: ${fighter2.weaknesses.join(", ")}
- Their quote: "${fighter2.signatureQuote}"
- Fun facts: ${fighter2.funFacts.join("; ")}

RULES — sound EXACTLY like Joe Rogan calling a UFC main event:
- Use ALL CAPS for emphasis on key words
- Reference each fighter's actual personality traits, quirks, and real-world/canonical abilities
- Be hyperbolic but grounded in real facts about who they are
- Make it funny — lean into the absurdity and comedy of this specific matchup
- fighter1Intro and fighter2Intro should hype up their SPECIFIC personality, not be generic
- fullNarration must reference the specific comedy/drama of these two personalities clashing

Respond ONLY with JSON:
{
  "intro": "Joe Rogan-style explosive opening that names this specific dream matchup",
  "fighter1Intro": "2-sentence Joe Rogan hype intro referencing their actual personality and abilities",
  "fighter2Intro": "2-sentence Joe Rogan hype intro referencing their actual personality and abilities",
  "crowdAtmosphere": "1 electric sentence about the insane crowd energy for THIS specific matchup",
  "fullNarration": "3-4 sentence Joe Rogan-style full narration — funny, hyped, personality-specific, makes you want to watch immediately"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const data = JSON.parse(content);

  return {
    intro: data.intro ?? "Tonight's Main Event!",
    fighter1Intro: data.fighter1Intro ?? `${fighter1.name} enters the arena.`,
    fighter2Intro: data.fighter2Intro ?? `${fighter2.name} enters the arena.`,
    crowdAtmosphere: data.crowdAtmosphere ?? "The crowd roars with anticipation.",
    fullNarration: data.fullNarration ?? `${fighter1.name} faces ${fighter2.name} in an epic battle!`,
  };
}

export async function generateFightRecap(
  winner: Fighter,
  loser: Fighter,
  fightDurationSeconds: number,
  rounds: number
): Promise<BattleRecap> {
  const minutes = Math.floor(fightDurationSeconds / 60);
  const seconds = fightDurationSeconds % 60;
  const fightTime = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const prompt = `You are JOE ROGAN doing the post-fight breakdown for "AnyFight: Dream Battles". You just watched the most INSANE dream fight and you cannot contain yourself.

Winner: ${winner.name} (${winner.nickname})
- Style: ${winner.fightingStyle}
- Signature: ${winner.signatureMove}
- Ultimate: ${winner.ultimateFinisher}
- Personality: ${winner.biography}
- Known weaknesses: ${winner.weaknesses.join(", ")}
- Fun facts: ${winner.funFacts.join("; ")}

Loser: ${loser.name} (${loser.nickname})
- Style: ${loser.fightingStyle}
- Signature: ${loser.signatureMove}
- Personality: ${loser.biography}
- Fun facts: ${loser.funFacts.join("; ")}

Fight Time: ${fightTime} | Rounds: ${rounds}

RULES — full Joe Rogan post-fight energy:
- methodOfVictory must reference the winner's ACTUAL known abilities or personality trait that secured the win
- memorableMoment must be a specific, funny, personality-based moment that captures the absurdity of this matchup
- fullRecap must be hyped, funny, and call out specific personality traits of BOTH fighters — reference their real quirks
- crowdReaction should be wild and specific to who won (e.g., different reaction if Batman vs Joker vs SpongeBob wins)
- Use ALL CAPS for emphasis on key moments

Respond ONLY with JSON:
{
  "winner": "${winner.name}",
  "fightTime": "${fightTime}",
  "fightRating": "one of: ★★★☆☆ Good Fight, ★★★★☆ Great Fight, ★★★★★ Epic Fight",
  "methodOfVictory": "personality-specific method — reference their actual known abilities",
  "crowdReaction": "1 wild sentence about the crowd's reaction specific to who won this matchup",
  "memorableMoment": "a funny, personality-specific memorable moment from the fight",
  "fullRecap": "2-3 sentence Joe Rogan-style recap — hyped, funny, references both fighters' real personalities"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const data = JSON.parse(content);

  return {
    winner: winner.name,
    fightTime,
    fightRating: data.fightRating ?? "★★★★☆ Great Fight",
    methodOfVictory: data.methodOfVictory ?? "Technical Knockout",
    crowdReaction: data.crowdReaction ?? "The crowd erupts in celebration.",
    memorableMoment: data.memorableMoment ?? `${winner.name}'s devastating finisher`,
    fullRecap: data.fullRecap ?? `${winner.name} defeats ${loser.name} in an exciting match.`,
  };
}

// Daily challenge cache (in-memory, resets if server restarts - acceptable for V1)
const dailyChallengeCache: Map<string, unknown> = new Map();

export async function getDailyChallenge() {
  const today = new Date().toISOString().split("T")[0];

  if (dailyChallengeCache.has(today)) {
    return dailyChallengeCache.get(today);
  }

  const prompt = `Generate an exciting daily challenge matchup for "AnyFight: Dream Battles". Pick two iconic, interesting fighters that would make for a compelling dream matchup. Return ONLY valid JSON: {"fighter1Name": "name", "fighter2Name": "name"}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 100,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content ?? '{"fighter1Name": "King Kong", "fighter2Name": "Darth Vader"}';
  const names = JSON.parse(content);

  const [fighter1, fighter2] = await Promise.all([
    generateFighterProfile(names.fighter1Name ?? "King Kong", "signature"),
    generateFighterProfile(names.fighter2Name ?? "Darth Vader", "signature"),
  ]);

  const analysis = await generateMatchupAnalysis(fighter1, fighter2);

  const challenge = {
    date: today,
    fighter1,
    fighter2,
    analysis,
    votesForFighter1: 0,
    votesForFighter2: 0,
  };

  dailyChallengeCache.set(today, challenge);
  return challenge;
}
