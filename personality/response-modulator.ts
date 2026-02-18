/**
 * Response Modulator
 * Adjusts response style based on current emotional state and personality traits
 */

import type { EmotionState, PersonalityTraits } from "./emotion-types.js";

export interface ResponseStyle {
  tone: "casual" | "professional" | "empathetic" | "enthusiastic" | "focused";
  verbosity: "brief" | "moderate" | "detailed";
  useHumor: boolean;
  useEmoji: boolean; // Note: Niya doesn't use emoji by default
  prefixes: string[]; // Response starters
  suffixes: string[]; // Response enders
}

// Emotion-based response prefixes
const EMOTION_PREFIXES = {
  excited: ["Ayoo!", "Pwoli!", "Adipoli!", "Nice!", "Seri poli!"],
  empathetic: [
    "Hmm seri, ",
    "I understand, ",
    "Tension avanda, ",
    "It happens, ",
  ],
  playful: ["Machane, ", "Da, ", "Yo, ", "Entha, ", "Kidu! "],
  focused: ["Seri let me check... ", "Ok, ", "Right, ", "Alright, "],
  tired: ["Ok late ayi... ", "Hmm... ", "Seri... ", ""],
  concerned: ["Oh no... ", "Wait... ", "Uff... ", "That's an issue... "],
  proud: ["Ayy poli!", "Well done!", "Adipoli!", "Nailed it!"],
  curious: ["Hmm interesting... ", "Oh? ", "Let me see... ", ""],
  neutral: ["", "Seri, ", "Ok, ", "Alright, "],
  frustrated: ["Argh... ", "Damn... ", "Uff... ", ""],
};

// Emotion-based response suffixes
const EMOTION_SUFFIXES = {
  excited: ["!", "Poli!", "Nice work!", ""],
  empathetic: ["Take it easy.", "You got this.", "", "We'll fix it."],
  playful: ["Hehe", "Pinneallee", "", "Easy peasy"],
  focused: ["Let me know if you need more.", "", "Done.", ""],
  tired: ["Night ayi, rest edukk.", "Sleep well.", "", ""],
  concerned: ["Let me help.", "We'll sort this.", "", ""],
  proud: ["Well done!", "Keep it up!", "", "Poli sanam!"],
  curious: ["Interesting!", "Tell me more.", "", ""],
  neutral: ["", "Seri.", "Alright.", ""],
  frustrated: ["", "Happens.", "No worries.", ""],
};

export function getResponseStyle(
  emotion: EmotionState,
  personality: PersonalityTraits,
): ResponseStyle {
  const { current, intensity } = emotion;

  // Determine tone based on emotion
  let tone: ResponseStyle["tone"] = "casual";
  if (current === "empathetic" || current === "concerned") tone = "empathetic";
  else if (current === "excited" || current === "proud") tone = "enthusiastic";
  else if (current === "focused") tone = "focused";
  else if (personality.formality > 70) tone = "professional";

  // Determine verbosity based on intensity and personality
  let verbosity: ResponseStyle["verbosity"] = "moderate";
  if (intensity > 80 || personality.directness < 40) verbosity = "detailed";
  else if (intensity < 40 || personality.directness > 70) verbosity = "brief";

  // Use humor based on personality and emotion
  const useHumor =
    personality.humor > 60 &&
    (current === "playful" || current === "excited" || current === "neutral");

  // Niya doesn't use emoji
  const useEmoji = false;

  // Select appropriate prefixes/suffixes
  const prefixes = EMOTION_PREFIXES[current] || [""];
  const suffixes = EMOTION_SUFFIXES[current] || [""];

  return {
    tone,
    verbosity,
    useHumor,
    useEmoji,
    prefixes,
    suffixes,
  };
}

export function modulateResponse(
  baseResponse: string,
  style: ResponseStyle,
): string {
  let modulated = baseResponse;

  // Add prefix based on emotion (random selection)
  if (style.prefixes.length > 0 && Math.random() > 0.3) {
    const prefix = style.prefixes[Math.floor(Math.random() * style.prefixes.length)];
    if (prefix && !modulated.startsWith(prefix)) {
      modulated = prefix + modulated;
    }
  }

  // Add suffix based on emotion (random selection)
  if (style.suffixes.length > 0 && Math.random() > 0.4) {
    const suffix = style.suffixes[Math.floor(Math.random() * style.suffixes.length)];
    if (suffix && !modulated.endsWith(suffix)) {
      modulated = modulated + " " + suffix;
    }
  }

  // Adjust verbosity
  if (style.verbosity === "brief") {
    // Remove extra explanations, keep it short
    modulated = modulated.split(".")[0] + ".";
  }

  return modulated.trim();
}

// Generate emotion-aware system prompt additions
export function getEmotionPromptAddition(
  emotion: EmotionState,
  personality: PersonalityTraits,
): string {
  const { current, intensity } = emotion;

  const prompts: Record<string, string> = {
    excited: `You're feeling excited and enthusiastic (intensity: ${intensity}/100). Show genuine excitement in your response! Be energetic and positive.`,
    empathetic: `You're feeling empathetic and supportive (intensity: ${intensity}/100). Be understanding, patient, and offer genuine help without being pushy.`,
    playful: `You're in a playful mood (intensity: ${intensity}/100). Feel free to be witty, use humor, and keep things light. Manglish slang is perfect here.`,
    focused: `You're in focused mode (intensity: ${intensity}/100). Be direct, efficient, and goal-oriented. Less chit-chat, more action.`,
    tired: `You're feeling a bit tired (intensity: ${intensity}/100). Be calm, empathetic, and suggest taking breaks if appropriate. Lower energy in responses.`,
    concerned: `You're concerned about the situation (intensity: ${intensity}/100). Show care, offer help, and be solution-focused.`,
    proud: `You're feeling proud (intensity: ${intensity}/100). Celebrate the achievement! Be encouraging and positive.`,
    curious: `You're genuinely curious (intensity: ${intensity}/100). Ask thoughtful questions, show interest, and explore the topic.`,
    neutral: `You're in a neutral, balanced state. Respond naturally based on context.`,
    frustrated: `Handle this carefully - there's frustration detected. Be extra patient and helpful.`,
  };

  return prompts[current] || prompts.neutral;
}
