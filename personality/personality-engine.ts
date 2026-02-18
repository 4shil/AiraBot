/**
 * Personality Engine - Main Integration
 * Connects all personality systems to the reply/response pipeline
 */

import type { EmotionType } from "./emotion-types.js";
import { getEmotionManager } from "./emotion-manager.js";
import {
  detectUserEmotion,
  getResponseEmotion,
  adjustEmotionByContext,
} from "./emotion-detection.js";
import {
  getResponseStyle,
  modulateResponse,
  getEmotionPromptAddition,
} from "./response-modulator.js";
import { getMoodTracker } from "./mood-tracker.js";
import { getPersonalityEvolution } from "./personality-evolution.js";
import { getEmotionLogger } from "./emotion-logger.js";
import {
  getTimeContext,
  adjustPersonalityForTime,
  getTimeBasedEmotion,
  getTimeSuggestions,
} from "./time-based-shifts.js";
import { recordInteraction } from "./interaction-learning.js";

export interface PersonalityContext {
  userMessage: string;
  workspaceDir?: string;
  sessionStartTime?: number;
  taskStartTime?: number;
  lastBreakTime?: number;
  errorCount?: number;
  successStreak?: number;
}

export interface PersonalityResponse {
  systemPromptAddition: string;
  responseModulator: (response: string) => string;
  currentEmotion: EmotionType;
  emotionIntensity: number;
  suggestions: string[];
  metadata: {
    detectedUserEmotion: EmotionType[];
    timeContext: string;
    energyLevel: number;
  };
}

export class PersonalityEngine {
  private initialized = false;

  async initialize(workspaceDir?: string): Promise<void> {
    if (this.initialized) return;

    // Initialize all subsystems
    await getPersonalityEvolution(workspaceDir);
    await getMoodTracker(workspaceDir);
    await getEmotionLogger(workspaceDir);

    this.initialized = true;
  }

  async processInteraction(
    context: PersonalityContext,
  ): Promise<PersonalityResponse> {
    if (!this.initialized) {
      await this.initialize(context.workspaceDir);
    }

    // Get managers
    const emotionMgr = getEmotionManager();
    const evolution = await getPersonalityEvolution(context.workspaceDir);
    const logger = await getEmotionLogger(context.workspaceDir);

    // Decay current emotion first
    emotionMgr.decayEmotion();

    // Get current state
    const currentState = emotionMgr.getCurrentEmotion();
    const basePersonality = evolution.getTraits();

    // Detect user emotion
    const userEmotionSignals = detectUserEmotion(context.userMessage);
    const responseEmotionType = getResponseEmotion(userEmotionSignals.detected);

    // Get time context
    const timeContext = getTimeContext();
    const timeBasedEmotion = getTimeBasedEmotion(timeContext, {
      sessionStartTime: context.sessionStartTime,
      taskStartTime: context.taskStartTime,
      lastBreakTime: context.lastBreakTime,
    });

    // Determine final emotion (priority: time > user > current)
    let finalEmotion: EmotionType =
      timeBasedEmotion || responseEmotionType || currentState.current;

    // Adjust by context
    const adjusted = adjustEmotionByContext(finalEmotion, {
      timeOfDay: timeContext.hour,
      taskDuration: context.taskStartTime
        ? (Date.now() - context.taskStartTime) / (60 * 1000)
        : undefined,
      errorCount: context.errorCount,
      successStreak: context.successStreak,
    });

    finalEmotion = adjusted.emotion;
    const intensity = adjusted.intensity;

    // Update emotion state
    const previousEmotion = emotionMgr.getCurrentEmotion();
    emotionMgr.setEmotion(finalEmotion, intensity, "user_interaction", {
      userMessage: context.userMessage,
      userEmotions: userEmotionSignals.detected,
      timeOfDay: timeContext.hour,
    });

    // Log transition
    const newEmotion = emotionMgr.getCurrentEmotion();
    await logger.logTransition(
      previousEmotion,
      newEmotion,
      context.userMessage,
      true,
    );

    // Adjust personality for time
    const adjustedPersonality = adjustPersonalityForTime(
      basePersonality,
      timeContext,
    );

    // Get response style
    const responseStyle = getResponseStyle(newEmotion, adjustedPersonality);

    // Get time-based suggestions
    const suggestions = getTimeSuggestions(timeContext, {
      sessionStartTime: context.sessionStartTime,
      taskStartTime: context.taskStartTime,
      lastBreakTime: context.lastBreakTime,
    });

    // Generate system prompt addition
    const systemPromptAddition = this.generateSystemPrompt(
      newEmotion,
      adjustedPersonality,
      userEmotionSignals.detected,
    );

    // Create response modulator function
    const responseModulator = (baseResponse: string): string => {
      return modulateResponse(baseResponse, responseStyle);
    };

    return {
      systemPromptAddition,
      responseModulator,
      currentEmotion: finalEmotion,
      emotionIntensity: intensity,
      suggestions,
      metadata: {
        detectedUserEmotion: userEmotionSignals.detected,
        timeContext: timeContext.isLateNight
          ? "late_night"
          : timeContext.isEarlyMorning
          ? "early_morning"
          : timeContext.isWorkHours
          ? "work_hours"
          : "evening",
        energyLevel: adjusted.intensity,
      },
    };
  }

