import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';

// ============================================================================
// ADMIN RECRUITS API — Fetch all recruits with optional rewards data
// ============================================================================

export async function GET(request: NextRequest) {
  const supabase = createSupabaseClient();
  const { searchParams } = new URL(request.url);
  const includeRewards = searchParams.get('include_rewards') === 'true';
  
  try {
    // Select columns based on whether rewards data is needed
    const columns = includeRewards
      ? 'id,email,mt5_id,affiliate_code,status,is_vip,store_total_spent,rewards_punches,rewards_total_spent,rewards_cards_completed,rewards_tier,rewards_lifetime_points,rewards_available_points,rewards_last_punch_at,rewards_free_item_claimed,created_at'
      : 'id,email,mt5_id,affiliate_code,status,is_vip,store_total_spent,created_at';
    
    const { data: recruits, error } = await supabase
      .from('recruits')
      .select(columns)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching recruits:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Normalize rewards fields (handle null columns if not yet added)
    const normalizedRecruits = ((recruits || []) as unknown as Record<string, unknown>[]).map((r) => ({
      ...r,
      rewards_punches: (r.rewards_punches as number) ?? 0,
      rewards_total_spent: (r.rewards_total_spent as number) ?? 0,
      rewards_cards_completed: (r.rewards_cards_completed as number) ?? 0,
      rewards_tier: (r.rewards_tier as string) ?? 'bronze',
      rewards_lifetime_points: (r.rewards_lifetime_points as number) ?? 0,
      rewards_available_points: (r.rewards_available_points as number) ?? 0,
      rewards_free_item_claimed: (r.rewards_free_item_claimed as boolean) ?? false,
    }));
    
    return NextResponse.json({ recruits: normalizedRecruits });
  } catch (err) {
    console.error('Admin recruits API error:', err);
    return NextResponse.json({ error: 'Failed to fetch recruits' }, { status: 500 });
  }
}
