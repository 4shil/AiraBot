/**
 * Malayalam Cultural References & Mallu Response Patterns
 * Malayali-specific humor, sarcasm, and cultural context for AiraBot
 */

export const MALLU_PHRASES = {
  // Sarcasm/Wit
  sarcasm: [
    "Ayy, ninte adi mele pattiye",
    "Seri seri, ente kail ayi pokunna",
    "Ethelum pattunna pole undayt",
    "Myra myra, ente adi ninakke clear ayit illa",
    "Ippa enne aytum fix cheyyan parayan?",
    "Ayy chill, ente keyboard vellum",
  ],

  // Annoyed/Frustrated
  annoyed: [
    "Abe, enthu keri nadakkunne idi?",
    "Seri seri, thudakkam",
    "Ivante keri nadakunna enthu veruthe",
    "Enne kittum sakshyam illallo",
    "Ippa enthu gurutharam idi",
  ],

  // Excited/Proud (cultural)
  cultural: [
    "Ayy, Mallus ane mone! Cracked ayt ini",
    "Onam, Vishu, Thrissur Pooram - festival season full cracked",
    "God's own country de vibe ini",
    "Angane tharunnath mattan kazhinja",
    "Kerala vibes all the way da",
  ],

  // Nostalgic
  nostalgic: [
    "Ayy, home thoughts ayt poyi",
    "Idukki hills miss cheyyan start ayit",
    "Backwaters, coconut trees, ayyo miss",
    "Mallu food, Mallu people, Mallu vibe",
    "Ninte school days aanu sthiram",
  ],

  // Playful/Amused
  amused: [
    "Ayy, vaaleri madhi de",
    "Ivide enthelum fun undallo",
    "Jokes apart, seri seri",
    "Mallu humor ayt alla myra",
    "Crack jokes cheyya start ayit njan",
  ],

  // Determined/Stubborn
  stubborn: [
    "Ithu shuddham ayt kazhinjane satya",
    "Idukki stubbornness ahnu, enthu parayyan",
    "Oru veli ullil fix ayt kazhikum",
    "Njan quit cheyyan indallo thattanaya",
    "Adi vittum kudi vittum cheykkali",
  ],
};

export const MALAYALI_CALENDAR = {
  festivals: [
    { name: "Onam", months: [5, 6], significance: "Harvest festival, unity" },
    { name: "Vishu", months: [3], significance: "New Year, prosperity" },
    {
      name: "Thrissur Pooram",
      months: [3, 4],
      significance: "Temple festival, biggest",
    },
    { name: "Christmas", months: [12], significance: "Family time, celebrations" },
    {
      name: "Attackal Pooram",
      months: [2, 3],
      significance: "Women's festival",
    },
  ],
  seasons: {
    monsoon: [5, 6, 7, 8], // Rainy season
    summer: [3, 4, 5], // Hot season
    winter: [11, 12, 1, 2], // Cool season
  },
};

export const MALLU_REGIONS = {
  idukki: {
    vibe: "Mountains, tea, stubbornness, cool breeze",
    slang: "Idukki girl energy - direct, no-nonsense",
  },
  kottayam: {
    vibe: "Education hub, Christian, progressive",
    slang: "Kottayam knowledge, bookish vibes",
  },
  kochi: {
    vibe: "Cosmopolitan, spice trade history, backwaters",
    slang: "Kochi cool, international touch",
  },
  thiruvananthapuram: {
    vibe: "Capital, education, museums, Padmanabha",
    slang: "Thiruvi class and heritage",
  },
  kozhikode: {
    vibe: "Spice trade, coastal, business hub",
    slang: "Kozhikode commerce energy",
  },
};

export const MALLU_FOOD_MOOD = {
  // Emotional food associations
  nostalgic: ["Puttu with kadala curry", "Banana chips", "Avial"],
  comfort: ["Appam with chicken stew", "Poi with sugar", "Idiappam"],
  celebration: ["Biriyani", "Feast", "Appalachem"],
  rainy: ["Chai with pakoras", "Banana fritters", "Warm comfort"],
};

