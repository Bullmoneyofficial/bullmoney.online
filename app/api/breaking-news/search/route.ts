// app/api/breaking-news/search/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * BREAKING NEWS SEARCH
 * Searches Google News RSS for a specific query AND filters cached local news
 */

interface SearchNewsItem {
  title: string;
  subtitle: string;
  link: string;
  source: string;
  category: string;
  image: string | null;
  published_at: string;
  urgency: "critical" | "high" | "medium" | "normal";
  age: string;
  matchType: "google" | "local";
}

// Simple in-memory search cache (query → results, 60s TTL)
const searchCache = new Map<string, { items: SearchNewsItem[]; ts: number }>();
const SEARCH_CACHE_TTL = 60000;

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function detectUrgency(title: string, description: string, publishedAt: string | undefined): SearchNewsItem["urgency"] {
  const text = `${title} ${description}`.toLowerCase();
  const ageMs = publishedAt ? Date.now() - new Date(publishedAt).getTime() : Infinity;
  const isVeryRecent = ageMs < 30 * 60 * 1000;
  const isRecent = ageMs < 2 * 60 * 60 * 1000;

  const CRIT = ["breaking", "just in", "alert", "urgent", "crash", "collapse", "plunge", "surge", "war", "attack", "bomb", "explosion", "missile"];
  const HIGH = ["developing", "live updates", "inflation", "jobs report", "gdp", "earnings", "crisis", "record high", "record low"];

  const hasCrit = CRIT.some(k => text.includes(k));
  const hasHigh = HIGH.some(k => text.includes(k));

  if (hasCrit && isVeryRecent) return "critical";
  if (hasCrit || (hasHigh && isVeryRecent)) return "high";
  if (hasHigh || isRecent) return "medium";
  return "normal";
}

function extractImage(block: string): string | null {
  const mediaContent = /media:content[^>]+url=["']([^"']+)["']/i.exec(block);
  if (mediaContent?.[1]) return mediaContent[1];
  const img = /<img[^>]+src=["']([^"']+)["']/i.exec(block);
  if (img?.[1]) return img[1];
  const anyImg = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>]*)?/i.exec(block);
  if (anyImg?.[0]) return anyImg[0];
  return null;
}

async function scrapeOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const reader = res.body?.getReader();
    if (!reader) return null;
    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 50000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>")) break;
    }
    reader.cancel();
    const ogImage = /property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html)
      || /content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
    if (ogImage?.[1]) return ogImage[1];
    const twImage = /name=["']twitter:image[^"']*["'][^>]+content=["']([^"']+)["']/i.exec(html)
      || /content=["']([^"']+)["'][^>]+name=["']twitter:image/i.exec(html);
    if (twImage?.[1]) return twImage[1];
    return null;
  } catch {
    return null;
  }
}

