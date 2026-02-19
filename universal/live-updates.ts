/**
 * Live Updates Module
 * RSS + Trends + Alerts aggregator for Kerala
 */

export interface LiveSource {
  name: string;
  type: "rss" | "trends" | "alerts" | "events" | "entertainment";
  url?: string;
  region?: string;
}

export interface LiveItem {
  title: string;
  source: string;
  url?: string;
  publishedAt?: string;
  category?: string;
}

export const LIVE_SOURCES: LiveSource[] = [
  // Malayalam News
  { name: "Manorama", type: "rss", url: "https://www.manoramaonline.com/news/kerala.rss" },
  { name: "Mathrubhumi", type: "rss", url: "https://www.mathrubhumi.com/feeds/news/kerala" },
  { name: "Asianet", type: "rss", url: "https://www.asianetnews.com/rss/kerala" },
  { name: "24News", type: "rss", url: "https://www.twentyfournews.com/rss/kerala" },
  { name: "Deshabhimani", type: "rss", url: "https://www.deshabhimani.com/rss/kerala" },

  // Tech News
  { name: "HackerNews", type: "rss", url: "https://news.ycombinator.com/rss" },
  { name: "ProductHunt", type: "rss", url: "https://www.producthunt.com/feed" },

  // Sports
  { name: "ESPNCricinfo", type: "rss", url: "https://www.espncricinfo.com/rss/content/story/feeds/0.xml" },

  // Entertainment
  { name: "BookMyShow", type: "entertainment" },
  { name: "OTT New Releases", type: "entertainment" },

  // Alerts
  { name: "IMD Weather", type: "alerts" },
  { name: "KSRTC Updates", type: "alerts" },
  { name: "Kerala Police Alerts", type: "alerts" },

  // Trends
  { name: "Google Trends - Kerala", type: "trends", region: "IN-KL" },
  { name: "YouTube Trending - Kerala", type: "trends", region: "IN-KL" },
  { name: "Instagram Reels - Malayalam", type: "trends", region: "IN-KL" },
];

// Simple RSS fetcher (no external deps)
export async function fetchRss(url: string): Promise<LiveItem[]> {
  const res = await fetch(url);
  if (!res.ok) return [];
  const xml = await res.text();

  // Very simple XML parsing (basic title/link)
  const items: LiveItem[] = [];
  const itemBlocks = xml.split("<item>").slice(1);
  for (const block of itemBlocks.slice(0, 10)) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    if (title) {
      items.push({
        title: decodeEntities(title),
        source: url,
        url: link,
        publishedAt: pubDate,
      });
    }
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([\s\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

export async function getLiveUpdates(limitPerSource = 5): Promise<LiveItem[]> {
  const rssSources = LIVE_SOURCES.filter((s) => s.type === "rss" && s.url);
  const results: LiveItem[] = [];

  for (const src of rssSources) {
    const items = await fetchRss(src.url!);
    items.slice(0, limitPerSource).forEach((it) =>
      results.push({ ...it, source: src.name })
    );
  }

  return results;
}

export async function getKeralaTopHeadlines(): Promise<LiveItem[]> {
  const keralaSources = LIVE_SOURCES.filter(
    (s) => s.type === "rss" && s.url && /kerala/i.test(s.url)
  );
  const results: LiveItem[] = [];
  for (const src of keralaSources) {
    const items = await fetchRss(src.url!);
    items.slice(0, 5).forEach((it) => results.push({ ...it, source: src.name }));
  }
  return results;
}
