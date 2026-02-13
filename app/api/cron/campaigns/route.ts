import { NextRequest, NextResponse } from 'next/server';
import { processScheduledCampaigns, ensureDailySeoCampaign } from '@/lib/campaign-service';

// ============================================================================
// CAMPAIGN CRON JOB
// Called by Vercel Cron every 15 minutes to process scheduled campaigns
// Also processes recurring campaigns that are due
// ============================================================================

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for batch sends

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const cronHeader = request.headers.get('x-vercel-cron');
    if (!cronHeader) {
      // Allow without auth in development
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  console.log('[Campaign Cron] Processing scheduled campaigns...');

  try {
    await ensureDailySeoCampaign();
    const result = await processScheduledCampaigns();

    const duration = Date.now() - startTime;
    console.log(`[Campaign Cron] Done in ${duration}ms: ${result.processed} processed, ${result.sent} sent, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      ...result,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('[Campaign Cron] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Allow POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}
