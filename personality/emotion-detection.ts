/**
 * Emotion Detection
 * Analyzes user messages to detect their emotional state and trigger appropriate bot emotions
 * Uses regex as fast pre-filter, falls back to LLM classification via OpenRouter
 */

import type { EmotionType } from './emotion-types.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface UserEmotionSignals {
  detected: EmotionType[];
  confidence: number; // 0-100
  indicators: string[]; // What triggered the detection
}

// Keyword-based emotion detection patterns (fast pre-filter)
const EMOTION_PATTERNS = {
  frustrated: [
    /wtf/i, /fuck/i, /damn/i, /shit/i, /error/i, /failed/i, /broken/i,
    /not working/i, /doesn't work/i, /wont work/i, /frustrated/i,
  ],
  excited: [
    /!/,
    /awesome/i, /amazing/i, /great/i, /nice/i, /perfect/i, /yes!/i,
    /worked!/i, /success/i, /done!/i, /finished/i,
  ],
  concerned: [
    /worried/i, /concerned/i, /urgent/i, /help/i, /problem/i, /issue/i, /stuck/i,
  ],
  tired: [
    /tired/i, /exhausted/i, /sleepy/i, /can't focus/i, /long day/i,
  ],
  curious: [
    /\?$/, /how/i, /what/i, /explain/i, /tell me/i, /show me/i,
  ],
  playful: [
    /lol/i, /haha/i, /funny/i, /joke/i, /😂/, /🤣/, /machane/i, /da/i, /entha/i,
  ],
};

async function readConfig(): Promise<Record<string, string>> {
  try {
    const configPath = join(homedir(), '.airabot', 'config.json');
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * Classify emotion using OpenRouter LLM (mistralai/mistral-7b-instruct).
 * Falls back to undefined if API unavailable.
 */
export async function classifyEmotionLLM(message: string): Promise<EmotionType | undefined> {
  const config = await readConfig();
  const apiKey = process.env.OPENROUTER_API_KEY ?? config['openrouterApiKey'];
  if (!apiKey) return undefined;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/4shil/AiraBot',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'user',
            content: `Classify the emotion in this message into one of: excited, frustrated, concerned, tired, curious, happy, neutral. Return only the emotion word.\n\nMessage: "${message}"`,
          },
        ],
        max_tokens: 10,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return undefined;
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const word = data.choices?.[0]?.message?.content?.trim().toLowerCase();
    const validEmotions: EmotionType[] = [
      'excited', 'frustrated', 'concerned', 'tired', 'curious', 'neutral', 'playful', 'empathetic',
    ];
    if (word && validEmotions.includes(word as EmotionType)) {
      return word as EmotionType;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function detectUserEmotionRegex(message: string): UserEmotionSignals {
  const detected: EmotionType[] = [];
  const indicators: string[] = [];

  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        detected.push(emotion as EmotionType);
        indicators.push(`${emotion}: matched "${pattern}"`);
        break;
      }
    }
  }

  const confidence = Math.min(100, detected.length * 30 + 20);
  return { detected: [...new Set(detected)], confidence, indicators };
}

export async function detectUserEmotion(message: string): Promise<UserEmotionSignals> {
  // Fast regex pre-filter
  const regexResult = detectUserEmotionRegex(message);

  // If regex is confident enough, skip LLM
  if (regexResult.confidence >= 60) {
    return regexResult;
  }

  // Try LLM classification
  const llmEmotion = await classifyEmotionLLM(message);
  if (llmEmotion) {
    return {
      detected: [llmEmotion],
      confidence: 85,
      indicators: [`LLM classified: ${llmEmotion}`],
    };
  }

  // Fall back to regex result
  return regexResult.detected.length > 0
    ? regexResult
    : { detected: ['neutral' as EmotionType], confidence: 40, indicators: ['default neutral'] };
}

export function getResponseEmotion(userEmotions: EmotionType[]): EmotionType | null {
  if (userEmotions.length === 0) return null;
  const emotionPriority: Record<EmotionType, EmotionType> = {
    frustrated: 'empathetic',
    concerned: 'focused',
    tired: 'empathetic',
    excited: 'excited',
    playful: 'playful',
    curious: 'curious',
    proud: 'proud',
    neutral: 'neutral',
    empathetic: 'empathetic',
    focused: 'focused',
    happy: 'excited',
  };
  return emotionPriority[userEmotions[0]] || 'neutral';
}

export function adjustEmotionByContext(
  baseEmotion: EmotionType,
  context: {
    timeOfDay?: number;
    taskDuration?: number;
    errorCount?: number;
    successStreak?: number;
  },
): { emotion: EmotionType; intensity: number } {
  let emotion = baseEmotion;
  let intensity = 70;
  if (context.timeOfDay && (context.timeOfDay >= 23 || context.timeOfDay <= 5)) {
    if (emotion === 'excited') emotion = 'empathetic';
    intensity = Math.max(50, intensity - 20);
  }
  if (context.taskDuration && context.taskDuration > 120) {
    if (emotion === 'playful') emotion = 'focused';
    intensity = Math.min(90, intensity + 10);
  }
  if (context.errorCount && context.errorCount > 3) {
    emotion = 'empathetic';
    intensity = 85;
  }
  if (context.successStreak && context.successStreak > 3) {
    if (emotion === 'neutral') emotion = 'proud';
    intensity = Math.min(95, intensity + 15);
  }
  return { emotion, intensity };
}
