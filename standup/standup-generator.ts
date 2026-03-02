/**
 * Daily Standup Auto-Generator
 * Analyzes git commits and activity to generate standup summaries
 */

import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

const execAsync = promisify(exec);

export interface StandupData {
  date: string;
  yesterday: string[];
  today: string[];
  blockers: string[];
  metrics: {
    commits: number;
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
  };
}

export class StandupGenerator {
  private workspaceDir: string;
  private historyPath: string;

  constructor(workspaceDir?: string) {
    this.workspaceDir = workspaceDir || process.cwd();
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.historyPath = join(base, "memory", "standup-history.json");
  }

  async generate(daysAgo: number = 1): Promise<StandupData> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Get git data
    const commits = await this.getGitCommits(dateStr);
    const stats = await this.getGitStats(dateStr);

    // Analyze activities
    const activities = this.analyzeCommits(commits);

    // Detect blockers (repeated attempts, reverts, error-related commits)
    const blockers = this.detectBlockers(commits);

    const standup: StandupData = {
      date: dateStr,
      yesterday: activities,
      today: [], // To be filled by user or predicted
      blockers,
      metrics: stats,
    };

    await this.saveHistory(standup);
    return standup;
  }

  private async getGitCommits(date: string): Promise<string[]> {
    try {
      const tomorrow = new Date(date);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const { stdout } = await execAsync(
        `git log --since="${date} 00:00" --until="${tomorrowStr} 00:00" --pretty=format:"%s" --no-merges`,
        { cwd: this.workspaceDir },
      );

      return stdout.trim().split("\n").filter(Boolean);
    } catch {
      return [];
    }
  }

  private async getGitStats(date: string): Promise<StandupData["metrics"]> {
    try {
      const tomorrow = new Date(date);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const { stdout: commitCount } = await execAsync(
        `git log --since="${date} 00:00" --until="${tomorrowStr} 00:00" --oneline --no-merges | wc -l`,
        { cwd: this.workspaceDir },
      );

      const { stdout: diffStat } = await execAsync(
        `git log --since="${date} 00:00" --until="${tomorrowStr} 00:00" --shortstat --no-merges`,
        { cwd: this.workspaceDir },
      );

      let filesChanged = 0;
      let linesAdded = 0;
      let linesRemoved = 0;

      const lines = diffStat.trim().split("\n");
      for (const line of lines) {
        const fileMatch = line.match(/(\d+) files? changed/);
        const addMatch = line.match(/(\d+) insertions?\(\+\)/);
        const delMatch = line.match(/(\d+) deletions?\(-\)/);

        if (fileMatch) filesChanged += parseInt(fileMatch[1]);
        if (addMatch) linesAdded += parseInt(addMatch[1]);
        if (delMatch) linesRemoved += parseInt(delMatch[1]);
      }

      return {
        commits: parseInt(commitCount.trim()),
        filesChanged,
        linesAdded,
        linesRemoved,
      };
    } catch {
      return { commits: 0, filesChanged: 0, linesAdded: 0, linesRemoved: 0 };
    }
  }

  private analyzeCommits(commits: string[]): string[] {
    const activities: string[] = [];
    const categories = new Map<string, string[]>();

    for (const commit of commits) {
      const lower = commit.toLowerCase();
      let category = "other";

      if (lower.includes("fix") || lower.includes("bug")) category = "fix";
      else if (lower.includes("feat") || lower.includes("add")) category = "feature";
      else if (lower.includes("refactor")) category = "refactor";
      else if (lower.includes("test")) category = "test";
      else if (lower.includes("docs")) category = "docs";
      else if (lower.includes("style") || lower.includes("format")) category = "style";
      else if (lower.includes("review") || lower.includes("pr")) category = "review";

      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(commit);
    }

    // Summarize by category
    if (categories.has("feature")) {
      const features = categories.get("feature")!;
      activities.push(`Added ${features.length} new feature(s): ${this.summarizeCommits(features)}`);
    }

    if (categories.has("fix")) {
      const fixes = categories.get("fix")!;
      activities.push(`Fixed ${fixes.length} bug(s): ${this.summarizeCommits(fixes)}`);
    }

    if (categories.has("refactor")) {
      activities.push(`Code refactoring: ${this.summarizeCommits(categories.get("refactor")!)}`);
    }

    if (categories.has("review")) {
      activities.push(`Reviewed PRs: ${categories.get("review")!.length} review(s)`);
    }

    if (categories.has("test")) {
      activities.push(`Added tests: ${this.summarizeCommits(categories.get("test")!)}`);
    }

    if (categories.has("docs")) {
      activities.push(`Updated documentation`);
    }

    return activities;
  }

  private summarizeCommits(commits: string[]): string {
    if (commits.length === 0) return "";
    if (commits.length === 1) return commits[0];
    
    // Extract main topics
    const topics = commits.map(c => {
      const match = c.match(/^(feat|fix|refactor|test|docs)[\(\:]?\s*(.+)/i);
      return match ? match[2].split(/[,\.]/ )[0].trim() : c.split(/[,\.]/)[0].trim();
    });

    return topics.slice(0, 3).join(", ") + (topics.length > 3 ? `, +${topics.length - 3} more` : "");
  }

  private detectBlockers(commits: string[]): string[] {
    const blockers: string[] = [];

    // Check for reverts
    const revertCount = commits.filter(c => /revert/i.test(c)).length;
    if (revertCount > 0) {
      blockers.push(`Had to revert ${revertCount} commit(s) - something went wrong`);
    }

    // Check for error/crash related commits
    const errorCommits = commits.filter(c => 
      /error|crash|failure|broken|not working/i.test(c)
    );
    if (errorCommits.length > 2) {
      blockers.push(`Multiple errors encountered: ${errorCommits.length} error-related commits`);
    }

    // Check for WIP commits (might indicate incomplete work)
    const wipCommits = commits.filter(c => /wip|work in progress|todo|fixme/i.test(c));
    if (wipCommits.length > 3) {
      blockers.push(`${wipCommits.length} WIP commits - some tasks incomplete`);
    }

    return blockers;
  }

  async predictToday(): Promise<string[]> {
    // Load recent history to predict today's tasks
    const history = await this.loadHistory();
    if (history.length === 0) return ["Continue working on current tasks"];

    const recent = history[0];
    const predictions: string[] = [];

    // If yesterday had blockers, today should resolve them
    if (recent.blockers.length > 0) {
      predictions.push(`Resolve blockers from yesterday`);
    }

    // Continue patterns from yesterday
    if (recent.yesterday.some(a => a.includes("feature"))) {
      predictions.push(`Continue feature development`);
    }

    if (recent.yesterday.some(a => a.includes("refactor"))) {
      predictions.push(`Complete refactoring tasks`);
    }

    if (recent.metrics.commits === 0) {
      predictions.push(`Get started with pending tasks`);
    }

    return predictions.length > 0 ? predictions : ["Continue working on current tasks"];
  }

  async saveHistory(standup: StandupData): Promise<void> {
    try {
      const history = await this.loadHistory();
      history.unshift(standup);

      const dir = join(this.historyPath, "..");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(this.historyPath, JSON.stringify(history.slice(0, 30), null, 2));
    } catch (error) {
      console.error("Failed to save standup history:", error);
    }
  }

  private async loadHistory(): Promise<StandupData[]> {
    try {
      const data = await fs.readFile(this.historyPath, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async format(standup: StandupData, style: "slack" | "discord" | "text" = "text"): Promise<string> {
    const today = await this.predictToday();
    standup.today = today;

    if (style === "slack" || style === "discord") {
      return this.formatMarkdown(standup);
    }

    return this.formatText(standup);
  }

  private formatText(standup: StandupData): string {
    const lines = [
      `📅 Standup for ${standup.date}`,
      "",
      "✅ Yesterday:",
    ];

    for (const item of standup.yesterday) {
      lines.push(`  • ${item}`);
    }

    if (standup.yesterday.length === 0) {
      lines.push("  • No commits");
    }

    lines.push("", "🎯 Today:");
    for (const item of standup.today) {
      lines.push(`  • ${item}`);
    }

    if (standup.blockers.length > 0) {
      lines.push("", "🚧 Blockers:");
      for (const blocker of standup.blockers) {
        lines.push(`  • ${blocker}`);
      }
    }

    lines.push(
      "",
      `📊 Stats: ${standup.metrics.commits} commits, ${standup.metrics.filesChanged} files, +${standup.metrics.linesAdded}/-${standup.metrics.linesRemoved} lines`,
    );

    return lines.join("\n");
  }

  private formatMarkdown(standup: StandupData): string {
    let md = `**📅 Standup for ${standup.date}**\n\n`;
    md += `**✅ Yesterday:**\n`;
    
    for (const item of standup.yesterday) {
      md += `• ${item}\n`;
    }
    if (standup.yesterday.length === 0) md += `• No commits\n`;

    md += `\n**🎯 Today:**\n`;
    for (const item of standup.today) {
      md += `• ${item}\n`;
    }

    if (standup.blockers.length > 0) {
      md += `\n**🚧 Blockers:**\n`;
      for (const blocker of standup.blockers) {
        md += `• ${blocker}\n`;
      }
    }

    md += `\n_Stats: ${standup.metrics.commits} commits, ${standup.metrics.filesChanged} files, +${standup.metrics.linesAdded}/-${standup.metrics.linesRemoved} lines_`;

    return md;
  }
}

let globalGenerator: StandupGenerator | null = null;

export function getStandupGenerator(workspaceDir?: string): StandupGenerator {
  if (!globalGenerator) {
    globalGenerator = new StandupGenerator(workspaceDir);
  }
  return globalGenerator;
}

// ─── Multi-repo standup support ───────────────────────────────────────────────

import { simpleGit } from 'simple-git';
import { promises as fsp } from 'fs';

export interface RepoStandup {
  repoName: string;
  commits: string[];
  commitCount: number;
}

export interface MultiRepoStandup {
  date: string;
  repos: RepoStandup[];
  totalCommits: number;
}

async function findGitRepos(baseDir: string): Promise<string[]> {
  const repos: string[] = [];
  try {
    const entries = await fsp.readdir(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const repoPath = join(baseDir, entry.name);
      try {
        const git = simpleGit(repoPath);
        if (await git.checkIsRepo()) repos.push(repoPath);
      } catch { /* skip */ }
    }
  } catch { /* ignore */ }
  return repos;
}

export async function generateMultiRepoStandup(options: {
  baseDir?: string;
  days?: number;
}): Promise<MultiRepoStandup> {
  const baseDir = options.baseDir ?? join(homedir(), 'Coding');
  const days = options.days ?? 1;
  const repos = await findGitRepos(baseDir);

  const since = days === 1 ? 'yesterday' : `${days}.days`;
  const result: MultiRepoStandup = {
    date: new Date().toISOString().split('T')[0] ?? '',
    repos: [],
    totalCommits: 0,
  };

  for (const repoPath of repos) {
    const repoName = repoPath.split('/').pop() ?? repoPath;
    try {
      const git = simpleGit(repoPath);
      const log = await git.log(['--since=' + since, '--format=%s']);
      const commits = log.all.map((c) => c.message).filter(Boolean);
      if (commits.length > 0) {
        result.repos.push({ repoName, commits, commitCount: commits.length });
        result.totalCommits += commits.length;
      }
    } catch { /* skip */ }
  }

  return result;
}

export function formatMultiRepoStandup(
  standup: MultiRepoStandup,
  format: 'slack' | 'discord' | 'plain' = 'plain',
): string {
  const lines: string[] = [];
  const date = standup.date;

  if (format === 'slack') {
    lines.push(`*Daily Standup — ${date}* 📋`);
    for (const repo of standup.repos) {
      lines.push(`\n*${repo.repoName}* (${repo.commitCount} commit${repo.commitCount !== 1 ? 's' : ''})`);
      for (const commit of repo.commits.slice(0, 5)) {
        lines.push(`  • ${commit}`);
      }
    }
    if (standup.repos.length === 0) lines.push('_No commits found in the period._');
  } else if (format === 'discord') {
    lines.push(`**Daily Standup — ${date}** 📋`);
    for (const repo of standup.repos) {
      lines.push(`\n**${repo.repoName}** (${repo.commitCount} commits)`);
      for (const commit of repo.commits.slice(0, 5)) {
        lines.push(`  • ${commit}`);
      }
    }
    if (standup.repos.length === 0) lines.push('_No commits found._');
  } else {
    lines.push(`Daily Standup — ${date}`);
    lines.push('='.repeat(40));
    for (const repo of standup.repos) {
      lines.push(`\n[${repo.repoName}] (${repo.commitCount} commits)`);
      for (const commit of repo.commits.slice(0, 5)) {
        lines.push(`  - ${commit}`);
      }
    }
    if (standup.repos.length === 0) lines.push('No commits found in the period.');
  }

  lines.push(`\nTotal: ${standup.totalCommits} commit${standup.totalCommits !== 1 ? 's' : ''} across ${standup.repos.length} repo${standup.repos.length !== 1 ? 's' : ''}`);
  return lines.join('\n');
}

// Convenience method used by CLI
export class StandupGeneratorExt {
  async generateForAllRepos(options: {
    format?: 'slack' | 'discord' | 'plain';
    days?: number;
    baseDir?: string;
  }): Promise<string> {
    const standup = await generateMultiRepoStandup({
      baseDir: options.baseDir,
      days: options.days ?? 1,
    });
    return formatMultiRepoStandup(standup, options.format ?? 'plain');
  }
}

// Re-export with same name expected by CLI
export { StandupGeneratorExt as StandupGenerator };
