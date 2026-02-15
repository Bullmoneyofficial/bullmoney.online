/**
 * ✅ COLD START PREVENTION: Warmup endpoint
 * 
 * This endpoint is called by cron jobs and client-side warmup utilities
 * to keep the serverless functions warm and prevent cold starts.
 * 
 * Edge runtime = 0ms cold start (always hot)
 */
export const runtime = 'edge';

// Revalidate every 30 seconds (keeps function hot)
export const revalidate = 30;

export async function GET() {
  const timestamp = Date.now();
  
  return Response.json({
    status: 'warm',
    timestamp,
    region: process.env.VERCEL_REGION || 'unknown',
    runtime: 'edge',
    uptime: process.uptime?.() || 'N/A',
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Warmup-Time': timestamp.toString(),
    },
  });
}

// Also support HEAD requests for faster pings
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Warmup-Time': Date.now().toString(),
    },
  });
}
