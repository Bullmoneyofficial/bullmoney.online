import { NextRequest, NextResponse } from 'next/server';

/**
 * Domain-based routing middleware
 * When accessed via www.bullmoney.shop or bullmoney.shop,
 * the root page (/) shows the store instead of the default app page.
 */

const SHOP_DOMAINS = ['www.bullmoney.shop', 'bullmoney.shop'];

const ipHits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 60; // per IP per 10 minutes for admin endpoints

const RATE_LIMIT_PATHS = [
  '/api/crypto-payment/admin',
  '/api/crypto-payment/refund',
  '/api/crypto-payment/verify',
];

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

function allow(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_HITS) return false;
  entry.count++;
  return true;
}

function isRateLimitedPath(pathname: string): boolean {
  return RATE_LIMIT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host')?.replace(/:\d+$/, '') || '';
  const { pathname } = request.nextUrl;

  if (isRateLimitedPath(pathname)) {
    const ip = getIp(request);
    if (!allow(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  // If the domain is bullmoney.shop and the user is visiting the root path,
  // rewrite to /store so the store page is served as the homepage
  if (SHOP_DOMAINS.includes(hostname) && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/store';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Only run middleware on the root path to avoid unnecessary processing
export const config = {
  matcher: [
    '/',
    '/api/crypto-payment/admin/:path*',
    '/api/crypto-payment/refund/:path*',
    '/api/crypto-payment/verify',
  ],
};
