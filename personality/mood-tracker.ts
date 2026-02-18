/**
 * Mood Tracker
 * Tracks mood patterns over time and provides insights
 */

import type { EmotionState, EmotionType } from "./emotion-types.js";
import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface MoodEntry {
  timestamp: number;
  emotion: EmotionType;
  intensity: number;
  trigger?: string;
  userMessage?: string;
  timeOfDay: number; // 0-23 hour
  dayOfWeek: number; // 0-6 (0 = Sunday)
}

export interface MoodPattern {
  dominantEmotions: Array<{ emotion: EmotionType; percentage: number }>;
  averageIntensity: number;
  peakHours: number[]; // Hours when most active
  commonTriggers: Array<{ trigger: string; count: number }>;
}

export class MoodTracker {
  private moodLog: MoodEntry[] = [];
  private logPath: string;
  private readonly maxLogSize = 1000;

  constructor(workspaceDir?: string) {
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.logPath = join(base, "memory", "mood-log.json");
  }

  async loadHistory(): Promise<void> {
    try {
      const data = await fs.readFile(this.logPath, "utf-8");
      this.moodLog = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start fresh
      this.moodLog = [];
    }
  }

  async logMood(
    emotion: EmotionState,
    userMessage?: string,
  ): Promise<void> {
    const now = new Date();
    const entry: MoodEntry = {
      timestamp: now.getTime(),
      emotion: emotion.current,
      intensity: emotion.intensity,
      trigger: emotion.trigger,
      userMessage: userMessage?.substring(0, 100), // Truncate long messages
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
    };

    this.moodLog.push(entry);

    // Keep log size manageable
    if (this.moodLog.length > this.maxLogSize) {
      this.moodLog = this.moodLog.slice(-this.maxLogSize);
    }

    await this.saveHistory();
  }

  private async saveHistory(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = join(this.logPath, "..");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.logPath, JSON.stringify(this.moodLog, null, 2));
    } catch (error) {
      console.error("Failed to save mood log:", error);
    }
  }

  getMoodPattern(windowDays: number = 7): MoodPattern {
    const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const recent = this.moodLog.filter((entry) => entry.timestamp > cutoff);

    if (recent.length === 0) {
      return {
        dominantEmotions: [{ emotion: "neutral", percentage: 100 }],
        averageIntensity: 50,
        peakHours: [],
        commonTriggers: [],
      };
    }

    // Calculate emotion distribution
    const emotionCounts = new Map<EmotionType, number>();
    let totalIntensity = 0;

    for (const entry of recent) {
      emotionCounts.set(
        entry.emotion,
        (emotionCounts.get(entry.emotion) || 0) + 1,
      );
      totalIntensity += entry.intensity;
    }

    const dominantEmotions = Array.from(emotionCounts.entries())
      .map(([emotion, count]) => ({
        emotion,
        percentage: Math.round((count / recent.length) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const averageIntensity = Math.round(totalIntensity / recent.length);

    // Find peak activity hours
    const hourCounts = new Map<number, number>();
    for (const entry of recent) {
      hourCounts.set(entry.timeOfDay, (hourCounts.get(entry.timeOfDay) || 0) + 1);
    }

    const peakHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    // Common triggers
    const triggerCounts = new Map<string, number>();
    for (const entry of recent) {
      if (entry.trigger) {
        triggerCounts.set(
          entry.trigger,
          (triggerCounts.get(entry.trigger) || 0) + 1,
        );
      }
    }

    const commonTriggers = Array.from(triggerCounts.entries())
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      dominantEmotions,
      averageIntensity,
      peakHours,
      commonTriggers,
    };
  }

  getEmotionTimeline(
    windowHours: number = 24,
  ): Array<{ time: string; emotion: EmotionType; intensity: number }> {
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    return this.moodLog
      .filter((entry) => entry.timestamp > cutoff)
      .map((entry) => ({
        time: new Date(entry.timestamp).toISOString(),
        emotion: entry.emotion,
        intensity: entry.intensity,
      }));
  }

  getMoodSummary(): string {
    const pattern = this.getMoodPattern(7);
    const lines: string[] = [
      "📊 Mood Summary (Last 7 days):",
      "",
      "Dominant Emotions:",
    ];

    for (const { emotion, percentage } of pattern.dominantEmotions.slice(0, 3)) {
      lines.push(`  • ${emotion}: ${percentage}%`);
    }

    lines.push(
      "",
      `Average Intensity: ${pattern.averageIntensity}/100`,
      "",
      `Peak Hours: ${pattern.peakHours.map((h) => `${h}:00`).join(", ")}`,
    );

    if (pattern.commonTriggers.length > 0) {
      lines.push("", "Common Triggers:");
      for (const { trigger, count } of pattern.commonTriggers.slice(0, 3)) {
        lines.push(`  • ${trigger} (${count}x)`);
      }
    }

    return lines.join("\n");
  }
}

// Global tracker instance
let globalTracker: MoodTracker | null = null;

export async function getMoodTracker(workspaceDir?: string): Promise<MoodTracker> {
  if (!globalTracker) {
    globalTracker = new MoodTracker(workspaceDir);
    await globalTracker.loadHistory();
  }
  return globalTracker;
}
