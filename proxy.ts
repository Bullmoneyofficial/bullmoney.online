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

export function proxy(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname, search } = request.nextUrl;

  const isBullmoneyShop =
    host.includes('bullmoney.shop') || host.includes('bullmoneyshop');

  if (!isBullmoneyShop) {
    return NextResponse.next();
  }

  // --- bullmoney.shop domain routing ---

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

  // Games & casino routes — ALWAYS pass through, never rewrite to /store
  // This covers /games/*, /crypto-game/*, /casino-games/* (front-end routes)
  // AND /dice/*, /mines/*, /plinko/*, /wheel/*, /jackpot/*, /crash/*,
  //     /slots/*, /flappybird/* (casino backend proxied via next.config rewrites)
  if (
    pathname.startsWith('/games') ||
    pathname.startsWith('/crypto-game') ||
    pathname.startsWith('/casino-games') ||
    pathname.startsWith('/dice') ||
    pathname.startsWith('/mines') ||
    pathname.startsWith('/plinko') ||
    pathname.startsWith('/wheel') ||
    pathname.startsWith('/jackpot') ||
    pathname.startsWith('/crash') ||
    pathname.startsWith('/slots') ||
    pathname.startsWith('/flappybird') ||
    pathname.startsWith('/user') ||
    pathname.startsWith('/wallet') ||
    pathname.startsWith('/payment') ||
    pathname.startsWith('/withdraw') ||
    pathname.startsWith('/load') ||
    pathname.startsWith('/bonus') ||
    pathname.startsWith('/referrals') ||
    pathname.startsWith('/auth')
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
