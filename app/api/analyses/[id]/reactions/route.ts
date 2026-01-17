import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/analyses/[id]/reactions - Add reaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: analysisId } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { reaction_type } = body;
    
    if (!['bull', 'bear', 'save'].includes(reaction_type)) {
      return NextResponse.json({ 
        error: 'Invalid reaction type. Must be: bull, bear, or save' 
      }, { status: 400 });
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
    
    // Upsert reaction (toggle behavior)
    const { data: existing } = await supabase
      .from('analysis_reactions')
      .select('id')
      .eq('analysis_id', analysisId)
      .eq('user_id', user.id)
      .eq('reaction_type', reaction_type)
      .single();
    
    if (existing) {
      // Remove existing reaction
      await supabase
        .from('analysis_reactions')
        .delete()
        .eq('id', existing.id);
      
      return NextResponse.json({ 
        action: 'removed',
        reaction_type 
      });
    } else {
      // Add new reaction
      const { data, error } = await supabase
        .from('analysis_reactions')
        .insert({
          analysis_id: analysisId,
          user_id: user.id,
          reaction_type,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        // Handle unique constraint violation (race condition)
        if (error.code === '23505') {
          return NextResponse.json({ 
            action: 'already_exists',
            reaction_type 
          });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      // Recalculate bull score (could be done with a trigger)
      await supabase.rpc('calculate_bull_score', { p_analysis_id: analysisId });
      
      return NextResponse.json({ 
        action: 'added',
        reaction: data 
      }, { status: 201 });
    }
    
  } catch (error) {
    console.error('Reaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/analyses/[id]/reactions - Remove reaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: analysisId } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const reactionType = searchParams.get('type');
    
    if (!reactionType || !['bull', 'bear', 'save'].includes(reactionType)) {
      return NextResponse.json({ 
        error: 'Invalid reaction type. Must be: bull, bear, or save' 
      }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('analysis_reactions')
      .delete()
      .eq('analysis_id', analysisId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Recalculate bull score
    await supabase.rpc('calculate_bull_score', { p_analysis_id: analysisId });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Remove reaction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
