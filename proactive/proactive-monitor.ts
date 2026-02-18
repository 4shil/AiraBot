/**
 * Proactive Monitoring
 * Continuously monitors workspace and triggers suggestions
 */

import { getPatternDetector } from "./pattern-detector.js";
import { getActivityTracker } from "./activity-tracker.js";
import { getSuggestionEngine } from "./suggestion-engine.js";
import { getContextAnalyzer } from "./context-analyzer.js";
import { getPredictiveScheduler } from "./predictive-scheduler.js";
import { getNotificationManager } from "./notification-manager.js";
import { getLearningFeedback } from "./learning-feedback.js";

export interface MonitoringConfig {
  enabled: boolean;
  checkIntervalMinutes: number;
  workspaceDir?: string;
}

export interface MonitoringResult {
  timestamp: number;
  suggestionsGenerated: number;
  actionsScheduled: number;
  notificationsDelivered: number;
  insights: string[];
}

export class ProactiveMonitor {
  private config: MonitoringConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private lastCheck: number = 0;

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.intervalId) {
      console.warn("Monitor already running");
      return;
    }

    console.log(`Starting proactive monitoring (interval: ${this.config.checkIntervalMinutes}min)`);

    // Initial check
    await this.performCheck();

    // Set up interval
    this.intervalId = setInterval(
      () => this.performCheck(),
      this.config.checkIntervalMinutes * 60 * 1000,
    );
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Stopped proactive monitoring");
    }
  }

  async performCheck(): Promise<MonitoringResult> {
    const result: MonitoringResult = {
      timestamp: Date.now(),
      suggestionsGenerated: 0,
      actionsScheduled: 0,
      notificationsDelivered: 0,
      insights: [],
    };

    try {
      const now = new Date();
      const hour = now.getHours();

      // Get all managers
      const patternDetector = await getPatternDetector(this.config.workspaceDir);
      const activityTracker = await getActivityTracker(this.config.workspaceDir);
      const suggestionEngine = getSuggestionEngine();
      const contextAnalyzer = getContextAnalyzer();
      const scheduler = await getPredictiveScheduler(this.config.workspaceDir);
      const notificationMgr = getNotificationManager();
      const feedback = await getLearningFeedback(this.config.workspaceDir);

      // Detect patterns
      const patterns = patternDetector.detectCurrentPatterns();
      const currentActivity = activityTracker.getCurrentActivity();
      const needsBreak = activityTracker.needsBreak();

      // Capture context
      const contextSnapshot = await contextAnalyzer.captureContext(
        this.config.workspaceDir,
      );
      const contextInsights = contextAnalyzer.analyzeContext(contextSnapshot);

      // Generate suggestions
      const suggestions = suggestionEngine.generateSuggestions({
        patterns,
        currentActivity,
        needsBreak,
        timeOfDay: hour,
      });

      result.suggestionsGenerated = suggestions.length;

      // Check scheduled actions
      const dueActions = scheduler.getDueActions();
      result.actionsScheduled = dueActions.length;

      // Deliver notifications
      for (const suggestion of suggestions) {
        // Check if we should deliver based on feedback
        const shouldDeliver = feedback.shouldSuggest(
          suggestion.category,
          hour,
          now.getDay(),
        );

        if (!shouldDeliver) continue;

        // Check notification manager rules
        if (notificationMgr.shouldDeliver(suggestion.priority, hour)) {
          const message = notificationMgr.formatNotification(suggestion);
          notificationMgr.recordDelivery(message, suggestion.priority);
          result.notificationsDelivered++;
          result.insights.push(message);
        }
      }

      // Add context insights
      for (const insight of contextInsights.slice(0, 2)) {
        if (insight.actionable) {
          result.insights.push(insight.message);
        }
      }

      this.lastCheck = Date.now();
    } catch (error) {
      console.error("Error during proactive check:", error);
    }

    return result;
  }

  async manualTrigger(): Promise<MonitoringResult> {
    console.log("Manual proactive check triggered");
    return await this.performCheck();
  }

  getStatus(): {
    running: boolean;
    lastCheck: number;
    nextCheck: number;
  } {
    return {
      running: this.intervalId !== null,
      lastCheck: this.lastCheck,
      nextCheck: this.lastCheck + this.config.checkIntervalMinutes * 60 * 1000,
    };
  }

  updateConfig(updates: Partial<MonitoringConfig>): void {
    const wasRunning = this.intervalId !== null;
    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...updates };

    if (wasRunning && updates.enabled !== false) {
      this.start();
    }
  }
}

let globalMonitor: ProactiveMonitor | null = null;

export function getProactiveMonitor(
  config?: Partial<MonitoringConfig>,
): ProactiveMonitor {
  if (!globalMonitor) {
    const defaultConfig: MonitoringConfig = {
      enabled: true,
      checkIntervalMinutes: 30,
      ...config,
    };
    globalMonitor = new ProactiveMonitor(defaultConfig);
  }
  return globalMonitor;
}
