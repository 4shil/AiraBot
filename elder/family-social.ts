// Family & Social
export async function getBirthdayReminders(days: number = 7): Promise<Array<{
  name: string;
  date: Date;
  relation: string;
}>> {
  return [
    { name: "Son Ashil", date: new Date(2026, 2, 28), relation: "Son" },
    { name: "Wife Suma", date: new Date(2026, 3, 5), relation: "Wife" },
  ];
}

export async function getRecipe(dish: string): Promise<{
  ingredients: string[];
  steps: string[];
}> {
  return {
    ingredients: ["Rice", "Coconut", "Jaggery"],
    steps: ["Boil rice", "Add coconut", "Mix jaggery"],
  };
}

export async function scheduleVideoCall(contact: string, time: Date): Promise<string> {
  return `Video call with ${contact} scheduled at ${time.toLocaleTimeString()}`;
}
