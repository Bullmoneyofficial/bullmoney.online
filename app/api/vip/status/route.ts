import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    console.log('[VIP Status API] Request params:', { userId, email });

    if (!userId && !email) {
      console.log('[VIP Status API] No userId or email provided');
      return NextResponse.json(
        { success: false, error: 'userId or email required', isVip: false },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[VIP Status API] Missing Supabase environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error', isVip: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let response;

    if (email) {
      // Prefer email lookup
      console.log('[VIP Status API] Looking up by email:', email);
      response = await supabase
        .from('recruits')
        .select('id, is_vip, vip_updated_at, email')
        .eq('email', email)
        .single();
    } else if (userId) {
      console.log('[VIP Status API] Looking up by userId:', userId);
      response = await supabase
        .from('recruits')
        .select('id, is_vip, vip_updated_at, email')
        .eq('id', userId)
        .single();
    }

    const { data, error } = response || {};

    console.log('[VIP Status API] Supabase response:', { data, error: error?.message });

    if (error) {
      console.error('[VIP Status API] Supabase error:', error);
      return NextResponse.json(
        {
          success: false,
          isVip: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const isVip = data?.is_vip === true;
    console.log('[VIP Status API] Final result:', { isVip, userId: data?.id, email: data?.email });

    return NextResponse.json(
      {
        success: true,
        isVip: isVip,
        vipUpdatedAt: data?.vip_updated_at,
        userId: data?.id,
        email: data?.email,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('[VIP Status API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        isVip: false,
        error: 'Server error',
      },
      { status: 500 }
    );
  }
}