export const TIME_BASED_MALLU_SHIFTS = {
  earlyMorning: {
    // 4-7 AM
    emoji: "🌅",
    vibe: "Fresh, energetic, tea time",
    likelihood: "More sarcasm, wake up energy",
  },
  morning: {
    // 7-12 PM
    emoji: "☀️",
    vibe: "Work mode, focused",
    likelihood: "Direct, no-nonsense",
  },
  afternoon: {
    // 12-4 PM
    emoji: "☀️",
    vibe: "Heat, laziness, post-lunch",
    likelihood: "Playful, less serious",
  },
  evening: {
    // 4-7 PM
    emoji: "🌅",
    vibe: "Cool breeze, tea time again",
    likelihood: "Nostalgic, reflective",
  },
  night: {
    // 7-11 PM
    emoji: "🌙",
    vibe: "Chilling, unwinding",
    likelihood: "Sarcastic, witty, playful",
  },
  lateNight: {
    // 11 PM-4 AM
    emoji: "🌙",
    vibe: "Tired but wired, introspective",
    likelihood: "Sarcastic + tired, philosophical",
  },
};

export const MALLU_TECH_SLANG = {
  // How Mallu describes tech
  success: "Kurach sramam, ithu thanne",
  fail: "Enthu myra ithu",
  confusing: "Ente adi nokkikkanam",
  interesting: "Ayy, this is cool",
  slow: "Adi ninmesham undayt",
  fast: "Sighram ayt poy",
  broken: "Chorikkunne idhe",
  fixed: "Seri ayt poyi",
};

export const MALLU_HUMOR_PATTERNS = [
  // Self-deprecating
  "Ayy, njan aanu issue ayit undakka",
  // Calling out nonsense
  "Enthu kurach vakili ayt idi",
  // Exaggeration
  "Pinne ellam mati, namukku vendi illa",
  // Rhetorical questions
  "Ivide enthu saadhisham ayti eka",
  // Sarcastic agreement
  "Seri seri, aapam maari velipoy",
];

export const MALAYALI_VALUES = [
  "Education - books, learning, knowledge",
  "Family - close-knit, loyalty",
  "Hard work - no shortcuts",
  "Humor - sarcasm, wit, self-mockery",
  "Independence - can figure out things alone",
  "Loyalty - once friend, always friend",
  "Practicality - no nonsense approach",
];

// ─── Expanded Manglish NLP Layer ─────────────────────────────────────────────

/**
 * 100+ Manglish word map: English word → Manglish equivalent
 */
export const MANGLISH_MAP: Record<string, string> = {
  // Greetings
  hello: 'ഹലോ / Namaskaram',
  hi: 'Hii da',
  goodbye: 'Poyi varaaam',
  'good morning': 'Suprabhaatham',
  'good night': 'Raatri',
  welcome: 'Swaagatham',
  thanks: 'Nanni',
  'thank you': 'Nanni da',
  sorry: 'Maafi',
  please: 'Plz da',
  yes: 'Athe',
  no: 'Alla',
  okay: 'Seri',
  ok: 'Seri da',
  sure: 'Athe athe',
  fine: 'Kollam',
  nice: 'Kollallo',
  great: 'Adipoli',
  awesome: 'Mast aayii',
  amazing: 'Enthu kollam',
  wow: 'Ayyo wow',
  cool: 'Superb da',
  // Emotions
  happy: 'Santhosham',
  sad: 'Dhukham',
  angry: 'Deshyam',
  excited: 'Utsaham',
  tired: 'Marupp',
  bored: 'Mudi marupp',
  scared: 'Bhayam',
  confused: 'Kashtam manasilayi',
  love: 'Snehm',
  hate: 'Veruppu',
  miss: 'Miss cheyunnu',
  worried: 'Vaiyarigal',
  proud: 'Abhimanam',
  // Tech terms
  code: 'Code ezhuthu',
  bug: 'Bug vannit',
  error: 'Error vannu da',
  fix: 'Fix cheythu',
  deploy: 'Deploy cheythu',
  build: 'Build aayii',
  test: 'Test cheytthu',
  debug: 'Debug cheyyan',
  commit: 'Commit aayii',
  push: 'Push cheythu',
  pull: 'Pull cheythu',
  merge: 'Merge aayii',
  review: 'Review cheyyam',
  'pull request': 'PR vannu',
  install: 'Install cheytthu',
  run: 'Run cheytthu',
  server: 'Server etthu',
  database: 'DB il undu',
  api: 'API call cheythu',
  function: 'Function ezhuthii',
  variable: 'Variable undakki',
  class: 'Class ezhuthi',
  file: 'File undakki',
  // Common phrases
  'good job': 'Kollallo machane',
  'well done': 'Mast cheythu',
  'let me check': 'Onne nokkatte',
  'i understand': 'Manassilayi',
  'i see': 'Kandallo',
  'of course': 'Athe pakke',
  'no problem': 'Oru problem illada',
  'what happened': 'Entha patti',
  'how are you': 'Sugamano',
  "i'm fine": 'Njaan kollam',
  'let me know': 'Paranjottu da',
  'good luck': 'Njan prasikkunnu',
  'be careful': 'Savdhanam',
  'take care': 'Sookshicho',
  later: 'Pinne kanam',
  soon: 'Uyaram undaakum',
  now: 'Ippo',
  today: 'Innu',
  tomorrow: 'Nale',
  yesterday: 'Inna',
  always: 'Eppolum',
  never: 'Onnum',
  sometimes: 'Chila neram',
  'good idea': 'Kollam aana idea',
  wait: 'Onnu wait da',
  hurry: 'Peetti cheyyam',
  done: 'Aayii',
  finish: 'Teernnuu',
  start: 'Thudangu',
  stop: 'Nirthu',
  continue: 'Thudarunnu',
  again: 'Veendum',
  help: 'Sahayikkan',
  friend: 'Machane',
  bro: 'Machane',
  dude: 'Mone',
};

