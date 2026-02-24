export interface NewsItem {
  title: string;
  subtitle: string;
  link: string;
  source: string;
  category: string;
  image: string | null;
  published_at: string;
  urgency: "critical" | "high" | "medium" | "normal";
  age: string;
}

export interface TickerConfig {
  scrollSpeed: number;
  fetchInterval: number;
  duplicateCount: number;
}
