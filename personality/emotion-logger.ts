/**
 * Emotion History Logger
 * Comprehensive logging system for emotion states, triggers, and transitions
 */

import type { EmotionState, EmotionType } from "./emotion-types.js";
import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface EmotionTransition {
  timestamp: number;
  from: EmotionType;
  to: EmotionType;
  trigger: string;
  context?: Record<string, unknown>;
  userMessage?: string;
  responseGenerated?: boolean;
}

export interface EmotionStatistics {
  totalTransitions: number;
  averageIntensity: number;
  mostFrequentEmotion: EmotionType;
  mostCommonTrigger: string;
  transitionsPerHour: number;
  uptime: number; // minutes
}

export class EmotionHistoryLogger {
  private transitions: EmotionTransition[] = [];
  private logPath: string;
  private sessionStart: number;
  private readonly maxLogSize = 2000;

  constructor(workspaceDir?: string) {
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.logPath = join(base, "memory", "emotion-history.jsonl");
    this.sessionStart = Date.now();
  }

  async loadHistory(): Promise<void> {
    try {
      const data = await fs.readFile(this.logPath, "utf-8");
      const lines = data.trim().split("\n").filter(Boolean);

      this.transitions = lines.slice(-this.maxLogSize).map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean) as EmotionTransition[];
    } catch (error) {
      // File doesn't exist yet
      this.transitions = [];
    }
  }

  async logTransition(
    from: EmotionState,
    to: EmotionState,
    userMessage?: string,
    responseGenerated: boolean = false,
  ): Promise<void> {
    const transition: EmotionTransition = {
      timestamp: Date.now(),
      from: from.current,
      to: to.current,
      trigger: to.trigger || "unknown",
      context: to.context,
      userMessage: userMessage?.substring(0, 150), // Truncate
      responseGenerated,
    };

    this.transitions.push(transition);

    // Append to JSONL file
    try {
      const dir = join(this.logPath, "..");
      await fs.mkdir(dir, { recursive: true });

      const line = JSON.stringify(transition) + "\n";
      await fs.appendFile(this.logPath, line);

      // Trim if too large (keep last maxLogSize entries)
      if (this.transitions.length > this.maxLogSize) {
        this.transitions = this.transitions.slice(-this.maxLogSize);
        await this.rotateLog();
      }
    } catch (error) {
      console.error("Failed to log emotion transition:", error);
    }
  }

  private async rotateLog(): Promise<void> {
    try {
      // Rewrite file with only recent entries
      const lines = this.transitions.map((t) => JSON.stringify(t)).join("\n") + "\n";
      await fs.writeFile(this.logPath, lines);
    } catch (error) {
      console.error("Failed to rotate emotion log:", error);
    }
  }

  getStatistics(windowHours: number = 24): EmotionStatistics {
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    const recent = this.transitions.filter((t) => t.timestamp > cutoff);

    if (recent.length === 0) {
      return {
        totalTransitions: 0,
        averageIntensity: 50,
        mostFrequentEmotion: "neutral",
        mostCommonTrigger: "none",
        transitionsPerHour: 0,
        uptime: 0,
      };
    }

    // Count emotions
    const emotionCounts = new Map<EmotionType, number>();
    for (const trans of recent) {
      emotionCounts.set(
        trans.to,
        (emotionCounts.get(trans.to) || 0) + 1,
      );
    }

    // Find most frequent
    let maxCount = 0;
    let mostFrequent: EmotionType = "neutral";
    for (const [emotion, count] of emotionCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = emotion;
      }
    }

    // Count triggers
    const triggerCounts = new Map<string, number>();
    for (const trans of recent) {
      triggerCounts.set(
        trans.trigger,
        (triggerCounts.get(trans.trigger) || 0) + 1,
      );
    }

    let mostCommonTrigger = "unknown";
    let maxTriggerCount = 0;
    for (const [trigger, count] of triggerCounts) {
      if (count > maxTriggerCount) {
        maxTriggerCount = count;
        mostCommonTrigger = trigger;
      }
    }

    // Calculate transitions per hour
    const hours = Math.max(1, (Date.now() - cutoff) / (60 * 60 * 1000));
    const transitionsPerHour = recent.length / hours;

    // Session uptime
    const uptime = (Date.now() - this.sessionStart) / (60 * 1000);

    return {
      totalTransitions: recent.length,
      averageIntensity: 70, // This would need actual intensity tracking
      mostFrequentEmotion: mostFrequent,
      mostCommonTrigger,
      transitionsPerHour,
      uptime,
    };
  }

  getRecentTransitions(limit: number = 10): EmotionTransition[] {
    return this.transitions.slice(-limit);
  }

  getTransitionChain(emotion: EmotionType): EmotionType[] {
    // Find what emotions typically follow the given emotion
    const following = new Map<EmotionType, number>();

    for (let i = 0; i < this.transitions.length - 1; i++) {
      if (this.transitions[i].to === emotion) {
        const next = this.transitions[i + 1].to;
        following.set(next, (following.get(next) || 0) + 1);
      }
    }

    return Array.from(following.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion]) => emotion);
  }

  getTriggerAnalysis(): Array<{ trigger: string; count: number; emotions: EmotionType[] }> {
    const triggerMap = new Map<string, { count: number; emotions: Set<EmotionType> }>();

    for (const trans of this.transitions) {
      const existing = triggerMap.get(trans.trigger) || {
        count: 0,
        emotions: new Set<EmotionType>(),
      };
      existing.count++;
      existing.emotions.add(trans.to);
      triggerMap.set(trans.trigger, existing);
    }

    return Array.from(triggerMap.entries())
      .map(([trigger, data]) => ({
        trigger,
        count: data.count,
        emotions: Array.from(data.emotions),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  getHistorySummary(): string {
    const stats = this.getStatistics(24);
    const lines: string[] = [
      "📝 Emotion History (Last 24 hours):",
      "",
      `Total Transitions: ${stats.totalTransitions}`,
      `Transitions/Hour: ${stats.transitionsPerHour.toFixed(2)}`,
      `Most Frequent Emotion: ${stats.mostFrequentEmotion}`,
      `Most Common Trigger: ${stats.mostCommonTrigger}`,
      `Session Uptime: ${Math.round(stats.uptime)} minutes`,
      "",
      "Recent Transitions:",
    ];

    const recent = this.getRecentTransitions(5);
    for (const trans of recent) {
      const time = new Date(trans.timestamp).toLocaleTimeString();
      lines.push(`  ${time}: ${trans.from} → ${trans.to} (${trans.trigger})`);
    }

    return lines.join("\n");
  }

  async exportHistory(outputPath?: string): Promise<string> {
    const path = outputPath || join(
      homedir(),
      ".airabot",
      "workspace",
      "memory",
      `emotion-export-${Date.now()}.json`,
    );

    const data = {
      exported: new Date().toISOString(),
      sessionStart: new Date(this.sessionStart).toISOString(),
      statistics: this.getStatistics(24),
      transitions: this.transitions,
      triggerAnalysis: this.getTriggerAnalysis(),
    };

    await fs.writeFile(path, JSON.stringify(data, null, 2));
    return path;
  }

  clearHistory(): void {
    this.transitions = [];
    this.sessionStart = Date.now();
  }
}

// Global logger instance
let globalLogger: EmotionHistoryLogger | null = null;

export async function getEmotionLogger(
  workspaceDir?: string,
): Promise<EmotionHistoryLogger> {
  if (!globalLogger) {
    globalLogger = new EmotionHistoryLogger(workspaceDir);
    await globalLogger.loadHistory();
  }
  return globalLogger;
}
