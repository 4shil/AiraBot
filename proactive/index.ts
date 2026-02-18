/**
 * Proactive Intelligence Engine
 * Main integration point for all proactive intelligence features
 */

export * from "./pattern-detector.js";
export * from "./activity-tracker.js";
export * from "./suggestion-engine.js";
export * from "./context-analyzer.js";
export * from "./predictive-scheduler.js";
export * from "./notification-manager.js";
export * from "./learning-feedback.js";
export * from "./proactive-monitor.js";
export * from "./heartbeat-integration.js";

import { getProactiveMonitor } from "./proactive-monitor.js";
import { getHeartbeatIntegration } from "./heartbeat-integration.js";
import { getPatternDetector } from "./pattern-detector.js";
import { getActivityTracker } from "./activity-tracker.js";
import { getSuggestionEngine } from "./suggestion-engine.js";
import { getContextAnalyzer } from "./context-analyzer.js";
import { getPredictiveScheduler } from "./predictive-scheduler.js";
import { getNotificationManager } from "./notification-manager.js";
import { getLearningFeedback } from "./learning-feedback.js";

export interface ProactiveEngineConfig {
  workspaceDir?: string;
  monitoringEnabled: boolean;
  checkIntervalMinutes: number;
  quietHoursStart: number;
  quietHoursEnd: number;
  maxNotificationsPerHour: number;
}

const DEFAULT_CONFIG: ProactiveEngineConfig = {
  monitoringEnabled: true,
  checkIntervalMinutes: 30,
  quietHoursStart: 23,
  quietHoursEnd: 7,
  maxNotificationsPerHour: 3,
};

export class ProactiveEngine {
  private config: ProactiveEngineConfig;
  private initialized: boolean = false;

  constructor(config?: Partial<ProactiveEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize all subsystems
    await getPatternDetector(this.config.workspaceDir);
    await getActivityTracker(this.config.workspaceDir);
    await getPredictiveScheduler(this.config.workspaceDir);
    await getLearningFeedback(this.config.workspaceDir);

    // Configure notification manager
    const notificationMgr = getNotificationManager();
    notificationMgr.updatePreferences({
      quietHours: {
        start: this.config.quietHoursStart,
        end: this.config.quietHoursEnd,
      },
      maxPerHour: this.config.maxNotificationsPerHour,
    });

    // Start monitoring if enabled
    if (this.config.monitoringEnabled) {
      const monitor = getProactiveMonitor({
        workspaceDir: this.config.workspaceDir,
        enabled: true,
        checkIntervalMinutes: this.config.checkIntervalMinutes,
      });
      await monitor.start();
    }

    this.initialized = true;
    console.log("✅ Proactive Intelligence Engine initialized");
  }

  async shutdown(): Promise<void> {
    const monitor = getProactiveMonitor();
    monitor.stop();
    this.initialized = false;
    console.log("Proactive Intelligence Engine shut down");
  }

  async logActivity(
    type: "coding" | "meeting" | "break" | "research" | "debugging" | "idle",
    durationMinutes: number,
  ): Promise<void> {
    const tracker = await getActivityTracker(this.config.workspaceDir);
    const detector = await getPatternDetector(this.config.workspaceDir);

    // Log to both systems
    tracker.startActivity(type);
    setTimeout(() => tracker.endActivity(), durationMinutes * 60 * 1000);

    await detector.logActivity(type, durationMinutes);
  }

  async getSuggestions(): Promise<string[]> {
    const suggestionEngine = getSuggestionEngine();
    const tracker = await getActivityTracker(this.config.workspaceDir);
    const detector = await getPatternDetector(this.config.workspaceDir);

    const patterns = detector.detectCurrentPatterns();
    const currentActivity = tracker.getCurrentActivity();
    const needsBreak = tracker.needsBreak();

    const suggestions = suggestionEngine.generateSuggestions({
      patterns,
      currentActivity,
      needsBreak,
      timeOfDay: new Date().getHours(),
    });

    return suggestions.map((s) => s.message);
  }

  async getFullStatus(): Promise<string> {
    const integration = getHeartbeatIntegration();
    return await integration.getProactiveStatus(this.config.workspaceDir);
  }

  async handleHeartbeat(): Promise<string | null> {
    const integration = getHeartbeatIntegration();
    const response = await integration.processHeartbeat(this.config.workspaceDir);

    if (!response.shouldRespond) {
      return null; // HEARTBEAT_OK
    }

    return response.message || null;
  }

  async recordFeedback(
    suggestionType: string,
    reaction: "positive" | "negative" | "ignored",
  ): Promise<void> {
    const feedback = await getLearningFeedback(this.config.workspaceDir);
    await feedback.recordFeedback(suggestionType, "", reaction);
  }

  async manualCheck(): Promise<{
    suggestions: string[];
    insights: string[];
    scheduledActions: number;
  }> {
    const monitor = getProactiveMonitor();
    const result = await monitor.manualTrigger();

    const suggestions = await this.getSuggestions();
    const analyzer = getContextAnalyzer();
    const snapshot = await analyzer.captureContext(this.config.workspaceDir);
    const contextInsights = analyzer.analyzeContext(snapshot);

    return {
      suggestions,
      insights: contextInsights.map((i) => i.message),
      scheduledActions: result.actionsScheduled,
    };
  }

  updateConfig(updates: Partial<ProactiveEngineConfig>): void {
    this.config = { ...this.config, ...updates };

    // Update subsystems
    if (updates.quietHoursStart !== undefined || updates.quietHoursEnd !== undefined) {
      const notificationMgr = getNotificationManager();
      notificationMgr.updatePreferences({
        quietHours: {
          start: this.config.quietHoursStart,
          end: this.config.quietHoursEnd,
        },
      });
    }

    if (updates.checkIntervalMinutes !== undefined) {
      const monitor = getProactiveMonitor();
      monitor.updateConfig({
        checkIntervalMinutes: updates.checkIntervalMinutes,
      });
    }
  }

  getConfig(): ProactiveEngineConfig {
    return { ...this.config };
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Global engine instance
let globalEngine: ProactiveEngine | null = null;

export function getProactiveEngine(
  config?: Partial<ProactiveEngineConfig>,
): ProactiveEngine {
  if (!globalEngine) {
    globalEngine = new ProactiveEngine(config);
  }
  return globalEngine;
}

// Quick-start helper
export async function initializeProactive(
  config?: Partial<ProactiveEngineConfig>,
): Promise<ProactiveEngine> {
  const engine = getProactiveEngine(config);
  await engine.initialize();
  return engine;
}
