/**
 * Emotion Detection
 * Analyzes user messages to detect their emotional state and trigger appropriate bot emotions
 */

import type { EmotionType } from "./emotion-types.js";

export interface UserEmotionSignals {
  detected: EmotionType[];
  confidence: number; // 0-100
  indicators: string[]; // What triggered the detection
}

// Keyword-based emotion detection patterns
const EMOTION_PATTERNS = {
  frustrated: [
    /wtf/i,
    /fuck/i,
    /damn/i,
    /shit/i,
    /error/i,
    /failed/i,
    /broken/i,
    /not working/i,
    /doesn't work/i,
    /wont work/i,
    /why/i,
    /frustrated/i,
  ],
  excited: [
    /!/,
    /awesome/i,
    /amazing/i,
    /great/i,
    /nice/i,
    /perfect/i,
    /yes!/i,
    /worked!/i,
    /success/i,
    /done!/i,
    /finished/i,
  ],
  concerned: [
    /worried/i,
    /concerned/i,
    /urgent/i,
    /help/i,
    /problem/i,
    /issue/i,
    /stuck/i,
  ],
  tired: [
    /tired/i,
    /exhausted/i,
    /sleepy/i,
    /can't focus/i,
    /long day/i,
  ],
  curious: [
    /\?$/,
    /how/i,
    /what/i,
    /why/i,
    /explain/i,
    /tell me/i,
    /show me/i,
  ],
  playful: [
    /lol/i,
    /haha/i,
    /funny/i,
    /joke/i,
    /😂/,
    /🤣/,
    /machane/i,
    /da/i,
    /entha/i,
  ],
};

export function detectUserEmotion(message: string): UserEmotionSignals {
  const detected: EmotionType[] = [];
  const indicators: string[] = [];

  // Check against each emotion pattern
  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        detected.push(emotion as EmotionType);
        indicators.push(`${emotion}: matched "${pattern}"`);
        break;
      }
    }
  }

  // Calculate confidence based on number of matches
  const confidence = Math.min(100, detected.length * 30 + 20);

  return {
    detected: [...new Set(detected)], // Remove duplicates
    confidence,
    indicators,
  };
}

// Map user emotions to appropriate bot response emotions
export function getResponseEmotion(
  userEmotions: EmotionType[],
): EmotionType | null {
  if (userEmotions.length === 0) return null;

  // Priority mapping - respond appropriately to user's emotional state
  const emotionPriority: Record<EmotionType, EmotionType> = {
    frustrated: "empathetic",
    concerned: "focused",
    tired: "empathetic",
    excited: "excited",
    playful: "playful",
    curious: "curious",
    proud: "proud",
    neutral: "neutral",
    empathetic: "empathetic",
    focused: "focused",
  };

  // Return the first detected emotion's response
  return emotionPriority[userEmotions[0]] || "neutral";
}

// Context-based emotion adjustments
export function adjustEmotionByContext(
  baseEmotion: EmotionType,
  context: {
    timeOfDay?: number; // 0-23
    taskDuration?: number; // minutes
    errorCount?: number;
    successStreak?: number;
  },
): { emotion: EmotionType; intensity: number } {
  let emotion = baseEmotion;
  let intensity = 70;

  // Late night -> tired/empathetic
  if (context.timeOfDay && (context.timeOfDay >= 23 || context.timeOfDay <= 5)) {
    if (emotion === "excited") emotion = "empathetic";
    intensity = Math.max(50, intensity - 20);
  }

  // Long task -> concerned/focused
  if (context.taskDuration && context.taskDuration > 120) {
    if (emotion === "playful") emotion = "focused";
    intensity = Math.min(90, intensity + 10);
  }

  // Multiple errors -> empathetic
  if (context.errorCount && context.errorCount > 3) {
    emotion = "empathetic";
    intensity = 85;
  }

  // Success streak -> excited/proud
  if (context.successStreak && context.successStreak > 3) {
    if (emotion === "neutral") emotion = "proud";
    intensity = Math.min(95, intensity + 15);
  }

  return { emotion, intensity };
}
