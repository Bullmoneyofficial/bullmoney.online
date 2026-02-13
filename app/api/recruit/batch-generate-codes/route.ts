import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

const ADMIN_SECRET = process.env.AFFILIATE_BATCH_SECRET || 'change-this-in-prod';

/**
 * Generates a unique affiliate code for a user
 * Format: First 3 letters of email + random alphanumeric suffix
 * Example: JOH-X7K9M2P (for john@example.com)
 */
function generateCode(email: string): string {
  const emailPrefix = email
    .split('@')[0]
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, 'X');

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${emailPrefix}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin secret
    const authHeader = request.headers.get('Authorization') || '';
    const providedSecret = authHeader.replace('Bearer ', '');

    if (providedSecret !== ADMIN_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get all users without affiliate codes
    const { data: usersWithoutCodes, error: fetchError } = await supabase
      .from('recruits')
      .select('id, email, affiliate_code')
      .or('affiliate_code.is.null,affiliate_code.eq.""')
      .limit(10000);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!usersWithoutCodes || usersWithoutCodes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All users already have affiliate codes',
        generated: 0,
        failed: 0,
        details: [],
      });
    }

    console.log(`[BatchGenerateCodes] Found ${usersWithoutCodes.length} users without codes`);

    // Track generated codes to avoid duplicates
    const generatedCodes = new Set<string>();
    const updates: Record<number, string> = {};
    const failures: Array<{ id: number; email: string; reason: string }> = [];
    const existingCodes = await supabase
      .from('recruits')
      .select('affiliate_code')
      .not('affiliate_code', 'is', null);

    if (existingCodes.data) {
      existingCodes.data.forEach((record: any) => {
        if (record.affiliate_code) {
          generatedCodes.add(record.affiliate_code);
        }
      });
    }

    // Generate codes for each user
    for (const user of usersWithoutCodes) {
      if (!user.email) {
        failures.push({
          id: user.id,
          email: user.email || 'unknown',
          reason: 'No email address',
        });
        continue;
      }

      let newCode = generateCode(user.email);
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure uniqueness
      while (attempts < maxAttempts && generatedCodes.has(newCode)) {
        newCode = generateCode(user.email);
        attempts++;
      }

      if (attempts >= maxAttempts) {
        failures.push({
          id: user.id,
          email: user.email,
          reason: 'Could not generate unique code after 10 attempts',
        });
        continue;
      }

      updates[user.id] = newCode;
      generatedCodes.add(newCode);
    }

    // Batch update database
    let successCount = 0;
    const updatePromises = Object.entries(updates).map(([userId, code]) =>
      supabase
        .from('recruits')
        .update({ affiliate_code: code })
        .eq('id', Number(userId))
        .then(({ error }) => {
          if (error) {
            failures.push({
              id: Number(userId),
              email: usersWithoutCodes.find((u) => u.id === Number(userId))?.email || 'unknown',
              reason: error.message,
            });
            return false;
          }
          successCount++;
          return true;
        })
    );

    await Promise.all(updatePromises);

    console.log(
      `[BatchGenerateCodes] ✓ Generated ${successCount} codes, ${failures.length} failures`
    );

    return NextResponse.json({
      success: true,
      message: `Generated affiliate codes for ${successCount} users`,
      generated: successCount,
      failed: failures.length,
      total_processed: usersWithoutCodes.length,
      failures: failures.length > 0 ? failures.slice(0, 10) : [],
      details: {
        samples: Object.entries(updates)
          .slice(0, 5)
          .map(([userId, code]) => ({
            userId: Number(userId),
            code,
            email: usersWithoutCodes.find((u) => u.id === Number(userId))?.email,
          })),
      },
    });
  } catch (error: any) {
    console.error('[BatchGenerateCodes] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check status/count
export async function GET(request: NextRequest) {
  try {
    // Verify admin secret
    const authHeader = request.headers.get('Authorization') || '';
    const providedSecret = authHeader.replace('Bearer ', '');

    if (providedSecret !== ADMIN_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Count users without codes
    const { data: usersWithoutCodes, error: countError } = await supabase
      .from('recruits')
      .select('id', { count: 'exact', head: true })
      .or('affiliate_code.is.null,affiliate_code.eq.""');

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 500 }
      );
    }

    // Count users with codes
    const { data: usersWithCodes, error: withError } = await supabase
      .from('recruits')
      .select('id', { count: 'exact', head: true })
      .not('affiliate_code', 'is', null);

    if (withError) {
      return NextResponse.json(
        { success: false, error: withError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: {
        without_codes: usersWithoutCodes?.length || 0,
        with_codes: usersWithCodes?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('[BatchGenerateCodes] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
