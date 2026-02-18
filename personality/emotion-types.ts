/**
 * Emotion & Personality Engine - Core Types
 * Defines emotional states and personality traits for AiraBot
 */

export type EmotionType =
  | "neutral"
  | "excited"
  | "empathetic"
  | "playful"
  | "focused"
  | "tired"
  | "concerned"
  | "proud"
  | "curious"
  | "frustrated";

export interface EmotionState {
  current: EmotionType;
  intensity: number; // 0-100
  timestamp: number;
  trigger?: string; // What caused this emotion
  context?: Record<string, unknown>;
}

export interface PersonalityTraits {
  humor: number; // 0-100: How much humor/wit in responses
  empathy: number; // 0-100: How emotionally supportive
  directness: number; // 0-100: How straight-to-the-point vs casual
  proactiveness: number; // 0-100: How much unsolicited help to offer
  enthusiasm: number; // 0-100: Energy level in responses
  formality: number; // 0-100: Professional vs casual tone
}

export interface PersonalityConfig {
  name: string;
  baseTraits: PersonalityTraits;
  emotionalRange: EmotionType[]; // Which emotions this personality can express
  adaptability: number; // 0-100: How much personality evolves based on interactions
}

export const DEFAULT_NIYA_PERSONALITY: PersonalityConfig = {
  name: "Niya",
  baseTraits: {
    humor: 75,
    empathy: 80,
    directness: 70,
    proactiveness: 65,
    enthusiasm: 75,
    formality: 20, // Very casual
  },
  emotionalRange: [
    "neutral",
    "excited",
    "empathetic",
    "playful",
    "focused",
    "tired",
    "proud",
    "curious",
  ],
  adaptability: 60,
};

export const EMOTION_TRIGGERS = {
  success: ["excited", "proud"],
  error: ["concerned", "empathetic"],
  lateNight: ["tired", "empathetic"],
  longTask: ["focused", "concerned"],
  newDiscovery: ["excited", "curious"],
  userFrustration: ["empathetic", "focused"],
  achievement: ["proud", "excited"],
  casual: ["playful", "neutral"],
} as const;