  private generateSystemPrompt(
    emotion: { current: EmotionType; intensity: number },
    personality: typeof import("./emotion-types.js").PersonalityTraits,
    userEmotions: EmotionType[],
  ): string {
    const parts: string[] = [];

    // Base emotion prompt
    parts.push(getEmotionPromptAddition(emotion, personality));

    // Personality traits guidance
    parts.push(
      `\nPersonality traits (0-100 scale):
- Humor: ${personality.humor}
- Empathy: ${personality.empathy}
- Directness: ${personality.directness}
- Proactiveness: ${personality.proactiveness}
- Enthusiasm: ${personality.enthusiasm}
- Formality: ${personality.formality}`,
    );

    // User emotion context
    if (userEmotions.length > 0) {
      parts.push(
        `\nUser seems to be feeling: ${userEmotions.join(", ")}. Respond accordingly.`,
      );
    }

    return parts.join("\n");
  }

  async recordFeedback(
    positive: boolean,
    context: string,
    workspaceDir?: string,
  ): Promise<void> {
    const evolution = await getPersonalityEvolution(workspaceDir);
    await evolution.recordFeedback(positive, context);
  }

  async logInteraction(
    userInput: string,
    responseLength: number,
    userSatisfaction?: "positive" | "negative" | "neutral",
  ): Promise<void> {
    const emotionMgr = getEmotionManager();
    const current = emotionMgr.getCurrentEmotion();

    await recordInteraction({
      userInput,
      botEmotion: current.current,
      responseLength,
      userSatisfaction,
    });
  }

  async getPersonalityReport(workspaceDir?: string): Promise<string> {
    const emotionMgr = getEmotionManager();
    const evolution = await getPersonalityEvolution(workspaceDir);
    const mood = await getMoodTracker(workspaceDir);
    const logger = await getEmotionLogger(workspaceDir);

    const lines: string[] = [
      "🤖 AiraBot Personality Report",
      "═══════════════════════════════",
      "",
      "Current State:",
      `  Emotion: ${emotionMgr.getCurrentEmotion().current}`,
      `  Intensity: ${emotionMgr.getCurrentEmotion().intensity}/100`,
      "",
      evolution.getEvolutionSummary(),
      "",
      mood.getMoodSummary(),
      "",
      logger.getHistorySummary(),
    ];

    return lines.join("\n");
  }
}

// Global engine instance
let globalEngine: PersonalityEngine | null = null;

export function getPersonalityEngine(): PersonalityEngine {
  if (!globalEngine) {
    globalEngine = new PersonalityEngine();
  }
  return globalEngine;
}

// Convenience function for reply pipeline integration
export async function enhanceReplyWithPersonality(
  userMessage: string,
  baseResponse: string,
  context?: Partial<PersonalityContext>,
): Promise<{ enhancedResponse: string; metadata: Record<string, unknown> }> {
  const engine = getPersonalityEngine();
  const fullContext: PersonalityContext = {
    userMessage,
    ...context,
  };

  const personality = await engine.processInteraction(fullContext);

  // Modulate the response
  const enhancedResponse = personality.responseModulator(baseResponse);

  // Log the interaction
  await engine.logInteraction(userMessage, enhancedResponse.length);

  return {
    enhancedResponse,
    metadata: {
      emotion: personality.currentEmotion,
      intensity: personality.emotionIntensity,
      suggestions: personality.suggestions,
      ...personality.metadata,
    },
  };
}
