/**
 * Authentication & Authorization Middleware
 * Provides secure authentication for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Initialize Supabase client for server-side auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

// Use service role key for admin operations, anon key as fallback
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseKey) {
  throw new Error('Missing Supabase authentication keys');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Admin credentials from environment
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN;

/**
 * Verify user authentication from request headers
 */
export async function verifyAuth(request: NextRequest): Promise<{
  authenticated: boolean;
  user?: any;
  error?: string;
}> {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'Missing or invalid authorization header',
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      logger.warn('Authentication failed:', error?.message || 'No user found');
      return {
        authenticated: false,
        error: 'Invalid or expired token',
      };
    }

    return {
      authenticated: true,
      user: data.user,
    };
  } catch (error: any) {
    logger.error('Auth verification error:', error);
    return {
      authenticated: false,
      error: 'Authentication verification failed',
    };
  }
}

/**
 * Verify admin access
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{
  authenticated: boolean;
  isAdmin: boolean;
  user?: any;
  error?: string;
}> {
  const authResult = await verifyAuth(request);

  if (!authResult.authenticated) {
    return {
      authenticated: false,
      isAdmin: false,
      error: authResult.error,
    };
  }

  // Check if user is admin
  const isAdmin = authResult.user?.email === ADMIN_EMAIL;

  if (!isAdmin) {
    logger.warn(`Unauthorized admin access attempt by ${authResult.user?.email}`);
    return {
      authenticated: true,
      isAdmin: false,
      user: authResult.user,
      error: 'Insufficient permissions',
    };
  }

  return {
    authenticated: true,
    isAdmin: true,
    user: authResult.user,
  };
}

/**
 * Verify admin PIN for critical operations
 */
export function verifyAdminPin(pin: string): boolean {
  if (!ADMIN_PIN) {
    logger.error('ADMIN_PIN not configured');
    return false;
  }

  return pin === ADMIN_PIN;
}

/**
 * Middleware to protect routes requiring authentication
 */
export async function requireAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  const authResult = await verifyAuth(request);

  if (!authResult.authenticated) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        message: authResult.error || 'Please provide valid credentials',
      },
      { status: 401 }
    );
  }

  return null; // Auth successful, allow request to proceed
}

/**
 * Middleware to protect routes requiring admin access
 */
export async function requireAdmin(
  request: NextRequest
): Promise<NextResponse | null> {
  const adminResult = await verifyAdminAuth(request);

  if (!adminResult.authenticated) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        message: adminResult.error || 'Please provide valid credentials',
      },
      { status: 401 }
    );
  }

  if (!adminResult.isAdmin) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Admin access required',
      },
      { status: 403 }
    );
  }

  return null; // Admin auth successful
}

/**
 * Helper to get authenticated user from request
 */
export async function getAuthUser(request: NextRequest): Promise<any | null> {
  const authResult = await verifyAuth(request);
  return authResult.authenticated ? authResult.user : null;
}

/**
 * Generate a secure token for API access
 * This can be used for server-to-server communication
 */
export function generateApiKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Rate limit specific to authenticated endpoints
 */
export interface AuthRateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

const failedAuthAttempts = new Map<string, { count: number; resetTime: number }>();

export async function checkAuthRateLimit(
  identifier: string,
  options: AuthRateLimitOptions = { maxAttempts: 5, windowMs: 15 * 60 * 1000 }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const record = failedAuthAttempts.get(identifier);

  if (!record || now > record.resetTime) {
    failedAuthAttempts.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return { allowed: true };
  }

  record.count++;

  if (record.count > options.maxAttempts) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

/**
 * Clear failed auth attempts for identifier (call on successful auth)
 */
export function clearAuthAttempts(identifier: string): void {
  failedAuthAttempts.delete(identifier);
}
