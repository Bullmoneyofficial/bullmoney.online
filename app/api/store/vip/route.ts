import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// Public endpoint to list BullMoney VIP offerings
export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('bullmoney_vip')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('price', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('VIP fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch VIP tiers' }, { status: 500 });
  }
}
