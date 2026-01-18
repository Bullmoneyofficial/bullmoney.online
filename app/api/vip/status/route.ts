import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: 'userId or email required', isVip: false },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error', isVip: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let response;

    if (userId) {
      response = await supabase
        .from('user_profiles')
        .select('id, is_vip, vip_updated_at, email')
        .eq('id', userId)
        .single();
    } else if (email) {
      response = await supabase
        .from('user_profiles')
        .select('id, is_vip, vip_updated_at, email')
        .eq('email', email)
        .single();
    }

    const { data, error } = response || {};

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        {
          success: false,
          isVip: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        isVip: data?.is_vip || false,
        vipUpdatedAt: data?.vip_updated_at,
        userId: data?.id,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('VIP status check error:', error);
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
