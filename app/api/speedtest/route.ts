/**
 * Ookla Speedtest API Route
 * 
 * Runs the official Ookla CLI speedtest and returns JSON results.
 * Falls back to Cloudflare-based HTTP speed test if the CLI is
 * unavailable or fails (works on Vercel, mobile, serverless, etc.).
 * 
 * Prerequisites for CLI mode:
 * - Install Ookla CLI: https://www.speedtest.net/apps/cli
 *   macOS: brew install speedtest-cli
 *   Ubuntu: apt-get install speedtest-cli
 *   Or download from https://install.speedtest.net/app/cli/ookla-speedtest-1.2.0-linux-x86_64.tgz
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const DEBUG_API_LOGS = process.env.DEBUG_API_LOGS === 'true';

const logInfo = (...args: unknown[]) => {
  if (DEBUG_API_LOGS) {
    console.log(...args);
  }
};

const logWarn = (...args: unknown[]) => {
  if (DEBUG_API_LOGS) {
    console.warn(...args);
  }
};

// Cache results to prevent abuse
const cache = new Map<string, { result: any; timestamp: number; ttl: number; status?: number }>();
const CACHE_TTL = 30000; // 30 seconds for successful results
const ERROR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for CLI errors
const CLI_FAILURE_TTL = 10 * 60 * 1000; // 10 minutes for socket/connection errors

// Track consecutive CLI failures to back off exponentially
let consecutiveCliFailures = 0;
let cliDisabledUntil = 0;
// If CLI is known to be missing, skip it permanently for this process lifetime
let cliKnownMissing = false;

// ─── Cloudflare HTTP Fallback ──────────────────────────────────────────────
// Uses Cloudflare's speed.cloudflare.com endpoints which work from any environment
// (serverless, containers, mobile proxied requests, etc.)

async function measureDownloadCF(bytes = 1_000_000): Promise<number> {
  const url = `https://speed.cloudflare.com/__down?bytes=${bytes}&ts=${Date.now()}`;
  const start = performance.now?.() ?? Date.now();
  const res = await fetch(url, { cache: 'no-store' });
  const buffer = await res.arrayBuffer();
  const elapsed = ((performance.now?.() ?? Date.now()) - start) / 1000;
  const mbps = (buffer.byteLength / 1024 / 1024 * 8) / Math.max(elapsed, 0.001);
  return Math.round(mbps * 100) / 100;
}

async function measureUploadCF(bytes = 500_000): Promise<number> {
  const payload = new Uint8Array(bytes);
  const url = `https://speed.cloudflare.com/__up?ts=${Date.now()}`;
  const start = performance.now?.() ?? Date.now();
  await fetch(url, { method: 'POST', body: payload, cache: 'no-store' });
  const elapsed = ((performance.now?.() ?? Date.now()) - start) / 1000;
  const mbps = (bytes / 1024 / 1024 * 8) / Math.max(elapsed, 0.001);
  return Math.round(mbps * 100) / 100;
}

async function measureLatencyCF(samples = 3): Promise<{ latency: number; jitter: number }> {
  const results: number[] = [];
  for (let i = 0; i < samples; i++) {
    const url = `https://speed.cloudflare.com/__down?bytes=64&ts=${Date.now()}-${i}`;
    const start = performance.now?.() ?? Date.now();
    try {
      await fetch(url, { cache: 'no-store' });
      results.push((performance.now?.() ?? Date.now()) - start);
    } catch {
      // skip failed probe
    }
  }
  if (results.length === 0) return { latency: 0, jitter: 0 };
  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  const jitter = results.length > 1
    ? results.reduce((s, v) => s + Math.abs(v - avg), 0) / results.length
    : 0;
  return { latency: Math.round(avg), jitter: Math.round(jitter * 10) / 10 };
}

async function runCloudfareFallback(): Promise<any> {
  logInfo('[Speedtest API] CLI unavailable — using Cloudflare fallback');
  const [download, upload, { latency, jitter }] = await Promise.all([
    measureDownloadCF(1_000_000),
    measureUploadCF(500_000),
    measureLatencyCF(3),
  ]);
  return {
    downMbps: download,
    upMbps: upload,
    latency,
    jitter,
    timestamp: Date.now(),
    source: 'cloudflare-fallback',
    server: {
      name: 'Cloudflare Edge',
      location: 'Nearest edge node',
      country: '',
      host: 'speed.cloudflare.com',
      id: 0,
    },
    client: {
      ip: '',
      isp: '',
    },
  };
}

// ─── CLI Speed Test ────────────────────────────────────────────────────────

async function runCliSpeedtest(serverId?: string | null): Promise<any> {
  let command = 'speedtest --accept-license --accept-gdpr --format=json --progress=no';
  if (serverId) {
    command += ` --server-id=${serverId}`;
  }

  logInfo('[Speedtest API] Running CLI:', command);

  const { stdout, stderr } = await execAsync(command, {
    timeout: 30000,
    maxBuffer: 1024 * 1024,
  });

  if (stderr && !stderr.includes('Speedtest')) {
    logWarn('[Speedtest API] stderr:', stderr);
  }

  const result = JSON.parse(stdout);

  return {
    downMbps: parseFloat((result.download.bandwidth * 8 / 1_000_000).toFixed(2)),
    upMbps: parseFloat((result.upload.bandwidth * 8 / 1_000_000).toFixed(2)),
    latency: result.ping.latency || 0,
    jitter: result.ping.jitter || 0,
    timestamp: Date.now(),
    source: 'ookla-cli',
    server: {
      name: result.server.name,
      location: result.server.location,
      country: result.server.country,
      host: result.server.host,
      id: result.server.id,
    },
    client: {
      ip: result.interface.externalIp,
      isp: result.isp,
    },
    raw: result,
  };
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const quick = searchParams.get('quick') === 'true';
  const serverId = searchParams.get('server');
  const cacheKey = `${quick}-${serverId || 'auto'}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return NextResponse.json(cached.result, { status: cached.status || 200 });
  }

  // ── Try CLI first (if available) ──────────────────────────────────────
  const cliAvailable = !cliKnownMissing && Date.now() >= cliDisabledUntil;

  if (cliAvailable) {
    try {
      const transformed = await runCliSpeedtest(serverId);

      // Success — reset failure counter
      consecutiveCliFailures = 0;
      cliDisabledUntil = 0;

      cache.set(cacheKey, { result: transformed, timestamp: Date.now(), ttl: CACHE_TTL });
      
      // Clean up old cache entries
      for (const [key, value] of cache.entries()) {
        if (Date.now() - value.timestamp > value.ttl) cache.delete(key);
      }

      logInfo('[Speedtest API] CLI result:', {
        down: transformed.downMbps,
        up: transformed.upMbps,
        ping: transformed.latency,
        server: transformed.server.name,
      });

      return NextResponse.json(transformed);
    } catch (cliError: any) {
      // Track failures and apply exponential backoff
      consecutiveCliFailures++;
      const backoffMs = Math.min(CLI_FAILURE_TTL, ERROR_CACHE_TTL * Math.pow(2, consecutiveCliFailures - 1));
      cliDisabledUntil = Date.now() + backoffMs;

      if (cliError.message.includes('not found') || cliError.message.includes('command not found')) {
        cliKnownMissing = true;
        logInfo('[Speedtest API] CLI not found — permanently using fallback');
      } else {
        console.warn(`✖ [Speedtest API] CLI failed (attempt ${consecutiveCliFailures}), falling back to Cloudflare:`, cliError.message);
      }
      // Fall through to Cloudflare fallback below
    }
  }

  // ── Cloudflare HTTP fallback ──────────────────────────────────────────
  try {
    const fallbackResult = await runCloudfareFallback();

    cache.set(cacheKey, { result: fallbackResult, timestamp: Date.now(), ttl: CACHE_TTL });

    // Clean up old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > value.ttl) cache.delete(key);
    }

    logInfo('[Speedtest API] Cloudflare fallback result:', {
      down: fallbackResult.downMbps,
      up: fallbackResult.upMbps,
      ping: fallbackResult.latency,
    });

    return NextResponse.json(fallbackResult);
  } catch (fallbackError: any) {
    console.error('✖ [Speedtest API] Both CLI and Cloudflare fallback failed:', fallbackError.message);

    const errorResult = {
      error: 'Speedtest failed',
      message: 'Both CLI and HTTP fallback unavailable.',
      timestamp: Date.now(),
    };

    cache.set(cacheKey, {
      result: errorResult,
      timestamp: Date.now(),
      ttl: 60000, // 1 minute cache for total failure
      status: 503,
    });

    return NextResponse.json(errorResult, { status: 503 });
  }
}

// POST method for triggering tests (same as GET but semantic)
export async function POST(request: NextRequest) {
  return GET(request);
}