function pickTag(xml: string, names: string[]) {
  for (const n of names) {
    const cdata = new RegExp(`<${n}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${n}>`, "i").exec(xml);
    if (cdata?.[1]) return cdata[1];
    const plain = new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`, "i").exec(xml);
    if (plain?.[1]) return plain[1];
  }
  return "";
}

function attrOf(xml: string, tag: string, attr: string) {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, "i");
  return re.exec(xml)?.[1] ?? "";
}

function strip(s: string) {
  return s
    .replace(/<[^>]+>/g, "")
    // decode common entities (handle double-encoded text like &amp;#39;)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;|&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    // decode numeric entities
    .replace(/&#(\d+);/g, (_m, dec) => {
      const codePoint = Number.parseInt(String(dec), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      const codePoint = Number.parseInt(String(hex), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) { costs[j] = j; continue; }
      if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter[i - 1] !== longer[j - 1]) newValue = Math.min(newValue, lastValue, costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[longer.length] = lastValue;
  }
  return (longer.length - costs[longer.length]) / longer.length;
}

function categorize(text: string): string {
  const t = text.toLowerCase();
  if (/bitcoin|ethereum|crypto|blockchain|defi|nft/i.test(t)) return "crypto";
  if (/forex|currency|dollar|euro|yen|pound|fx/i.test(t)) return "forex";
  if (/oil|gold|silver|commodity|opec|natural gas/i.test(t)) return "commodities";
  if (/war|conflict|sanction|military|geopolit|nuclear|terror|coup|election/i.test(t)) return "geopolitics";
  if (/fed|ecb|central bank|interest rate|inflation|gdp|unemployment|recession/i.test(t)) return "economics";
  if (/stock|share|s&p|nasdaq|dow|earnings|ipo|merger/i.test(t)) return "stocks";
  return "markets";
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ items: [], query: q, error: "Query too short" });
  }

  const cacheKey = q.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SEARCH_CACHE_TTL) {
    return NextResponse.json({ items: cached.items, query: q, cached: true });
  }

  const allResults: SearchNewsItem[] = [];

  // 1. Search Google News RSS for the query
  const googleQueries = [
    `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en&gl=US&ceid=US:en`,
    `https://news.google.com/rss/search?q=${encodeURIComponent(q + " market trading")}&hl=en&gl=US&ceid=US:en`,
  ];

  const googleResults = await Promise.allSettled(
    googleQueries.map(async (url) => {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(url, {
          cache: "no-store",
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
          signal: controller.signal,
        });
        clearTimeout(tid);
        if (!res.ok) return [];
        const xml = await res.text();
        const items: SearchNewsItem[] = [];
        const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
        for (const block of blocks.slice(0, 15)) {
          const title = strip(pickTag(block, ["title"]) || "");
          const link = attrOf(block, "link", "href") || strip(pickTag(block, ["link"]) || pickTag(block, ["guid"]) || "");
          const pub = pickTag(block, ["pubDate", "published", "updated"]) || undefined;
          const rawSource = strip(pickTag(block, ["source"])) || "Google News";
          const desc = strip(pickTag(block, ["description", "summary"]) || "").substring(0, 300);
          const image = extractImage(block);
          if (!title || !link) continue;
          const publishedAt = pub ? new Date(strip(pub)).toISOString() : new Date().toISOString();
          items.push({
            title: title.substring(0, 150),
            subtitle: desc.substring(0, 120),
            link,
            source: rawSource,
            category: categorize(title + " " + desc),
            image,
            published_at: publishedAt,
            urgency: detectUrgency(title, desc, publishedAt),
            age: getTimeAgo(publishedAt),
            matchType: "google",
          });
        }
        return items;
      } catch {
        clearTimeout(tid);
        return [];
      }
    })
  );

  for (const r of googleResults) {
    if (r.status === "fulfilled") allResults.push(...r.value);
  }

  // 2. Also fetch the local cached results and filter them
  try {
    const localUrl = new URL("/api/breaking-news", request.nextUrl.origin);
    const localRes = await fetch(localUrl, { cache: "no-store" });
    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData.items?.length) {
        const terms = q.toLowerCase().split(/\s+/);
        const filtered = localData.items.filter((item: any) => {
          const text = `${item.title} ${item.subtitle} ${item.source} ${item.category}`.toLowerCase();
          return terms.some((t: string) => text.includes(t));
        });
        for (const item of filtered) {
          allResults.push({ ...item, matchType: "local" as const });
        }
      }
    }
  } catch { /* silent */ }

  // 3. Deduplicate
  const unique: SearchNewsItem[] = [];
  for (const item of allResults) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 50);
    const isDupe = unique.some(u => {
      const ek = u.title.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 50);
      return key === ek || levenshteinSimilarity(key, ek) > 0.8;
    });
    if (!isDupe) unique.push(item);
  }

  // 4. Sort by urgency + recency
  const urgencyOrder = { critical: 0, high: 1, medium: 2, normal: 3 };
  unique.sort((a, b) => {
    const ud = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (ud !== 0) return ud;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  const final = unique.slice(0, 40);

  // 5. Scrape og:image for items without images (max 10)
  const needsImg = final.filter(i => !i.image).slice(0, 10);
  if (needsImg.length > 0) {
    await Promise.allSettled(
      needsImg.map(async (item) => {
        const img = await scrapeOgImage(item.link);
        if (img) item.image = img;
      })
    );
  }

  // Cache results
  searchCache.set(cacheKey, { items: final, ts: Date.now() });

  // Cleanup old cache entries
  if (searchCache.size > 50) {
    const now = Date.now();
    for (const [k, v] of searchCache) {
      if (now - v.ts > SEARCH_CACHE_TTL * 5) searchCache.delete(k);
    }
  }

  return NextResponse.json({ items: final, query: q, total: final.length });
}
