/**
 * Kerala/India Specific Features
 * Malayalam support, IST scheduling, festival calendar, local services
 */

export interface KeralaFestival {
  name: string;
  nameML: string;
  date: Date;
  type: "religious" | "harvest" | "national" | "state";
  description: string;
}

export interface ISTTime {
  hour: number;
  minute: number;
  dateIST: Date;
  formatted: string;
}

// Malayalam to English transliteration map (common words)
const MANGLISH_MAP: Record<string, string> = {
  // Common phrases
  "entha": "what",
  "enthu": "what",
  "engane": "how",
  "evide": "where",
  "eppo": "when",
  "eppol": "when",
  "aaru": "who",
  "enthina": "why",
  
  // Actions
  "cheyyada": "do it",
  "kanikku": "show",
  "thaada": "give",
  "vaa": "come",
  "po": "go",
  "nilkku": "stop",
  
  // Responses
  "seri": "okay",
  "pinne": "then",
  "machane": "dude",
  "da": "dude",
  "ayy": "hey",
  "poli": "awesome",
  "adipoli": "super awesome",
  "pwoli": "cool",
  
  // Tech terms (Malayalam + English)
  "commit": "commit",
  "push": "push",
  "pull": "pull",
  "code": "code",
  "build": "build",
  "run": "run",
  "test": "test",
};

export class KeralaUtils {
  // Convert UTC to IST
  static getISTTime(utcDate?: Date): ISTTime {
    const date = utcDate || new Date();
    // IST is UTC +5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);

    return {
      hour: istDate.getUTCHours(),
      minute: istDate.getUTCMinutes(),
      dateIST: istDate,
      formatted: istDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };
  }

  // Schedule at IST time
  static scheduleIST(hour: number, minute: number): Date {
    const now = new Date();
    const istTime = this.getISTTime(now);

    const target = new Date(istTime.dateIST);
    target.setHours(hour, minute, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (target.getTime() <= istTime.dateIST.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    // Convert back to UTC
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(target.getTime() - istOffset);
  }

  // Get Kerala festivals for current year
  static getKeralaFestivals(year?: number): KeralaFestival[] {
    const y = year || new Date().getFullYear();

    return [
      {
        name: "Onam",
        nameML: "ഓണം",
        date: new Date(y, 8, 15), // Approximate - August/September
        type: "harvest",
        description: "Harvest festival celebrating King Mahabali's return",
      },
      {
        name: "Vishu",
        nameML: "വിഷു",
        date: new Date(y, 3, 14), // April 14
        type: "harvest",
        description: "Malayalam New Year",
      },
      {
        name: "Thiruvathira",
        nameML: "തിരുവാതിര",
        date: new Date(y, 11, 25), // December/January
        type: "religious",
        description: "Women's festival for Lord Shiva",
      },
      {
        name: "Kerala Piravi",
        nameML: "കേരള പിറവി",
        date: new Date(y, 10, 1), // November 1
        type: "state",
        description: "Kerala Formation Day",
      },
      {
        name: "Makaravilakku",
        nameML: "മകരവിളക്ക്",
        date: new Date(y, 0, 14), // January 14
        type: "religious",
        description: "Festival at Sabarimala",
      },
    ];
  }

  // Get upcoming festivals
  static getUpcomingFestivals(days: number = 30): KeralaFestival[] {
    const festivals = this.getKeralaFestivals();
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return festivals.filter(
      f => f.date.getTime() >= now.getTime() && f.date.getTime() <= cutoff.getTime(),
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Translate Manglish command to English
  static translateManglish(text: string): string {
    let translated = text.toLowerCase();

    for (const [ml, en] of Object.entries(MANGLISH_MAP)) {
      const regex = new RegExp(`\\b${ml}\\b`, "gi");
      translated = translated.replace(regex, en);
    }

    return translated;
  }

  // Detect if text is Manglish
  static isManglish(text: string): boolean {
    const lower = text.toLowerCase();
    const manglishWords = Object.keys(MANGLISH_MAP);

    let matches = 0;
    for (const word of manglishWords) {
      if (new RegExp(`\\b${word}\\b`, "i").test(lower)) {
        matches++;
      }
    }

    // If 2+ Manglish words detected, consider it Manglish
    return matches >= 2;
  }

  // Format time in IST with Malayalam-friendly format
  static formatTimeIST(date: Date, style: "12h" | "24h" = "12h"): string {
    const ist = this.getISTTime(date);

    if (style === "24h") {
      return `${ist.hour.toString().padStart(2, "0")}:${ist.minute.toString().padStart(2, "0")} IST`;
    }

    let hour = ist.hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    return `${hour}:${ist.minute.toString().padStart(2, "0")} ${ampm} IST`;
  }

  // Get Malayalam month names
  static getMalayalamMonth(monthIndex: number): string {
    const months = [
      "ജനുവരി", // January
      "ഫെബ്രുവരി", // February
      "മാർച്ച്", // March
      "ഏപ്രിൽ", // April
      "മെയ്", // May
      "ജൂൺ", // June
      "ജൂലൈ", // July
      "ഓഗസ്റ്റ്", // August
      "സെപ്റ്റംബർ", // September
      "ഒക്ടോബർ", // October
      "നവംബർ", // November
      "ഡിസംബർ", // December
    ];

    return months[monthIndex] || months[0];
  }

  // Check if today is a Kerala holiday
  static isKeralaHoliday(date?: Date): { isHoliday: boolean; festival?: KeralaFestival } {
    const checkDate = date || new Date();
    const festivals = this.getKeralaFestivals(checkDate.getFullYear());

    for (const festival of festivals) {
      if (
        festival.date.getDate() === checkDate.getDate() &&
        festival.date.getMonth() === checkDate.getMonth()
      ) {
        return { isHoliday: true, festival };
      }
    }

    return { isHoliday: false };
  }

  // Generate reminder text in Manglish style
  static generateManglishReminder(task: string): string {
    const greetings = ["Machane", "Da", "Yo"];
    const actions = ["cheyyada", "cheyyanam", "cheythooda"];
    const endings = ["seri?", "okay?", "pinneallee"];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const ending = endings[Math.floor(Math.random() * endings.length)];

    return `${greeting}, ${task} ${action}, ${ending}`;
  }

  // Get IST-aware cron expression
  static getCronForIST(hour: number, minute: number): string {
    // Convert IST time to UTC for cron
    const istDate = new Date();
    istDate.setHours(hour, minute, 0, 0);

    const istOffset = 5.5 * 60 * 60 * 1000;
    const utcDate = new Date(istDate.getTime() - istOffset);

    return `${utcDate.getUTCMinutes()} ${utcDate.getUTCHours()} * * *`;
  }
}

// Quick access helpers
export const ist = {
  now: () => KeralaUtils.getISTTime(),
  format: (date: Date) => KeralaUtils.formatTimeIST(date),
  schedule: (hour: number, minute: number) => KeralaUtils.scheduleIST(hour, minute),
};

export const festivals = {
  upcoming: (days = 30) => KeralaUtils.getUpcomingFestivals(days),
  isHoliday: (date?: Date) => KeralaUtils.isKeralaHoliday(date),
  all: (year?: number) => KeralaUtils.getKeralaFestivals(year),
};

export const manglish = {
  translate: (text: string) => KeralaUtils.translateManglish(text),
  detect: (text: string) => KeralaUtils.isManglish(text),
  remind: (task: string) => KeralaUtils.generateManglishReminder(task),
};
