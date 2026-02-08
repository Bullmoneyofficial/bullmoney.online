import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// ADMIN: FETCH RECRUITS BY EMAIL
// POST /api/crypto-payment/admin/recruits
// Body: { emails: string[] }
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

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { emails } = await request.json();
    const list = Array.isArray(emails) ? emails : [];
    const normalized = list
      .filter(Boolean)
      .map((email: string) => email.toLowerCase())
      .slice(0, 200);

    if (normalized.length === 0) {
      return NextResponse.json({ recruits: [] });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('recruits')
      .select('id, email, full_name, username, is_vip, status, affiliate_code, created_at')
      .in('email', normalized);

    if (error) {
      console.error('[AdminRecruits] Query error:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    return NextResponse.json({ recruits: data || [] });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
