import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;
    
    if (!accessToken) {
      // Try to get from Supabase auth cookie
      const supabaseAuthToken = cookieStore.get('sb-token')?.value || 
                                cookieStore.get('supabase-auth-token')?.value;
      
      if (!supabaseAuthToken) {
        return NextResponse.json({ user: null });
      }
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Try to get the user from the access token
    if (accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (user && !error) {
        // Also get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email,
            ...profile,
          },
        });
      }
    }
    
    return NextResponse.json({ user: null });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export const dynamic = 'force-dynamic';
