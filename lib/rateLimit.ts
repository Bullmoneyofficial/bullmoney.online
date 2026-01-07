/**
 * Rate Limiting Utility
 * Protects API routes from abuse with configurable limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Custom message to return when rate limit is exceeded
   */
  message?: string;

  /**
   * Custom status code (default: 429)
   */
  statusCode?: number;

  /**
   * Whether to skip rate limiting for certain IPs (e.g., localhost)
   */
  skip?: (req: NextRequest) => boolean;
}

// In-memory storage for rate limit records
// In production, use Redis or another distributed cache
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Clean up expired rate limit records periodically
 */
function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000);
}

/**
 * Get client identifier from request
 */
function getClientId(req: NextRequest): string {
  // Priority: x-forwarded-for > x-real-ip > remote address > unknown
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to 'unknown' if no IP headers are present
  return 'unknown';
}

/**
 * Rate limit middleware factory
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    limit,
    windowMs,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    skip,
  } = options;

  return async (
    req: NextRequest
  ): Promise<{ success: true } | { success: false; response: NextResponse }> => {
    // Skip rate limiting if skip function returns true
    if (skip && skip(req)) {
      return { success: true };
    }

    const clientId = getClientId(req);
    const now = Date.now();
    const key = `${req.nextUrl.pathname}:${clientId}`;

    // Get or create rate limit record
    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Create new record
      record = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now,
      };
      rateLimitStore.set(key, record);
      return { success: true };
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > limit) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      logger.warn(`Rate limit exceeded for ${clientId} on ${req.nextUrl.pathname}`);

      return {
        success: false,
        response: NextResponse.json(
          {
            error: message,
            retryAfter,
            limit,
            windowMs,
          },
          {
            status: statusCode,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
            },
          }
        ),
      };
    }

    // Update rate limit headers for successful request
    return { success: true };
  };
}

/**
 * Predefined rate limiters for common use cases
 */

// Strict - For sensitive endpoints (e.g., authentication)
export const strictRateLimit = rateLimit({
  limit: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many attempts, please try again in 15 minutes',
});

// Standard - For general API endpoints
export const standardRateLimit = rateLimit({
  limit: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many requests, please slow down',
});

// Lenient - For public read-only endpoints
export const lenientRateLimit = rateLimit({
  limit: 300,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Request limit exceeded',
});

// Skip localhost in development
const skipLocalhost = (req: NextRequest): boolean => {
  if (process.env.NODE_ENV === 'development') {
    const clientId = getClientId(req);
    return clientId === '::1' || clientId === '127.0.0.1' || clientId === 'localhost';
  }
  return false;
};

// Development-friendly rate limiter
export const devRateLimit = rateLimit({
  limit: 1000,
  windowMs: 15 * 60 * 1000,
  skip: skipLocalhost,
});

/**
 * Helper to apply rate limit in API route
 */
export async function applyRateLimit(
  req: NextRequest,
  limiter: (req: NextRequest) => Promise<{ success: boolean; response?: NextResponse }>
): Promise<NextResponse | null> {
  const result = await limiter(req);

  if (!result.success && result.response) {
    return result.response;
  }

  return null;
}

/**
 * Get rate limit status for a client
 */
export function getRateLimitStatus(req: NextRequest, route: string): {
  count: number;
  limit: number;
  remaining: number;
  resetTime: number;
} | null {
  const clientId = getClientId(req);
  const key = `${route}:${clientId}`;
  const record = rateLimitStore.get(key);

  if (!record) {
    return null;
  }

  // Note: This assumes you know the limit for the route
  // In a real implementation, you'd store the limit with the record
  return {
    count: record.count,
    limit: 100, // You'd get this from the rate limiter config
    remaining: Math.max(0, 100 - record.count),
    resetTime: record.resetTime,
  };
}
