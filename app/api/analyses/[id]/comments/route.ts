import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

// GET /api/analyses/[id]/comments - Get comments for analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 });
    }

    const { id: analysisId } = await params;
    
    const { data, error } = await supabase
      .from('analysis_comments')
      .select(`
        *,
        author:user_profiles!user_id(*)
      `)
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: true });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ comments: data || [] });
    
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/analyses/[id]/comments - Add comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase env not configured' }, { status: 500 });
    }

    const { id: analysisId } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { content, parent_id, image_url, rich_content } = body;
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    // Check if analysis exists
    const { data: analysis } = await supabase
      .from('analyses')
      .select('id')
      .eq('id', analysisId)
      .single();
    
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    
    // If replying, check parent comment exists
    if (parent_id) {
      const { data: parentComment } = await supabase
        .from('analysis_comments')
        .select('id')
        .eq('id', parent_id)
        .eq('analysis_id', analysisId)
        .single();
      
      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }
    
    const { data, error } = await supabase
      .from('analysis_comments')
      .insert({
        analysis_id: analysisId,
        user_id: user.id,
        parent_id: parent_id || null,
        content: content.trim(),
        rich_content: rich_content || null,
        image_url: image_url || null,
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        author:user_profiles!user_id(*)
      `)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Recalculate bull score (comments increase engagement)
    await supabase.rpc('calculate_bull_score', { p_analysis_id: analysisId });
    
    return NextResponse.json({ comment: data }, { status: 201 });
    
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
