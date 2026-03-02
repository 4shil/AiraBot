/**
 * Pattern Detection System
 * Learns user behavior patterns to predict and anticipate needs
 */

import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface ActivityPattern {
  type: "coding" | "meeting" | "break" | "research" | "debugging" | "writing";
  startHour: number; // 0-23
  endHour: number;
  dayOfWeek: number[]; // 0-6
  frequency: number; // How often this pattern occurs
  confidence: number; // 0-100
}

export interface UserBehaviorPattern {
  wakeTime?: number; // Average hour user starts working
  sleepTime?: number; // Average hour user stops
  breakPattern?: {
    frequency: number; // breaks per hour
    averageDuration: number; // minutes
  };
  codingHours: number[]; // Hours when user typically codes
  peakProductivity: number[]; // Hours of peak productivity
  preferredBreakTimes: number[]; // Preferred break hours
}

export interface DetectedPattern {
  pattern: string;
  confidence: number;
  prediction: string;
  suggestedAction?: string;
}

export class PatternDetector {
  private activityLog: Array<{
    timestamp: number;
    activity: string;
    duration: number; // minutes
    hour: number;
    dayOfWeek: number;
  }> = [];

  private patterns: ActivityPattern[] = [];
  private logPath: string;
  private readonly maxLogSize = 5000;

  constructor(workspaceDir?: string) {
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.logPath = join(base, "memory", "activity-patterns.json");
  }

  async loadPatterns(): Promise<void> {
    try {
      const data = await fs.readFile(this.logPath, "utf-8");
      const saved = JSON.parse(data);
      this.activityLog = saved.activityLog || [];
      this.patterns = saved.patterns || [];
    } catch {
      this.activityLog = [];
      this.patterns = [];
    }
  }

