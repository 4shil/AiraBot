/**
 * Learning Feedback System
 * Learns from user reactions to improve proactive suggestions
 */

import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface FeedbackEntry {
  timestamp: number;
  suggestionType: string;
  suggestionMessage: string;
  reaction: "positive" | "negative" | "ignored";
  context: {
    timeOfDay: number;
    dayOfWeek: number;
    activityType?: string;
  };
}

export interface LearningMetrics {
  totalSuggestions: number;
  positiveRate: number;
  negativeRate: number;
  ignoredRate: number;
  topAcceptedTypes: string[];
  topRejectedTypes: string[];
}

export class LearningFeedback {
  private feedback: FeedbackEntry[] = [];
  private logPath: string;
  private readonly maxLogSize = 1000;

  constructor(workspaceDir?: string) {
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.logPath = join(base, "memory", "proactive-feedback.json");
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.logPath, "utf-8");
      this.feedback = JSON.parse(data);
    } catch {
      this.feedback = [];
    }
  }

  async save(): Promise<void> {
    try {
      const dir = join(this.logPath, "..");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        this.logPath,
        JSON.stringify(this.feedback.slice(-this.maxLogSize), null, 2),
      );
    } catch (error) {
      console.error("Failed to save feedback:", error);
    }
  }

  async recordFeedback(
    suggestionType: string,
    suggestionMessage: string,
    reaction: FeedbackEntry["reaction"],
    activityType?: string,
  ): Promise<void> {
    const now = new Date();
    this.feedback.push({
      timestamp: now.getTime(),
      suggestionType,
      suggestionMessage: suggestionMessage.substring(0, 100),
      reaction,
      context: {
        timeOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        activityType,
      },
    });

    if (this.feedback.length > this.maxLogSize) {
      this.feedback = this.feedback.slice(-this.maxLogSize);
    }

    await this.save();
  }

  getMetrics(windowDays: number = 30): LearningMetrics {
    const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const recent = this.feedback.filter((f) => f.timestamp > cutoff);

    if (recent.length === 0) {
      return {
        totalSuggestions: 0,
        positiveRate: 0,
        negativeRate: 0,
        ignoredRate: 0,
        topAcceptedTypes: [],
        topRejectedTypes: [],
      };
    }

    const total = recent.length;
    const positive = recent.filter((f) => f.reaction === "positive").length;
    const negative = recent.filter((f) => f.reaction === "negative").length;
    const ignored = recent.filter((f) => f.reaction === "ignored").length;

    // Count by type
    const typeCounts = {
      positive: new Map<string, number>(),
      negative: new Map<string, number>(),
    };

    for (const entry of recent) {
      if (entry.reaction === "positive") {
        typeCounts.positive.set(
          entry.suggestionType,
          (typeCounts.positive.get(entry.suggestionType) || 0) + 1,
        );
      } else if (entry.reaction === "negative") {
        typeCounts.negative.set(
          entry.suggestionType,
          (typeCounts.negative.get(entry.suggestionType) || 0) + 1,
        );
      }
    }

    const topAccepted = Array.from(typeCounts.positive.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    const topRejected = Array.from(typeCounts.negative.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    return {
      totalSuggestions: total,
      positiveRate: Math.round((positive / total) * 100),
      negativeRate: Math.round((negative / total) * 100),
      ignoredRate: Math.round((ignored / total) * 100),
      topAcceptedTypes: topAccepted,
      topRejectedTypes: topRejected,
    };
  }

  shouldSuggest(
    suggestionType: string,
    currentHour: number,
    currentDay: number,
  ): boolean {
    // Look at historical performance for this type at this time
    const similar = this.feedback.filter(
      (f) =>
        f.suggestionType === suggestionType &&
        Math.abs(f.context.timeOfDay - currentHour) <= 1 &&
        f.context.dayOfWeek === currentDay,
    );

    if (similar.length < 3) return true; // Not enough data, allow

    const positive = similar.filter((f) => f.reaction === "positive").length;
    const negative = similar.filter((f) => f.reaction === "negative").length;
    const successRate = (positive / similar.length) * 100;

    // Don't suggest if historically negative
    if (negative > positive && similar.length >= 5) {
      return false;
    }

    // Don't suggest if success rate too low
    if (successRate < 30 && similar.length >= 10) {
      return false;
    }

    return true;
  }

  getFeedbackSummary(): string {
    const metrics = this.getMetrics(30);

    const lines = [
      "📈 Learning Feedback (Last 30 days)",
      "",
      `Total Suggestions: ${metrics.totalSuggestions}`,
      `Positive: ${metrics.positiveRate}%`,
      `Negative: ${metrics.negativeRate}%`,
      `Ignored: ${metrics.ignoredRate}%`,
    ];

    if (metrics.topAcceptedTypes.length > 0) {
      lines.push("", "Most Accepted:");
      for (const type of metrics.topAcceptedTypes) {
        lines.push(`  • ${type}`);
      }
    }

    if (metrics.topRejectedTypes.length > 0) {
      lines.push("", "Most Rejected:");
      for (const type of metrics.topRejectedTypes) {
        lines.push(`  • ${type}`);
      }
    }

    return lines.join("\n");
  }

  getRecommendations(): string[] {
    const metrics = this.getMetrics(30);
    const recommendations: string[] = [];

    if (metrics.ignoredRate > 50) {
      recommendations.push(
        "High ignore rate - consider reducing notification frequency",
      );
    }

    if (metrics.negativeRate > 30) {
      recommendations.push(
        "High negative feedback - review suggestion timing and relevance",
      );
    }

    if (metrics.positiveRate > 70) {
      recommendations.push(
        "Great positive rate - current approach is working well!",
      );
    }

    for (const type of metrics.topRejectedTypes) {
      recommendations.push(`Consider reducing "${type}" suggestions`);
    }

    return recommendations;
  }
}

let globalFeedback: LearningFeedback | null = null;

export async function getLearningFeedback(
  workspaceDir?: string,
): Promise<LearningFeedback> {
  if (!globalFeedback) {
    globalFeedback = new LearningFeedback(workspaceDir);
    await globalFeedback.load();
  }
  return globalFeedback;
}

// ─── Extended feedback API for CLI ────────────────────────────────────────────

const FEEDBACK_PATH = join(homedir(), '.airabot', 'feedback.json');

export interface FeedbackRecord {
  suggestionId: string;
  category: string;
  reaction: 'yes' | 'no' | 'never';
  timestamp: number;
}

export interface SuggestionScore {
  category: string;
  score: number; // 0-1
  totalVotes: number;
  neverBlocked: boolean;
}

let feedbackStore: FeedbackRecord[] = [];

async function loadFeedbackStore(): Promise<void> {
  try {
    const data = await fs.readFile(FEEDBACK_PATH, 'utf-8');
    feedbackStore = JSON.parse(data) as FeedbackRecord[];
  } catch {
    feedbackStore = [];
  }
}

async function saveFeedbackStore(): Promise<void> {
  await fs.mkdir(join(homedir(), '.airabot'), { recursive: true });
  await fs.writeFile(FEEDBACK_PATH, JSON.stringify(feedbackStore, null, 2));
}

export async function recordFeedback(
  suggestionId: string,
  category: string,
  reaction: 'yes' | 'no' | 'never',
): Promise<void> {
  await loadFeedbackStore();
  feedbackStore.push({ suggestionId, category, reaction, timestamp: Date.now() });
  feedbackStore = feedbackStore.slice(-2000);
  await saveFeedbackStore();
}

export async function getSuggestionScore(category: string): Promise<number> {
  await loadFeedbackStore();
  const relevant = feedbackStore.filter((f) => f.category === category);
  if (relevant.length === 0) return 0.5; // neutral default

  const yes = relevant.filter((f) => f.reaction === 'yes').length;
  const no = relevant.filter((f) => f.reaction === 'no').length;
  const never = relevant.filter((f) => f.reaction === 'never').length;

  if (never > 0) return 0; // blocked
  if (yes + no === 0) return 0.5;
  return yes / (yes + no);
}

export async function shouldShowSuggestion(category: string): Promise<boolean> {
  const score = await getSuggestionScore(category);
  if (score === 0) return false; // never
  if (score < 0.2) return false; // too negative
  return true;
}
