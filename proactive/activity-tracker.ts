/**
 * Activity Tracker
 * Tracks coding sessions, breaks, meetings, and work patterns
 */

import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface ActivitySession {
  id: string;
  type: "coding" | "meeting" | "break" | "research" | "debugging" | "idle";
  startTime: number;
  endTime?: number;
  duration?: number; // minutes
  metadata?: {
    language?: string;
    project?: string;
    errorCount?: number;
    linesChanged?: number;
  };
}

export interface DailyStats {
  date: string;
  totalCodingMinutes: number;
  totalBreakMinutes: number;
  totalMeetingMinutes: number;
  sessionsCount: number;
  longestSession: number;
  breakFrequency: number;
}

export class ActivityTracker {
  private sessions: ActivitySession[] = [];
  private currentSession: ActivitySession | null = null;
  private logPath: string;

  constructor(workspaceDir?: string) {
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.logPath = join(base, "memory", "activity-tracker.json");
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.logPath, "utf-8");
      const saved = JSON.parse(data);
      this.sessions = saved.sessions || [];
      this.currentSession = saved.currentSession || null;
    } catch {
      this.sessions = [];
    }
  }

  async save(): Promise<void> {
    try {
      const dir = join(this.logPath, "..");
      await fs.mkdir(dir, { recursive: true});
      await fs.writeFile(
        this.logPath,
        JSON.stringify(
          {
            sessions: this.sessions.slice(-1000),
            currentSession: this.currentSession,
            lastUpdated: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error("Failed to save activity tracker:", error);
    }
  }

  startActivity(
    type: ActivitySession["type"],
    metadata?: ActivitySession["metadata"],
  ): string {
    // End previous session if exists
    if (this.currentSession) {
      this.endActivity();
    }

    const id = `${type}-${Date.now()}`;
    this.currentSession = {
      id,
      type,
      startTime: Date.now(),
      metadata,
    };

    this.save();
    return id;
  }

  endActivity(): ActivitySession | null {
    if (!this.currentSession) return null;

    const endTime = Date.now();
    const duration = (endTime - this.currentSession.startTime) / (60 * 1000);

    this.currentSession.endTime = endTime;
    this.currentSession.duration = duration;

    this.sessions.push(this.currentSession);
    const completed = this.currentSession;
    this.currentSession = null;

    this.save();
    return completed;
  }

  getCurrentActivity(): ActivitySession | null {
    return this.currentSession;
  }

  getDailyStats(date?: Date): DailyStats {
    const targetDate = date || new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const daySessions = this.sessions.filter(
      (s) =>
        s.startTime >= dayStart.getTime() && s.startTime <= dayEnd.getTime(),
    );

    let totalCoding = 0;
    let totalBreak = 0;
    let totalMeeting = 0;
    let longest = 0;

    for (const session of daySessions) {
      const dur = session.duration || 0;
      if (session.type === "coding" || session.type === "debugging") {
        totalCoding += dur;
      } else if (session.type === "break") {
        totalBreak += dur;
      } else if (session.type === "meeting") {
        totalMeeting += dur;
      }
      if (dur > longest) longest = dur;
    }

    return {
      date: targetDate.toISOString().split("T")[0],
      totalCodingMinutes: totalCoding,
      totalBreakMinutes: totalBreak,
      totalMeetingMinutes: totalMeeting,
      sessionsCount: daySessions.length,
      longestSession: longest,
      breakFrequency:
        daySessions.filter((s) => s.type === "break").length /
        Math.max(1, totalCoding / 60),
    };
  }

  getWeeklyTrend(): DailyStats[] {
    const trend: DailyStats[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      trend.push(this.getDailyStats(date));
    }

    return trend;
  }

  needsBreak(): boolean {
    if (!this.currentSession) return false;
    if (this.currentSession.type === "break") return false;

    const duration = (Date.now() - this.currentSession.startTime) / (60 * 1000);
    return duration > 60; // 60+ minutes without break
  }

  getActivitySummary(): string {
    const today = this.getDailyStats();
    const current = this.currentSession;

    const lines = [
      "⏱️  Activity Summary (Today)",
      "",
      `Coding: ${Math.round(today.totalCodingMinutes)} min`,
      `Breaks: ${Math.round(today.totalBreakMinutes)} min`,
      `Meetings: ${Math.round(today.totalMeetingMinutes)} min`,
      `Sessions: ${today.sessionsCount}`,
      `Longest Session: ${Math.round(today.longestSession)} min`,
    ];

    if (current) {
      const currentDur = (Date.now() - current.startTime) / (60 * 1000);
      lines.push(
        "",
        `Current Activity: ${current.type} (${Math.round(currentDur)} min)`,
      );

      if (this.needsBreak()) {
        lines.push("⚠️  Time for a break!");
      }
    }

    return lines.join("\n");
  }
}

let globalTracker: ActivityTracker | null = null;

export async function getActivityTracker(
  workspaceDir?: string,
): Promise<ActivityTracker> {
  if (!globalTracker) {
    globalTracker = new ActivityTracker(workspaceDir);
    await globalTracker.load();
  }
  return globalTracker;
}
