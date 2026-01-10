import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number;
}

const rateLimitMap = new Map<string, number[]>();

export function rateLimit(config: RateLimitConfig) {
  return {
    check: (req: NextRequest, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenKey = `${token}`;
        const now = Date.now();
        const timestamps = rateLimitMap.get(tokenKey) || [];

        // Filter out timestamps outside the interval window
        const validTimestamps = timestamps.filter(
          (timestamp) => now - timestamp < config.interval
        );

        if (validTimestamps.length >= limit) {
          reject(new Error("Rate limit exceeded"));
        } else {
          validTimestamps.push(now);
          rateLimitMap.set(tokenKey, validTimestamps);

          // Cleanup old entries to prevent memory leaks
          if (rateLimitMap.size > config.uniqueTokenPerInterval) {
            const firstKey = rateLimitMap.keys().next().value;
            if (firstKey !== undefined) {
              rateLimitMap.delete(firstKey);
            }
          }

          resolve();
        }
      }),
  };
}

// Helper function to get client IP or identifier
function getClientIdentifier(req: NextRequest): string {
  return req.headers.get("x-forwarded-for") ||
         req.headers.get("x-real-ip") ||
         "anonymous";
}

// Rate limit wrapper that matches the expected API
async function rateLimitWrapper(limiterInstance: ReturnType<typeof rateLimit>, req: NextRequest, limit: number = 10) {
  try {
    const token = getClientIdentifier(req);
    await limiterInstance.check(req, limit, token);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      ),
    };
  }
}

// Default rate limiter: 10 requests per 60 seconds
const limiterInstance = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

export const limiter = (req: NextRequest, limit?: number) =>
  rateLimitWrapper(limiterInstance, req, limit);

// Lenient rate limiter: 20 requests per 60 seconds
const lenientInstance = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
});

export const lenientRateLimit = (req: NextRequest, limit: number = 20) =>
  rateLimitWrapper(lenientInstance, req, limit);

// Standard rate limiter: 10 requests per 60 seconds
const standardInstance = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
});

export const standardRateLimit = (req: NextRequest, limit: number = 10) =>
  rateLimitWrapper(standardInstance, req, limit);

// Strict rate limiter: 5 requests per 60 seconds
const strictInstance = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
});

export const strictRateLimit = (req: NextRequest, limit: number = 5) =>
  rateLimitWrapper(strictInstance, req, limit);

export default limiter;
