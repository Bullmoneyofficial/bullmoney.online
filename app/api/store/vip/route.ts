import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

// Static fallback so the store always renders even when Supabase is unreachable
const FALLBACK_VIP: Record<string, unknown>[] = [
  { id: '00000000-0000-0000-0000-000000000901', name: 'VIP Indicators',          price: 9.99,   sort_order: 1, coming_soon: false, buy_url: '/vip', description: 'Proprietary indicator bundle tuned for BullMoney strategies.' },
  { id: '00000000-0000-0000-0000-000000000902', name: 'VIP Groups',              price: 19.99,  sort_order: 2, coming_soon: false, buy_url: '/vip', description: 'Priority access to VIP chat groups and community trade breakdowns.' },
  { id: '00000000-0000-0000-0000-000000000903', name: 'BullMoney+ Subscription', price: 39.99,  sort_order: 3, coming_soon: false, buy_url: '/vip', description: 'Unlock indicators + VIP groups + full website access.' },
  { id: '00000000-0000-0000-0000-000000000904', name: 'VIP Pro',                 price: 99.99,  sort_order: 4, coming_soon: true,  buy_url: null,   description: 'Expanded mentorship tracks and premium research drops.' },
  { id: '00000000-0000-0000-0000-000000000905', name: 'VIP Live Streams',        price: 149.99, sort_order: 5, coming_soon: true,  buy_url: null,   description: 'Private live trading streams + Q&A.' },
];

// Public endpoint to list BullMoney VIP offerings
export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('bullmoney_vip')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('price', { ascending: true });

    if (error) {
      // Log the real Supabase error for debugging, return fallback data
      console.error('VIP Supabase error:', error.message, error.code, error.hint);
      return NextResponse.json({ data: FALLBACK_VIP, _fallback: true });
    }

    return NextResponse.json({ data: data && data.length > 0 ? data : FALLBACK_VIP });
  } catch (error: any) {
    console.error('VIP fetch error:', error?.message ?? error);
    // Return fallback instead of 500 so the store still renders
    return NextResponse.json({ data: FALLBACK_VIP, _fallback: true });
  }
}
