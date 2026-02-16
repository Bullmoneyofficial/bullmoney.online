import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// STORE DISPLAY MODE API
// Controls whether the store shows regular products or VIP products globally
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
  .trim()
  .replace(/^['"]|['"]$/g, '')
  .toLowerCase();

// Helper: ensure the store_display_mode column exists in site_settings
async function ensureColumn() {
  // Try to read – if the column doesn't exist Supabase returns an error we can detect
  const { error } = await supabase
    .from('site_settings')
    .select('store_display_mode')
    .limit(1);

  if (error && error.message?.includes('store_display_mode')) {
    // Column missing – add it via raw SQL (service-role has permission)
    const rpcResult = await supabase.rpc('exec_sql', {
      query: `ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS store_display_mode text DEFAULT 'global';`,
    });
    if (rpcResult.error) {
      // If RPC doesn't exist, that's okay – we'll handle it with a fallback
      console.warn('Could not auto-add store_display_mode column via RPC. Add it manually.');
    }
  }
}

// Ensure at least one row exists in site_settings
async function ensureRow() {
  const { data } = await supabase
    .from('site_settings')
    .select('id')
    .limit(1);

  if (!data || data.length === 0) {
    await supabase.from('site_settings').insert({
      site_name: 'BullMoney',
      site_tagline: 'Elite Trading Community',
    });
  }
}

/**
 * GET – Public endpoint to read current store display mode
 * Returns { mode: 'global' | 'vip' | 'timer', timer_end?: string, timer_headline?: string, timer_subtext?: string }
 */
export async function GET() {
  try {
    await ensureColumn();
    await ensureRow();

    const { data, error } = await supabase
      .from('site_settings')
      .select('store_display_mode, store_timer_end, store_timer_headline, store_timer_subtext')
      .limit(1)
      .single();

    if (error) {
      console.error('Display mode read error:', error);
      return NextResponse.json({ mode: 'global' });
    }

    const response: Record<string, unknown> = {
      mode: data?.store_display_mode || 'global',
    };

    if (data?.store_display_mode === 'timer') {
      response.timer_end = data.store_timer_end || null;
      response.timer_headline = data.store_timer_headline || 'Something big is coming';
      response.timer_subtext = data.store_timer_subtext || 'New products dropping soon. Stay tuned.';
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('Display mode GET error:', err);
    return NextResponse.json({ mode: 'global' });
  }
}

/**
 * PUT – Admin-only endpoint to update the store display mode
 * Body: { mode: 'global' | 'vip' | 'timer', timer_end?: string, timer_headline?: string, timer_subtext?: string }
 * Auth: x-admin-email + x-admin-token headers
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin auth
    const adminEmail = (request.headers.get('x-admin-email') || '').trim().toLowerCase();
    const adminToken = request.headers.get('x-admin-token') || '';

    if (!adminEmail || adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token is a valid Supabase session for the admin email
    if (adminToken) {
      const { data: userData } = await supabase.auth.getUser(adminToken);
      if (!userData?.user || userData.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
      }
    }

    const body = await request.json();
    const mode = body.mode;

    if (!mode || !['global', 'vip', 'timer'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "global", "vip", or "timer".' },
        { status: 400 }
      );
    }

    // Validate timer fields when timer mode is selected
    if (mode === 'timer' && !body.timer_end) {
      return NextResponse.json(
        { error: 'timer_end is required when mode is "timer".' },
        { status: 400 }
      );
    }

    await ensureColumn();
    await ensureRow();

    const updatePayload: Record<string, unknown> = {
      store_display_mode: mode,
      updated_at: new Date().toISOString(),
    };

    if (mode === 'timer') {
      updatePayload.store_timer_end = body.timer_end;
      updatePayload.store_timer_headline = body.timer_headline || 'Something big is coming';
      updatePayload.store_timer_subtext = body.timer_subtext || 'New products dropping soon. Stay tuned.';
    }

    // Update mode for all rows (should be just one)
    const { error } = await supabase
      .from('site_settings')
      .update(updatePayload)
      .not('id', 'is', null); // Update all rows

    if (error) {
      console.error('Display mode update error:', error);
      return NextResponse.json(
        { error: 'Failed to update display mode' },
        { status: 500 }
      );
    }

    const messages: Record<string, string> = {
      vip: 'Store now shows VIP products for all users',
      global: 'Store now shows regular products for all users',
      timer: 'Store now shows countdown timer – all products hidden',
    };

    return NextResponse.json({
      success: true,
      mode,
      message: messages[mode],
    });
  } catch (err) {
    console.error('Display mode PUT error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
