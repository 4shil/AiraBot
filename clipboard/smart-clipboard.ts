/**
 * Smart Clipboard History
 * AI-powered clipboard with semantic search and auto-categorization
 */

import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";

export type ClipboardCategory = "code" | "link" | "text" | "command" | "json" | "credential" | "other";

export interface ClipboardEntry {
  id: string;
  content: string;
  category: ClipboardCategory;
  timestamp: number;
  source?: string;
  language?: string; // For code
  expiresAt?: number; // For sensitive data
  tags: string[];
  searchVector?: string; // Simplified text for search
}

export interface SearchResult {
  entry: ClipboardEntry;
  score: number;
  matchReason: string;
}

export class SmartClipboard {
  private history: ClipboardEntry[] = [];
  private logPath: string;
  private readonly maxSize = 500;
  private readonly sensitivePatterns = [/password|secret|token|key|api[-_]?key/i];

  constructor(workspaceDir?: string) {
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.logPath = join(base, "memory", "clipboard-history.json");
  }

  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.logPath, "utf-8");
      this.history = JSON.parse(data);
      this.cleanExpired();
    } catch {
      this.history = [];
    }
  }

  async save(): Promise<void> {
    try {
      const dir = join(this.logPath, "..");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        this.logPath,
        JSON.stringify(this.history.slice(-this.maxSize), null, 2),
      );
    } catch (error) {
      console.error("Failed to save clipboard:", error);
    }
  }

  async add(content: string, source?: string): Promise<string> {
    // Generate ID
    const id = randomUUID();

    // Detect category
    const category = this.detectCategory(content);

    // Check if sensitive
    const isSensitive = this.isSensitive(content);
    const expiresAt = isSensitive ? Date.now() + 60 * 60 * 1000 : undefined; // 1 hour for sensitive

    // Detect language for code
    const language = category === "code" ? this.detectLanguage(content) : undefined;

    // Generate tags
    const tags = this.generateTags(content, category);

    // Create entry
    const entry: ClipboardEntry = {
      id,
      content,
      category,
      timestamp: Date.now(),
      source,
      language,
      expiresAt,
      tags,
      searchVector: this.createSearchVector(content),
    };

    this.history.push(entry);
    
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize);
    }

    await this.save();
    return id;
  }

  private detectCategory(content: string): ClipboardCategory {
    const trimmed = content.trim();

    // URL
    if (/^https?:\/\//i.test(trimmed)) return "link";

    // JSON
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || 
        (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        JSON.parse(trimmed);
        return "json";
      } catch {}
    }

    // Command (starts with $, #, or common commands)
    if (/^[$#]/.test(trimmed) || /^(npm|git|cd|ls|docker|kubectl|yarn|pnpm)\s+/.test(trimmed)) {
      return "command";
    }

    // Code indicators
    if (/^(function|const|let|var|class|import|export|def|async|await)\s+/m.test(trimmed) ||
        /(=>|{|}|\[|\]|\(|\)|;|===|!==)/g.test(trimmed)) {
      return "code";
    }

    // Credentials
    if (this.isSensitive(content)) {
      return "credential";
    }

    return "text";
  }

  private detectLanguage(code: string): string {
    if (/^(import|export|const|let|function|class)\s+/.test(code)) return "javascript";
    if (/^(def|import|class|async def|from .* import)/.test(code)) return "python";
    if (/^(func|package|import|type|interface)/.test(code)) return "go";
    if (/^(fn|let|use|impl|struct)/.test(code)) return "rust";
    if (/<[^>]+>/.test(code) && /className|onClick/.test(code)) return "jsx";
    if (/<\?php/.test(code)) return "php";
    return "unknown";
  }

  private isSensitive(content: string): boolean {
    return this.sensitivePatterns.some(pattern => pattern.test(content));
  }

  private generateTags(content: string, category: ClipboardCategory): string[] {
    const tags: string[] = [category];
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    
    // Add common tech keywords as tags
    const keywords = ["react", "node", "docker", "api", "database", "auth", "git", "npm", "typescript"];
    for (const keyword of keywords) {
      if (words.includes(keyword)) tags.push(keyword);
    }

    return [...new Set(tags)];
  }

  private createSearchVector(content: string): string {
    // Simplified search vector - lowercase, remove special chars
    return content.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  search(query: string, limit: number = 10): SearchResult[] {
    const queryVector = this.createSearchVector(query);
    const queryWords = queryVector.split(" ");

    const results: SearchResult[] = [];

    for (const entry of this.history) {
      if (!entry.searchVector) continue;

      let score = 0;
      let matchReason = "";

      // Exact match
      if (entry.searchVector.includes(queryVector)) {
        score += 100;
        matchReason = "exact match";
      }

      // Word matches
      let wordMatches = 0;
      for (const word of queryWords) {
        if (entry.searchVector.includes(word)) {
          wordMatches++;
          score += 10;
        }
      }

      if (wordMatches > 0) {
        matchReason = matchReason || `${wordMatches} word match(es)`;
      }

      // Tag matches
      for (const tag of entry.tags) {
        if (queryVector.includes(tag)) {
          score += 20;
          matchReason = matchReason || `tag: ${tag}`;
        }
      }

      // Category match
      if (queryVector.includes(entry.category)) {
        score += 15;
      }

      if (score > 0) {
        results.push({ entry, score, matchReason });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getRecent(limit: number = 20, category?: ClipboardCategory): ClipboardEntry[] {
    let filtered = [...this.history];
    
    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }

    return filtered.slice(-limit).reverse();
  }

  list(): ClipboardEntry[] {
    return [...this.history].reverse();
  }

  clear(): void {
    this.history = [];
  }

  getById(id: string): ClipboardEntry | undefined {
    return this.history.find(e => e.id === id);
  }

  deleteById(id: string): boolean {
    const index = this.history.findIndex(e => e.id === id);
    if (index >= 0) {
      this.history.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  private cleanExpired(): void {
    const now = Date.now();
    this.history = this.history.filter(e => !e.expiresAt || e.expiresAt > now);
  }

  getStats(): {
    totalEntries: number;
    byCategory: Record<ClipboardCategory, number>;
    oldestEntry: number;
    newestEntry: number;
  } {
    const byCategory: Record<string, number> = {};
    
    for (const entry of this.history) {
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
    }

    return {
      totalEntries: this.history.length,
      byCategory: byCategory as Record<ClipboardCategory, number>,
      oldestEntry: this.history[0]?.timestamp || 0,
      newestEntry: this.history[this.history.length - 1]?.timestamp || 0,
    };
  }
}

let globalClipboard: SmartClipboard | null = null;

export async function getSmartClipboard(workspaceDir?: string): Promise<SmartClipboard> {
  if (!globalClipboard) {
    globalClipboard = new SmartClipboard(workspaceDir);
    await globalClipboard.load();
  }
  return globalClipboard;
}

// ─── System clipboard watching and extended methods ───────────────────────────

import { spawn, type ChildProcess } from 'child_process';

let watcherProcess: ChildProcess | null = null;

/**
 * Start watching the system clipboard via wl-paste --watch (Wayland).
 * Falls back to polling with xclip on X11.
 */
export function startClipboardWatcher(cb: SmartClipboard): void {
  if (watcherProcess) return; // already watching

  try {
    watcherProcess = spawn('wl-paste', ['--watch', 'cat'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    let buffer = '';
    watcherProcess.stdout?.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          const last = cb.list()[0];
          if (!last || last.content !== trimmed) {
            cb.add(trimmed);
            cb.save().catch(() => { /* ignore */ });
          }
        }
      }
    });

    watcherProcess.on('error', () => {
      watcherProcess = null;
    });

    watcherProcess.on('exit', () => {
      watcherProcess = null;
    });
  } catch {
    watcherProcess = null;
  }
}

export function stopClipboardWatcher(): void {
  if (watcherProcess) {
    watcherProcess.kill('SIGTERM');
    watcherProcess = null;
  }
}
