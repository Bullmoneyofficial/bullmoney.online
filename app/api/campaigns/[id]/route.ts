import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaign,
  executeCampaign,
  updateCampaignStatus,
  deleteCampaign,
} from '@/lib/campaign-service';

// ============================================================================
// CAMPAIGN ACTIONS — Send, pause, cancel, delete individual campaigns
// POST: Execute action on a campaign
// GET:  Get campaign details
// DELETE: Delete a draft campaign
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action as string;

    const campaign = await getCampaign(id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    switch (action) {
      case 'send': {
        if (campaign.status === 'sent') {
          return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 });
        }
        // Execute async
        executeCampaign(id).catch((e) =>
          console.error(`[Campaign] Execute error for ${id}:`, e)
        );
        return NextResponse.json({
          success: true,
          message: `Campaign "${campaign.name}" is now sending`,
          campaign_id: id,
        });
      }

      case 'pause': {
        if (campaign.status !== 'scheduled') {
          return NextResponse.json({ error: 'Can only pause scheduled campaigns' }, { status: 400 });
        }
        await updateCampaignStatus(id, 'paused');
        return NextResponse.json({ success: true, message: 'Campaign paused' });
      }

      case 'resume': {
        if (campaign.status !== 'paused') {
          return NextResponse.json({ error: 'Campaign is not paused' }, { status: 400 });
        }
        await updateCampaignStatus(id, 'scheduled');
        return NextResponse.json({ success: true, message: 'Campaign resumed' });
      }

      case 'cancel': {
        await updateCampaignStatus(id, 'cancelled');
        return NextResponse.json({ success: true, message: 'Campaign cancelled' });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use: send, pause, resume, cancel` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Campaign Action] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await getCampaign(id);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteCampaign(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Campaign not found or cannot be deleted (only drafts/cancelled)' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
