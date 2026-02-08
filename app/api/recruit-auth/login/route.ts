import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { decryptValue, encryptValue } from '@/lib/crypto-encryption';

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

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: recruit, error } = await supabase
      .from('recruits')
      .select('id, created_at, email, mt5_id, is_vip, affiliate_code, referred_by_code, social_handle, task_broker_verified, task_social_verified, status, commission_balance, total_referred_manual, used_code, image_url, password, password_hash')
      .ilike('email', email)
      .maybeSingle();

    if (error || !recruit) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    const storedHash = recruit.password_hash as string | null;
    const storedPassword = recruit.password as string | null;
    const decryptedPassword = decryptValue(storedPassword || '') || storedPassword;

    let ok = false;
    if (storedHash) {
      ok = await bcrypt.compare(password, storedHash);
    } else if (decryptedPassword) {
      ok = decryptedPassword === password;
    }

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Lazy-migrate to hashed + encrypted password
    if (!storedHash) {
      const passwordHash = await bcrypt.hash(password, 10);
      const encrypted = encryptValue(password);
      await supabase
        .from('recruits')
        .update({ password_hash: passwordHash, password: encrypted })
        .eq('id', recruit.id);
    }

    return NextResponse.json({
      success: true,
      recruit: {
        id: recruit.id,
        created_at: recruit.created_at,
        email: recruit.email,
        mt5_id: recruit.mt5_id,
        affiliate_code: recruit.affiliate_code,
        referred_by_code: recruit.referred_by_code,
        social_handle: recruit.social_handle,
        task_broker_verified: recruit.task_broker_verified === true || recruit.task_broker_verified === 'true',
        task_social_verified: recruit.task_social_verified === true || recruit.task_social_verified === 'true',
        status: recruit.status || 'Pending',
        commission_balance: parseFloat(recruit.commission_balance as any) || 0,
        total_referred_manual: recruit.total_referred_manual,
        used_code: recruit.used_code === true || recruit.used_code === 'true',
        image_url: recruit.image_url,
        is_vip: recruit.is_vip === true,
      },
    });
  } catch (error) {
    console.error('[RecruitAuth] Login error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