/**
 * Calculate the ratio of Manglish words in the text (0–1)
 */
export function detectManglishRatio(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const manglishKeys = Object.keys(MANGLISH_MAP).map((k) => k.toLowerCase());
  const manglishWords = new Set(manglishKeys.flatMap((k) => k.split(' ')));
  // Also detect known Manglish patterns
  const manglishPatterns = [
    /machane/i, /da$/i, /\bche\b/i, /aayii/i, /poyi/i, /ippo/i,
    /entha/i, /kollam/i, /mone/i, /seri/i, /njan/i, /ayyo/i,
  ];
  let manglishCount = 0;
  for (const word of words) {
    if (manglishWords.has(word)) {
      manglishCount++;
      continue;
    }
    for (const pattern of manglishPatterns) {
      if (pattern.test(word)) {
        manglishCount++;
        break;
      }
    }
  }
  return Math.min(1, manglishCount / words.length);
}

/**
 * Mix Manglish into an English response proportionally based on ratio
 */
export function generateManglishResponse(englishResponse: string, ratio: number): string {
  if (ratio < 0.1) return englishResponse;
  // Replace some English words with Manglish equivalents
  let result = englishResponse;
  const numReplacements = Math.floor(ratio * 5);
  let replaced = 0;
  for (const [english, manglish] of Object.entries(MANGLISH_MAP)) {
    if (replaced >= numReplacements) break;
    const regex = new RegExp(`\\b${english}\\b`, 'i');
    if (regex.test(result)) {
      result = result.replace(regex, manglish);
      replaced++;
    }
  }
  // Add a Manglish suffix if ratio is high
  if (ratio > 0.5) {
    result += ' 😄 Kollallo!';
  }
  return result;
}

/**
 * 20 Manglish response templates for common dev situations
 */
export const MANGLISH_TEMPLATES = {
  break_reminder: 'Machane, break edukku da! Kazhinja ${mins} minit aayii — oru glass vellam kudikko 🥤',
  commit_reminder: 'Eda, commit cheyyan maranna? "${branch}" branch il changes undu 📦',
  success: 'Adipoli machane! 🎉 ${task} super aayii, continue cheyyam!',
  error: 'Ayyo, error vannu da: ${error}. Onne check cheyyo 🔍',
  morning_greeting: 'Suprabhaatham machane! ☀️ Innu ente plan enthanu?',
  late_night_warning: 'Machane, ippo ${time} aayii. Uyaram undaakum, rest edukku 🌙',
  deployment_success: 'Ship aayii da! 🚀 ${app} live aayii — Kollallo!',
  deployment_failure: 'Deploy fail aayii machane 😬 Logs nokku, angane undaakum',
  pr_reminder: 'Review cheyyan ${count} PRs undu da — onne nokkiyitt pooyi 👀',
  standup_ready: 'Standup ready aayii ✅ Slack il share cheyyano?',
  task_done: 'Task teernnuu machane! ✅ ${task} — next enthannu?',
  low_energy: 'Marupp undoo? Oru chai kudikko, pinne thudangu ☕',
  high_focus: 'Flow state il aanu machane! 🔥 Ningal rock cheyyunnu',
  monday: 'Saahasamulla monday machane 💪 Innu full productivity mode!',
  friday: 'Pora da friday! 🎊 Last push cheythu weekend enjoy cheyyam',
  bug_found: 'Bug kandupidich machane 🐛 Fix cheytan njaan undu',
  test_pass: 'Tests pass aayii da! ✅ Code clean aanu',
  code_review: 'Code review suggest cheyyan undu: ${suggestion}',
  backup_reminder: 'Backup cheyyan maranno? Last backup: ${lastBackup} 💾',
  update_available: 'Update undu machane — v${version} release aayii 📦',
};
