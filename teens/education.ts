// Education features
export async function getDeadlines(subject?: string): Promise<Array<{
  title: string;
  dueDate: Date;
  subject: string;
}>> {
  return [
    { title: "Math Assignment", dueDate: new Date(2026, 2, 25), subject: "Math" },
    { title: "History Project", dueDate: new Date(2026, 3, 1), subject: "History" },
  ];
}

export async function pomodoroTimer(workMinutes: number = 25, breakMinutes: number = 5): Promise<string> {
  return `Pomodoro started: ${workMinutes}min work, ${breakMinutes}min break`;
}
