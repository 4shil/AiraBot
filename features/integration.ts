/**
 * Feature Integration Layer
 * Connects all new features to the main AiraBot engine
 */

// Export all new features
export * from "../clipboard/smart-clipboard.js";
export * from "../standup/standup-generator.js";
export * from "../knowledge/knowledge-base.js";
export * from "../estimator/task-estimator.js";
export * from "../kerala/kerala-utils.js";

import { getSmartClipboard } from "../clipboard/smart-clipboard.js";
import { getStandupGenerator } from "../standup/standup-generator.js";
import { getKnowledgeBase } from "../knowledge/knowledge-base.js";
import { getTaskEstimator } from "../estimator/task-estimator.js";
import { KeralaUtils, ist, festivals, manglish } from "../kerala/kerala-utils.js";

export interface FeatureConfig {
  workspaceDir?: string;
  enableClipboard: boolean;
  enableStandup: boolean;
  enableKnowledge: boolean;
  enableEstimator: boolean;
  enableKerala: boolean;
}

const DEFAULT_CONFIG: FeatureConfig = {
  enableClipboard: true,
  enableStandup: true,
  enableKnowledge: true,
  enableEstimator: true,
  enableKerala: true,
};

export class IntegratedFeatures {
  private config: FeatureConfig;
  private initialized: boolean = false;

  constructor(config?: Partial<FeatureConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (this.config.enableKnowledge) {
      const kb = await getKnowledgeBase(this.config.workspaceDir);
      console.log("✅ Knowledge Base initialized");
    }

    if (this.config.enableClipboard) {
      await getSmartClipboard(this.config.workspaceDir);
      console.log("✅ Smart Clipboard initialized");
    }

    if (this.config.enableEstimator) {
      await getTaskEstimator(this.config.workspaceDir);
      console.log("✅ Task Estimator initialized");
    }

    this.initialized = true;
    console.log("✅ All features initialized");
  }

  // Clipboard operations
  async addToClipboard(content: string, source?: string): Promise<string> {
    if (!this.config.enableClipboard) throw new Error("Clipboard disabled");
    const clipboard = await getSmartClipboard(this.config.workspaceDir);
    return await clipboard.add(content, source);
  }

  async searchClipboard(query: string, limit?: number) {
    if (!this.config.enableClipboard) throw new Error("Clipboard disabled");
    const clipboard = await getSmartClipboard(this.config.workspaceDir);
    return clipboard.search(query, limit);
  }

  // Standup operations
  async generateStandup(daysAgo: number = 1, format: "slack" | "discord" | "text" = "text") {
    if (!this.config.enableStandup) throw new Error("Standup disabled");
    const generator = getStandupGenerator(this.config.workspaceDir);
    const standup = await generator.generate(daysAgo);
    return await generator.format(standup, format);
  }

  // Knowledge base operations
  async addKnowledge(data: {
    title: string;
    content: string;
    type: "note" | "terminal" | "error-solution" | "snippet" | "link" | "concept";
    tags?: string[];
  }) {
    if (!this.config.enableKnowledge) throw new Error("Knowledge base disabled");
    const kb = await getKnowledgeBase(this.config.workspaceDir);
    return await kb.add(data);
  }

  async searchKnowledge(query: string, limit?: number) {
    if (!this.config.enableKnowledge) throw new Error("Knowledge base disabled");
    const kb = await getKnowledgeBase(this.config.workspaceDir);
    return kb.search(query, undefined, limit);
  }

  // Task estimation operations
  async estimateTask(data: {
    type: "coding" | "debugging" | "research" | "meeting" | "review" | "writing" | "other";
    complexity?: "simple" | "medium" | "complex";
    baseEstimate?: number;
  }) {
    if (!this.config.enableEstimator) throw new Error("Estimator disabled");
    const estimator = await getTaskEstimator(this.config.workspaceDir);
    return estimator.predictTime(data);
  }

  async startTask(id: string) {
    if (!this.config.enableEstimator) throw new Error("Estimator disabled");
    const estimator = await getTaskEstimator(this.config.workspaceDir);
    return estimator.startTask(id);
  }

  async completeTask(id: string, actualMinutes?: number) {
    if (!this.config.enableEstimator) throw new Error("Estimator disabled");
    const estimator = await getTaskEstimator(this.config.workspaceDir);
    return estimator.completeTask(id, actualMinutes);
  }

  // Kerala utilities
  getISTTime() {
    if (!this.config.enableKerala) throw new Error("Kerala utils disabled");
    return ist.now();
  }

  getUpcomingFestivals(days?: number) {
    if (!this.config.enableKerala) throw new Error("Kerala utils disabled");
    return festivals.upcoming(days);
  }

  translateManglish(text: string) {
    if (!this.config.enableKerala) throw new Error("Kerala utils disabled");
    return manglish.translate(text);
  }

  // Combined operations
  async getFullStatus(): Promise<string> {
    const sections: string[] = ["🤖 AiraBot Feature Status", ""];

    if (this.config.enableClipboard) {
      const clipboard = await getSmartClipboard(this.config.workspaceDir);
      const stats = clipboard.getStats();
      sections.push(`📋 Clipboard: ${stats.totalEntries} entries`);
    }

    if (this.config.enableKnowledge) {
      const kb = await getKnowledgeBase(this.config.workspaceDir);
      const stats = kb.getStats();
      sections.push(`🧠 Knowledge: ${stats.totalEntries} entries`);
    }

    if (this.config.enableEstimator) {
      const estimator = await getTaskEstimator(this.config.workspaceDir);
      const stats = estimator.getStats(30);
      sections.push(`⏱️  Tasks: ${stats.totalTasks} tracked, ${stats.accuracyRate}% accurate`);
    }

    if (this.config.enableKerala) {
      const istTime = ist.now();
      const upcoming = festivals.upcoming(7);
      sections.push(`🕐 IST: ${istTime.formatted}`);
      if (upcoming.length > 0) {
        sections.push(`🎉 Next: ${upcoming[0].name} on ${upcoming[0].date.toLocaleDateString()}`);
      }
    }

    return sections.join("\n");
  }
}

// Global instance
let globalIntegration: IntegratedFeatures | null = null;

export function getIntegratedFeatures(config?: Partial<FeatureConfig>): IntegratedFeatures {
  if (!globalIntegration) {
    globalIntegration = new IntegratedFeatures(config);
  }
  return globalIntegration;
}

// Quick-start helper
export async function initializeAllFeatures(
  config?: Partial<FeatureConfig>,
): Promise<IntegratedFeatures> {
  const features = getIntegratedFeatures(config);
  await features.initialize();
  return features;
}

// Export convenience objects
export { ist, festivals, manglish };
