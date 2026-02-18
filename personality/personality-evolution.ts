/**
 * Personality Traits Evolution
 * Allows personality to adapt based on interactions and user preferences
 */

import type { PersonalityTraits, PersonalityConfig } from "./emotion-types.js";
import { DEFAULT_NIYA_PERSONALITY } from "./emotion-types.js";
import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface PersonalityAdjustment {
  timestamp: number;
  trait: keyof PersonalityTraits;
  oldValue: number;
  newValue: number;
  reason: string;
}

export interface InteractionFeedback {
  positive: boolean; // Did user like the response?
  context: string; // What was the context?
  personalitySnapshot: PersonalityTraits;
}

export class PersonalityEvolution {
  private config: PersonalityConfig;
  private adjustmentHistory: PersonalityAdjustment[] = [];
  private feedbackLog: InteractionFeedback[] = [];
  private configPath: string;
  private readonly maxHistorySize = 500;

  constructor(workspaceDir?: string) {
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.configPath = join(base, "personality-config.json");
    this.config = { ...DEFAULT_NIYA_PERSONALITY };
  }

  async loadConfig(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPath, "utf-8");
      const saved = JSON.parse(data);
      this.config = saved.config || { ...DEFAULT_NIYA_PERSONALITY };
      this.adjustmentHistory = saved.history || [];
      this.feedbackLog = saved.feedback || [];
    } catch (error) {
      // Use defaults if file doesn't exist
      this.config = { ...DEFAULT_NIYA_PERSONALITY };
    }
  }

  async saveConfig(): Promise<void> {
    try {
      const dir = join(this.configPath, "..");
      await fs.mkdir(dir, { recursive: true });

      const data = {
        config: this.config,
        history: this.adjustmentHistory.slice(-this.maxHistorySize),
        feedback: this.feedbackLog.slice(-this.maxHistorySize),
        lastUpdated: new Date().toISOString(),
      };

      await fs.writeFile(this.configPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save personality config:", error);
    }
  }

  getConfig(): PersonalityConfig {
    return { ...this.config };
  }

  getTraits(): PersonalityTraits {
    return { ...this.config.baseTraits };
  }

  adjustTrait(
    trait: keyof PersonalityTraits,
    delta: number,
    reason: string,
  ): void {
    const oldValue = this.config.baseTraits[trait];
    const newValue = Math.max(0, Math.min(100, oldValue + delta));

    if (oldValue === newValue) return; // No change

    this.config.baseTraits[trait] = newValue;

    this.adjustmentHistory.push({
      timestamp: Date.now(),
      trait,
      oldValue,
      newValue,
      reason,
    });

    this.saveConfig();
  }

  async recordFeedback(positive: boolean, context: string): Promise<void> {
    this.feedbackLog.push({
      positive,
      context,
      personalitySnapshot: { ...this.config.baseTraits },
    });

    await this.saveConfig();

    // Auto-adjust based on feedback (if adaptability is high)
    if (this.config.adaptability > 50) {
      await this.learnFromFeedback();
    }
  }

  private async learnFromFeedback(): Promise<void> {
    // Analyze recent feedback (last 10 interactions)
    const recentFeedback = this.feedbackLog.slice(-10);
    if (recentFeedback.length < 5) return; // Need enough data

    const positiveRate =
      recentFeedback.filter((f) => f.positive).length / recentFeedback.length;

    // If mostly negative feedback, make adjustments
    if (positiveRate < 0.4) {
      // User isn't happy - try adjusting traits
      const contextAnalysis = this.analyzeContexts(
        recentFeedback.filter((f) => !f.positive),
      );

      if (contextAnalysis.tooFormal) {
        this.adjustTrait("formality", -5, "user_feedback_too_formal");
      }
      if (contextAnalysis.notHelpfulEnough) {
        this.adjustTrait("proactiveness", 5, "user_feedback_need_more_help");
      }
      if (contextAnalysis.tooVerbose) {
        this.adjustTrait("directness", 10, "user_feedback_too_verbose");
      }
    }

    // If mostly positive, reinforce current traits (minor adjustment)
    if (positiveRate > 0.7) {
      // Slight increase in successful traits based on context
      const contextAnalysis = this.analyzeContexts(
        recentFeedback.filter((f) => f.positive),
      );

      if (contextAnalysis.humorAppreciated) {
        this.adjustTrait("humor", 2, "user_feedback_humor_working");
      }
      if (contextAnalysis.empathyAppreciated) {
        this.adjustTrait("empathy", 2, "user_feedback_empathy_working");
      }
    }
  }

  private analyzeContexts(
    feedback: InteractionFeedback[],
  ): {
    tooFormal: boolean;
    notHelpfulEnough: boolean;
    tooVerbose: boolean;
    humorAppreciated: boolean;
    empathyAppreciated: boolean;
  } {
    // Simple keyword-based context analysis
    const contexts = feedback.map((f) => f.context.toLowerCase());

    return {
      tooFormal:
        contexts.some((c) => c.includes("formal") || c.includes("stiff")) ||
        false,
      notHelpfulEnough:
        contexts.some((c) => c.includes("help") || c.includes("explain")) ||
        false,
      tooVerbose:
        contexts.some((c) => c.includes("long") || c.includes("brief")) ||
        false,
      humorAppreciated:
        contexts.some(
          (c) => c.includes("funny") || c.includes("lol") || c.includes("haha"),
        ) || false,
      empathyAppreciated:
        contexts.some(
          (c) => c.includes("understanding") || c.includes("support"),
        ) || false,
    };
  }

  getEvolutionSummary(): string {
    const recent = this.adjustmentHistory.slice(-10);
    if (recent.length === 0) {
      return "No personality adjustments yet.";
    }

    const lines: string[] = ["🧬 Personality Evolution (Last 10 adjustments):"];

    for (const adj of recent) {
      const direction = adj.newValue > adj.oldValue ? "↑" : "↓";
      const change = Math.abs(adj.newValue - adj.oldValue);
      lines.push(
        `  ${direction} ${adj.trait}: ${adj.oldValue} → ${adj.newValue} (+${change}) - ${adj.reason}`,
      );
    }

    const feedbackStats = this.feedbackLog.slice(-20);
    if (feedbackStats.length > 0) {
      const positiveCount = feedbackStats.filter((f) => f.positive).length;
      const rate = Math.round((positiveCount / feedbackStats.length) * 100);
      lines.push("", `Positive Feedback Rate: ${rate}% (last 20 interactions)`);
    }

    return lines.join("\n");
  }

  resetToDefault(): void {
    this.config = { ...DEFAULT_NIYA_PERSONALITY };
    this.adjustmentHistory = [];
    this.saveConfig();
  }
}

// Global evolution manager
let globalEvolution: PersonalityEvolution | null = null;

export async function getPersonalityEvolution(
  workspaceDir?: string,
): Promise<PersonalityEvolution> {
  if (!globalEvolution) {
    globalEvolution = new PersonalityEvolution(workspaceDir);
    await globalEvolution.loadConfig();
  }
  return globalEvolution;
}
