import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Domain-based routing middleware
 * When accessed via www.bullmoney.shop or bullmoney.shop,
 * the root page (/) shows the store instead of the default app page.
 */

const SHOP_DOMAINS = ['www.bullmoney.shop', 'bullmoney.shop'];

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host')?.replace(/:\d+$/, '') || '';
  const { pathname } = request.nextUrl;

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
  matcher: ['/'],
};
