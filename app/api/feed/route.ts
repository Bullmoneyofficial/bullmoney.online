import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query params
    const filter = searchParams.get('filter') || 'fresh';
    const contentType = searchParams.get('content_type') || 'all';
    const ticker = searchParams.get('ticker');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const market = searchParams.get('market');
    
    // Build query
    let query = supabase
      .from('analyses')
      .select(`
        *,
        author:user_profiles!author_id(*)
      `)
      .eq('is_published', true)
      .limit(limit + 1); // Fetch one extra to determine hasMore
    
    // Filter by content type
    if (contentType && contentType !== 'all') {
      query = query.eq('content_type', contentType);
    }
    
    // Filter by market
    if (market && market !== 'all') {
      query = query.eq('market', market);
    }
    
    // Filter by ticker
    if (ticker) {
      query = query.contains('tickers', [ticker.toUpperCase()]);
    }
    
    // Cursor-based pagination
    if (cursor) {
      query = query.lt('id', cursor);
    }
    
    // Sorting based on filter
    switch (filter) {
      case 'hot':
        // Hot = high engagement velocity (recent posts with high engagement)
        // We'll sort by bull_score but only for recent posts
        query = query
          .gte('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()) // Last 4 hours
          .order('bull_score', { ascending: false });
        break;
        
      case 'top':
        // Top rated by bull_score
        query = query.order('bull_score', { ascending: false });
        break;
        
      case 'smart_money':
        // Filter by verified traders with high win rate
        query = query
          .not('author', 'is', null)
          .order('bull_score', { ascending: false });
        // Note: Smart money filtering should be done on user_profiles join
        break;
        
      case 'fresh':
      default:
        // Chronological
        query = query.order('created_at', { ascending: false });
        break;
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching feed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Determine if there are more results
    const hasMore = data && data.length > limit;
    const analyses = hasMore ? data.slice(0, limit) : data || [];
    
    // For smart_money filter, filter client-side (ideally this would be done in the query)
    let filteredAnalyses = analyses;
    if (filter === 'smart_money') {
      filteredAnalyses = analyses.filter((a: any) => 
        a.author?.is_smart_money === true || 
        (a.author?.win_rate && a.author.win_rate >= 65)
      );
    }
    
    // Get next cursor
    const nextCursor = filteredAnalyses.length > 0 
      ? filteredAnalyses[filteredAnalyses.length - 1].id 
      : null;
    
    return NextResponse.json({
      analyses: filteredAnalyses,
      next_cursor: hasMore ? nextCursor : null,
      has_more: hasMore,
    });
    
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
