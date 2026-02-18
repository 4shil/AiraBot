/**
 * Emotion State Manager
 * Tracks and manages current emotional state of AiraBot
 */

import type {
  EmotionState,
  EmotionType,
  PersonalityConfig,
} from "./emotion-types.js";
import { DEFAULT_NIYA_PERSONALITY } from "./emotion-types.js";

export class EmotionStateManager {
  private currentState: EmotionState;
  private history: EmotionState[] = [];
  private personality: PersonalityConfig;
  private readonly maxHistorySize = 100;

  constructor(personality: PersonalityConfig = DEFAULT_NIYA_PERSONALITY) {
    this.personality = personality;
    this.currentState = {
      current: "neutral",
      intensity: 50,
      timestamp: Date.now(),
    };
  }

  getCurrentEmotion(): EmotionState {
    return { ...this.currentState };
  }

  setEmotion(
    emotion: EmotionType,
    intensity: number = 70,
    trigger?: string,
    context?: Record<string, unknown>,
  ): void {
    // Validate emotion is in personality's range
    if (!this.personality.emotionalRange.includes(emotion)) {
      console.warn(
        `Emotion ${emotion} not in personality range, defaulting to neutral`,
      );
      emotion = "neutral";
    }

    // Store previous state in history
    this.history.push(this.currentState);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Update current state
    this.currentState = {
      current: emotion,
      intensity: Math.max(0, Math.min(100, intensity)),
      timestamp: Date.now(),
      trigger,
      context,
    };
  }

  getEmotionHistory(limit: number = 10): EmotionState[] {
    return this.history.slice(-limit);
  }

  getDominantEmotion(windowMinutes: number = 60): EmotionType {
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    const recentEmotions = this.history.filter((e) => e.timestamp > cutoff);

    if (recentEmotions.length === 0) {
      return this.currentState.current;
    }

    const emotionCounts = new Map<EmotionType, number>();
    for (const state of recentEmotions) {
      emotionCounts.set(
        state.current,
        (emotionCounts.get(state.current) || 0) + 1,
      );
    }

    let maxCount = 0;
    let dominant: EmotionType = "neutral";
    for (const [emotion, count] of emotionCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominant = emotion;
      }
    }

    return dominant;
  }

  getPersonality(): PersonalityConfig {
    return { ...this.personality };
  }

  updatePersonality(updates: Partial<PersonalityConfig>): void {
    this.personality = { ...this.personality, ...updates };
  }

  // Decay emotion intensity over time (emotions fade)
  decayEmotion(decayRate: number = 0.1): void {
    const timeSinceUpdate = Date.now() - this.currentState.timestamp;
    const minutesPassed = timeSinceUpdate / (60 * 1000);

    if (minutesPassed > 5) {
      const newIntensity = Math.max(
        30,
        this.currentState.intensity - minutesPassed * decayRate,
      );
      this.currentState.intensity = newIntensity;

      // If intensity drops too low, return to neutral
      if (newIntensity <= 35 && this.currentState.current !== "neutral") {
        this.setEmotion("neutral", 50, "emotion_decay");
      }
    }
  }

  toJSON(): string {
    return JSON.stringify({
      current: this.currentState,
      personality: this.personality,
      recentHistory: this.history.slice(-5),
    });
  }
}

// Global singleton instance
let globalEmotionManager: EmotionStateManager | null = null;

export function getEmotionManager(): EmotionStateManager {
  if (!globalEmotionManager) {
    globalEmotionManager = new EmotionStateManager();
  }
  return globalEmotionManager;
}

export function resetEmotionManager(): void {
  globalEmotionManager = new EmotionStateManager();
}
