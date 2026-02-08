import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// ADMIN: LIST CRYPTO REFUNDS
// GET /api/crypto-payment/refund/admin?status=requested&limit=50
// Auth: CRON_SECRET bearer token OR x-admin-email + x-admin-token header
// ============================================================================

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

function isAdminAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const bearerAuth = request.headers.get('authorization');
  if (cronSecret && bearerAuth === `Bearer ${cronSecret}`) return true;

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const adminToken = process.env.ADMIN_API_TOKEN;
  const authEmail = request.headers.get('x-admin-email');
  const authToken = request.headers.get('x-admin-token');

  if (!adminEmail || !authEmail) return false;
  if (authEmail !== adminEmail) return false;
  if (adminToken && authToken !== adminToken) return false;

  return true;
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('crypto_refunds')
      .select('*', { count: 'exact' })
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[AdminRefunds] Query error:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    return NextResponse.json({
      refunds: data,
      total: count,
      limit,
      offset,
    });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
