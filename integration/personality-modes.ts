/**
 * Personality Mode System
 * Auto-detect and switch between Teen, Tech, Elder modes based on context
 */

import type { EmotionType, PersonalityConfig } from "../personality/emotion-types.js";

export type PersonalityMode = "teen" | "tech" | "elder" | "auto";

export interface ModeConfig {
  vocabulary: string[]; // Characteristic words for this mode
  topics: string[]; // Topics that trigger this mode
  responseStyle: {
    slang: boolean;
    emoji: boolean;
    technical: boolean;
    detailed: boolean;
    respectful: boolean;
  };
  preferredEmotions: EmotionType[];
}

// Teen Mode Configuration
export const TEEN_MODE: ModeConfig = {
  vocabulary: [
    "pwoli",
    "adipoli",
    "lit",
    "fire",
    "dude",
    "bro",
    "machane",
    "da",
    "yo",
    "lol",
    "bruh",
    "cracked",
    "cap",
    "fr",
  ],
  topics: [
    "gaming",
    "bgmi",
    "cod",
    "pubg",
    "fortnite",
    "instagram",
    "reels",
    "tiktok",
    "snapchat",
    "discord",
    "anime",
    "music",
    "spotify",
    "meme",
    "fashion",
    "sneaker",
    "concert",
    "movie",
    "netflix",
    "homework",
    "exam",
    "college",
  ],
  responseStyle: {
    slang: true,
    emoji: true,
    technical: false,
    detailed: false,
    respectful: false,
  },
  preferredEmotions: ["excited", "playful", "sarcasticMallu", "amused"],
};

// Tech Mode Configuration
export const TECH_MODE: ModeConfig = {
  vocabulary: [
    "git",
    "commit",
    "push",
    "pull",
    "api",
    "docker",
    "kubernetes",
    "deploy",
    "ssh",
    "terminal",
    "code",
    "debug",
    "error",
    "fix",
    "optimize",
    "refactor",
    "algorithm",
    "database",
    "server",
  ],
  topics: [
    "programming",
    "development",
    "coding",
    "github",
    "vscode",
    "automation",
    "devops",
    "linux",
    "python",
    "javascript",
    "typescript",
    "react",
    "node",
    "docker",
    "kubernetes",
    "aws",
    "cloud",
    "ml",
    "ai",
    "security",
    "crypto",
    "blockchain",
  ],
  responseStyle: {
    slang: false,
    emoji: false,
    technical: true,
    detailed: true,
    respectful: false,
  },
  preferredEmotions: ["focused", "curious", "determined", "proud"],
};

// Elder Mode Configuration
export const ELDER_MODE: ModeConfig = {
  vocabulary: [
    "ettan",
    "chechi",
    "saar",
    "madam",
    "please",
    "thank you",
    "help",
    "medicine",
    "doctor",
    "bill",
    "payment",
    "family",
    "prayer",
    "temple",
    "church",
    "health",
  ],
  topics: [
    "health",
    "medicine",
    "doctor",
    "appointment",
    "bill",
    "kseb",
    "payment",
    "pension",
    "ration",
    "family",
    "birthday",
    "prayer",
    "temple",
    "church",
    "mosque",
    "recipe",
    "cooking",
    "tv",
    "serial",
    "news",
    "whatsapp",
    "video call",
  ],
  responseStyle: {
    slang: false,
    emoji: false,
    technical: false,
    detailed: false,
    respectful: true,
  },
  preferredEmotions: ["empathetic", "neutral", "concerned", "proud-cultural"],
};

export interface PersonalityModeSystem {
  detectMode(query: string, context?: { age?: number; history?: string[] }): PersonalityMode;
  applyMode(mode: PersonalityMode, response: string): string;
  getCurrentMode(): PersonalityMode;
  setMode(mode: PersonalityMode): void;
}

class PersonalityModeSystemImpl implements PersonalityModeSystem {
  private currentMode: PersonalityMode = "auto";
  private modeHistory: Array<{ mode: PersonalityMode; timestamp: Date }> = [];

