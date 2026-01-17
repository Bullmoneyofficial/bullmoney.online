import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Create server-side Supabase client
const getSupabase = async () => {
  const cookieStore = await cookies();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    }
  );
};

// GET /api/analyses - List analyses
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const published = searchParams.get('published') !== 'false';
    
    let query = supabase
      .from('analyses')
      .select(`
        *,
        author:user_profiles!author_id(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (published) {
      query = query.eq('is_published', true);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      analyses: data,
      total: count,
      limit,
      offset,
    });
    
  } catch (error) {
    console.error('Analyses API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/analyses - Create new analysis
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.content || !body.pair) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, content, pair' 
      }, { status: 400 });
    }
    
    // Create analysis
    const { data, error } = await supabase
      .from('analyses')
      .insert({
        author_id: user.id,
        title: body.title,
        content: body.content,
        rich_content: body.rich_content || null,
        market: body.market || 'forex',
        direction: body.direction || 'neutral',
        pair: body.pair,
        entry_price: body.entry_price || null,
        target_price: body.target_price || null,
        stop_loss: body.stop_loss || null,
        confidence_score: body.confidence_score || 5,
        content_type: body.content_type || 'deep_dive',
        chart_config: body.chart_config || null,
        attachments: body.attachments || [],
        tickers: body.tickers || [],
        image_url: body.image_url || null,
        is_published: body.is_published ?? true,
        is_pro_only: body.is_pro_only ?? false,
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        author:user_profiles!author_id(*)
      `)
      .single();
    
    if (error) {
      console.error('Error creating analysis:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ analysis: data }, { status: 201 });
    
  } catch (error) {
    console.error('Create analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
