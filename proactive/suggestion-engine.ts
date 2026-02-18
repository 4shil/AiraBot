/**
 * Suggestion Engine
 * Generates proactive suggestions based on patterns and context
 */

import type { DetectedPattern } from "./pattern-detector.js";
import type { ActivitySession } from "./activity-tracker.js";

export interface ProactiveSuggestion {
  id: string;
  priority: "low" | "medium" | "high";
  category: "health" | "productivity" | "learning" | "reminder" | "optimization";
  message: string;
  action?: {
    type: "remind" | "execute" | "ask";
    payload?: Record<string, unknown>;
  };
  expiresAt?: number;
}

export class SuggestionEngine {
  private suggestions: ProactiveSuggestion[] = [];

  generateSuggestions(context: {
    patterns?: DetectedPattern[];
    currentActivity?: ActivitySession | null;
    needsBreak?: boolean;
    timeOfDay?: number;
    errorCount?: number;
  }): ProactiveSuggestion[] {
    this.suggestions = [];

    // Break suggestions
    if (context.needsBreak) {
      this.suggestions.push({
        id: `break-${Date.now()}`,
        priority: "high",
        category: "health",
        message: "You've been working for over an hour. Time for a quick break? Stretch, grab water, rest your eyes.",
        action: {
          type: "remind",
          payload: { type: "break", duration: 5 },
        },
      });
    }

    // Pattern-based suggestions
    if (context.patterns) {
      for (const pattern of context.patterns) {
        if (pattern.suggestedAction) {
          this.suggestions.push({
            id: `pattern-${pattern.pattern}-${Date.now()}`,
            priority: pattern.confidence > 80 ? "high" : "medium",
            category: "productivity",
            message: `Detected pattern: ${pattern.prediction}. ${pattern.suggestedAction}`,
          });
        }
      }
    }

    // Time-based suggestions
    if (context.timeOfDay !== undefined) {
      if (context.timeOfDay >= 23 || context.timeOfDay < 6) {
        this.suggestions.push({
          id: `sleep-${Date.now()}`,
          priority: "medium",
          category: "health",
          message: "It's late! Consider wrapping up and getting some rest.",
        });
      } else if (context.timeOfDay >= 6 && context.timeOfDay < 9) {
        this.suggestions.push({
          id: `morning-${Date.now()}`,
          priority: "low",
          category: "productivity",
          message: "Good morning! Set your top 3 priorities for today?",
          action: {
            type: "ask",
            payload: { question: "What are your goals for today?" },
          },
        });
      }
    }

    // Error-based suggestions
    if (context.errorCount && context.errorCount > 5) {
      this.suggestions.push({
        id: `errors-${Date.now()}`,
        priority: "medium",
        category: "productivity",
        message: "Multiple errors detected. Take a step back - review logs, check documentation, or take a short break to reset?",
      });
    }

    // Activity-based
    if (context.currentActivity) {
      const duration =
        (Date.now() - context.currentActivity.startTime) / (60 * 1000);

      if (context.currentActivity.type === "debugging" && duration > 30) {
        this.suggestions.push({
          id: `debug-${Date.now()}`,
          priority: "medium",
          category: "productivity",
          message: "Been debugging for a while. Try: rubber duck it, ask for help, or search similar issues online?",
        });
      }
    }

    // Sort by priority
    return this.suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  getSuggestion(id: string): ProactiveSuggestion | undefined {
    return this.suggestions.find((s) => s.id === id);
  }

  dismissSuggestion(id: string): void {
    this.suggestions = this.suggestions.filter((s) => s.id !== id);
  }

  clearExpired(): void {
    const now = Date.now();
    this.suggestions = this.suggestions.filter(
      (s) => !s.expiresAt || s.expiresAt > now,
    );
  }
}

let globalEngine: SuggestionEngine | null = null;

export function getSuggestionEngine(): SuggestionEngine {
  if (!globalEngine) {
    globalEngine = new SuggestionEngine();
  }
  return globalEngine;
}
