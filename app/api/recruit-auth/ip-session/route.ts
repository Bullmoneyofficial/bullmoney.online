import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

// Get client IP from headers (works with Vercel)
function getClientIP(req: NextRequest): string {
  // Vercel/production: x-forwarded-for contains the real client IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first one
    return forwarded.split(',')[0].trim();
  }
  
  // Fallback headers
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') || // Cloudflare
    req.headers.get('true-client-ip') ||   // Akamai
    'unknown'
  );
}

// Get device ID from request (sent by client-side fingerprinting)
function getDeviceId(req: NextRequest): string | null {
  return req.headers.get('x-device-id') || null;
}

// Table name for IP sessions (uses Supabase)
const IP_SESSIONS_TABLE = 'ip_sessions';

/**
 * GET: Check if there's an existing session for the current device
 * Uses device fingerprint as primary identifier (works across networks, incognito)
 */
export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const deviceId = getDeviceId(request);
    
    // Device ID is required for session lookup
    if (!deviceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No device fingerprint provided',
        hasSession: false 
      });
    }

    const supabase = getSupabaseAdmin();

    // Look up session by device ID (primary) - not IP
    const { data: session, error: sessionError } = await supabase
      .from(IP_SESSIONS_TABLE)
      .select('*')
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('[IP Session] Lookup error:', sessionError);
      // Table might not exist yet - return no session
      return NextResponse.json({ 
        success: true, 
        hasSession: false,
        error: null 
      });
    }

    if (!session) {
      return NextResponse.json({ 
        success: true, 
        hasSession: false 
      });
    }

    // Check if session is expired (90 days)
    const createdAt = new Date(session.created_at);
    const now = new Date();
    const daysSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCreated > 90) {
      // Session expired - mark it inactive
      await supabase
        .from(IP_SESSIONS_TABLE)
        .update({ is_active: false })
        .eq('id', session.id);
      
      return NextResponse.json({ 
        success: true, 
        hasSession: false 
      });
    }

    // Fetch the full recruit data
    const { data: recruit, error: recruitError } = await supabase
      .from('recruits')
      .select('id, email, mt5_id, is_vip, affiliate_code, social_handle, status, commission_balance, image_url')
      .eq('id', session.recruit_id)
      .maybeSingle();

    if (recruitError || !recruit) {
      return NextResponse.json({ 
        success: true, 
        hasSession: false 
      });
    }

    // Update last_used timestamp
    await supabase
      .from(IP_SESSIONS_TABLE)
      .update({ last_used: new Date().toISOString() })
      .eq('id', session.id);

    return NextResponse.json({
      success: true,
      hasSession: true,
      recruit: {
        id: recruit.id,
        email: recruit.email,
        mt5_id: recruit.mt5_id,
        is_vip: recruit.is_vip === true,
        affiliate_code: recruit.affiliate_code,
        social_handle: recruit.social_handle,
        status: recruit.status,
        commission_balance: recruit.commission_balance,
        image_url: recruit.image_url,
      },
    });

  } catch (error) {
    console.error('[IP Session] GET error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      hasSession: false 
    }, { status: 500 });
  }
}

/**
 * POST: Store a new session for the current device
 * Body: { recruitId, email }
 * Header: x-device-id (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recruitId, email } = body;

    if (!recruitId || !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing recruitId or email' 
      }, { status: 400 });
    }

    const clientIP = getClientIP(request);
    const deviceId = getDeviceId(request);
    
    if (!deviceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No device fingerprint provided' 
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Deactivate any existing sessions for this device
    await supabase
      .from(IP_SESSIONS_TABLE)
      .update({ is_active: false })
      .eq('device_id', deviceId);

    // Create new session
    const { data: newSession, error: insertError } = await supabase
      .from(IP_SESSIONS_TABLE)
      .insert({
        ip_address: clientIP, // Still store IP for reference/debugging
        device_id: deviceId,  // Primary identifier
        recruit_id: recruitId,
        email: email,
        is_active: true,
        user_agent: request.headers.get('user-agent') || null,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[IP Session] Insert error:', insertError);
      // If table doesn't exist, try to create it
      if (insertError.code === '42P01') {
        return NextResponse.json({ 
          success: false, 
          error: 'IP sessions table not initialized. Please run migrations.',
          needsMigration: true
        }, { status: 500 });
      }
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      session: {
        id: newSession.id,
        ip_address: clientIP,
        created_at: newSession.created_at,
      },
    });

  } catch (error) {
    console.error('[IP Session] POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
}

/**
 * DELETE: Clear session for current device (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    const deviceId = getDeviceId(request);
    
    if (!deviceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No device fingerprint provided' 
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Deactivate all sessions for this device
    await supabase
      .from(IP_SESSIONS_TABLE)
      .update({ is_active: false })
      .eq('device_id', deviceId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[IP Session] DELETE error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
}
