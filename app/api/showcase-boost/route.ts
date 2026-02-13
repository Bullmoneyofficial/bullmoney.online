import { NextRequest, NextResponse } from 'next/server';

const rateMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 120;

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

    let payload: { pageId?: string; path?: string; ts?: number; inApp?: boolean } = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    return NextResponse.json({
      ok: true,
      boosted: true,
      pageId: payload.pageId || 'unknown',
      path: payload.path || '/',
      inApp: Boolean(payload.inApp),
      ts: payload.ts || Date.now(),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, warmed: true, ts: Date.now() }, {
    headers: {
      'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let pageId = 'unknown';
  let path = '/';

  try {
    const body = await request.json();
    if (typeof body?.pageId === 'string' && body.pageId) pageId = body.pageId;
    if (typeof body?.path === 'string' && body.path) path = body.path;
  } catch {
    // keep fast path when beacon body is unavailable
  }

  return NextResponse.json(
    {
      ok: true,
      boosted: true,
      pageId,
      path,
      ts: Date.now(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export async function GET() {
  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
