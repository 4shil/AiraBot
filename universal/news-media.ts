// News aggregation
export interface NewsArticle {
  title: string;
  source: string;
  url: string;
  category: "malayalam" | "national" | "sports" | "tech";
}

export async function getNews(category: string): Promise<NewsArticle[]> {
  return [{ title: "Sample news", source: "Manorama", url: "", category: "malayalam" }];
}
