import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY
);

// GET /api/analyses/[id] - Get single analysis
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Increment view count
    await supabase.rpc('increment_view_count', { analysis_id: id });
    
    const { data, error } = await supabase
      .from('analyses')
      .select(`
        *,
        author:user_profiles!author_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get reaction counts
    const { data: reactions } = await supabase
      .from('analysis_reactions')
      .select('reaction_type')
      .eq('analysis_id', id);
    
    const reactionCounts = {
      bull: reactions?.filter(r => r.reaction_type === 'bull').length || 0,
      bear: reactions?.filter(r => r.reaction_type === 'bear').length || 0,
      save: reactions?.filter(r => r.reaction_type === 'save').length || 0,
    };
    
    // Get comment count
    const { count: commentCount } = await supabase
      .from('analysis_comments')
      .select('id', { count: 'exact', head: true })
      .eq('analysis_id', id);
    
    return NextResponse.json({
      analysis: {
        ...data,
        reaction_counts: reactionCounts,
        comment_count: commentCount || 0,
      }
    });
    
  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/analyses/[id] - Update analysis
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check ownership
    const { data: existing } = await supabase
      .from('analyses')
      .select('author_id')
      .eq('id', id)
      .single();
    
    if (!existing || existing.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('analyses')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        author:user_profiles!author_id(*)
      `)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ analysis: data });
    
  } catch (error) {
    console.error('Update analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/analyses/[id] - Delete analysis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check ownership
    const { data: existing } = await supabase
      .from('analyses')
      .select('author_id')
      .eq('id', id)
      .single();
    
    if (!existing || existing.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Delete analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
