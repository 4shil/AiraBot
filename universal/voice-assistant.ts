/**
 * Voice Assistant - Manglish NLP & Command Parser
 * Handles natural language queries in Malayalam-English (Manglish)
 */

export interface VoiceCommand {
  intent: string;
  entities: Record<string, string>;
  confidence: number;
  originalQuery: string;
}

export interface VoiceResponse {
  text: string;
  audio?: string; // TTS audio URL if available
  actions?: Array<{ type: string; payload: any }>;
}

export interface VoiceAssistant {
  parse(query: string): Promise<VoiceCommand>;
  execute(command: VoiceCommand): Promise<VoiceResponse>;
  registerIntent(pattern: RegExp, handler: (entities: Record<string, string>) => Promise<VoiceResponse>): void;
}

// Intent patterns for Manglish queries
const INTENT_PATTERNS = [
  // Weather queries
  {
    pattern: /(.*)(mazha|rain)(.*)(undo|und|indavo)/i,
    intent: "weather.check_rain",
    extract: (match: RegExpMatchArray) => ({
      location: extractLocation(match[0]),
    }),
  },
  {
    pattern: /(.*)(weather|veyil|temperature)(.*)/i,
    intent: "weather.current",
    extract: (match: RegExpMatchArray) => ({
      location: extractLocation(match[0]),
    }),
  },

  // Festival queries
  {
    pattern: /(onam|vishu|pooram|christmas)(.*)(engane|when|date)/i,
    intent: "festival.date",
    extract: (match: RegExpMatchArray) => ({
      festival: match[1],
    }),
  },
  {
    pattern: /(.*)(festival|celebration)(.*)(upcoming|next)/i,
    intent: "festival.upcoming",
    extract: () => ({}),
  },

  // Food delivery
  {
    pattern: /(order|vangiko|medikk)(.*)(food|biriyani|burger|pizza)/i,
    intent: "food.order",
    extract: (match: RegExpMatchArray) => ({
      item: match[3] || "food",
    }),
  },
  {
    pattern: /(.*)(restaurant|hotel|eat)(.*)(evide|where|recommend)/i,
    intent: "food.recommend",
    extract: (match: RegExpMatchArray) => ({
      location: extractLocation(match[0]),
      cuisine: extractCuisine(match[0]),
    }),
  },

  // Entertainment
  {
    pattern: /(.*)(movie|cinema|film)(.*)(recommend|suggest|entha|good)/i,
    intent: "entertainment.movie_recommend",
    extract: () => ({}),
  },
  {
    pattern: /(.*)(song|music|paatt)(.*)(play|kalikk)/i,
    intent: "entertainment.play_music",
    extract: (match: RegExpMatchArray) => ({
      query: match[0],
    }),
  },

  // Git/Dev commands
  {
    pattern: /(git|github)(.*)(status|commit|push)/i,
    intent: "dev.git",
    extract: (match: RegExpMatchArray) => ({
      action: match[3] || "status",
    }),
  },

  // Health reminders
  {
    pattern: /(medicine|medicine|marunnath)(.*)(remind|kanikk)/i,
    intent: "health.medicine_reminder",
    extract: () => ({}),
  },

  // WhatsApp
  {
    pattern: /(whatsapp)(.*)(message|send|ayakk)/i,
    intent: "whatsapp.send",
    extract: (match: RegExpMatchArray) => ({
      recipient: extractName(match[0]),
      message: match[0],
    }),
  },
  {
    pattern: /(group)(.*)(summary|entha nadanne)/i,
    intent: "whatsapp.group_summary",
    extract: () => ({}),
  },

  // General queries
  {
    pattern: /(entha|what|enthu)(.*)(time|samayam)/i,
    intent: "general.time",
    extract: () => ({}),
  },
  {
    pattern: /(help|sahayam|enthu cheyyan|commands)/i,
    intent: "general.help",
    extract: () => ({}),
  },
];

// Entity extractors
function extractLocation(query: string): string {
  const locations = [
    "Thiruvananthapuram",
    "TVM",
    "Kochi",
    "Cochin",
    "Ernakulam",
    "Kozhikode",
    "Calicut",
    "Idukki",
    "Wayanad",
    "Thrissur",
    "Palakkad",
    "Kottayam",
    "Alappuzha",
    "Kollam",
    "Pathanamthitta",
    "Malappuram",
    "Kannur",
    "Kasaragod",
  ];

  for (const loc of locations) {
    if (query.toLowerCase().includes(loc.toLowerCase())) {
      return loc;
    }
  }

  return "current"; // Default to user's current location
}

