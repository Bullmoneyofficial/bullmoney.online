import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Domain-specific routing proxy
 * Routes www.bullmoney.shop to /store page only
 * Avoids middleware conflicts by handling rewrite at edge
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Check if request is from bullmoney.shop domain (with or without www)
  const isBullmoneyShop = hostname.includes('bullmoney.shop');
  
  if (isBullmoneyShop) {
    const url = request.nextUrl;
    const pathname = url.pathname;
    
    // If already on /store or /store/* pages, allow through
    if (pathname.startsWith('/store')) {
      return NextResponse.next();
    }
    
    // If accessing root /, redirect to /store
    if (pathname === '/') {
      url.pathname = '/store';
      return NextResponse.rewrite(url);
    }
    
    // For any other path on bullmoney.shop, redirect to /store
    // This ensures only /store is accessible on this domain
    url.pathname = '/store';
    return NextResponse.redirect(url);
  }
  
  // For all other domains (bullmoney.online, etc.), allow normal routing
  return NextResponse.next();
}

/**
 * Middleware matcher configuration
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
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
