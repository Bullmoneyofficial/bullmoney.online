import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { encryptValue } from '@/lib/crypto-encryption';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const mt5Id = String(body?.mt5_id || body?.mt5Number || '').trim();
    const referralCode = String(body?.referred_by_code || body?.referralCode || '').trim();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from('recruits')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const encryptedPassword = encryptValue(password);

    const insertPayload: Record<string, any> = {
      email,
      password_hash: passwordHash,
      password: encryptedPassword,
      referred_by_code: referralCode || null,
      used_code: true,
    };

    if (mt5Id) insertPayload.mt5_id = mt5Id;

    const { data: recruit, error } = await supabase
      .from('recruits')
      .insert([insertPayload])
      .select('id, email, mt5_id, is_vip')
      .single();

    if (error || !recruit) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create recruit' }, { status: 500 });
    }

    return NextResponse.json({ success: true, recruit });
  } catch (error) {
    console.error('[RecruitAuth] Register error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