  detectMode(
    query: string,
    context?: { age?: number; history?: string[] }
  ): PersonalityMode {
    // Manual override
    if (this.currentMode !== "auto") {
      return this.currentMode;
    }

    // Age-based detection
    if (context?.age) {
      if (context.age >= 13 && context.age <= 19) return "teen";
      if (context.age >= 40) return "elder";
      if (context.age >= 20 && context.age <= 39) return "tech";
    }

    // Query analysis
    const lowerQuery = query.toLowerCase();
    let teenScore = 0;
    let techScore = 0;
    let elderScore = 0;

    // Check vocabulary matches
    TEEN_MODE.vocabulary.forEach((word) => {
      if (lowerQuery.includes(word)) teenScore += 2;
    });
    TECH_MODE.vocabulary.forEach((word) => {
      if (lowerQuery.includes(word)) techScore += 2;
    });
    ELDER_MODE.vocabulary.forEach((word) => {
      if (lowerQuery.includes(word)) elderScore += 2;
    });

    // Check topic matches
    TEEN_MODE.topics.forEach((topic) => {
      if (lowerQuery.includes(topic)) teenScore += 1;
    });
    TECH_MODE.topics.forEach((topic) => {
      if (lowerQuery.includes(topic)) techScore += 1;
    });
    ELDER_MODE.topics.forEach((topic) => {
      if (lowerQuery.includes(topic)) elderScore += 1;
    });

    // History-based bias
    if (context?.history) {
      const recentModes = this.modeHistory.slice(-5);
      const techCount = recentModes.filter((m) => m.mode === "tech").length;
      const teenCount = recentModes.filter((m) => m.mode === "teen").length;
      const elderCount = recentModes.filter((m) => m.mode === "elder").length;

      techScore += techCount * 0.5;
      teenScore += teenCount * 0.5;
      elderScore += elderCount * 0.5;
    }

    // Determine winner
    const max = Math.max(teenScore, techScore, elderScore);
    if (max === 0) return "tech"; // Default to tech if no clear match

    if (teenScore === max) return "teen";
    if (techScore === max) return "tech";
    return "elder";
  }

  applyMode(mode: PersonalityMode, response: string): string {
    const config = this.getModeConfig(mode);
    if (!config) return response;

    let modified = response;

    // Apply slang
    if (config.responseStyle.slang) {
      modified = modified.replace(/okay/gi, "seri");
      modified = modified.replace(/yes/gi, "athe");
      modified = modified.replace(/no/gi, "illa");
      modified = modified.replace(/good/gi, "poli");
    }

    // Add respectful tone for elder
    if (config.responseStyle.respectful) {
      // Add "please" where appropriate
      if (!modified.includes("please") && Math.random() > 0.7) {
        modified += " please.";
      }
    }

    // Add emoji for teen (but remember: Niya doesn't use emoji, so skip this)
    // if (config.responseStyle.emoji) {
    //   // Add relevant emoji
    // }

    return modified;
  }

  getCurrentMode(): PersonalityMode {
    return this.currentMode;
  }

  setMode(mode: PersonalityMode): void {
    this.currentMode = mode;
    this.modeHistory.push({ mode, timestamp: new Date() });

    // Keep only last 20 entries
    if (this.modeHistory.length > 20) {
      this.modeHistory = this.modeHistory.slice(-20);
    }
  }

  private getModeConfig(mode: PersonalityMode): ModeConfig | null {
    switch (mode) {
      case "teen":
        return TEEN_MODE;
      case "tech":
        return TECH_MODE;
      case "elder":
        return ELDER_MODE;
      default:
        return null;
    }
  }

  // Get recommended emotion for current mode
  getRecommendedEmotion(mode: PersonalityMode): EmotionType {
    const config = this.getModeConfig(mode);
    if (!config || config.preferredEmotions.length === 0) return "neutral";

    // Random emotion from preferred list
    return config.preferredEmotions[
      Math.floor(Math.random() * config.preferredEmotions.length)
    ];
  }
}

let instance: PersonalityModeSystem | null = null;

export function getPersonalityModeSystem(): PersonalityModeSystem {
  if (!instance) {
    instance = new PersonalityModeSystemImpl();
  }
  return instance;
}

// Helper: Get mode-appropriate greeting
export function getGreeting(mode: PersonalityMode): string {
  switch (mode) {
    case "teen":
      return "Yo! Entha machane?";
    case "tech":
      return "Hey! What's up?";
    case "elder":
      return "Hello! Entha vishesham?";
    default:
      return "Hey! Ketto?";
  }
}

// Helper: Get mode-appropriate error message
export function getErrorMessage(mode: PersonalityMode, context: string): string {
  switch (mode) {
    case "teen":
      return `Ayyo, ${context} fail ayi bro. Try again?`;
    case "tech":
      return `Error: ${context}. Check logs and retry.`;
    case "elder":
      return `Sorry, ${context} work avunnilla. Please try again.`;
    default:
      return `${context} issue und. Retry cheyy.`;
  }
}
