/**
 * Notification Manager
 * Manages when and how to deliver proactive notifications
 */

import type { ProactiveSuggestion } from "./suggestion-engine.js";
import type { ScheduledAction } from "./predictive-scheduler.js";

export interface NotificationPreferences {
  quietHours: { start: number; end: number }; // 23 = 11 PM, 7 = 7 AM
  maxPerHour: number;
  priorityThreshold: "low" | "medium" | "high";
  channels: Array<"chat" | "system" | "silent">;
}

export interface DeliveredNotification {
  timestamp: number;
  message: string;
  priority: string;
  acknowledged: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  quietHours: { start: 23, end: 7 },
  maxPerHour: 3,
  priorityThreshold: "low",
  channels: ["chat"],
};

export class NotificationManager {
  private preferences: NotificationPreferences;
  private delivered: DeliveredNotification[] = [];

  constructor(preferences?: Partial<NotificationPreferences>) {
    this.preferences = { ...DEFAULT_PREFERENCES, ...preferences };
  }

  shouldDeliver(
    priority: "low" | "medium" | "high",
    currentHour: number,
  ): boolean {
    // Check quiet hours
    if (this.isQuietHour(currentHour)) {
      return priority === "high"; // Only high priority during quiet hours
    }

    // Check rate limiting
    const recentCount = this.getRecentCount(60); // Last hour
    if (recentCount >= this.preferences.maxPerHour) {
      return priority === "high"; // Rate limit, only high priority
    }

    // Check priority threshold
    const priorityOrder = { low: 1, medium: 2, high: 3 };
    const thresholdOrder = { low: 1, medium: 2, high: 3 };
    return priorityOrder[priority] >= thresholdOrder[this.preferences.priorityThreshold];
  }

  private isQuietHour(hour: number): boolean {
    const { start, end } = this.preferences.quietHours;
    if (start < end) {
      return hour >= start || hour < end;
    } else {
      // Wraps around midnight
      return hour >= start || hour < end;
    }
  }

  private getRecentCount(minutes: number): number {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.delivered.filter((n) => n.timestamp > cutoff).length;
  }

  formatNotification(
    suggestion: ProactiveSuggestion | ScheduledAction,
  ): string {
    const emoji = this.getEmoji(
      "priority" in suggestion ? suggestion.priority : "medium",
    );
    return `${emoji} ${suggestion.message}`;
  }

  private getEmoji(priority: string): string {
    switch (priority) {
      case "high":
        return "⚠️";
      case "medium":
        return "💡";
      case "low":
        return "💬";
      default:
        return "ℹ️";
    }
  }

  recordDelivery(message: string, priority: string): void {
    this.delivered.push({
      timestamp: Date.now(),
      message,
      priority,
      acknowledged: false,
    });

    // Keep only last 100
    if (this.delivered.length > 100) {
      this.delivered = this.delivered.slice(-100);
    }
  }

  acknowledge(index: number): void {
    if (this.delivered[index]) {
      this.delivered[index].acknowledged = true;
    }
  }

  getPendingCount(): number {
    return this.delivered.filter((n) => !n.acknowledged).length;
  }

  getDeliveryStats(): {
    totalDelivered: number;
    acknowledgedRate: number;
    avgPerHour: number;
  } {
    const total = this.delivered.length;
    const acknowledged = this.delivered.filter((n) => n.acknowledged).length;
    const rate = total > 0 ? (acknowledged / total) * 100 : 0;

    // Calculate per hour over last 24 hours
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const last24h = this.delivered.filter((n) => n.timestamp > dayAgo).length;
    const avgPerHour = last24h / 24;

    return {
      totalDelivered: total,
      acknowledgedRate: Math.round(rate),
      avgPerHour: parseFloat(avgPerHour.toFixed(2)),
    };
  }

  updatePreferences(updates: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }
}

let globalManager: NotificationManager | null = null;

export function getNotificationManager(): NotificationManager {
  if (!globalManager) {
    globalManager = new NotificationManager();
  }
  return globalManager;
}
