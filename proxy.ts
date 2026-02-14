import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Routing proxy (Next.js 16)
 * bullmoney.shop: redirect root `/` to `/store`
 * all other routes/domains: pass through unchanged
 *
 * Replaces the deprecated middleware.ts convention in Next.js 16+.
 */
export function proxy(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const { pathname } = request.nextUrl;

  const isBullmoneyShop = host.includes('bullmoney.shop');
  if (isBullmoneyShop && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/store';
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

/**
 * Proxy matcher configuration
 * Match app routes while excluding static internals.
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
