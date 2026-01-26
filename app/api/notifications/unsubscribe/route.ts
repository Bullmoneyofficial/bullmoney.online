import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use server-side Supabase client with service role for write operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getServerSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// POST - Unsubscribe a user from push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // Mark the subscription as inactive (soft delete)
    const { error } = await supabase
      .from('push_subscriptions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('endpoint', endpoint);

    if (error) {
      console.error('[Notifications] Error unsubscribing:', error);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    console.log('[Notifications] Subscription removed:', endpoint.slice(-20));

    return NextResponse.json({ 
      success: true, 
      message: 'Unsubscribed successfully' 
    });
  } catch (error) {
    console.error('[Notifications] Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
