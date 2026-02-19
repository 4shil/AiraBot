// Shopping & fashion
export async function getDeals(platform: "myntra" | "amazon" | "flipkart"): Promise<Array<{
  product: string;
  price: number;
  discount: number;
}>> {
  return [
    { product: "Nike Air Max", price: 4999, discount: 30 },
    { product: "Adidas Hoodie", price: 1499, discount: 40 },
  ];
}

export async function trackPrice(productUrl: string): Promise<{ current: number; lowest: number }> {
  return { current: 5000, lowest: 4200 };
}
