// Gaming features
export async function getBGMIStats(playerId: string): Promise<{
  kills: number;
  wins: number;
  kd: number;
}> {
  return { kills: 1250, wins: 45, kd: 3.2 };
}

export async function getGameDeals(): Promise<Array<{ game: string; price: number; discount: number }>> {
  return [
    { game: "GTA V", price: 999, discount: 50 },
    { game: "Valorant Points", price: 399, discount: 20 },
  ];
}

export async function remindBreak(sessionMinutes: number): Promise<string> {
  if (sessionMinutes > 120) {
    return "Machane, 2 hours ayi! Break edukkeda. Eyes rest venam.";
  }
  return "";
}
