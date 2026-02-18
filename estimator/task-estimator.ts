/**
 * Smart Task Time Estimator
 * Learns from actual vs estimated time to improve future predictions
 */

import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface Task {
  id: string;
  title: string;
  type: "coding" | "debugging" | "research" | "meeting" | "review" | "writing" | "other";
  estimatedMinutes: number;
  actualMinutes?: number;
  startTime?: number;
  endTime?: number;
  completed: boolean;
  complexity: "simple" | "medium" | "complex";
  tags: string[];
}

export interface EstimationStats {
  totalTasks: number;
  avgEstimatedTime: number;
  avgActualTime: number;
  accuracyRate: number; // Percentage
  underestimationRate: number;
  overestimationRate: number;
  byType: Record<string, {
    count: number;
    avgMultiplier: number; // actual / estimated
  }>;
}

export class TaskTimeEstimator {
  private tasks: Task[] = [];
  private dataPath: string;

  constructor(workspaceDir?: string) {
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.dataPath = join(base, "memory", "task-estimates.json");
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataPath, "utf-8");
      this.tasks = JSON.parse(data);
    } catch {
      this.tasks = [];
    }
  }

  async save(): Promise<void> {
    try {
      const dir = join(this.dataPath, "..");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.dataPath, JSON.stringify(this.tasks.slice(-500), null, 2));
    } catch (error) {
      console.error("Failed to save task estimates:", error);
    }
  }

  addTask(data: {
    title: string;
    type: Task["type"];
    estimatedMinutes: number;
    complexity?: Task["complexity"];
    tags?: string[];
  }): string {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const task: Task = {
      id,
      title: data.title,
      type: data.type,
      estimatedMinutes: data.estimatedMinutes,
      completed: false,
      complexity: data.complexity || this.guessComplexity(data.title),
      tags: data.tags || [],
    };

    this.tasks.push(task);
    this.save();
    return id;
  }

  private guessComplexity(title: string): Task["complexity"] {
    const lower = title.toLowerCase();
    if (lower.includes("simple") || lower.includes("quick") || lower.includes("small")) {
      return "simple";
    }
    if (lower.includes("complex") || lower.includes("refactor") || lower.includes("architecture")) {
      return "complex";
    }
    return "medium";
  }

  startTask(id: string): boolean {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return false;

    task.startTime = Date.now();
    this.save();
    return true;
  }

  completeTask(id: string, actualMinutes?: number): boolean {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return false;

    if (!actualMinutes && task.startTime) {
      actualMinutes = (Date.now() - task.startTime) / (60 * 1000);
    }

    if (!actualMinutes) return false;

    task.actualMinutes = Math.round(actualMinutes);
    task.endTime = Date.now();
    task.completed = true;

    this.save();
    return true;
  }

  predictTime(data: {
    type: Task["type"];
    complexity?: Task["complexity"];
    baseEstimate?: number;
  }): {
    predicted: number;
    confidence: number;
    reasoning: string;
  } {
    const similar = this.tasks.filter(
      t =>
        t.completed &&
        t.actualMinutes &&
        t.type === data.type &&
        (!data.complexity || t.complexity === data.complexity),
    );

    if (similar.length < 3) {
      return {
        predicted: data.baseEstimate || 60,
        confidence: 30,
        reasoning: "Not enough historical data for this task type",
      };
    }

    // Calculate average multiplier (actual / estimated)
    const multipliers = similar.map(t => t.actualMinutes! / t.estimatedMinutes);
    const avgMultiplier = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;

    const baseEstimate = data.baseEstimate || this.getTypicalDuration(data.type);
    const predicted = Math.round(baseEstimate * avgMultiplier);

    // Calculate confidence based on data consistency
    const variance = multipliers.reduce((sum, m) => sum + Math.pow(m - avgMultiplier, 2), 0) / multipliers.length;
    const confidence = Math.min(95, Math.max(50, 100 - variance * 50));

    const reasoning = `Based on ${similar.length} similar ${data.type} tasks, you typically take ${Math.round(avgMultiplier * 100)}% of estimated time`;

    return { predicted, confidence: Math.round(confidence), reasoning };
  }

  private getTypicalDuration(type: Task["type"]): number {
    const defaults: Record<Task["type"], number> = {
      coding: 120,
      debugging: 90,
      research: 60,
      meeting: 45,
      review: 30,
      writing: 60,
      other: 60,
    };
    return defaults[type];
  }

  getStats(windowDays: number = 30): EstimationStats {
    const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const relevant = this.tasks.filter(
      t => t.completed && t.actualMinutes && t.endTime && t.endTime > cutoff,
    );

    if (relevant.length === 0) {
      return {
        totalTasks: 0,
        avgEstimatedTime: 0,
        avgActualTime: 0,
        accuracyRate: 0,
        underestimationRate: 0,
        overestimationRate: 0,
        byType: {},
      };
    }

    const totalEstimated = relevant.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const totalActual = relevant.reduce((sum, t) => sum + t.actualMinutes!, 0);

    // Count accurate estimates (within 20%)
    let accurate = 0;
    let underestimated = 0;
    let overestimated = 0;

    for (const task of relevant) {
      const ratio = task.actualMinutes! / task.estimatedMinutes;
      if (ratio >= 0.8 && ratio <= 1.2) accurate++;
      else if (ratio > 1.2) underestimated++;
      else overestimated++;
    }

    // Stats by type
    const byType: EstimationStats["byType"] = {};
    const typeGroups = new Map<string, Task[]>();

    for (const task of relevant) {
      if (!typeGroups.has(task.type)) {
        typeGroups.set(task.type, []);
      }
      typeGroups.get(task.type)!.push(task);
    }

    for (const [type, tasks] of typeGroups) {
      const multipliers = tasks.map(t => t.actualMinutes! / t.estimatedMinutes);
      const avgMultiplier = multipliers.reduce((a, b) => a + b, 0) / multipliers.length;

      byType[type] = {
        count: tasks.length,
        avgMultiplier: parseFloat(avgMultiplier.toFixed(2)),
      };
    }

    return {
      totalTasks: relevant.length,
      avgEstimatedTime: Math.round(totalEstimated / relevant.length),
      avgActualTime: Math.round(totalActual / relevant.length),
      accuracyRate: Math.round((accurate / relevant.length) * 100),
      underestimationRate: Math.round((underestimated / relevant.length) * 100),
      overestimationRate: Math.round((overestimated / relevant.length) * 100),
      byType,
    };
  }

  getCurrentProgress(id: string): {
    elapsedMinutes: number;
    percentComplete: number;
    projectedTotal: number;
  } | null {
    const task = this.tasks.find(t => t.id === id);
    if (!task || !task.startTime) return null;

    const elapsedMinutes = (Date.now() - task.startTime) / (60 * 1000);

    // Use historical data to project
    const prediction = this.predictTime({ type: task.type, complexity: task.complexity });
    const projectedTotal = prediction.predicted;

    const percentComplete = Math.min(99, Math.round((elapsedMinutes / projectedTotal) * 100));

    return {
      elapsedMinutes: Math.round(elapsedMinutes),
      percentComplete,
      projectedTotal,
    };
  }

  getActiveTasks(): Task[] {
    return this.tasks.filter(t => !t.completed && t.startTime);
  }

  getPendingTasks(): Task[] {
    return this.tasks.filter(t => !t.completed && !t.startTime);
  }

  getSummary(): string {
    const stats = this.getStats(30);
    const active = this.getActiveTasks();
    const pending = this.getPendingTasks();

    const lines = [
      "⏱️  Task Time Estimation Summary (Last 30 days)",
      "",
      `Total Tasks: ${stats.totalTasks}`,
      `Accuracy Rate: ${stats.accuracyRate}% (within 20% of estimate)`,
      `Underestimation: ${stats.underestimationRate}%`,
      `Overestimation: ${stats.overestimationRate}%`,
      `Avg Estimated: ${stats.avgEstimatedTime} min`,
      `Avg Actual: ${stats.avgActualTime} min`,
    ];

    if (Object.keys(stats.byType).length > 0) {
      lines.push("", "By Task Type:");
      for (const [type, data] of Object.entries(stats.byType)) {
        const pct = Math.round(data.avgMultiplier * 100);
        lines.push(`  • ${type}: ${pct}% of estimate (${data.count} tasks)`);
      }
    }

    if (active.length > 0) {
      lines.push("", `Active Tasks: ${active.length}`);
      for (const task of active.slice(0, 3)) {
        const progress = this.getCurrentProgress(task.id);
        if (progress) {
          lines.push(
            `  • ${task.title}: ${progress.percentComplete}% complete (${progress.elapsedMinutes}/${progress.projectedTotal} min)`,
          );
        }
      }
    }

    if (pending.length > 0) {
      lines.push("", `Pending Tasks: ${pending.length}`);
    }

    return lines.join("\n");
  }
}

let globalEstimator: TaskTimeEstimator | null = null;

export async function getTaskEstimator(workspaceDir?: string): Promise<TaskTimeEstimator> {
  if (!globalEstimator) {
    globalEstimator = new TaskTimeEstimator(workspaceDir);
    await globalEstimator.load();
  }
  return globalEstimator;
}
