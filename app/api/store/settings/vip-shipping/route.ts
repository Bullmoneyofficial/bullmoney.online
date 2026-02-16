import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// VIP SHIPPING SETTING API
// Controls whether VIP products are charged shipping (in cart summary)
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
  .trim()
  .replace(/^['"]|['"]$/g, '')
  .toLowerCase();

const COLUMN = 'store_vip_shipping_charged';

async function ensureColumn() {
  const { error } = await supabase
    .from('site_settings')
    .select(COLUMN)
    .limit(1);

  if (error && error.message?.includes(COLUMN)) {
    const rpcResult = await supabase.rpc('exec_sql', {
      query: `ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS ${COLUMN} boolean DEFAULT true;`,
    });
    if (rpcResult.error) {
      console.warn(`Could not auto-add ${COLUMN} column via RPC. Add it manually.`);
    }
  }
}

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
 * GET – Public endpoint
 * Returns { charged: boolean }
 */
export async function GET() {
  try {
    await ensureColumn();
    await ensureRow();

    const { data, error } = await supabase
      .from('site_settings')
      .select(COLUMN)
      .limit(1)
      .single();

    if (error) {
      console.error('VIP shipping read error:', error);
      return NextResponse.json({ charged: true });
    }

    return NextResponse.json({ charged: data?.[COLUMN] !== false });
  } catch (err) {
    console.error('VIP shipping GET error:', err);
    return NextResponse.json({ charged: true });
  }
}

/**
 * PUT – Admin-only endpoint
 * Body: { charged: boolean }
 * Auth: x-admin-email + x-admin-token headers
 */
export async function PUT(request: NextRequest) {
  try {
    const adminEmail = (request.headers.get('x-admin-email') || '').trim().toLowerCase();
    const adminToken = request.headers.get('x-admin-token') || '';

    if (!adminEmail || adminEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (adminToken) {
      const { data: userData } = await supabase.auth.getUser(adminToken);
      if (!userData?.user || userData.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
      }
    }

    const body = await request.json();
    const charged = Boolean(body?.charged);

    await ensureColumn();
    await ensureRow();

    const { error } = await supabase
      .from('site_settings')
      .update({
        [COLUMN]: charged,
        updated_at: new Date().toISOString(),
      })
      .not('id', 'is', null);

    if (error) {
      console.error('VIP shipping update error:', error);
      return NextResponse.json({ error: 'Failed to update VIP shipping setting' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      charged,
      message: charged ? 'VIP products will be charged shipping' : 'VIP products will NOT be charged shipping',
    });
  } catch (err) {
    console.error('VIP shipping PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
