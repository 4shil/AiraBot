/**
 * Context Analyzer
 * Analyzes current context to determine what user might need
 */

import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface ContextSnapshot {
  timestamp: number;
  gitStatus?: {
    branch: string;
    uncommittedChanges: number;
    unstagedFiles: number;
  };
  systemLoad?: {
    cpuUsage: number;
    memoryUsage: number;
  };
  recentErrors?: string[];
  openProjects?: string[];
  timeContext: {
    hour: number;
    dayOfWeek: number;
    isWeekend: boolean;
  };
}

export interface ContextInsight {
  type: "opportunity" | "warning" | "tip";
  message: string;
  confidence: number;
  actionable: boolean;
}

export class ContextAnalyzer {
  async captureContext(workspaceDir?: string): Promise<ContextSnapshot> {
    const now = new Date();
    const snapshot: ContextSnapshot = {
      timestamp: now.getTime(),
      timeContext: {
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        isWeekend: now.getDay() === 0 || now.getDay() === 6,
      },
    };

    // Capture git status if in a git repo
    if (workspaceDir) {
      try {
        const { stdout: branchOut } = await execAsync("git branch --show-current", {
          cwd: workspaceDir,
        });
        const { stdout: statusOut } = await execAsync("git status --porcelain", {
          cwd: workspaceDir,
        });

        const lines = statusOut.trim().split("\n").filter(Boolean);
        snapshot.gitStatus = {
          branch: branchOut.trim(),
          uncommittedChanges: lines.length,
          unstagedFiles: lines.filter((l) => l.startsWith(" M") || l.startsWith("??")).length,
        };
      } catch {
        // Not a git repo or git not available
      }
    }

    return snapshot;
  }

  analyzeContext(snapshot: ContextSnapshot): ContextInsight[] {
    const insights: ContextInsight[] = [];

    // Git-based insights
    if (snapshot.gitStatus) {
      if (snapshot.gitStatus.uncommittedChanges > 10) {
        insights.push({
          type: "warning",
          message: `You have ${snapshot.gitStatus.uncommittedChanges} uncommitted changes. Consider committing your work.`,
          confidence: 85,
          actionable: true,
        });
      }

      if (snapshot.gitStatus.unstagedFiles > 5) {
        insights.push({
          type: "tip",
          message: `${snapshot.gitStatus.unstagedFiles} unstaged files. Review and stage them?`,
          confidence: 70,
          actionable: true,
        });
      }
    }

    // Time-based insights
    const { hour, isWeekend } = snapshot.timeContext;

    if (hour >= 23 || hour < 6) {
      insights.push({
        type: "warning",
        message: "It's late night! Consider saving your work and getting rest.",
        confidence: 90,
        actionable: true,
      });
    }

    if (hour >= 12 && hour < 14 && !isWeekend) {
      insights.push({
        type: "tip",
        message: "Lunch time! Taking breaks improves productivity.",
        confidence: 60,
        actionable: false,
      });
    }

    if (hour >= 15 && hour < 16 && !isWeekend) {
      insights.push({
        type: "tip",
        message: "Afternoon slump time. Coffee break or quick walk?",
        confidence: 55,
        actionable: false,
      });
    }

    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  async getContextReport(workspaceDir?: string): Promise<string> {
    const snapshot = await this.captureContext(workspaceDir);
    const insights = this.analyzeContext(snapshot);

    const lines = ["📍 Context Analysis", ""];

    if (snapshot.gitStatus) {
      lines.push(
        `Git Branch: ${snapshot.gitStatus.branch}`,
        `Uncommitted: ${snapshot.gitStatus.uncommittedChanges} files`,
        `Unstaged: ${snapshot.gitStatus.unstagedFiles} files`,
        "",
      );
    }

    lines.push(
      `Time: ${snapshot.timeContext.hour}:00 (${snapshot.timeContext.isWeekend ? "Weekend" : "Weekday"})`,
    );

    if (insights.length > 0) {
      lines.push("", "Insights:");
      for (const insight of insights.slice(0, 3)) {
        const icon = insight.type === "warning" ? "⚠️" : insight.type === "opportunity" ? "💡" : "💬";
        lines.push(`  ${icon} ${insight.message} (${insight.confidence}%)`);
      }
    }

    return lines.join("\n");
  }

  detectOpportunities(snapshot: ContextSnapshot): Array<{ opportunity: string; reason: string }> {
    const opportunities: Array<{ opportunity: string; reason: string }> = [];

    // Early morning = fresh start
    if (snapshot.timeContext.hour >= 6 && snapshot.timeContext.hour < 9) {
      opportunities.push({
        opportunity: "Plan your day",
        reason: "Morning is best for strategic thinking",
      });
    }

    // Clean git state = good time to start new feature
    if (snapshot.gitStatus && snapshot.gitStatus.uncommittedChanges === 0) {
      opportunities.push({
        opportunity: "Start new feature or experiment",
        reason: "Clean slate - no pending changes",
      });
    }

    // Weekend = learning time
    if (snapshot.timeContext.isWeekend) {
      opportunities.push({
        opportunity: "Learn something new",
        reason: "Weekends are great for exploration",
      });
    }

    return opportunities;
  }
}

let globalAnalyzer: ContextAnalyzer | null = null;

export function getContextAnalyzer(): ContextAnalyzer {
  if (!globalAnalyzer) {
    globalAnalyzer = new ContextAnalyzer();
  }
  return globalAnalyzer;
}
