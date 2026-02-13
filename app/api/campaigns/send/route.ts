import { NextRequest, NextResponse } from 'next/server';
import { quickSend } from '@/lib/campaign-service';
import { CAMPAIGN_PRESETS } from '@/lib/campaign-types';

// ============================================================================
// CAMPAIGN QUICK SEND API
// Simple trigger endpoint for sending campaigns with minimal config
// 
// Examples:
//   POST /api/campaigns/send { "template": "store_promo", "audience": "all" }
//   POST /api/campaigns/send { "preset": "welcome_series", "send_now": true }
//   POST /api/campaigns/send { "template": "vip_promo", "audience": "recruits" }
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, preset, audience = 'all', subject } = body;

    // Use preset if provided
    if (preset) {
      const presetConfig = CAMPAIGN_PRESETS[preset];
      if (!presetConfig) {
        return NextResponse.json({
          error: `Unknown preset: "${preset}"`,
          available_presets: Object.keys(CAMPAIGN_PRESETS),
        }, { status: 400 });
      }

      const result = await quickSend({
        template_name: presetConfig.template_name || preset,
        audience: audience || presetConfig.audience || 'all',
        subject,
      });

      return NextResponse.json({
        success: true,
        message: `Campaign "${presetConfig.name}" is sending to ${audience}`,
        ...result,
      });
    }

    // Direct template send
    if (!template) {
      return NextResponse.json({
        error: 'Provide "template" or "preset"',
        available_templates: [
          'welcome', 'grand_launch', 'store_promo', 'vip_promo',
          'affiliate_promo', 'weekly_digest', 'flash_sale', 'new_product',
        ],
        available_presets: Object.keys(CAMPAIGN_PRESETS),
      }, { status: 400 });
    }

    const result = await quickSend({
      template_name: template,
      audience,
      subject,
    });

    return NextResponse.json({
      success: true,
      message: `Sending "${template}" to ${audience}`,
      ...result,
    });
  } catch (error) {
    console.error('[Campaign Send] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Show available templates and presets
export async function GET() {
  return NextResponse.json({
    templates: [
      'welcome', 'grand_launch', 'store_promo', 'vip_promo',
      'affiliate_promo', 'weekly_digest', 'flash_sale', 'new_product',
      'cryptoPaymentAdmin', 'cryptoPaymentCustomer', 'cryptoPaymentConfirmed',
    ],
    presets: Object.entries(CAMPAIGN_PRESETS).map(([key, val]) => ({
      id: key,
      name: val.name,
      description: val.description,
      type: val.type,
      audience: val.audience,
    })),
    audiences: ['all', 'recruits', 'vip', 'newsletter', 'custom'],
    usage: {
      quick_send: 'POST /api/campaigns/send { "template": "store_promo", "audience": "all" }',
      preset_send: 'POST /api/campaigns/send { "preset": "welcome_series" }',
      scheduled: 'POST /api/campaigns { "name": "...", "type": "blast", "template_name": "store_promo", "audience": "all", "scheduled_at": "2025-01-15T09:00:00Z" }',
    },
  });
}
