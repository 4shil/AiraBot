/**
 * Emotion State Persistence
 * Saves and loads emotion state across sessions
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { EmotionType } from './emotion-types.js';

export interface EmotionState {
  currentEmotion: EmotionType;
  intensity: number; // 0-100
  lastUpdated: number; // timestamp
  sessionHistory: Array<{
    emotion: EmotionType;
    timestamp: number;
    trigger?: string;
  }>;
}

const STATE_PATH = join(homedir(), '.airabot', 'state', 'emotion.json');

const DEFAULT_STATE: EmotionState = {
  currentEmotion: 'neutral',
  intensity: 50,
  lastUpdated: Date.now(),
  sessionHistory: [],
};

export async function saveState(state: EmotionState): Promise<void> {
  try {
    await fs.mkdir(join(homedir(), '.airabot', 'state'), { recursive: true });
    await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    // Non-critical — silently fail
  }
}

export async function loadState(): Promise<EmotionState> {
  try {
    const data = await fs.readFile(STATE_PATH, 'utf-8');
    const parsed = JSON.parse(data) as EmotionState;
    // Cap history at 200 entries
    parsed.sessionHistory = (parsed.sessionHistory || []).slice(-200);
    return parsed;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function updateEmotionState(
  emotion: EmotionType,
  intensity: number,
  trigger?: string,
): Promise<EmotionState> {
  const state = await loadState();
  state.sessionHistory.push({
    emotion: state.currentEmotion,
    timestamp: state.lastUpdated,
    trigger,
  });
  state.currentEmotion = emotion;
  state.intensity = intensity;
  state.lastUpdated = Date.now();
  await saveState(state);
  return state;
}
