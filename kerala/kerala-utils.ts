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

// ─── Live festival calendar with Calendarific API ─────────────────────────────

import { promises as fsp } from 'fs';
import { join as pjoin } from 'path';
import { homedir as oHomedir } from 'os';

const CACHE_DIR = pjoin(oHomedir(), '.airabot');

async function readConfig(): Promise<Record<string, string>> {
  try {
    return JSON.parse(await fsp.readFile(pjoin(CACHE_DIR, 'config.json'), 'utf-8'));
  } catch { return {}; }
}

export async function fetchFestivals(year: number): Promise<KeralaFestival[]> {
  const cacheFile = pjoin(CACHE_DIR, `festivals-${year}.json`);

  // Check cache first
  try {
    const cached = JSON.parse(await fsp.readFile(cacheFile, 'utf-8')) as KeralaFestival[];
    if (Array.isArray(cached) && cached.length > 0) return cached;
  } catch { /* cache miss */ }

  const config = await readConfig();
  const apiKey = process.env.CALENDARIFIC_API_KEY ?? config['calendarificApiKey'];

  if (!apiKey) {
    // Fall back to hardcoded
    return KeralaUtils.getKeralaFestivals(year);
  }

  try {
    const url = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=IN&year=${year}&location=in-kl`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Calendarific API error: ${res.status}`);
    const json = await res.json() as { response?: { holidays?: Array<{ name: string; date: { iso: string }; description: string }> } };
    const holidays = json.response?.holidays ?? [];

    const festivals: KeralaFestival[] = holidays.map((h) => ({
      name: h.name,
      date: new Date(h.date.iso),
      description: h.description ?? '',
      isHoliday: true,
    }));

    // Merge with hardcoded and deduplicate by name+month
    const hardcoded = KeralaUtils.getKeralaFestivals(year);
    const names = new Set(festivals.map((f) => f.name.toLowerCase()));
    for (const hf of hardcoded) {
      if (!names.has(hf.name.toLowerCase())) festivals.push(hf);
    }

    // Cache results
    await fsp.mkdir(CACHE_DIR, { recursive: true });
    await fsp.writeFile(cacheFile, JSON.stringify(festivals, null, 2));
    return festivals;
  } catch {
    return KeralaUtils.getKeralaFestivals(year);
  }
}

export async function getUpcomingFestivals(days: number): Promise<KeralaFestival[]> {
  const now = new Date();
  const year = now.getFullYear();
  const all = await fetchFestivals(year);
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return all.filter((f) => f.date >= now && f.date <= cutoff).sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ─── IST-aware smart scheduling ───────────────────────────────────────────────

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

// @ts-ignore — dayjs plugin extend
dayjs.extend(customParseFormat);
// @ts-ignore
dayjs.extend(utc);
// @ts-ignore
dayjs.extend(timezone);

const IST_TZ = 'Asia/Kolkata';
const REMINDERS_PATH = pjoin(oHomedir(), '.airabot', 'reminders.json');

export interface ReminderEntry {
  id: string;
  message: string;
  timeIST: string;
  utcTime: string;
  scheduledAt: string;
}

function parseTimeIST(timeStr: string): dayjs.Dayjs | null {
  const now = dayjs().tz(IST_TZ);
  const str = timeStr.trim().toLowerCase();

  // "tomorrow 9am" or "tomorrow 09:00"
  if (str.startsWith('tomorrow')) {
    const rest = str.replace('tomorrow', '').trim();
    const base = now.add(1, 'day');
    return parseTimeOnDay(rest, base);
  }

  // "8pm", "20:00", "8:30pm"
  return parseTimeOnDay(str, now);
}

function parseTimeOnDay(timeStr: string, base: dayjs.Dayjs): dayjs.Dayjs | null {
  // Try 12h format: "8pm", "8:30pm"
  const match12 = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1]!, 10);
    const mins = parseInt(match12[2] ?? '0', 10);
    const ampm = match12[3]!.toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    return base.hour(hours).minute(mins).second(0);
  }

  // Try 24h format: "20:00"
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return base.hour(parseInt(match24[1]!, 10)).minute(parseInt(match24[2]!, 10)).second(0);
  }

  return null;
}

export async function scheduleReminder(message: string, timeIST: string): Promise<void> {
  const istTime = parseTimeIST(timeIST);
  if (!istTime) throw new Error(`Could not parse time: "${timeIST}"`);

  const utcTime = istTime.utc();
  const atFormat = utcTime.format('HH:mm YYYY-MM-DD'); // at(1) compatible

  const safeMsg = message.replace(/'/g, "\\'");
  const cmd = `echo "notify-send 'AiraBot Reminder' '${safeMsg}'" | at ${atFormat}`;

  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    await promisify(exec)(cmd);
  } catch (err) {
    // at may not be installed — log reminder anyway
  }

  // Persist to reminders.json
  await fsp.mkdir(CACHE_DIR, { recursive: true });
  let reminders: ReminderEntry[] = [];
  try { reminders = JSON.parse(await fsp.readFile(REMINDERS_PATH, 'utf-8')); } catch { /* ok */ }
  reminders.push({
    id: Math.random().toString(36).slice(2),
    message,
    timeIST: istTime.tz(IST_TZ).format('YYYY-MM-DD HH:mm'),
    utcTime: utcTime.format('YYYY-MM-DD HH:mm'),
    scheduledAt: new Date().toISOString(),
  });
  await fsp.writeFile(REMINDERS_PATH, JSON.stringify(reminders, null, 2));
}
