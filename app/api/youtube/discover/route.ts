import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const ROTATION_WINDOW_MS = 2 * 60 * 1000;

const MARKET_NEWS_QUERIES = [
  'FOMC meeting live market reaction',
  'US CPI inflation report market reaction',
  'NFP payrolls report forex market',
  'Trump policy news market impact live',
  'black swan event market crash analysis live',
];

function decodeHtmlEntities(text?: string): string {
  if (!text) return '';

  return text
    // decode &amp; first so double-encoded sequences like &amp;#39; become &#39;
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;|&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    // decode numeric entities
    .replace(/&#(\d+);/g, (_m, dec) => {
      const codePoint = Number.parseInt(String(dec), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      const codePoint = Number.parseInt(String(hex), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : '';
    });
}

// Categories with search queries relevant to BullMoney
const CATEGORIES: Record<string, string[]> = {
  'Trading': [
    'stock trading strategies',
    'day trading live',
    'forex trading tutorial',
    'swing trading tips',
    'technical analysis stocks',
  ],
  'Crypto': [
    'cryptocurrency news today',
    'bitcoin analysis',
    'crypto trading strategies',
    'defi explained',
    'altcoin picks',
  ],
  'Finance': [
    'personal finance tips',
    'investing for beginners',
    'wealth building strategies',
    'passive income ideas',
    'financial freedom',
  ],
  'Markets': [
    'stock market news today',
    'market analysis live',
    'earnings report analysis',
    'economic news update',
    'wall street today',
  ],
  'Motivation': [
    'entrepreneur motivation',
    'trading mindset',
    'financial success stories',
    'money mindset',
    'millionaire habits',
  ],
};

const ALL_CATEGORY_NAMES = Object.keys(CATEGORIES);

// Pick N random items from an array
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function getRotationBucket(now = Date.now()): number {
  return Math.floor(now / ROTATION_WINDOW_MS);
}

export async function GET(request: NextRequest) {
  if (!YOUTUBE_API_KEY) {
    return NextResponse.json(
      { success: false, error: 'YouTube API key not configured' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const categoriesParam = searchParams.get('categories');

    if (mode === 'market-news') {
      const freshNonce = searchParams.get('fresh') || Date.now().toString();
      const marketVideos: any[] = [];

      for (const query of MARKET_NEWS_QUERIES) {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&type=video&maxResults=4&order=date&relevanceLanguage=en&` +
          `q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&_=${freshNonce}`,
          { cache: 'no-store' }
        );

        if (!res.ok) {
          console.error(`[YouTube Market News] Search failed for "${query}":`, await res.text());
          continue;
        }

        const data = await res.json();
        const items = (data.items || []).map((item: any) => ({
          videoId: item.id?.videoId,
          title: decodeHtmlEntities(item.snippet?.title) || 'Live Market News Update',
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
          channelTitle: decodeHtmlEntities(item.snippet?.channelTitle) || 'YouTube Markets',
          publishedAt: item.snippet?.publishedAt,
          category: 'Market News',
        })).filter((v: any) => v.videoId);

        marketVideos.push(...items);
      }

      const deduped = Array.from(new Map(marketVideos.map((v) => [v.videoId, v])).values());
      const latest = deduped.sort((a, b) => {
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bTime - aTime;
      });

      return NextResponse.json({
        success: true,
        videos: latest,
        categories: ['Market News'],
        generatedAt: Date.now(),
        refreshInMs: ROTATION_WINDOW_MS,
      });
    }

    let selectedCategories = categoriesParam
      ?.split(',')
      .map((c) => c.trim())
      .filter((c) => !!c && ALL_CATEGORY_NAMES.includes(c));

    // Pick 3 random categories
    if (!selectedCategories || selectedCategories.length === 0) {
      selectedCategories = pickRandom(ALL_CATEGORY_NAMES, 3);
    }

    const allVideos: any[] = [];
    const rotationBucket = getRotationBucket();

    for (const category of selectedCategories) {
      const queries = CATEGORIES[category];
      // Pick one random query per category
      const query = queries[Math.floor(Math.random() * queries.length)];
      const cacheBuster = `${rotationBucket}-${Math.random().toString(36).slice(2, 8)}`;

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=video&videoDuration=medium&maxResults=5&order=relevance&` +
        `relevanceLanguage=en&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&_=${cacheBuster}`,
        { cache: 'no-store' }
      );

      if (!res.ok) {
        console.error(`[YouTube Discover] Search failed for "${query}":`, await res.text());
        continue;
      }

      const data = await res.json();
      const items = (data.items || []).map((item: any) => ({
        videoId: item.id?.videoId,
        title: decodeHtmlEntities(item.snippet?.title),
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        channelTitle: decodeHtmlEntities(item.snippet?.channelTitle),
        publishedAt: item.snippet?.publishedAt,
        category,
      })).filter((v: any) => v.videoId);

      allVideos.push(...items);
    }

    // Shuffle final results
    const shuffled = allVideos.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      videos: shuffled,
      categories: selectedCategories,
      generatedAt: Date.now(),
      refreshInMs: ROTATION_WINDOW_MS,
    });
  } catch (error) {
    console.error('[YouTube Discover] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
