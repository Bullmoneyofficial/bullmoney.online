import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Routing proxy (Next.js 16)
 *
 * bullmoney.shop domain handling:
 *   • `/`                     → rewrite to `/store`
 *   • `/product/*`            → rewrite to `/store/product/*`
 *   • `/checkout`             → rewrite to `/store/checkout`
 *   • `/gift-cards`           → rewrite to `/store/gift-cards`
 *   • `/account`              → rewrite to `/store/account`
 *   • `/success`              → rewrite to `/store/success`
 *   • `/store/*`              → pass through (already correct)
 *   • `/api/*`, `/_next/*`    → pass through (API/static assets)
 *   • all other routes        → pass through (about, games, etc. still accessible)
 *
 * All other domains: pass through unchanged.
 */

/** Store sub-paths that should be rewritten when accessed at root level on the shop domain */
const STORE_SHORTCUT_PATHS = [
  '/product',
  '/checkout',
  '/gift-cards',
  '/account',
  '/success',
  '/admin',
];

const ALWAYS_PASS_THROUGH_PREFIXES = [
  // Design page should be reachable on all domains
  '/design',
  // Games & casino routes should never be rewritten to /store
  '/games',
  '/crypto-game',
  '/casino-games',
  '/dice',
  '/mines',
  '/plinko',
  '/wheel',
  '/jackpot',
  '/crash',
  '/slots',
  '/flappybird',
  // Casino API proxied via next.config rewrites
  '/user',
  '/wallet',
  '/payment',
  '/withdraw',
  '/load',
  '/bonus',
  '/referrals',
  '/auth',
] as const;

function isExactOrUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + '/');
}

export function proxy(request: NextRequest) {
  const rawHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const host = rawHost.split(',')[0].trim().toLowerCase();
  const { pathname, search } = request.nextUrl;

  const isDev = process.env.NODE_ENV !== 'production';

  const hostnameOnly = host
    // drop port if present (e.g. 192.168.1.10:3000)
    .replace(/:\d+$/, '')
    // drop IPv6 brackets if present (e.g. [::1]:3000)
    .replace(/^\[(.*)\]$/, '$1');

  const isLocalDevHost = isDev
    ? hostnameOnly === 'localhost' ||
      hostnameOnly === '127.0.0.1' ||
      hostnameOnly === '::1' ||
      // private IPv4 ranges: 10/8, 192.168/16, 172.16/12
      /^10\.(?:\d{1,3}\.){2}\d{1,3}$/.test(hostnameOnly) ||
      /^192\.168\.(?:\d{1,3})\.(?:\d{1,3})$/.test(hostnameOnly) ||
      /^172\.(?:1[6-9]|2\d|3[0-1])\.(?:\d{1,3})\.(?:\d{1,3})$/.test(hostnameOnly)
    : false;

  const isBullmoneyShop =
    host.includes('bullmoney.shop') ||
    host.includes('bullmoney.online') ||
    host.includes('bullmoneyshop') ||
    isLocalDevHost;

  if (!isBullmoneyShop) {
    return NextResponse.next();
  }

  // --- bullmoney.shop domain routing ---

  // Always allow certain routes to pass through unchanged on store domains.
  // This ensures URLs like /design and /games keep working on bullmoney.shop and bullmoney.online.
  for (const prefix of ALWAYS_PASS_THROUGH_PREFIXES) {
    if (isExactOrUnder(pathname, prefix)) {
      return NextResponse.next();
    }
  }

  // Root → /store (rewrite so URL stays as `/`)
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/store';
    return NextResponse.rewrite(url);
  }

  // Already under /store — pass through
  if (pathname.startsWith('/store')) {
    return NextResponse.next();
  }

  // API routes, _next internals, static files — always pass through
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/sw.js')
  ) {
    return NextResponse.next();
  }

  // Shortcut paths: e.g. bullmoney.shop/checkout → /store/checkout
  for (const prefix of STORE_SHORTCUT_PATHS) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/store' + pathname;
      return NextResponse.rewrite(url);
    }
  }

  // All other routes (about, games, community, etc.) — pass through
  return NextResponse.next();
}

/**
 * Proxy matcher configuration
 * Match ALL request paths except static internals.
 * API routes are included so the proxy can add headers / handle CORS if needed.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public static assets by extension
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|woff|woff2|ttf|eot|mp4|mp3|webm|avif)$).*)',
  ],
};
