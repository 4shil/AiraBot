/**
 * Personality & Emotion Engine
 * 
 * Complete emotion and personality system for AiraBot
 * 
 * Features:
 * - Emotion detection and state management
 * - Time-based personality shifts
 * - Mood tracking and pattern analysis
 * - Personality evolution through interactions
 * - Context-aware response modulation
 * 
 * Usage:
 * ```typescript
 * import { getPersonalityEngine, enhanceReplyWithPersonality } from './personality';
 * 
 * const engine = getPersonalityEngine();
 * await engine.initialize();
 * 
 * const result = await enhanceReplyWithPersonality(
 *   userMessage,
 *   baseResponse,
 *   { sessionStartTime: Date.now() }
 * );
 * ```
 */

// Core types
export type {
  EmotionType,
  EmotionState,
  PersonalityTraits,
  PersonalityConfig,
} from "./emotion-types.js";

export { DEFAULT_NIYA_PERSONALITY, EMOTION_TRIGGERS } from "./emotion-types.js";

// Emotion management
export {
  EmotionStateManager,
  getEmotionManager,
  resetEmotionManager,
} from "./emotion-manager.js";

// Emotion detection
export {
  detectUserEmotion,
  getResponseEmotion,
  adjustEmotionByContext,
} from "./emotion-detection.js";

// Response modulation
export {
  getResponseStyle,
  modulateResponse,
  getEmotionPromptAddition,
} from "./response-modulator.js";

// Mood tracking
export { MoodTracker, getMoodTracker } from "./mood-tracker.js";

// Personality evolution
export {
  PersonalityEvolution,
  getPersonalityEvolution,
} from "./personality-evolution.js";

// Time-based shifts
export {
  getTimeContext,
  adjustPersonalityForTime,
  getTimeBasedEmotion,
  getTimeSuggestions,
  getEnergyLevel,
  getTimeGreeting,
} from "./time-based-shifts.js";

// Emotion logging
export { EmotionHistoryLogger, getEmotionLogger } from "./emotion-logger.js";

// Interaction learning
export {
  InteractionLearning,
  getInteractionLearning,
  recordInteraction,
} from "./interaction-learning.js";

// NEW: Malayali cultural context
export {
  MALLU_PHRASES,
  MALAYALI_CALENDAR,
  MALLU_REGIONS,
  MALLU_FOOD_MOOD,
  TIME_BASED_MALLU_SHIFTS,
  MALLU_TECH_SLANG,
  MALLU_HUMOR_PATTERNS,
  MALAYALI_VALUES,
} from "./malayali-culture.js";

// Main engine
export {
  PersonalityEngine,
  getPersonalityEngine,
  enhanceReplyWithPersonality,
} from "./personality-engine.js";

export type {
  PersonalityContext,
  PersonalityResponse,
} from "./personality-engine.js";
