/**
 * Personal Knowledge Base (Second Brain)
 * RAG-powered search across notes, docs, and terminal outputs
 */

import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createHash } from "crypto";

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  type: "note" | "terminal" | "error-solution" | "snippet" | "link" | "concept";
  timestamp: number;
  tags: string[];
  relatedIds: string[];
  source?: string;
  searchVector: string;
}

export interface SearchResult {
  entry: KnowledgeEntry;
  score: number;
  excerpt: string;
}

export class KnowledgeBase {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private dataPath: string;
  private readonly maxExcerptLength = 200;

  constructor(workspaceDir?: string) {
    const base = workspaceDir || join(homedir(), ".airabot", "workspace");
    this.dataPath = join(base, "knowledge");
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.dataPath, { recursive: true });
    await this.loadAll();
  }

  private async loadAll(): Promise<void> {
    try {
      const files = await fs.readdir(this.dataPath);
      
      for (const file of files) {
        if (file.endsWith(".json")) {
          const data = await fs.readFile(join(this.dataPath, file), "utf-8");
          const entry: KnowledgeEntry = JSON.parse(data);
          this.entries.set(entry.id, entry);
        }
      }
    } catch {
      // Directory might not exist yet
    }
  }

  async add(data: {
    title: string;
    content: string;
    type: KnowledgeEntry["type"];
    tags?: string[];
    source?: string;
  }): Promise<string> {
    const id = createHash("md5")
      .update(data.title + data.content + Date.now())
      .digest("hex")
      .substring(0, 16);

    const entry: KnowledgeEntry = {
      id,
      title: data.title,
      content: data.content,
      type: data.type,
      timestamp: Date.now(),
      tags: data.tags || this.extractTags(data.content),
      relatedIds: [],
      source: data.source,
      searchVector: this.createSearchVector(data.title + " " + data.content),
    };

    // Find related entries
    entry.relatedIds = this.findRelated(entry);

    this.entries.set(id, entry);
    await this.save(entry);

    return id;
  }

  private extractTags(content: string): string[] {
    const tags = new Set<string>();

    // Common tech keywords
    const techKeywords = [
      "javascript", "typescript", "python", "react", "node", "docker", "kubernetes",
      "api", "database", "postgres", "mongodb", "redis", "auth", "jwt", "oauth",
      "git", "github", "ci/cd", "testing", "deployment", "security", "performance",
    ];

    const lower = content.toLowerCase();
    for (const keyword of techKeywords) {
      if (lower.includes(keyword)) {
        tags.add(keyword);
      }
    }

    // Extract hashtags
    const hashtagMatches = content.match(/#(\w+)/g);
    if (hashtagMatches) {
      for (const match of hashtagMatches) {
        tags.add(match.substring(1).toLowerCase());
      }
    }

    return Array.from(tags);
  }

  private createSearchVector(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private findRelated(entry: KnowledgeEntry, limit: number = 5): string[] {
    const related: Array<{ id: string; score: number }> = [];

    for (const [id, other] of this.entries) {
      if (id === entry.id) continue;

      let score = 0;

      // Tag overlap
      const commonTags = entry.tags.filter(t => other.tags.includes(t));
      score += commonTags.length * 10;

      // Same type
      if (entry.type === other.type) score += 5;

      // Content similarity (simple word overlap)
      const entryWords = new Set(entry.searchVector.split(" "));
      const otherWords = new Set(other.searchVector.split(" "));
      const intersection = Array.from(entryWords).filter(w => otherWords.has(w));
      score += intersection.length;

      if (score > 10) {
        related.push({ id, score });
      }
    }

    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.id);
  }

  search(query: string, type?: KnowledgeEntry["type"], limit: number = 10): SearchResult[] {
    const queryVector = this.createSearchVector(query);
    const queryWords = queryVector.split(" ").filter(w => w.length > 2);

    const results: SearchResult[] = [];

    for (const entry of this.entries.values()) {
      if (type && entry.type !== type) continue;

      let score = 0;

      // Title exact match
      if (entry.title.toLowerCase().includes(query.toLowerCase())) {
        score += 50;
      }

      // Tag match
      for (const tag of entry.tags) {
        if (queryVector.includes(tag)) {
          score += 20;
        }
      }

      // Word matches
      let wordMatches = 0;
      for (const word of queryWords) {
        if (entry.searchVector.includes(word)) {
          wordMatches++;
          score += 5;
        }
      }

      if (score > 0) {
        // Generate excerpt
        const excerpt = this.generateExcerpt(entry.content, queryWords);
        results.push({ entry, score, excerpt });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private generateExcerpt(content: string, queryWords: string[]): string {
    // Find best matching sentence
    const sentences = content.split(/[.!?]\s+/);
    let bestSentence = sentences[0] || content;
    let maxScore = 0;

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (lower.includes(word)) score++;
      }
      if (score > maxScore) {
        maxScore = score;
        bestSentence = sentence;
      }
    }

    if (bestSentence.length > this.maxExcerptLength) {
      return bestSentence.substring(0, this.maxExcerptLength) + "...";
    }

    return bestSentence;
  }

  getById(id: string): KnowledgeEntry | undefined {
    return this.entries.get(id);
  }

  getRelated(id: string): KnowledgeEntry[] {
    const entry = this.entries.get(id);
    if (!entry) return [];

    return entry.relatedIds
      .map(rid => this.entries.get(rid))
      .filter(Boolean) as KnowledgeEntry[];
  }

  getByTag(tag: string): KnowledgeEntry[] {
    return Array.from(this.entries.values())
      .filter(e => e.tags.includes(tag.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getRecent(limit: number = 20, type?: KnowledgeEntry["type"]): KnowledgeEntry[] {
    let entries = Array.from(this.entries.values());
    
    if (type) {
      entries = entries.filter(e => e.type === type);
    }

    return entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async update(id: string, updates: Partial<KnowledgeEntry>): Promise<boolean> {
    const entry = this.entries.get(id);
    if (!entry) return false;

    Object.assign(entry, updates);

    // Regenerate search vector if content/title changed
    if (updates.content || updates.title) {
      entry.searchVector = this.createSearchVector(
        (updates.title || entry.title) + " " + (updates.content || entry.content),
      );
    }

    // Regenerate tags if content changed
    if (updates.content) {
      entry.tags = this.extractTags(updates.content);
    }

    await this.save(entry);
    return true;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.entries.has(id)) return false;

    this.entries.delete(id);

    try {
      await fs.unlink(join(this.dataPath, `${id}.json`));
      return true;
    } catch {
      return false;
    }
  }

  private async save(entry: KnowledgeEntry): Promise<void> {
    try {
      await fs.writeFile(
        join(this.dataPath, `${entry.id}.json`),
        JSON.stringify(entry, null, 2),
      );
    } catch (error) {
      console.error("Failed to save knowledge entry:", error);
    }
  }

  getStats(): {
    totalEntries: number;
    byType: Record<string, number>;
    totalTags: number;
    mostUsedTags: Array<{ tag: string; count: number }>;
  } {
    const byType: Record<string, number> = {};
    const tagCounts = new Map<string, number>();

    for (const entry of this.entries.values()) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;

      for (const tag of entry.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    const mostUsedTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEntries: this.entries.size,
      byType,
      totalTags: tagCounts.size,
      mostUsedTags,
    };
  }

  async exportToObsidian(outputDir: string): Promise<number> {
    await fs.mkdir(outputDir, { recursive: true });
    let count = 0;

    for (const entry of this.entries.values()) {
      const filename = `${entry.title.replace(/[^a-z0-9]/gi, "-")}.md`;
      const content = [
        `# ${entry.title}`,
        "",
        `**Type:** ${entry.type}`,
        `**Created:** ${new Date(entry.timestamp).toISOString()}`,
        `**Tags:** ${entry.tags.map(t => `#${t}`).join(" ")}`,
        "",
        entry.content,
      ];

      if (entry.relatedIds.length > 0) {
        content.push("", "## Related");
        for (const rid of entry.relatedIds) {
          const related = this.entries.get(rid);
          if (related) {
            content.push(`- [[${related.title}]]`);
          }
        }
      }

      await fs.writeFile(join(outputDir, filename), content.join("\n"));
      count++;
    }

    return count;
  }
}

let globalKB: KnowledgeBase | null = null;

export async function getKnowledgeBase(workspaceDir?: string): Promise<KnowledgeBase> {
  if (!globalKB) {
    globalKB = new KnowledgeBase(workspaceDir);
    await globalKB.initialize();
  }
  return globalKB;
}

// ─── TF-IDF semantic search ───────────────────────────────────────────────────

const STOPWORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','should','could','can','may','might','shall',
  'to','of','in','on','at','by','for','with','about','from','this','that','these',
  'those','it','its','i','my','your','our','their','and','or','but','not','no',
  'as','if','then','so','up','out','what','which','who','when','where','how',
]);

export function generateSearchVector(content: string): string {
  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .join(' ');
}

function buildTermFrequency(text: string): Map<string, number> {
  const words = generateSearchVector(text).split(/\s+/).filter(Boolean);
  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  // Normalize
  const max = Math.max(...freq.values(), 1);
  for (const [k, v] of freq) freq.set(k, v / max);
  return freq;
}

export interface TFIDFSearchResult {
  entry: KnowledgeEntry;
  score: number;
  excerpt: string;
}

export function tfidfSearch(
  entries: KnowledgeEntry[],
  query: string,
  limit = 5,
): TFIDFSearchResult[] {
  const queryTerms = generateSearchVector(query).split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0 || entries.length === 0) return [];

  // Build IDF: log(N / df)
  const N = entries.length;
  const df = new Map<string, number>();
  for (const entry of entries) {
    const words = new Set(generateSearchVector(entry.title + ' ' + entry.content).split(/\s+/));
    for (const w of words) df.set(w, (df.get(w) ?? 0) + 1);
  }

  const idf = (term: string): number => {
    const docFreq = df.get(term) ?? 0;
    return docFreq === 0 ? 0 : Math.log(N / docFreq + 1);
  };

  const scored = entries.map((entry) => {
    const tf = buildTermFrequency(entry.title + ' ' + entry.content);
    let score = 0;
    for (const term of queryTerms) {
      score += (tf.get(term) ?? 0) * idf(term);
    }
    // Title boost
    if (entry.title.toLowerCase().includes(query.toLowerCase())) score += 2;
    // Tag boost
    for (const tag of entry.tags) {
      if (queryTerms.includes(tag.toLowerCase())) score += 1;
    }

    const excerpt = entry.content.substring(0, 150) + (entry.content.length > 150 ? '…' : '');
    return { entry, score, excerpt };
  });

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
