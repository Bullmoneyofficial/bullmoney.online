import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mrbullmoney@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action, userId, updates, isVip } = body;

    // Fail fast with clear errors if server env is misconfigured
    if (!ADMIN_PASSWORD) {
      console.error('Admin API: ADMIN_PASSWORD is not configured on the server.');
      return NextResponse.json({ error: 'Server admin password not configured. Set ADMIN_PASSWORD on the server.' }, { status: 500 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Admin API: Supabase URL or service role key missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
      return NextResponse.json({ error: 'Server Supabase configuration missing. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.' }, { status: 500 });
    }

    // Verify admin credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'login') {
      // Generate a simple admin session token
      const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
      
      return NextResponse.json({
        success: true,
        token: sessionToken,
        admin: { email: ADMIN_EMAIL },
      });
    }

    if (action === 'get_users') {
      // Fetch all users from Supabase
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
      }

      return NextResponse.json({ success: true, users });
    }

    if (action === 'get_recruits') {
      // Fetch all recruits
      const { data: recruits, error } = await supabase
        .from('recruits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recruits:', error);
        return NextResponse.json({ error: 'Failed to fetch recruits' }, { status: 500 });
      }

      return NextResponse.json({ success: true, recruits });
    }

    if (action === 'update_user') {
      if (!userId || !updates) {
        return NextResponse.json({ error: 'Missing userId or updates' }, { status: 400 });
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }

      return NextResponse.json({ success: true, user: data });
    }

    if (action === 'update_recruit') {
      if (!userId || !updates) {
        return NextResponse.json({ error: 'Missing recruitId or updates' }, { status: 400 });
      }
      
      const { data, error } = await supabase
        .from('recruits')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to update recruit' }, { status: 500 });
      }

      return NextResponse.json({ success: true, recruit: data });
    }

    if (action === 'toggle_vip') {
      if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
      }
      
      // Check which table (user_profiles or recruits) - defaults to user_profiles
      const table = body.table || 'user_profiles';
      
      const { data, error } = await supabase
        .from(table)
        .update({ 
          is_vip: isVip,
          vip_updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to update VIP status' }, { status: 500 });
      }

      return NextResponse.json({ success: true, user: data });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
