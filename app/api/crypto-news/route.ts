// app/api/crypto-news/route.ts
import { NextResponse } from "next/server";

/**
 * Free, no-auth news via public RSS feeds.
 * Feeds chosen: CoinDesk, Cointelegraph, Decrypt, Bitcoin Magazine, Binance Blog.
 * You can add/remove feeds below.
 */
const FEEDS: { url: string; source: string }[] = [
  // Crypto / Original
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph" },
  { url: "https://decrypt.co/feed", source: "Decrypt" },
  { url: "https://bitcoinmagazine.com/.rss/full/", source: "Bitcoin Magazine" },
  { url: "https://www.binance.com/en/feed/rss", source: "Binance Feed" },

  // Metals / Commodities
  { url: "https://news.kitco.com/rss/kitconewsfeed.xml", source: "Kitco News" },
  { url: "https://www.kitco.com/news/category/metals", source: "Kitco Metals" },  // sometimes category listing
  { url: "https://www.kitco.com/news/category/base-metals", source: "Kitco Base Metals" },
  { url: "https://www.mining.com/feed/", source: "Mining.com" },

  // General Markets / Commodities
  { url: "https://www.investing.com/webmaster-tools/rss", source: "Investing.com" },

  // Forex / Currency
  { url: "https://www.actionforex.com/general/forex-rss-feeds/", source: "ActionForex" },
  { url: "https://www.dailyforex.com/forex-rss", source: "DailyForex" },
  { url: "https://www.instaforex.com/forex_rss", source: "InstaForex" },
];


export async function GET() {
  try {
    const results = await Promise.allSettled(
      FEEDS.map(async (f) => {
        const res = await fetch(f.url, {
          // avoid Next cache so you always get fresh headlines
          cache: "no-store",
          // some RSS hosts like a UA header
          headers: { "User-Agent": "Mozilla/5.0 (compatible; BullMoneyBot/1.0)" },
        });
        if (!res.ok) throw new Error(`${f.source} fetch failed: ${res.status}`);
        const xml = await res.text();
        return parseRss(xml, f.source);
      })
    );

    // flatten successful arrays
    const items = results
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      // sort by pub date (desc)
      .sort((a, b) => {
        const ta = a.published_at ? Date.parse(a.published_at) : 0;
        const tb = b.published_at ? Date.parse(b.published_at) : 0;
        return tb - ta;
      })
      .slice(0, 60); // cap the payload

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to fetch", detail: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Tiny RSS parser (no deps). Handles common <item> variants and CDATA.
 * Returns: { title, link, source, published_at }[]
 */
function parseRss(xml: string, fallbackSource: string) {
  const items: Array<{ title: string; link: string; source: string; published_at?: string }> = [];

  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];

  for (const block of itemBlocks) {
    const title = pickTag(block, ["title"]) || "";
    const link =
      // Atom <link href="..."/>
      attrOf(block, "link", "href") ||
      // RSS <link>...</link>
      pickTag(block, ["link"]) ||
      // <guid> sometimes contains a URL
      pickTag(block, ["guid"]) ||
      "";

    const pub =
      pickTag(block, ["pubDate", "published", "updated", "dc:date"]) ||
      undefined;

    // some feeds include <source>…</source>
    const source = strip(pickTag(block, ["source"])) || fallbackSource;

    if (!title || !link) continue;

    items.push({
      title: strip(title),
      link: strip(link),
      source,
      published_at: pub ? new Date(strip(pub)).toISOString() : undefined,
    });
  }

  return items;
}

// helpers
function pickTag(xml: string, names: string[]) {
  for (const n of names) {
    // CDATA or plain
    const cdata = new RegExp(`<${n}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${n}>`, "i").exec(xml);
    if (cdata?.[1]) return cdata[1];

    const plain = new RegExp(`<${n}[^>]*>([\\s\\S]*?)<\\/${n}>`, "i").exec(xml);
    if (plain?.[1]) return plain[1];
  }
  return "";
}

function attrOf(xml: string, tag: string, attr: string) {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, "i");
  const m = re.exec(xml);
  return m?.[1] ?? "";
}

function strip(s: string) {
  // remove tags/entities
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

