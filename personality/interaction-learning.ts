/**
 * Interaction-Based Evolution
 * Learns from user interactions and evolves personality over time
 */

import type { EmotionType, PersonalityTraits } from "./emotion-types.js";
import { getPersonalityEvolution } from "./personality-evolution.js";
import { getMoodTracker } from "./mood-tracker.js";
import { getEmotionLogger } from "./emotion-logger.js";

export interface InteractionPattern {
  type: "question" | "command" | "casual" | "problem" | "success" | "frustration";
  frequency: number;
  preferredResponseStyle?: "brief" | "detailed" | "humor" | "serious";
}

export interface LearningInsight {
  insight: string;
  confidence: number; // 0-100
  suggestedAdjustment?: {
    trait: keyof PersonalityTraits;
    delta: number;
  };
}

export class InteractionLearning {
  private interactionLog: Array<{
    timestamp: number;
    userInput: string;
    botEmotion: EmotionType;
    responseLength: number;
    userSatisfaction?: "positive" | "negative" | "neutral";
  }> = [];

  async analyzeInteractionPatterns(): Promise<InteractionPattern[]> {
    const patterns: Map<string, InteractionPattern> = new Map();

    for (const interaction of this.interactionLog) {
      const type = this.classifyInteraction(interaction.userInput);
      const existing = patterns.get(type) || {
        type: type as InteractionPattern["type"],
        frequency: 0,
      };
      existing.frequency++;
      patterns.set(type, existing);
    }

    return Array.from(patterns.values()).sort((a, b) => b.frequency - a.frequency);
  }

  private classifyInteraction(input: string): string {
    const lower = input.toLowerCase();

    if (lower.includes("?")) return "question";
    if (
      lower.startsWith("/") ||
      lower.includes("run") ||
      lower.includes("execute")
    )
      return "command";
    if (
      lower.includes("error") ||
      lower.includes("help") ||
      lower.includes("problem")
    )
      return "problem";
    if (
      lower.includes("worked") ||
      lower.includes("success") ||
      lower.includes("thanks")
    )
      return "success";
    if (
      lower.includes("wtf") ||
      lower.includes("damn") ||
      lower.includes("frustrated")
    )
      return "frustration";

    return "casual";
  }

  async logInteraction(
    userInput: string,
    botEmotion: EmotionType,
    responseLength: number,
    userSatisfaction?: "positive" | "negative" | "neutral",
  ): Promise<void> {
    this.interactionLog.push({
      timestamp: Date.now(),
      userInput: userInput.substring(0, 200),
      botEmotion,
      responseLength,
      userSatisfaction,
    });

    // Keep only last 500 interactions
    if (this.interactionLog.length > 500) {
      this.interactionLog = this.interactionLog.slice(-500);
    }

    // Analyze and learn periodically (every 10 interactions)
    if (this.interactionLog.length % 10 === 0) {
      await this.performLearning();
    }
  }

  private async performLearning(): Promise<void> {
    const insights = await this.generateLearningInsights();
    const evolution = await getPersonalityEvolution();

    for (const insight of insights) {
      if (insight.confidence > 70 && insight.suggestedAdjustment) {
        const { trait, delta } = insight.suggestedAdjustment;
        evolution.adjustTrait(trait, delta, `learning: ${insight.insight}`);
      }
    }
  }

