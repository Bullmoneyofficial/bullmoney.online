import { NextResponse } from "next/server";

export const runtime = "nodejs";

type LinkPreview = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

// In-memory cache with TTL
const cache = new Map<string, { data: LinkPreview; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(url: string): LinkPreview | null {
  const cached = cache.get(url);
  if (!cached) return null;
  
  if (Date.now() > cached.expiresAt) {
    cache.delete(url);
    return null;
  }
  
  return cached.data;
}

function setCache(url: string, data: LinkPreview): void {
  cache.set(url, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  
  // Limit cache size to prevent memory issues
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

function isPrivateIp(hostname: string) {
  // Very small SSRF guard for obvious IP literals.
  // Note: does not resolve DNS for hostnames.
  const host = hostname.trim().toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4) return false;

  const parts = ipv4.slice(1).map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;

  return false;
}

function extractMeta(html: string, baseUrl: string): Omit<LinkPreview, "url"> {
  const getMeta = (keys: string[]) => {
    for (const key of keys) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // property/name first, content later
      const re1 = new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>` ,
        "i"
      );
      // content first, property/name later
      const re2 = new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>` ,
        "i"
      );

      const m1 = re1.exec(html);
      if (m1?.[1]) return m1[1].trim();
      const m2 = re2.exec(html);
      if (m2?.[1]) return m2[1].trim();
    }
    return undefined;
  };

  const titleFromOg = getMeta(["og:title", "twitter:title"]);
  const desc = getMeta(["og:description", "description", "twitter:description"]);
  const siteName = getMeta(["og:site_name"]);
  const image = getMeta(["og:image", "twitter:image", "twitter:image:src"]);

  const titleTag = /<title[^>]*>([^<]{1,300})<\/title>/i.exec(html)?.[1]?.trim();

  let normalizedImage: string | undefined;
  if (image) {
    try {
      normalizedImage = new URL(image, baseUrl).toString();
    } catch {
      normalizedImage = undefined;
    }
  }

  return {
    title: titleFromOg || titleTag,
    description: desc,
    siteName,
    image: normalizedImage,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const urlParam = searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Check cache first
  const cached = getCached(urlParam);
  if (cached) {
    return NextResponse.json(cached, {
      status: 200,
      headers: { 
        "cache-control": "public, max-age=300",
        "x-cache": "HIT"
      },
    });
  }

  let target: URL;
  try {
    target = new URL(urlParam);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
  }

  if (isPrivateIp(target.hostname)) {
    return NextResponse.json({ error: "Blocked host" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "BullMoneyBot/1.0 (+https://bullmoney.online)",
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("text/html")) {
      const payload: LinkPreview = { url: target.toString() };
      setCache(urlParam, payload);
      return NextResponse.json(payload, {
        status: 200,
        headers: { 
          "cache-control": "public, max-age=300",
          "x-cache": "MISS"
        },
      });
    }

    const text = await res.text();
    const html = text.slice(0, 800_000);
    const meta = extractMeta(html, target.toString());

    const payload: LinkPreview = {
      url: target.toString(),
      ...meta,
    };

    setCache(urlParam, payload);
    return NextResponse.json(payload, {
      status: 200,
      headers: { 
        "cache-control": "public, max-age=300",
        "x-cache": "MISS"
      },
    });
  } catch (e: any) {
    const payload: LinkPreview = { url: target.toString() };
    // Don't cache errors aggressively
    return NextResponse.json(payload, {
      status: 200,
      headers: { 
        "cache-control": "public, max-age=60",
        "x-cache": "ERROR"
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
