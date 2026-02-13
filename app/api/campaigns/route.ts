import { NextRequest, NextResponse } from 'next/server';
import {
  createCampaign,
  listCampaigns,
  quickSend,
} from '@/lib/campaign-service';
import { CAMPAIGN_PRESETS } from '@/lib/campaign-types';
import type { CampaignCreateRequest, CampaignStatus } from '@/lib/campaign-types';

// ============================================================================
// CAMPAIGNS API — Create, list, and quick-send email campaigns
// POST: Create a new campaign (or send immediately)
// GET:  List campaigns with optional status filter
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Quick-send mode: just provide template_name + audience
    if (body.quick_send) {
      const result = await quickSend({
        template_name: body.template_name,
        audience: body.audience || 'all',
        subject: body.subject,
      });
      return NextResponse.json({ success: true, ...result });
    }

    // Preset mode: use a pre-built campaign template
    if (body.preset) {
      const preset = CAMPAIGN_PRESETS[body.preset];
      if (!preset) {
        return NextResponse.json(
          { error: `Unknown preset: ${body.preset}. Available: ${Object.keys(CAMPAIGN_PRESETS).join(', ')}` },
          { status: 400 }
        );
      }
      const req: CampaignCreateRequest = {
        ...preset,
        name: body.name || preset.name || body.preset,
        type: preset.type || 'blast',
        audience: body.audience || preset.audience || 'all',
        scheduled_at: body.scheduled_at,
        send_now: body.send_now || false,
      } as CampaignCreateRequest;

      const campaign = await createCampaign(req);
      return NextResponse.json({ success: true, campaign });
    }

    // Full campaign creation
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'name and type are required. type: blast | drip | triggered | recurring' },
        { status: 400 }
      );
    }

    const campaign = await createCampaign(body as CampaignCreateRequest);
    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error('[Campaigns API] POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CampaignStatus | null;

    const campaigns = await listCampaigns(status || undefined);

    return NextResponse.json({
      success: true,
      campaigns,
      presets: Object.keys(CAMPAIGN_PRESETS),
      count: campaigns.length,
    });
  } catch (error) {
    console.error('[Campaigns API] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
