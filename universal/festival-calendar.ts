/**
 * Kerala Festival Calendar
 * Tracks Onam, Vishu, Thrissur Pooram, Christmas, Eid, temple festivals
 */

export interface Festival {
  name: string;
  date: Date;
  type: "onam" | "vishu" | "pooram" | "christmas" | "eid" | "temple" | "other";
  description: string;
  district?: string;
  preparation?: {
    daysBeforeAlert: number;
    shoppingList?: string[];
    tasks?: string[];
  };
}

export interface FestivalCalendar {
  getUpcoming(days: number): Festival[];
  getByMonth(month: number): Festival[];
  getByType(type: Festival["type"]): Festival[];
  getCountdown(festivalName: string): number;
  getPreparationTasks(festivalName: string): string[];
}

class FestivalCalendarImpl implements FestivalCalendar {
  private festivals: Festival[] = [];

  constructor() {
    this.initializeFestivals();
  }

  private initializeFestivals() {
    const currentYear = new Date().getFullYear();

    // Onam (August-September, 10 days)
    this.festivals.push({
      name: "Onam",
      date: new Date(currentYear, 7, 28), // Thiruvonam - Aug 28
      type: "onam",
      description: "Kerala harvest festival - 10 days of celebration",
      preparation: {
        daysBeforeAlert: 15,
        shoppingList: [
          "Pookalam flowers",
          "Onasadya items",
          "New clothes (Onakkodi)",
          "Banana chips ingredients",
          "Payasam items",
        ],
        tasks: [
          "Clean house",
          "Buy new clothes",
          "Plan Onasadya menu",
          "Prepare pookalam design",
          "Invite relatives",
        ],
      },
    });

    // Vishu (April - Malayalam New Year)
    this.festivals.push({
      name: "Vishu",
      date: new Date(currentYear, 3, 14), // April 14
      type: "vishu",
      description: "Malayalam New Year - Vishukkani morning ritual",
      preparation: {
        daysBeforeAlert: 7,
        shoppingList: [
          "Konna flowers",
          "Vishu kaineetam (money)",
          "Rice, coconut, cucumber",
          "New clothes",
          "Uruli (bell metal vessel)",
        ],
        tasks: [
          "Arrange Vishukkani items",
          "Buy new clothes",
          "Prepare special feast",
          "Get coins for kaineetam",
        ],
      },
    });

    // Thrissur Pooram (April-May)
    this.festivals.push({
      name: "Thrissur Pooram",
      date: new Date(currentYear, 3, 20), // April 20 (varies)
      type: "pooram",
      description: "Biggest temple festival in Kerala - elephants, fireworks",
      district: "Thrissur",
      preparation: {
        daysBeforeAlert: 10,
        tasks: [
          "Book accommodation",
          "Plan travel to Thrissur",
          "Check pooram schedule",
          "Arrange tickets if needed",
        ],
      },
    });

    // Christmas (December 25)
    this.festivals.push({
      name: "Christmas",
      date: new Date(currentYear, 11, 25),
      type: "christmas",
      description: "Christian celebration - widely celebrated in Kerala",
      preparation: {
        daysBeforeAlert: 15,
        shoppingList: [
          "Christmas tree & decorations",
          "Cake ingredients",
          "Gifts",
          "New clothes",
          "Plum cake items",
        ],
        tasks: [
          "Decorate home",
          "Buy/order cake",
          "Plan family gathering",
          "Make plum cake",
        ],
      },
    });

    // Attukal Pongala (February-March)
    this.festivals.push({
      name: "Attukal Pongala",
      date: new Date(currentYear, 2, 8), // March 8 (varies)
      type: "temple",
      description: "World's largest women's gathering - Attukal Devi temple",
      district: "Thiruvananthapuram",
      preparation: {
        daysBeforeAlert: 5,
        shoppingList: ["Pongala items", "Earthen pots", "Firewood", "Rice, jaggery"],
        tasks: ["Book travel", "Arrange early morning transport", "Prepare offerings"],
      },
    });

    // Sabarimala Season (November-January)
    this.festivals.push({
      name: "Sabarimala Season",
      date: new Date(currentYear, 10, 15), // Nov 15
      type: "temple",
      description: "Ayyappa pilgrimage season - 41 days vratham",
      district: "Pathanamthitta",
      preparation: {
        daysBeforeAlert: 20,
        tasks: [
          "Start vratham preparations",
          "Book online queue",
          "Plan pilgrimage date",
          "Arrange group/travel",
        ],
      },
    });
  }

  getUpcoming(days: number): Festival[] {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    return this.festivals
      .filter((f) => f.date >= now && f.date <= futureDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  getByMonth(month: number): Festival[] {
    return this.festivals
      .filter((f) => f.date.getMonth() === month - 1)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  getByType(type: Festival["type"]): Festival[] {
    return this.festivals.filter((f) => f.type === type);
  }

  getCountdown(festivalName: string): number {
    const festival = this.festivals.find(
      (f) => f.name.toLowerCase() === festivalName.toLowerCase()
    );
    if (!festival) return -1;

    const now = new Date();
    const diff = festival.date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getPreparationTasks(festivalName: string): string[] {
    const festival = this.festivals.find(
      (f) => f.name.toLowerCase() === festivalName.toLowerCase()
    );
    return festival?.preparation?.tasks || [];
  }

  // Check if any festival needs preparation alert
  getPreparationAlerts(): Array<{ festival: Festival; daysLeft: number }> {
    const now = new Date();
    const alerts: Array<{ festival: Festival; daysLeft: number }> = [];

    for (const festival of this.festivals) {
      if (!festival.preparation?.daysBeforeAlert) continue;

      const daysLeft = this.getCountdown(festival.name);
      if (
        daysLeft > 0 &&
        daysLeft <= festival.preparation.daysBeforeAlert
      ) {
        alerts.push({ festival, daysLeft });
      }
    }

    return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  }
}

let instance: FestivalCalendar | null = null;

export function getFestivalCalendar(): FestivalCalendar {
  if (!instance) {
    instance = new FestivalCalendarImpl();
  }
  return instance;
}

// Helper: Format festival info as Manglish message
export function formatFestivalManglish(festival: Festival, daysLeft: number): string {
  if (daysLeft === 0) {
    return `Machane! Innu ${festival.name} aane! ${festival.description}`;
  } else if (daysLeft === 1) {
    return `Nale ${festival.name} aane! ${festival.description}. Ready undo?`;
  } else if (daysLeft <= 7) {
    return `${festival.name} ${daysLeft} days il! ${festival.description}. Preparation start cheyy!`;
  } else {
    return `${festival.name} ${daysLeft} days kazhinju. ${festival.description}`;
  }
}

// Helper: Get shopping list in Manglish
export function getShoppingListManglish(festivalName: string): string {
  const calendar = getFestivalCalendar();
  const festivals = calendar.getByType("onam"); // Get all to search
  const allFestivals = [
    ...calendar.getByType("onam"),
    ...calendar.getByType("vishu"),
    ...calendar.getByType("pooram"),
    ...calendar.getByType("christmas"),
    ...calendar.getByType("temple"),
  ];

  const festival = allFestivals.find(
    (f) => f.name.toLowerCase() === festivalName.toLowerCase()
  );

  if (!festival?.preparation?.shoppingList) {
    return `${festivalName} shopping list kittyila bro`;
  }

  return `${festival.name} shopping list:\n${festival.preparation.shoppingList
    .map((item, i) => `${i + 1}. ${item}`)
    .join("\n")}`;
}
