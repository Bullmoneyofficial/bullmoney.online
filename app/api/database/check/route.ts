/**
 * Database Diagnostic Endpoint
 * Lists push subscriptions and can delete inactive ones
 *
 * Usage:
 *   GET /api/database/check - List all subscriptions
 *   POST /api/database/check - Delete inactive subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function GET(request: NextRequest) {
  try {
    // Get all subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, is_active, user_agent, created_at, channel_trades')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const subscriptions = (subs || []).map((s: any) => ({
      endpoint_short: `...${s.endpoint.slice(-40)}`,
      is_active: s.is_active,
      channel_trades: s.channel_trades,
      user_agent: (s.user_agent || '').slice(0, 50),
      created_at: s.created_at?.slice(0, 16),
    }));

    const active = subscriptions.filter(s => s.is_active).length;
    const inactive = subscriptions.filter(s => !s.is_active).length;

    return NextResponse.json({
      success: true,
      total: subscriptions.length,
      active,
      inactive,
      subscriptions,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Deleting all inactive subscriptions...');

    // Delete inactive subscriptions
    const { data: deleted, error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('is_active', false)
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`Deleted: ${deleted?.length || 0} inactive rows`);

    // Get remaining subscriptions
    const { data: remaining } = await supabase
      .from('push_subscriptions')
      .select('endpoint, is_active')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      deleted: deleted?.length || 0,
      remaining: remaining?.length || 0,
      message: `Deleted ${deleted?.length || 0} inactive subscriptions, ${remaining?.length || 0} remaining`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
