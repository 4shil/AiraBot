/**
 * Integration Layer - Main Interface for All Features
 * Brings together teens, tech, elder, universal modules
 */

import { getPersonalityModeSystem } from "./personality-modes.js";
import { getVoiceAssistant } from "../universal/voice-assistant.js";
import { getFestivalCalendar } from "../universal/festival-calendar.js";
import { getWeatherService } from "../universal/weather.js";
import { getFoodDeliveryService } from "../universal/food-delivery.js";

export interface AiraBotContext {
  userId: string;
  age?: number;
  preferences: {
    mode?: "teen" | "tech" | "elder" | "auto";
    location?: string;
    language: "manglish" | "english";
  };
  history: string[];
}

export interface AiraBotResponse {
  text: string;
  mode: "teen" | "tech" | "elder";
  emotion?: string;
  actions?: Array<{ type: string; payload: any }>;
}

export class AiraBot {
  private context: AiraBotContext;

  constructor(context: AiraBotContext) {
    this.context = context;
  }

  async query(input: string): Promise<AiraBotResponse> {
    // 1. Detect personality mode
    const modeSystem = getPersonalityModeSystem();
    const mode = modeSystem.detectMode(input, {
      age: this.context.age,
      history: this.context.history,
    });
    modeSystem.setMode(mode);

    // 2. Parse voice command
    const assistant = getVoiceAssistant();
    const command = await assistant.parse(input);

    // 3. Route to appropriate feature module
    let response: string;
    let actions: Array<{ type: string; payload: any }> = [];

    switch (command.intent) {
      case "weather.check_rain":
      case "weather.current": {
        const weather = getWeatherService();
        const data = await weather.getCurrentWeather(
          command.entities.location || "Kochi"
        );
        response = `Weather in ${data.district}: ${data.temperature}°C, ${data.condition}`;
        break;
      }

      case "festival.date":
      case "festival.upcoming": {
        const calendar = getFestivalCalendar();
        const upcoming = calendar.getUpcoming(30);
        response = upcoming.length > 0
          ? `Upcoming: ${upcoming[0].name} in ${calendar.getCountdown(upcoming[0].name)} days`
          : "No festivals in next 30 days";
        break;
      }

      case "food.order":
      case "food.recommend": {
        const food = getFoodDeliveryService();
        const restaurants = await food.searchRestaurants(
          command.entities.item || "biriyani",
          command.entities.location || "Kochi"
        );
        response = restaurants.length > 0
          ? `Best option: ${restaurants[0].name} (${restaurants[0].rating}⭐)`
          : "No restaurants found";
        break;
      }

      default: {
        // Execute generic command
        const execResult = await assistant.execute(command);
        response = execResult.text;
        actions = execResult.actions || [];
      }
    }

    // 4. Apply personality mode styling
    response = modeSystem.applyMode(mode, response);

    // 5. Track history
    this.context.history.push(input);
    if (this.context.history.length > 50) {
      this.context.history = this.context.history.slice(-50);
    }

    return {
      text: response,
      mode,
      emotion: modeSystem.getRecommendedEmotion(mode),
      actions,
    };
  }

  // Quick access methods
  async checkWeather(location?: string): Promise<string> {
    return (await this.query(`Weather in ${location || "current location"}`)).text;
  }

  async orderFood(item: string): Promise<string> {
    return (await this.query(`Order ${item}`)).text;
  }

  async getFestivalInfo(): Promise<string> {
    return (await this.query("Upcoming festivals")).text;
  }

  async getNews(category?: string): Promise<string> {
    return (await this.query(`News ${category || ""}`)).text;
  }
}

// Factory function
export function createAiraBot(userId: string, age?: number): AiraBot {
  return new AiraBot({
    userId,
    age,
    preferences: { language: "manglish" },
    history: [],
  });
}

// Export all module entry points
export * from "./personality-modes.js";
export * from "../universal/festival-calendar.js";
export * from "../universal/weather.js";
export * from "../universal/food-delivery.js";
export * from "../universal/travel-tourism.js";
export * from "../universal/news-media.js";
export * from "../universal/voice-assistant.js";
export * from "../teens/index.js";
export * from "../tech/index.js";
export * from "../elder/index.js";