function extractCuisine(query: string): string {
  const cuisines = ["biriyani", "kerala", "north indian", "chinese", "burger", "pizza"];
  for (const cuisine of cuisines) {
    if (query.toLowerCase().includes(cuisine)) {
      return cuisine;
    }
  }
  return "any";
}

function extractName(query: string): string {
  // Simple name extraction - can be improved with NER
  const words = query.split(" ");
  const nameIndicators = ["to", "ayakk", "send"];

  for (let i = 0; i < words.length; i++) {
    if (nameIndicators.includes(words[i].toLowerCase()) && words[i + 1]) {
      return words[i + 1];
    }
  }

  return "";
}

class VoiceAssistantImpl implements VoiceAssistant {
  private customHandlers: Map<
    string,
    (entities: Record<string, string>) => Promise<VoiceResponse>
  > = new Map();

  async parse(query: string): Promise<VoiceCommand> {
    query = query.trim();

    // Try matching against registered patterns
    for (const { pattern, intent, extract } of INTENT_PATTERNS) {
      const match = query.match(pattern);
      if (match) {
        return {
          intent,
          entities: extract(match),
          confidence: 0.8,
          originalQuery: query,
        };
      }
    }

    // Fallback: general query
    return {
      intent: "general.unknown",
      entities: { query },
      confidence: 0.3,
      originalQuery: query,
    };
  }

  async execute(command: VoiceCommand): Promise<VoiceResponse> {
    // Check custom handlers first
    const handler = this.customHandlers.get(command.intent);
    if (handler) {
      return handler(command.entities);
    }

    // Built-in handlers
    switch (command.intent) {
      case "general.time":
        return {
          text: `Ippo samayam ${new Date().toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
          })} IST`,
        };

      case "general.help":
        return {
          text: `Niya here! Commands:
- "Idukki il mazha undo?" - weather check
- "Onam engane?" - festival dates
- "Order biriyani" - food delivery
- "Git status" - dev commands
- "Movie recommend chey" - entertainment
- "Medicine reminder" - health tracking

Enthelum choikk!`,
        };

      case "general.unknown":
        return {
          text: `Hmm, ente adi clear ayilla. Try:
- Weather queries
- Festival info
- Food orders
- Dev commands
Type "help" for full list.`,
        };

      default:
        return {
          text: `Intent "${command.intent}" ready avunnilla. Coming soon!`,
        };
    }
  }

  registerIntent(
    pattern: RegExp,
    handler: (entities: Record<string, string>) => Promise<VoiceResponse>
  ): void {
    // Register custom intent handler
    const intentName = `custom.${pattern.source}`;
    this.customHandlers.set(intentName, handler);

    // Add pattern to intent list
    INTENT_PATTERNS.push({
      pattern,
      intent: intentName,
      extract: (match) => ({ match: match[0] }),
    });
  }
}

let instance: VoiceAssistant | null = null;

export function getVoiceAssistant(): VoiceAssistant {
  if (!instance) {
    instance = new VoiceAssistantImpl();
  }
  return instance;
}

// Quick query interface
export async function ask(query: string): Promise<string> {
  const assistant = getVoiceAssistant();
  const command = await assistant.parse(query);
  const response = await assistant.execute(command);
  return response.text;
}

// Manglish confirmation helpers
export function confirmManglish(action: string): string {
  const confirmations = [
    `Seri, ${action} cheyyatte?`,
    `${action} confirm aano?`,
    `${action} okay aano machane?`,
  ];
  return confirmations[Math.floor(Math.random() * confirmations.length)];
}

export function successManglish(action: string): string {
  const success = [
    `${action} ayt poyi!`,
    `Done! ${action} kazhinja.`,
    `Seri, ${action} successful.`,
  ];
  return success[Math.floor(Math.random() * success.length)];
}

export function errorManglish(action: string, error?: string): string {
  return `Ayyo, ${action} fail ayi. ${error || "Try again?"}`;
}
