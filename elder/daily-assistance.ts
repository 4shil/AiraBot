// Daily Assistance
export async function getPrayerTimings(district: string): Promise<{
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}> {
  return {
    fajr: "5:30 AM",
    dhuhr: "12:15 PM",
    asr: "3:30 PM",
    maghrib: "6:10 PM",
    isha: "7:20 PM",
  };
}

export async function getTempleTiming(templeName: string): Promise<string> {
  return "Guruvayoor Temple: 4:00 AM - 9:00 PM";
}

export async function checkRationCard(cardNumber: string): Promise<{
  status: string;
  balance: number;
}> {
  return { status: "Active", balance: 25 };
}

export async function getGovernmentSchemes(category: string): Promise<string[]> {
  return ["Pension scheme", "Ayushman Bharat", "PM Kisan"];
}
