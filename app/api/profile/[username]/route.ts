import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/profile/[username] - Get public profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    
    // Get user's analyses (public only)
    const { data: analyses, error: analysesError } = await supabase
      .from('analyses')
      .select(`
        id,
        content_type,
        title,
        tickers,
        sentiment,
        confidence,
        thumbnail_url,
        bull_score,
        created_at
      `)
      .eq('user_id', profile.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (analysesError) {
      console.error('Get user analyses error:', analysesError);
    }
    
    // Get stats
    const { count: totalAnalyses } = await supabase
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_published', true);
    
    const { count: totalReactions } = await supabase
      .from('analysis_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('analysis_id', profile.id);
    
    // Get follower/following counts (if following system exists)
    const { count: followers } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id);
    
    const { count: following } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id);
    
    // Sanitize profile for public display
    const publicProfile = {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      trading_style: profile.trading_style,
      favorite_tickers: profile.favorite_tickers,
      is_verified: profile.is_verified,
      is_vip: profile.is_vip,
      joined_at: profile.joined_at,
      stats: {
        analyses: totalAnalyses || 0,
        reactions: totalReactions || 0,
        followers: followers || 0,
        following: following || 0,
      },
    };
    
    return NextResponse.json({
      profile: publicProfile,
      analyses: analyses || [],
    });
    
  } catch (error) {
    console.error('Get public profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
