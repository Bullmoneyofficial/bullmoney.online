import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Domain-specific routing proxy (Next.js 16)
 * Routes www.bullmoney.shop:
 *   - / → /store (main page)
 *   - /store, /games, /design, /apps, /desktop → allowed
 *   - Everything else → redirect to /store
 * 
 * Replaces the deprecated middleware.ts convention in Next.js 16+.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Canonical affiliate onboarding URL:
  // /register/pagemode -> /about?src=nav (+ preserve existing query params)
  if (pathname === '/register/pagemode' || pathname === '/register/pagemode/') {
    const url = request.nextUrl.clone();
    url.pathname = '/about';
    if (!url.searchParams.get('src')) {
      url.searchParams.set('src', 'nav');
    }
    return NextResponse.rewrite(url);
  }

  const hostname = request.headers.get('host') || '';
  const isBullmoneyShop = hostname.includes('bullmoney.shop');
  
  if (!isBullmoneyShop) {
    return NextResponse.next();
  }

  // Root → rewrite to /store
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/store';
    return NextResponse.rewrite(url);
  }

  // Allowed paths on bullmoney.shop
  const allowedPaths = ['/store', '/games', '/design', '/apps', '/desktop', '/login', '/register', '/auth', '/api', '/casino-games', '/crypto-game'];
  for (const allowed of allowedPaths) {
    if (pathname === allowed || pathname.startsWith(allowed + '/')) {
      return NextResponse.next();
    }
  }

  // Static/internal paths
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/assets') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Everything else → redirect to /store
  const url = request.nextUrl.clone();
  url.pathname = '/store';
  return NextResponse.redirect(url);
}

/**
 * Proxy matcher configuration
 * Only run on routes that need domain checking
 * Exclude static files, API routes, and _next internal routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, CSS, JS, etc)
     * - assets directory (CSS, images, fonts)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
