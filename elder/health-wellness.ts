// Health & Wellness
export async function getMedicineReminders(): Promise<Array<{
  medicine: string;
  time: string;
  dosage: string;
}>> {
  return [
    { medicine: "BP Tablet", time: "8:00 AM", dosage: "1 tablet" },
    { medicine: "Diabetes", time: "9:00 PM", dosage: "2 tablets" },
  ];
}

export async function bookDoctor(specialty: string, date: Date): Promise<string> {
  return `Doctor appointment booked: ${specialty} on ${date.toDateString()}`;
}

export async function getAyurvedaTips(condition: string): Promise<string[]> {
  return [
    "Drink warm water in morning",
    "Take Triphala before bed",
    "Practice yoga 30min daily",
  ];
}