  async generateLearningInsights(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    const patterns = await this.analyzeInteractionPatterns();

    // Analyze satisfaction rates
    const satisfactionCounts = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    for (const interaction of this.interactionLog.slice(-50)) {
      if (interaction.userSatisfaction) {
        satisfactionCounts[interaction.userSatisfaction]++;
      }
    }

    const total =
      satisfactionCounts.positive +
      satisfactionCounts.negative +
      satisfactionCounts.neutral;

    if (total > 10) {
      const positiveRate = satisfactionCounts.positive / total;
      const negativeRate = satisfactionCounts.negative / total;

      if (negativeRate > 0.3) {
        insights.push({
          insight: "High negative feedback rate - user may prefer different response style",
          confidence: 80,
          suggestedAdjustment: {
            trait: "directness",
            delta: 10,
          },
        });
      }

      if (positiveRate > 0.7) {
        insights.push({
          insight: "High positive feedback - current personality style is working well",
          confidence: 85,
        });
      }
    }

    // Analyze question frequency
    const questionPattern = patterns.find((p) => p.type === "question");
    if (questionPattern && questionPattern.frequency > patterns[0].frequency * 0.4) {
      insights.push({
        insight: "User asks many questions - increase proactiveness to anticipate needs",
        confidence: 75,
        suggestedAdjustment: {
          trait: "proactiveness",
          delta: 5,
        },
      });
    }

    // Analyze frustration patterns
    const frustrationPattern = patterns.find((p) => p.type === "frustration");
    if (
      frustrationPattern &&
      frustrationPattern.frequency > 5
    ) {
      insights.push({
        insight: "User shows frustration - increase empathy and support",
        confidence: 80,
        suggestedAdjustment: {
          trait: "empathy",
          delta: 10,
        },
      });
    }

    // Analyze casual interactions
    const casualPattern = patterns.find((p) => p.type === "casual");
    if (
      casualPattern &&
      casualPattern.frequency > patterns[0].frequency * 0.5
    ) {
      insights.push({
        insight: "Many casual interactions - user prefers relaxed conversation style",
        confidence: 70,
        suggestedAdjustment: {
          trait: "formality",
          delta: -10,
        },
      });
    }

    // Analyze response length preferences
    const avgResponseLength =
      this.interactionLog.slice(-20).reduce((sum, i) => sum + i.responseLength, 0) /
      Math.min(20, this.interactionLog.length);

    if (avgResponseLength < 100) {
      insights.push({
        insight: "User interactions result in brief responses - they may prefer concise communication",
        confidence: 65,
        suggestedAdjustment: {
          trait: "directness",
          delta: 5,
        },
      });
    }

    return insights;
  }

  async getEvolutionReport(): Promise<string> {
    const patterns = await this.analyzeInteractionPatterns();
    const insights = await this.generateLearningInsights();

    const lines: string[] = [
      "🧠 Personality Evolution Report",
      "",
      "Interaction Patterns:",
    ];

    for (const pattern of patterns.slice(0, 5)) {
      lines.push(`  • ${pattern.type}: ${pattern.frequency} occurrences`);
    }

    lines.push("", "Learning Insights:");

    for (const insight of insights) {
      lines.push(`  • ${insight.insight} (${insight.confidence}% confidence)`);
      if (insight.suggestedAdjustment) {
        const { trait, delta } = insight.suggestedAdjustment;
        const direction = delta > 0 ? "↑" : "↓";
        lines.push(`    ${direction} Suggested: Adjust ${trait} by ${Math.abs(delta)}`);
      }
    }

    return lines.join("\n");
  }

  getInteractionStats(): {
    totalInteractions: number;
    avgResponseLength: number;
    satisfactionRate: number;
  } {
    const total = this.interactionLog.length;
    const avgLength =
      total > 0
        ? this.interactionLog.reduce((sum, i) => sum + i.responseLength, 0) / total
        : 0;

    const withSatisfaction = this.interactionLog.filter(
      (i) => i.userSatisfaction,
    );
    const positiveCount = withSatisfaction.filter(
      (i) => i.userSatisfaction === "positive",
    ).length;
    const satisfactionRate =
      withSatisfaction.length > 0
        ? (positiveCount / withSatisfaction.length) * 100
        : 0;

    return {
      totalInteractions: total,
      avgResponseLength: Math.round(avgLength),
      satisfactionRate: Math.round(satisfactionRate),
    };
  }
}

// Global learning instance
let globalLearning: InteractionLearning | null = null;

export function getInteractionLearning(): InteractionLearning {
  if (!globalLearning) {
    globalLearning = new InteractionLearning();
  }
  return globalLearning;
}

// Convenience function to record complete interaction
export async function recordInteraction(data: {
  userInput: string;
  botEmotion: EmotionType;
  responseLength: number;
  userSatisfaction?: "positive" | "negative" | "neutral";
}): Promise<void> {
  const learning = getInteractionLearning();
  await learning.logInteraction(
    data.userInput,
    data.botEmotion,
    data.responseLength,
    data.userSatisfaction,
  );

  // Also log to mood tracker
  const mood = await getMoodTracker();
  await mood.logMood(
    {
      current: data.botEmotion,
      intensity: 70,
      timestamp: Date.now(),
    },
    data.userInput,
  );
}
