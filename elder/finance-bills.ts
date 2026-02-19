// Finance & Bills
export interface Bill {
  type: "kseb" | "water" | "mobile" | "internet";
  amount: number;
  dueDate: Date;
  paid: boolean;
}

export async function getBillReminders(): Promise<Bill[]> {
  return [
    { type: "kseb", amount: 450, dueDate: new Date(2026, 2, 15), paid: false },
    { type: "mobile", amount: 599, dueDate: new Date(2026, 2, 20), paid: false },
  ];
}

export async function checkBankBalance(accountNumber: string): Promise<number> {
  return 25000; // Simulated
}

export async function trackExpenses(month: number): Promise<{ category: string; amount: number }[]> {
  return [
    { category: "Food", amount: 8000 },
    { category: "Bills", amount: 3000 },
    { category: "Transport", amount: 2000 },
  ];
}
