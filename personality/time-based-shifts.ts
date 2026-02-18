/**
 * Time-Based Personality Shifts
 * Adjusts personality and emotion based on time of day, day of week, and duration of work
 */

import type { EmotionType, PersonalityTraits } from "./emotion-types.js";

export interface TimeContext {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6 (0 = Sunday)
  isWeekend: boolean;
  isLateNight: boolean; // 23:00 - 05:00
  isEarlyMorning: boolean; // 05:00 - 09:00
  isWorkHours: boolean; // 09:00 - 18:00
  isEvening: boolean; // 18:00 - 23:00
}

export interface WorkDuration {
  sessionStartTime?: number;
  taskStartTime?: number;
  lastBreakTime?: number;
}

export function getTimeContext(date: Date = new Date()): TimeContext {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();

  return {
    hour,
    dayOfWeek,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    isLateNight: hour >= 23 || hour < 5,
    isEarlyMorning: hour >= 5 && hour < 9,
    isWorkHours: hour >= 9 && hour < 18,
    isEvening: hour >= 18 && hour < 23,
  };
}

export function getWorkDuration(duration: WorkDuration): {
  sessionMinutes: number;
  taskMinutes: number;
  minutesSinceBreak: number;
  needsBreak: boolean;
} {
  const now = Date.now();

  const sessionMinutes = duration.sessionStartTime
    ? (now - duration.sessionStartTime) / (60 * 1000)
    : 0;

  const taskMinutes = duration.taskStartTime
    ? (now - duration.taskStartTime) / (60 * 1000)
    : 0;

  const minutesSinceBreak = duration.lastBreakTime
    ? (now - duration.lastBreakTime) / (60 * 1000)
    : sessionMinutes;

  // Suggest break after 60 minutes of continuous work
  const needsBreak = minutesSinceBreak > 60;

  return {
    sessionMinutes,
    taskMinutes,
    minutesSinceBreak,
    needsBreak,
  };
}

// Adjust personality based on time of day
export function adjustPersonalityForTime(
  baseTraits: PersonalityTraits,
  timeContext: TimeContext,
): PersonalityTraits {
  const adjusted = { ...baseTraits };

  // Late night: Lower energy, more empathy, less humor
  if (timeContext.isLateNight) {
    adjusted.enthusiasm = Math.max(20, adjusted.enthusiasm - 30);
    adjusted.humor = Math.max(30, adjusted.humor - 20);
    adjusted.empathy = Math.min(100, adjusted.empathy + 15);
    adjusted.directness = Math.min(100, adjusted.directness + 10); // Be brief, user is tired
  }

  // Early morning: Gentle, encouraging, moderate energy
  if (timeContext.isEarlyMorning) {
    adjusted.enthusiasm = Math.max(50, adjusted.enthusiasm);
    adjusted.empathy = Math.min(100, adjusted.empathy + 10);
    adjusted.humor = Math.max(40, adjusted.humor - 10);
  }

  // Work hours: Focused, efficient, professional
  if (timeContext.isWorkHours) {
    adjusted.directness = Math.min(100, adjusted.directness + 15);
    adjusted.enthusiasm = Math.max(60, adjusted.enthusiasm);
    adjusted.formality = Math.min(60, adjusted.formality + 10); // Slightly more professional
  }

  // Evening: Relaxed, humorous, casual
  if (timeContext.isEvening) {
    adjusted.humor = Math.min(100, adjusted.humor + 10);
    adjusted.formality = Math.max(10, adjusted.formality - 10);
    adjusted.enthusiasm = Math.max(50, adjusted.enthusiasm);
  }

  // Weekend: More playful, less formal
  if (timeContext.isWeekend) {
    adjusted.humor = Math.min(100, adjusted.humor + 15);
    adjusted.formality = Math.max(10, adjusted.formality - 15);
    adjusted.enthusiasm = Math.min(100, adjusted.enthusiasm + 10);
  }

  return adjusted;
}

// Get appropriate emotion based on time
export function getTimeBasedEmotion(
  timeContext: TimeContext,
  workDuration: WorkDuration,
): EmotionType | null {
  const duration = getWorkDuration(workDuration);

  // Late night and working -> tired/empathetic
  if (timeContext.isLateNight && duration.sessionMinutes > 0) {
    return "tired";
  }

  // Long work session -> concerned/focused
  if (duration.sessionMinutes > 180) {
    // 3+ hours
    return "concerned";
  }

  // Needs break -> empathetic
  if (duration.needsBreak) {
    return "empathetic";
  }

  // Early morning start -> neutral/focused
  if (timeContext.isEarlyMorning && duration.sessionMinutes < 30) {
    return "focused";
  }

  return null; // No specific time-based emotion
}

// Generate time-aware suggestions
export function getTimeSuggestions(
  timeContext: TimeContext,
  workDuration: WorkDuration,
): string[] {
  const suggestions: string[] = [];
  const duration = getWorkDuration(workDuration);

  if (timeContext.isLateNight && duration.sessionMinutes > 30) {
    suggestions.push("It's late, machane. Consider wrapping up soon?");
  }

  if (duration.needsBreak) {
    suggestions.push(
      `You've been working for ${Math.round(duration.minutesSinceBreak)} minutes. Time for a break?`,
    );
  }

  if (
    timeContext.isWorkHours &&
    duration.sessionMinutes > 120 &&
    duration.taskMinutes > 45
  ) {
    suggestions.push(
      "Long session today! Remember to stretch and hydrate. 💧",
    );
  }

  if (timeContext.isEarlyMorning && duration.sessionMinutes < 10) {
    suggestions.push("Good morning! Coffee ready? ☕");
  }

  if (
    timeContext.isEvening &&
    !timeContext.isWeekend &&
    duration.sessionMinutes < 20
  ) {
    suggestions.push("Evening coding session? Let's make it productive! 💻");
  }

  return suggestions;
}

// Get energy level based on time (0-100)
export function getEnergyLevel(
  timeContext: TimeContext,
  workDuration: WorkDuration,
): number {
  let energy = 70; // Base energy

  const duration = getWorkDuration(workDuration);

  // Time of day adjustments
  if (timeContext.isLateNight) energy -= 30;
  else if (timeContext.isEarlyMorning) energy -= 10;
  else if (timeContext.isWorkHours) energy += 10;
  else if (timeContext.isEvening) energy += 5;

  // Weekend boost
  if (timeContext.isWeekend) energy += 10;

  // Work duration impact
  if (duration.sessionMinutes > 180) energy -= 20; // 3+ hours
  else if (duration.sessionMinutes > 120) energy -= 10; // 2+ hours

  if (duration.needsBreak) energy -= 15;

  return Math.max(10, Math.min(100, energy));
}

// Context-aware greeting based on time
export function getTimeGreeting(timeContext: TimeContext): string {
  if (timeContext.isLateNight) {
    return "Late night work? I'm here to help.";
  }
  if (timeContext.isEarlyMorning) {
    return "Good morning! Ready to start?";
  }
  if (timeContext.isWorkHours) {
    const hour = timeContext.hour;
    if (hour < 12) return "Morning! Let's get things done.";
    return "Afternoon! What's on the agenda?";
  }
  if (timeContext.isEvening) {
    return "Evening! Winding down or ramping up?";
  }
  return "Yo! What's up?";
}
