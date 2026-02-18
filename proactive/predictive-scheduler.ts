/**
 * Predictive Scheduler
 * Predicts upcoming needs and schedules proactive actions
 */

import type { ActivityPattern, UserBehaviorPattern } from "./pattern-detector.js";
import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface ScheduledAction {
  id: string;
  scheduledFor: number; // timestamp
  type: "reminder" | "suggestion" | "check";
  message: string;
  priority: "low" | "medium" | "high";
  executed: boolean;
  prediction: string; // Why this was scheduled
}

export class PredictiveScheduler {
  private scheduled: ScheduledAction[] = [];
  private logPath: string;

  constructor(workspaceDir?: string) {
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.logPath = join(base, "memory", "scheduled-actions.json");
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.logPath, "utf-8");
      this.scheduled = JSON.parse(data);
    } catch {
      this.scheduled = [];
    }
  }

  async save(): Promise<void> {
    try {
      const dir = join(this.logPath, "..");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.logPath, JSON.stringify(this.scheduled.slice(-100), null, 2));
    } catch (error) {
      console.error("Failed to save scheduled actions:", error);
    }
  }

  scheduleFromBehavior(behavior: UserBehaviorPattern): void {
    const now = Date.now();

    // Schedule break reminders at typical break times
    if (behavior.preferredBreakTimes) {
      for (const hour of behavior.preferredBreakTimes) {
        const target = this.getNextOccurrence(hour, 0);
        if (target > now) {
          this.scheduleAction({
            scheduledFor: target,
            type: "reminder",
            message: "You usually take a break around this time. Stretch, hydrate, rest your eyes?",
            priority: "low",
            prediction: "Based on break patterns",
          });
        }
      }
    }

    // Schedule productivity check during peak hours
    if (behavior.peakProductivity) {
      for (const hour of behavior.peakProductivity.slice(0, 1)) {
        const target = this.getNextOccurrence(hour, 0);
        if (target > now) {
          this.scheduleAction({
            scheduledFor: target,
            type: "suggestion",
            message: "Peak productivity time! Focus on your most important task.",
            priority: "medium",
            prediction: "Peak productivity hour",
          });
        }
      }
    }

    // Schedule end-of-day commit reminder
    if (behavior.sleepTime) {
      const target = this.getNextOccurrence(behavior.sleepTime - 1, 0);
      if (target > now) {
        this.scheduleAction({
          scheduledFor: target,
          type: "check",
          message: "Wrapping up for the day? Commit your work and push changes.",
          priority: "medium",
          prediction: "End of workday",
        });
      }
    }

    this.save();
  }

  scheduleAction(
    action: Omit<ScheduledAction, "id" | "executed">,
  ): string {
    const id = `${action.type}-${action.scheduledFor}-${Date.now()}`;
    this.scheduled.push({
      ...action,
      id,
      executed: false,
    });
    this.save();
    return id;
  }

  getDueActions(): ScheduledAction[] {
    const now = Date.now();
    return this.scheduled.filter(
      (a) => a.scheduledFor <= now && !a.executed,
    ).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  markExecuted(id: string): void {
    const action = this.scheduled.find((a) => a.id === id);
    if (action) {
      action.executed = true;
      this.save();
    }
  }

  clearOld(): void {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
    this.scheduled = this.scheduled.filter((a) => a.scheduledFor > cutoff);
    this.save();
  }

  private getNextOccurrence(hour: number, minute: number): number {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    return target.getTime();
  }

  getUpcoming(limit: number = 5): ScheduledAction[] {
    const now = Date.now();
    return this.scheduled
      .filter((a) => a.scheduledFor > now && !a.executed)
      .sort((a, b) => a.scheduledFor - b.scheduledFor)
      .slice(0, limit);
  }

  getScheduleSummary(): string {
    const due = this.getDueActions();
    const upcoming = this.getUpcoming(3);

    const lines = ["📅 Scheduled Actions", ""];

    if (due.length > 0) {
      lines.push(`Due Now: ${due.length} action(s)`, "");
      for (const action of due.slice(0, 3)) {
        lines.push(`  • [${action.priority.toUpperCase()}] ${action.message}`);
        lines.push(`    Reason: ${action.prediction}`);
      }
    }

    if (upcoming.length > 0) {
      lines.push("", "Upcoming:");
      for (const action of upcoming) {
        const time = new Date(action.scheduledFor).toLocaleTimeString();
        lines.push(`  • ${time}: ${action.message}`);
      }
    }

    if (due.length === 0 && upcoming.length === 0) {
      lines.push("No scheduled actions.");
    }

    return lines.join("\n");
  }
}

let globalScheduler: PredictiveScheduler | null = null;

export async function getPredictiveScheduler(
  workspaceDir?: string,
): Promise<PredictiveScheduler> {
  if (!globalScheduler) {
    globalScheduler = new PredictiveScheduler(workspaceDir);
    await globalScheduler.load();
  }
  return globalScheduler;
}
