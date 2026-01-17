import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics API Endpoint
 * 
 * Receives analytics events from the client (especially via sendBeacon on page unload).
 * This is a fallback for when Vercel Analytics can't capture events directly.
 * 
 * Events are logged and can be forwarded to additional analytics services.
 */

// Rate limiting: Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // Max requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

// Bot detection patterns
const BOT_PATTERNS = [
  'bot', 'crawler', 'spider', 'scraper', 'headless',
  'puppeteer', 'playwright', 'selenium', 'phantomjs',
  'googlebot', 'bingbot', 'yandex', 'baidu',
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Rate limit check
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || '';
    
    // Skip bot traffic
    if (isBot(userAgent)) {
      return NextResponse.json({ success: true, skipped: 'bot' });
    }
    
    // Parse request body
    let data;
    try {
      const text = await request.text();
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!data.event) {
      return NextResponse.json(
        { error: 'Missing event name' },
        { status: 400 }
      );
    }
    
    // Log the event (in production, you might send to a database or external service)
    console.log('[Analytics API]', {
      event: data.event,
      timestamp: new Date().toISOString(),
      ip: ip.slice(0, 10) + '...', // Partially mask IP for privacy
      userAgent: userAgent.slice(0, 50) + '...',
      data: data,
    });
    
    // Here you could forward to:
    // - A database (MongoDB, PostgreSQL, etc.)
    // - External analytics service (Mixpanel, Amplitude, etc.)
    // - Data warehouse (BigQuery, Snowflake, etc.)
    
    // Example: Forward to external analytics
    // await sendToExternalAnalytics(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
