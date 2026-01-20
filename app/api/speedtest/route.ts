/**
 * Ookla Speedtest API Route
 * 
 * Runs the official Ookla CLI speedtest and returns JSON results.
 * This uses the EXACT same servers and logic as speedtest.net,
 * guaranteeing matching results.
 * 
 * Prerequisites:
 * - Install Ookla CLI: https://www.speedtest.net/apps/cli
 *   macOS: brew install speedtest-cli
 *   Ubuntu: apt-get install speedtest-cli
 *   Or download from https://install.speedtest.net/app/cli/ookla-speedtest-1.2.0-linux-x86_64.tgz
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Cache results for 10 seconds to prevent abuse
const cache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quick = searchParams.get('quick') === 'true';
    const serverId = searchParams.get('server'); // Optional: target specific server
    
    // Check cache
    const cacheKey = `${quick}-${serverId || 'auto'}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.result);
    }

    // Build speedtest command
    // --accept-license --accept-gdpr: auto-accept on first run
    // --format=json: output JSON
    // --progress=no: disable progress bar
    let command = 'speedtest --accept-license --accept-gdpr --format=json --progress=no';
    
    if (serverId) {
      command += ` --server-id=${serverId}`;
    }

    console.log('[Speedtest API] Running:', command);
    
    // Run the official Ookla CLI speedtest
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    if (stderr && !stderr.includes('Speedtest')) {
      console.warn('[Speedtest API] stderr:', stderr);
    }

    // Parse JSON output
    const result = JSON.parse(stdout);
    
    // Transform to our expected format
    const transformed = {
      downMbps: parseFloat((result.download.bandwidth * 8 / 1_000_000).toFixed(2)),
      upMbps: parseFloat((result.upload.bandwidth * 8 / 1_000_000).toFixed(2)),
      latency: result.ping.latency || 0,
      jitter: result.ping.jitter || 0,
      timestamp: Date.now(),
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
      // Include raw result for debugging
      raw: result,
    };

    // Cache the result
    cache.set(cacheKey, { result: transformed, timestamp: Date.now() });

    // Clean up old cache entries
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }

    console.log('[Speedtest API] Result:', {
      down: transformed.downMbps,
      up: transformed.upMbps,
      ping: transformed.latency,
      server: transformed.server.name,
    });

    return NextResponse.json(transformed);
  } catch (error: any) {
    console.error('[Speedtest API] Error:', error.message);
    
    // Check if speedtest CLI is not installed
    if (error.message.includes('not found') || error.message.includes('command not found')) {
      return NextResponse.json(
        {
          error: 'Speedtest CLI not installed',
          message: 'Install from: https://www.speedtest.net/apps/cli',
          instructions: {
            macOS: 'brew install speedtest-cli',
            linux: 'apt-get install speedtest-cli or download from https://install.speedtest.net',
            windows: 'Download from https://install.speedtest.net',
          },
        },
        { status: 503 }
      );
    }

    // Timeout error
    if (error.killed || error.message.includes('timeout')) {
      return NextResponse.json(
        {
          error: 'Speedtest timeout',
          message: 'Test took too long (>60s)',
        },
        { status: 504 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Speedtest failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST method for triggering tests (same as GET but semantic)
export async function POST(request: NextRequest) {
  return GET(request);
}
