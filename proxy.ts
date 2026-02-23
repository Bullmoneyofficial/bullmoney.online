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

  // Only run on real document navigations (avoid redirecting XHR/prefetch/assets)
  const fetchDest = (request.headers.get('sec-fetch-dest') || '').toLowerCase();
  const fetchMode = (request.headers.get('sec-fetch-mode') || '').toLowerCase();
  const isDocumentNavigation =
    fetchDest === 'document' || fetchMode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

  const isBullmoneyShop = host.includes('bullmoney.shop');
  const isBullmoneyOnline = host.includes('bullmoney.online');

  // FIRST VISIT ROUTE: bullmoney.online `/` -> bullmoney.shop `/store`
  // Goal: new visitors land on the faster store experience immediately.
  // We persist a cookie on the .online domain so this only happens once.
  if (isBullmoneyOnline && pathname === '/' && isDocumentNavigation && request.method === 'GET') {
    const firstVisitCookie = request.cookies.get('bm_online_first_redirected')?.value;
    if (firstVisitCookie !== '1') {
      const returnTo = request.nextUrl.clone();
      // Preserve the exact landing URL (path + search) so the store can offer a “go back” link.
      const returnToUrl = returnTo.toString();

      const redirectUrl = new URL('https://bullmoney.shop/store');
      redirectUrl.searchParams.set('bm_from', 'online');
      redirectUrl.searchParams.set('bm_return', returnToUrl);

      const response = NextResponse.redirect(redirectUrl, 307);

      // In local dev we usually run over http://localhost, so a Secure cookie would be dropped.
      const shouldUseSecureCookie =
        process.env.NODE_ENV === 'production' || request.nextUrl.protocol === 'https:';

      // Cookie scoped to the online domain so subsequent visits stay on bullmoney.online.
      const cookieDomain = host.includes('www.bullmoney.online') || host.endsWith('bullmoney.online') ? '.bullmoney.online' : undefined;
      response.cookies.set({
        name: 'bm_online_first_redirected',
        value: '1',
        path: '/',
        maxAge: 60 * 60 * 24 * 180, // 180 days
        sameSite: 'lax',
        secure: shouldUseSecureCookie,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });
      return response;
    }
  }

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
