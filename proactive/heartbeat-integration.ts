/**
 * Heartbeat Integration
 * Integrates proactive intelligence with AiraBot's heartbeat system
 */

import { getProactiveMonitor } from "./proactive-monitor.js";
import { getPatternDetector } from "./pattern-detector.js";
import { getActivityTracker } from "./activity-tracker.js";
import { getPredictiveScheduler } from "./predictive-scheduler.js";
import { getLearningFeedback } from "./learning-feedback.js";

export interface HeartbeatResponse {
  shouldRespond: boolean;
  message?: string;
  priority: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
}

export class HeartbeatIntegration {
  private lastHeartbeat: number = 0;
  private heartbeatCount: number = 0;

  async processHeartbeat(workspaceDir?: string): Promise<HeartbeatResponse> {
    this.heartbeatCount++;
    this.lastHeartbeat = Date.now();

    // Run proactive check
    const monitor = getProactiveMonitor({ workspaceDir });
    const result = await monitor.performCheck();

    // If no insights, return heartbeat OK
    if (result.insights.length === 0 && result.actionsScheduled === 0) {
      return {
        shouldRespond: false,
        priority: "low",
      };
    }

    // Compile message from insights
    const messages: string[] = [];

    // Add top priority insights
    if (result.insights.length > 0) {
      messages.push(...result.insights.slice(0, 2));
    }

    // Check scheduled actions
    const scheduler = await getPredictiveScheduler(workspaceDir);
    const dueActions = scheduler.getDueActions();

    if (dueActions.length > 0) {
      for (const action of dueActions.slice(0, 2)) {
        messages.push(action.message);
        scheduler.markExecuted(action.id);
      }
    }

    // Determine priority
    let priority: "low" | "medium" | "high" = "low";
    if (dueActions.some((a) => a.priority === "high")) {
      priority = "high";
    } else if (result.notificationsDelivered > 0) {
      priority = "medium";
    }

    return {
      shouldRespond: messages.length > 0,
      message: messages.join("\n\n"),
      priority,
      metadata: {
        suggestionsGenerated: result.suggestionsGenerated,
        actionsScheduled: result.actionsScheduled,
        heartbeatCount: this.heartbeatCount,
      },
    };
  }

  async updatePatterns(workspaceDir?: string): Promise<void> {
    // Update behavior patterns from recent activity
    const detector = await getPatternDetector(workspaceDir);
    const tracker = await getActivityTracker(workspaceDir);

    const behavior = detector.getUserBehaviorPattern();

    // Schedule future actions based on patterns
    const scheduler = await getPredictiveScheduler(workspaceDir);
    scheduler.scheduleFromBehavior(behavior);
  }

  async recordActivity(
    type: "coding" | "meeting" | "break" | "research" | "debugging" | "idle",
    durationMinutes: number,
    workspaceDir?: string,
  ): Promise<void> {
    const detector = await getPatternDetector(workspaceDir);
    await detector.logActivity(type, durationMinutes);
  }

  async provideFeedback(
    suggestionType: string,
    reaction: "positive" | "negative" | "ignored",
    workspaceDir?: string,
  ): Promise<void> {
    const feedback = await getLearningFeedback(workspaceDir);
    await feedback.recordFeedback(suggestionType, "", reaction);
  }

  async getProactiveStatus(workspaceDir?: string): Promise<string> {
    const detector = await getPatternDetector(workspaceDir);
    const tracker = await getActivityTracker(workspaceDir);
    const scheduler = await getPredictiveScheduler(workspaceDir);
    const feedback = await getLearningFeedback(workspaceDir);

    const parts = [
      detector.getPatternSummary(),
      "",
      tracker.getActivitySummary(),
      "",
      scheduler.getScheduleSummary(),
      "",
      feedback.getFeedbackSummary(),
    ];

    return parts.join("\n");
  }

  getHeartbeatStats(): {
    totalHeartbeats: number;
    lastHeartbeat: number;
    avgIntervalMinutes: number;
  } {
    const avgInterval =
      this.heartbeatCount > 1
        ? (Date.now() - this.lastHeartbeat) / (this.heartbeatCount * 60 * 1000)
        : 0;

    return {
      totalHeartbeats: this.heartbeatCount,
      lastHeartbeat: this.lastHeartbeat,
      avgIntervalMinutes: Math.round(avgInterval),
    };
  }
}

let globalIntegration: HeartbeatIntegration | null = null;

export function getHeartbeatIntegration(): HeartbeatIntegration {
  if (!globalIntegration) {
    globalIntegration = new HeartbeatIntegration();
  }
  return globalIntegration;
}

// Convenience function for heartbeat handlers
export async function handleProactiveHeartbeat(
  workspaceDir?: string,
): Promise<string | null> {
  const integration = getHeartbeatIntegration();
  const response = await integration.processHeartbeat(workspaceDir);

  if (!response.shouldRespond) {
    return null; // Return null = HEARTBEAT_OK
  }

  return response.message || null;
}