  async savePatterns(): Promise<void> {
    try {
      const dir = join(this.logPath, "..");
      await fs.mkdir(dir, { recursive: true });

      const data = {
        activityLog: this.activityLog.slice(-this.maxLogSize),
        patterns: this.patterns,
        lastUpdated: new Date().toISOString(),
      };

      await fs.writeFile(this.logPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save patterns:", error);
    }
  }

  async logActivity(activity: string, durationMinutes: number): Promise<void> {
    const now = new Date();
    this.activityLog.push({
      timestamp: now.getTime(),
      activity,
      duration: durationMinutes,
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
    });

    if (this.activityLog.length > this.maxLogSize) {
      this.activityLog = this.activityLog.slice(-this.maxLogSize);
    }

    // Reanalyze patterns every 10 activities
    if (this.activityLog.length % 10 === 0) {
      await this.analyzePatterns();
    }

    await this.savePatterns();
  }

  private async analyzePatterns(): Promise<void> {
    this.patterns = [];

    // Group activities by type, hour, and day
    const activityGroups = new Map<string, typeof this.activityLog>();

    for (const log of this.activityLog) {
      const key = `${log.activity}-${log.hour}-${log.dayOfWeek}`;
      if (!activityGroups.has(key)) {
        activityGroups.set(key, []);
      }
      activityGroups.get(key)!.push(log);
    }

    // Analyze each group for patterns
    for (const [key, logs] of activityGroups) {
      if (logs.length < 3) continue; // Need at least 3 occurrences

      const [activity, hourStr, dayStr] = key.split("-");
      const hour = parseInt(hourStr);
      const day = parseInt(dayStr);

      const frequency = logs.length;
      const totalActivities = this.activityLog.filter(
        (l) => l.activity === activity,
      ).length;
      const confidence = Math.min(100, (frequency / totalActivities) * 100);

      if (confidence > 30) {
        this.patterns.push({
          type: activity as ActivityPattern["type"],
          startHour: hour,
          endHour: hour + 1,
          dayOfWeek: [day],
          frequency,
          confidence,
        });
      }
    }

    // Sort by confidence
    this.patterns.sort((a, b) => b.confidence - a.confidence);
  }

  getUserBehaviorPattern(): UserBehaviorPattern {
    if (this.activityLog.length < 10) {
      return {
        codingHours: [],
        peakProductivity: [],
        preferredBreakTimes: [],
      };
    }

    // Find wake/sleep times
    const hourCounts = new Map<number, number>();
    for (const log of this.activityLog) {
      hourCounts.set(log.hour, (hourCounts.get(log.hour) || 0) + 1);
    }

    const sortedHours = Array.from(hourCounts.entries()).sort(
      (a, b) => b[1] - a[1],
    );

    // Peak hours = top activity hours
    const peakProductivity = sortedHours.slice(0, 3).map(([hour]) => hour);

    // Coding hours
    const codingLogs = this.activityLog.filter((l) => l.activity === "coding");
    const codingHourSet = new Set(codingLogs.map((l) => l.hour));
    const codingHours = Array.from(codingHourSet).sort((a, b) => a - b);

    // Break pattern
    const breakLogs = this.activityLog.filter((l) => l.activity === "break");
    const breakFrequency =
      breakLogs.length / Math.max(1, this.activityLog.length / 60); // per hour
    const avgBreakDuration =
      breakLogs.length > 0
        ? breakLogs.reduce((sum, l) => sum + l.duration, 0) / breakLogs.length
        : 0;

    const preferredBreakTimes = Array.from(
      new Set(breakLogs.map((l) => l.hour)),
    ).sort((a, b) => a - b);

    // Estimate wake/sleep times
    const activeHours = Array.from(hourCounts.keys()).sort((a, b) => a - b);
    const wakeTime = activeHours[0];
    const sleepTime = activeHours[activeHours.length - 1];

    return {
      wakeTime,
      sleepTime,
      breakPattern: {
        frequency: breakFrequency,
        averageDuration: avgBreakDuration,
      },
      codingHours,
      peakProductivity,
      preferredBreakTimes,
    };
  }

  detectCurrentPatterns(): DetectedPattern[] {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    const detected: DetectedPattern[] = [];
    const behavior = this.getUserBehaviorPattern();

    // Check if it's usual wake time
    if (behavior.wakeTime && Math.abs(hour - behavior.wakeTime) <= 1) {
      detected.push({
        pattern: "wake_time",
        confidence: 80,
        prediction: "User typically starts working around this time",
        suggestedAction: "Offer morning setup assistance",
      });
    }

    // Check if it's peak productivity time
    if (behavior.peakProductivity.includes(hour)) {
      detected.push({
        pattern: "peak_productivity",
        confidence: 75,
        prediction: "This is usually a highly productive hour",
        suggestedAction: "Minimize interruptions, be extra efficient",
      });
    }

    // Check if it's usual break time
    if (behavior.preferredBreakTimes.includes(hour)) {
      detected.push({
        pattern: "break_time",
        confidence: 70,
        prediction: "User often takes breaks at this hour",
        suggestedAction: "Suggest taking a break if working continuously",
      });
    }

    // Check activity patterns for this time
    const matchingPatterns = this.patterns.filter(
      (p) =>
        p.startHour <= hour &&
        p.endHour > hour &&
        p.dayOfWeek.includes(day),
    );

    for (const pattern of matchingPatterns.slice(0, 3)) {
      detected.push({
        pattern: pattern.type,
        confidence: pattern.confidence,
        prediction: `User often does ${pattern.type} at this time`,
        suggestedAction: `Prepare tools/context for ${pattern.type}`,
      });
    }

    return detected.sort((a, b) => b.confidence - a.confidence);
  }

  getPatternSummary(): string {
    const behavior = this.getUserBehaviorPattern();
    const detected = this.detectCurrentPatterns();

    const lines: string[] = [
      "📊 Detected Behavior Patterns",
      "",
      `Wake Time: ${behavior.wakeTime ? `${behavior.wakeTime}:00` : "Unknown"}`,
      `Sleep Time: ${behavior.sleepTime ? `${behavior.sleepTime}:00` : "Unknown"}`,
      `Peak Productivity: ${behavior.peakProductivity.map((h) => `${h}:00`).join(", ")}`,
      `Coding Hours: ${behavior.codingHours.map((h) => `${h}:00`).join(", ")}`,
    ];

    if (behavior.breakPattern) {
      lines.push(
        `Break Frequency: ${behavior.breakPattern.frequency.toFixed(1)}/hour`,
        `Avg Break Duration: ${Math.round(behavior.breakPattern.averageDuration)} min`,
      );
    }

    if (detected.length > 0) {
      lines.push("", "Current Patterns:");
      for (const d of detected.slice(0, 3)) {
        lines.push(
          `  • ${d.pattern} (${d.confidence}%): ${d.prediction}`,
        );
      }
    }

    return lines.join("\n");
  }
}

// Global detector instance
let globalDetector: PatternDetector | null = null;

export async function getPatternDetector(
  workspaceDir?: string,
): Promise<PatternDetector> {
  if (!globalDetector) {
    globalDetector = new PatternDetector(workspaceDir);
    await globalDetector.loadPatterns();
  }
  return globalDetector;
}

// ─── Real git log scanning ────────────────────────────────────────────────────

import { promises as fsp } from 'fs';
import { simpleGit } from 'simple-git';

export interface RepoStats {
  repoPath: string;
  repoName: string;
  commitCount: number;
  peakHours: number[];
  commitsByDow: number[]; // 0-6
  authors: string[];
  commonPatterns: string[];
  lastCommitDate: string;
}

export async function scanWorkspaceRepos(workspaceDir: string): Promise<RepoStats[]> {
  const results: RepoStats[] = [];
  let entries: string[] = [];
  try {
    const dirents = await fsp.readdir(workspaceDir, { withFileTypes: true });
    entries = dirents.filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return results;
  }

  for (const name of entries) {
    const repoPath = join(workspaceDir, name);
    try {
      const git = simpleGit(repoPath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) continue;

      const log = await git.log([
        '--since=30.days',
        '--format=%H|%ae|%ad|%s',
        '--date=iso',
      ]);

      const commitsByHour: number[] = new Array(24).fill(0);
      const commitsByDow: number[] = new Array(7).fill(0);
      const authors = new Set<string>();
      const patterns: Record<string, number> = {};

      for (const entry of log.all) {
        const line = `${entry.hash}|${entry.author_email}|${entry.date}|${entry.message}`;
        const parts = line.split('|');
        if (parts.length < 4) continue;
        const [, email, dateStr, ...msgParts] = parts;
        const msg = msgParts.join('|');
        if (email) authors.add(email);

        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          commitsByHour[d.getHours()]++;
          commitsByDow[d.getDay()]++;
        }

        // Extract common prefix patterns (feat:, fix:, chore:, etc.)
        const prefixMatch = msg.match(/^(\w+)[\(:]/);
        if (prefixMatch) {
          const prefix = prefixMatch[1].toLowerCase();
          patterns[prefix] = (patterns[prefix] ?? 0) + 1;
        }
      }

      const peakHours = commitsByHour
        .map((count, hour) => ({ count, hour }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .filter((x) => x.count > 0)
        .map((x) => x.hour);

      const commonPatterns = Object.entries(patterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => k);

      results.push({
        repoPath,
        repoName: name,
        commitCount: log.total,
        peakHours,
        commitsByDow,
        authors: [...authors],
        commonPatterns,
        lastCommitDate: log.latest?.date ?? 'unknown',
      });
    } catch {
      // Skip repos that fail
    }
  }

  return results;
}
