import { NextRequest, NextResponse } from 'next/server';

const rateMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 90;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= LIMIT) return true;
  entry.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
    }

    let payload: { source?: string; level?: number; path?: string; ts?: number } = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    return NextResponse.json({
      ok: true,
      boosted: true,
      source: payload.source || 'idle-cleanup',
      level: typeof payload.level === 'number' ? payload.level : 0,
      path: payload.path || '/',
      ts: payload.ts || Date.now(),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, warmed: true, ts: Date.now() }, {
    headers: {
      'cache-control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=300',
    },
  });
}
