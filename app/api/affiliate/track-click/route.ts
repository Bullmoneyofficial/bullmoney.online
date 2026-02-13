import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const affiliateCode = String(body?.affiliateCode || body?.ref || '').trim();

    if (!affiliateCode) {
      return NextResponse.json({ success: false, error: 'Missing affiliate code' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: affiliate, error: lookupError } = await supabase
      .from('recruits')
      .select('id, link_clicks')
      .eq('affiliate_code', affiliateCode)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ success: false, error: lookupError.message }, { status: 500 });
    }

    if (!affiliate?.id) {
      return NextResponse.json({ success: false, error: 'Affiliate not found' }, { status: 404 });
    }

    const nextClicks = Number(affiliate.link_clicks || 0) + 1;

    const { error: updateError } = await supabase
      .from('recruits')
      .update({
        link_clicks: nextClicks,
        link_last_clicked: new Date().toISOString(),
      })
      .eq('id', affiliate.id);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, link_clicks: nextClicks });
  } catch (error) {
    console.error('[AffiliateTrack] Click tracking error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
