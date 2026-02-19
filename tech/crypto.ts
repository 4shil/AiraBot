// Crypto tracking (read-only, no investment advice)
export async function getCryptoPrice(symbol: string): Promise<{ price: number; change24h: number }> {
  const prices: Record<string, number> = { BTC: 67000, ETH: 3500, SOL: 150 };
  return { price: prices[symbol] || 0, change24h: 2.5 };
}

export async function getPortfolio(): Promise<Array<{ coin: string; amount: number; value: number }>> {
  return [
    { coin: "BTC", amount: 0.05, value: 3350 },
    { coin: "ETH", amount: 1.2, value: 4200 },
  ];
}
