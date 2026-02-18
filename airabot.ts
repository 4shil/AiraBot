/**
 * AiraBot - Complete Feature Exports
 * Import everything from here for easy access
 */

// Personality & Emotion Engine
export * from "./personality/index.js";

// Proactive Intelligence
export * from "./proactive/index.js";

// New Features
export * from "./clipboard/smart-clipboard.js";
export * from "./standup/standup-generator.js";
export * from "./knowledge/knowledge-base.js";
export * from "./estimator/task-estimator.js";
export * from "./kerala/kerala-utils.js";

// Integration
export * from "./features/integration.js";

// Quick-start helpers
import { getPersonalityEngine } from "./personality/index.js";
import { getProactiveEngine } from "./proactive/index.js";
import { getIntegratedFeatures } from "./features/integration.js";

export async function initializeAiraBot(config?: {
  workspaceDir?: string;
  personality?: boolean;
  proactive?: boolean;
  features?: boolean;
}) {
  const results = {
    personality: null as any,
    proactive: null as any,
    features: null as any,
  };

  if (config?.personality !== false) {
    const personality = getPersonalityEngine();
    await personality.initialize(config?.workspaceDir);
    results.personality = personality;
  }

  if (config?.proactive !== false) {
    const proactive = getProactiveEngine({
      workspaceDir: config?.workspaceDir,
    });
    await proactive.initialize();
    results.proactive = proactive;
  }

  if (config?.features !== false) {
    const features = getIntegratedFeatures({
      workspaceDir: config?.workspaceDir,
    });
    await features.initialize();
    results.features = features;
  }

  console.log("🤖 AiraBot fully initialized!");
  return results;
}
