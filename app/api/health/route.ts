/**
 * ✅ HEALTH CHECK ENDPOINT
 * 
 * Used by hosting platforms (Render, Vercel) to check app health.
 * Edge runtime ensures 0ms cold start.
 */
export const runtime = 'edge';

export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    region: process.env.VERCEL_REGION || process.env.RENDER_REGION || 'unknown',
    env: process.env.NODE_ENV,
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
