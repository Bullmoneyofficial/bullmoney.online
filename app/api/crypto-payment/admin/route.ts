import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptValue } from '@/lib/crypto-encryption';

// ============================================================================
// ADMIN: LIST/MANAGE CRYPTO PAYMENTS
// GET  /api/crypto-payment/admin?status=pending&limit=50
// PATCH — Update payment status (admin manual override)
//
// Auth: CRON_SECRET bearer token OR x-admin-email + x-admin-token header
// ============================================================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

// Verify admin access — requires BOTH admin email AND admin token
function isAdminAuthorized(request: NextRequest): boolean {
  // Allow CRON_SECRET bearer token
  const cronSecret = process.env.CRON_SECRET;
  const bearerAuth = request.headers.get('authorization');
  if (cronSecret && bearerAuth === `Bearer ${cronSecret}`) return true;

  // Admin email + token check
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const adminToken = process.env.ADMIN_API_TOKEN; // Add this env var for security
  const authEmail = request.headers.get('x-admin-email');
  const authToken = request.headers.get('x-admin-token');

  if (!adminEmail || !authEmail) return false;
  if (authEmail !== adminEmail) return false;
  
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && !adminToken) return false;
  if (!adminToken) return true;
  if (authToken !== adminToken) return false;
  
  return true;
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // pending, confirmed, failed, etc.
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('crypto_payments')
      .select('*', { count: 'exact' })
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[AdminCrypto] Query error:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    // Summary stats
    const { data: stats } = await supabase
      .from('crypto_payments')
      .select('status')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        data?.forEach((p) => {
          counts[p.status] = (counts[p.status] || 0) + 1;
        });
        return { data: counts };
      });

    const payments = (data || []).map((p: any) => ({
      ...p,
      guest_email: decryptValue(p.guest_email),
      tx_hash: decryptValue(p.tx_hash),
      wallet_address: decryptValue(p.wallet_address),
      sender_wallet: decryptValue(p.sender_wallet),
    }));

    return NextResponse.json({
      payments,
      total: count,
      stats,
      limit,
      offset,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH: Update payment status (admin manual override)
export async function PATCH(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { paymentId, status, adminNotes } = body;
    const adminEmail =
      request.headers.get('x-admin-email') ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      'admin';

    if (!paymentId || !status) {
      return NextResponse.json({ error: 'paymentId and status required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirming', 'confirmed', 'underpaid', 'overpaid', 'failed', 'expired', 'manual_review'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from('crypto_payments')
      .select('status, order_number')
      .eq('id', paymentId)
      .maybeSingle();

    const updateData: Record<string, unknown> = {
      status,
      admin_reviewed_by: adminEmail,
      admin_reviewed_at: new Date().toISOString(),
    };

    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('crypto_payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Update failed', details: error.message }, { status: 500 });
    }

    if (existing) {
      await supabase.from('crypto_payment_audit').insert({
        payment_id: paymentId,
        order_number: existing.order_number,
        previous_status: existing.status,
        new_status: status,
        admin_email: adminEmail,
        admin_notes: adminNotes || null,
      });
    }

    return NextResponse.json({ success: true, payment: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
