import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

/**
 * Generates a unique affiliate code for a user
 * Format: First 3 letters of email + random alphanumeric suffix
 * Example: JOH-X7K9M2P (for john@example.com)
 */
function generateUniqueAffiliateCode(email: string): string {
  const emailPrefix = email
    .split('@')[0]
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, 'X'); // Replace non-letters with X

  // Generate random alphanumeric suffix (6 chars)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${emailPrefix}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    const email = String(body?.email || '').trim().toLowerCase();

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or email' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if user already has an affiliate code
    const { data: existing } = await supabase
      .from('recruits')
      .select('affiliate_code')
      .eq('id', userId)
      .single();

    if (existing?.affiliate_code && existing.affiliate_code.trim()) {
      // User already has a code, return it
      return NextResponse.json({
        success: true,
        affiliateCode: existing.affiliate_code,
        isNew: false,
      });
    }

    // Generate a new unique affiliate code
    let newCode = generateUniqueAffiliateCode(email);
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure the generated code is unique
    while (attempts < maxAttempts && !isUnique) {
      const { data: existing } = await supabase
        .from('recruits')
        .select('id')
        .eq('affiliate_code', newCode)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        // Regenerate if collision detected
        newCode = generateUniqueAffiliateCode(email);
        attempts++;
      }
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate unique affiliate code' },
        { status: 500 }
      );
    }

    // Update user with new affiliate code
    const { error } = await supabase
      .from('recruits')
      .update({ affiliate_code: newCode })
      .eq('id', userId);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to save affiliate code' },
        { status: 500 }
      );
    }

    console.log(`[AffiliateCodeGen] Generated code for user ${userId}: ${newCode}`);

    return NextResponse.json({
      success: true,
      affiliateCode: newCode,
      isNew: true,
    });
  } catch (error) {
    console.error('[AffiliateCodeGen] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
