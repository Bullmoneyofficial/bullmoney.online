import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TRANSLATION PROXY API - POST /api/translate
// Server-side translation with multiple fallback backends.
// Works in ALL browsers — bypasses CSP, ad-blockers, in-app browser restrictions.
//
// Backends (tried in order):
//   1. Google Translate free endpoint (no API key)
//   2. MyMemory API (free, 5000 chars/day per IP)
//   3. Returns original text as ultimate fallback
// ============================================================================

const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

// Rate limiting (simple in-memory, per-IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 120; // requests per minute
const RATE_WINDOW = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// ── Google Translate (free endpoint, no key) ────────────────────────────────
async function translateGoogle(
  texts: string[],
  from: string,
  to: string,
  signal: AbortSignal
): Promise<string[] | null> {
  try {
    // Google's free endpoint only handles one text at a time efficiently,
    // but we can batch by joining with a separator
    const separator = '\n\u2063\n'; // invisible separator
    const joined = texts.join(separator);

    const params = new URLSearchParams({
      client: 'gtx',
      sl: from,
      tl: to,
      dt: 't',
      q: joined,
    });

    const res = await fetch(`${GOOGLE_TRANSLATE_URL}?${params}`, {
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BullMoney/1.0)',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.[0]) return null;

    // Reassemble translated text
    const translated = (data[0] as Array<[string]>)
      .map((segment: [string]) => segment[0])
      .join('');

    // Split back by separator
    const results = translated.split(separator);

    // Validate we got same number of results
    if (results.length !== texts.length) {
      // If counts don't match, return the whole thing as one
      return texts.length === 1 ? [translated] : null;
    }

    return results.map((t: string) => t.trim());
  } catch {
    return null;
  }
}

// ── MyMemory Translate (free, no key needed) ─────────────────────────────────
async function translateMyMemory(
  texts: string[],
  from: string,
  to: string,
  signal: AbortSignal
): Promise<string[] | null> {
  try {
    const results: string[] = [];

    // MyMemory handles one at a time; batch up to 10
    const batch = texts.slice(0, 10);
    const promises = batch.map(async (text) => {
      const params = new URLSearchParams({
        q: text,
        langpair: `${from}|${to}`,
      });

      const res = await fetch(`${MYMEMORY_URL}?${params}`, { signal });
      if (!res.ok) return text;

      const data = await res.json();
      return data?.responseData?.translatedText || text;
    });

    const settled = await Promise.allSettled(promises);
    for (let i = 0; i < texts.length; i++) {
      if (i < settled.length && settled[i].status === 'fulfilled') {
        results.push((settled[i] as PromiseFulfilledResult<string>).value);
      } else {
        results.push(texts[i]);
      }
    }

    return results;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limited', translations: [] },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { texts, from = 'en', to } = body as {
      texts: string[];
      from?: string;
      to: string;
    };

    if (!to || !texts?.length) {
      return NextResponse.json(
        { error: 'Missing texts or target language', translations: [] },
        { status: 400 }
      );
    }

    // Don't translate if same language
    if (from === to) {
      return NextResponse.json({ translations: texts, source: 'passthrough' });
    }

    // Limit batch size
    const limited = texts.slice(0, 50);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      // Strategy 1: Google Translate
      const google = await translateGoogle(limited, from, to, controller.signal);
      if (google?.length === limited.length) {
        clearTimeout(timeout);
        return NextResponse.json(
          { translations: google, source: 'google' },
          { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
        );
      }

      // Strategy 2: MyMemory
      const myMemory = await translateMyMemory(limited, from, to, controller.signal);
      if (myMemory?.length === limited.length) {
        clearTimeout(timeout);
        return NextResponse.json(
          { translations: myMemory, source: 'mymemory' },
          { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
        );
      }

      // Strategy 3: Return originals
      clearTimeout(timeout);
      return NextResponse.json(
        { translations: limited, source: 'fallback' },
        { headers: { 'Cache-Control': 'public, s-maxage=60' } }
      );
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('[translate] Error:', error);
    return NextResponse.json(
      { error: 'Translation failed', translations: [] },
      { status: 500 }
    );
  }
}
