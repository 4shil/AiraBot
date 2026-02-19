/**
 * Kerala Weather Integration
 * District-wise weather, monsoon alerts, flood warnings
 */

export interface WeatherData {
  district: string;
  temperature: number; // Celsius
  humidity: number; // Percentage
  condition: "sunny" | "cloudy" | "rainy" | "stormy" | "foggy";
  rainfall: number; // mm
  windSpeed: number; // km/h
  uvIndex: number;
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  type: "monsoon" | "flood" | "cyclone" | "heatwave" | "fog";
  severity: "low" | "medium" | "high" | "extreme";
  message: string;
  validUntil: Date;
}

export interface WeatherForecast {
  date: Date;
  minTemp: number;
  maxTemp: number;
  condition: WeatherData["condition"];
  rainChance: number; // Percentage
}

export const KERALA_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
] as const;

export type KeralaDistrict = (typeof KERALA_DISTRICTS)[number];

export interface WeatherService {
  getCurrentWeather(district: KeralaDistrict): Promise<WeatherData>;
  getForecast(district: KeralaDistrict, days: number): Promise<WeatherForecast[]>;
  getMonsoonStatus(): Promise<{
    active: boolean;
    intensity: "low" | "moderate" | "heavy";
    affectedDistricts: KeralaDistrict[];
  }>;
  getAlerts(): Promise<WeatherAlert[]>;
}

class WeatherServiceImpl implements WeatherService {
  private apiEndpoint = "https://api.openweathermap.org/data/2.5"; // Can be replaced
  private apiKey = process.env.OPENWEATHER_API_KEY || "";

  async getCurrentWeather(district: KeralaDistrict): Promise<WeatherData> {
    // Simulated data - replace with actual API call
    // In production: fetch from OpenWeatherMap or IMD API
    return {
      district,
      temperature: this.getSimulatedTemp(district),
      humidity: 75,
      condition: this.getSimulatedCondition(),
      rainfall: 10,
      windSpeed: 15,
      uvIndex: 6,
      alerts: await this.getDistrictAlerts(district),
    };
  }

  async getForecast(
    district: KeralaDistrict,
    days: number
  ): Promise<WeatherForecast[]> {
    const forecasts: WeatherForecast[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);

      forecasts.push({
        date,
        minTemp: 24,
        maxTemp: 32,
        condition: this.getSimulatedCondition(),
        rainChance: 40,
      });
    }

    return forecasts;
  }

  async getMonsoonStatus() {
    // Simulated monsoon status
    const now = new Date();
    const month = now.getMonth();

    // Monsoon months in Kerala: June-September (5-8)
    const isMonsoonSeason = month >= 5 && month <= 8;

    return {
      active: isMonsoonSeason,
      intensity: isMonsoonSeason ? ("heavy" as const) : ("low" as const),
      affectedDistricts: isMonsoonSeason
        ? (["Idukki", "Wayanad", "Kozhikode", "Kannur"] as KeralaDistrict[])
        : [],
    };
  }

  async getAlerts(): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];
    const monsoon = await this.getMonsoonStatus();

    if (monsoon.active && monsoon.intensity === "heavy") {
      alerts.push({
        type: "monsoon",
        severity: "high",
        message: "Heavy monsoon rains expected. Avoid travel to hilly areas.",
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    return alerts;
  }

  private async getDistrictAlerts(
    district: KeralaDistrict
  ): Promise<WeatherAlert[]> {
    const allAlerts = await this.getAlerts();
    const monsoon = await this.getMonsoonStatus();

    // Add district-specific alerts
    if (
      monsoon.affectedDistricts.includes(district) &&
      (district === "Idukki" || district === "Wayanad")
    ) {
      allAlerts.push({
        type: "flood",
        severity: "medium",
        message: `${district} district - risk of landslides in hilly areas`,
        validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });
    }

    return allAlerts;
  }

  private getSimulatedTemp(district: KeralaDistrict): number {
    // Idukki is cooler (hill station)
    if (district === "Idukki" || district === "Wayanad") {
      return 22 + Math.random() * 6; // 22-28°C
    }
    // Coastal districts are warmer
    return 28 + Math.random() * 6; // 28-34°C
  }

  private getSimulatedCondition(): WeatherData["condition"] {
    const conditions: WeatherData["condition"][] = [
      "sunny",
      "cloudy",
      "rainy",
      "cloudy",
      "sunny",
    ];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }
}

let instance: WeatherService | null = null;

export function getWeatherService(): WeatherService {
  if (!instance) {
    instance = new WeatherServiceImpl();
  }
  return instance;
}

// Manglish weather formatting
export function formatWeatherManglish(weather: WeatherData): string {
  const { district, temperature, condition, rainfall, alerts } = weather;

  let message = `${district} weather:\n`;
  message += `Temperature: ${temperature.toFixed(1)}°C\n`;
  message += `Condition: ${getConditionManglish(condition)}\n`;

  if (rainfall > 0) {
    message += `Rainfall: ${rainfall}mm - ${getRainfallComment(rainfall)}\n`;
  }

  if (alerts.length > 0) {
    message += `\n⚠️ Alerts:\n`;
    alerts.forEach((alert) => {
      message += `- ${alert.message}\n`;
    });
  }

  return message;
}

function getConditionManglish(
  condition: WeatherData["condition"]
): string {
  const translations = {
    sunny: "Veyil und - sunny",
    cloudy: "Megham und - cloudy",
    rainy: "Mazha peyyunnu - raining",
    stormy: "Storm und - dangerous",
    foggy: "Manju und - foggy",
  };
  return translations[condition];
}

function getRainfallComment(mm: number): string {
  if (mm < 10) return "Cheriya mazha";
  if (mm < 50) return "Moderate rain";
  if (mm < 100) return "Heavy rain - travel careful aayirikk";
  return "Very heavy rain - veetil irikk safe";
}

// Best travel day predictor
export async function getBestTravelDays(
  district: KeralaDistrict,
  nextDays: number = 7
): Promise<Date[]> {
  const service = getWeatherService();
  const forecast = await service.getForecast(district, nextDays);

  return forecast
    .filter((f) => f.rainChance < 30 && f.condition === "sunny")
    .map((f) => f.date);
}

// Simple query interface
export async function queryWeather(query: string): Promise<string> {
  const service = getWeatherService();

  // Parse district from query
  const district = KERALA_DISTRICTS.find((d) =>
    query.toLowerCase().includes(d.toLowerCase())
  );

  if (!district) {
    return "District specify chey - Idukki, Kochi, Thiruvananthapuram, etc";
  }

  // Check query type
  if (query.includes("mazha") || query.includes("rain")) {
    const weather = await service.getCurrentWeather(district);
    if (weather.condition === "rainy" || weather.rainfall > 0) {
      return `Athe, ${district} il mazha und. ${weather.rainfall}mm rainfall.`;
    }
    return `Illa, ${district} il mazha illa ippo.`;
  }

  // Default: current weather
  const weather = await service.getCurrentWeather(district);
  return formatWeatherManglish(weather);
}
