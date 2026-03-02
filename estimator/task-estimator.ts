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

// ─── Extended TaskEstimator for CLI ──────────────────────────────────────────

import { promises as fsp } from 'fs';
import { join as pathJoin } from 'path';
import { homedir as osHomedir } from 'os';
import { createHash } from 'crypto';

const TASK_HISTORY_PATH = pathJoin(osHomedir(), '.airabot', 'task-history.json');

export interface TaskHistoryEntry {
  id: string;
  type: string;
  complexity: 'low' | 'medium' | 'high';
  baseMinutes: number;
  estimatedMinutes: number;
  actualMinutes?: number;
  emaAccuracy?: number; // rolling EMA of actual/estimated
  createdAt: string;
  completedAt?: string;
}

export interface EstimateResult {
  id: string;
  estimatedMinutes: number;
  rangeMin: number;
  rangeMax: number;
  confidence: number;
}

export interface AccuracyReport {
  overall: number; // 0-1 (1 = perfect)
  byType: Record<string, number>;
}

// Complexity multipliers
const COMPLEXITY_MULT: Record<string, number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.6,
};

let historyCache: TaskHistoryEntry[] | null = null;

async function loadHistory(): Promise<TaskHistoryEntry[]> {
  if (historyCache) return historyCache;
  try {
    const data = await fsp.readFile(TASK_HISTORY_PATH, 'utf-8');
    historyCache = JSON.parse(data) as TaskHistoryEntry[];
  } catch {
    historyCache = [];
  }
  return historyCache;
}

async function saveHistory(history: TaskHistoryEntry[]): Promise<void> {
  await fsp.mkdir(pathJoin(osHomedir(), '.airabot'), { recursive: true });
  await fsp.writeFile(TASK_HISTORY_PATH, JSON.stringify(history, null, 2));
  historyCache = history;
}

export class TaskEstimator {
  private history: TaskHistoryEntry[] = [];

  async load(): Promise<void> {
    this.history = await loadHistory();
  }

  estimate(opts: { type: string; complexity: 'low' | 'medium' | 'high'; baseMinutes: number }): EstimateResult {
    const mult = COMPLEXITY_MULT[opts.complexity] ?? 1.0;
    const estimated = Math.round(opts.baseMinutes * mult);
    const id = createHash('sha1').update(`${opts.type}:${Date.now()}`).digest('hex').slice(0, 8);

    // Find EMA accuracy for this type
    const typeHistory = this.history.filter((h) => h.type === opts.type && h.actualMinutes != null);
    const ema = typeHistory.length > 0 ? typeHistory[typeHistory.length - 1]?.emaAccuracy ?? 1.0 : 1.0;
    const adjustedEstimate = Math.round(estimated * (ema < 0.5 ? 1 / ema : 1));

    // Range: ±25%
    const rangeMin = Math.round(adjustedEstimate * 0.75);
    const rangeMax = Math.round(adjustedEstimate * 1.25);
    const confidence = Math.min(95, 50 + typeHistory.length * 5);

    // Save to history
    const entry: TaskHistoryEntry = {
      id,
      type: opts.type,
      complexity: opts.complexity,
      baseMinutes: opts.baseMinutes,
      estimatedMinutes: adjustedEstimate,
      createdAt: new Date().toISOString(),
    };
    this.history.push(entry);
    saveHistory(this.history).catch(() => { /* ignore */ });

    return { id, estimatedMinutes: adjustedEstimate, rangeMin, rangeMax, confidence };
  }

  async completeTask(id: string, actualMinutes: number): Promise<void> {
    const entry = this.history.find((h) => h.id === id);
    if (!entry) throw new Error(`Task ${id} not found`);

    const ratio = actualMinutes / entry.estimatedMinutes;
    const alpha = 0.3;
    const prevEma = entry.emaAccuracy ?? 1.0;
    entry.emaAccuracy = alpha * ratio + (1 - alpha) * prevEma;
    entry.actualMinutes = actualMinutes;
    entry.completedAt = new Date().toISOString();

    await saveHistory(this.history);
  }

  getAccuracyReport(): AccuracyReport {
    const completed = this.history.filter((h) => h.actualMinutes != null);
    if (completed.length === 0) return { overall: 1.0, byType: {} };

    const byType: Record<string, number[]> = {};
    for (const h of completed) {
      if (!byType[h.type]) byType[h.type] = [];
      byType[h.type]!.push(h.actualMinutes! / h.estimatedMinutes);
    }

    const typeAccuracy: Record<string, number> = {};
    for (const [type, ratios] of Object.entries(byType)) {
      const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      // accuracy = 1 - abs(1 - ratio), clamped to 0-1
      typeAccuracy[type] = Math.max(0, 1 - Math.abs(1 - avg));
    }

    const overall =
      Object.values(typeAccuracy).reduce((a, b) => a + b, 0) /
      Object.values(typeAccuracy).length;

    return { overall, byType: typeAccuracy };
  }
}
