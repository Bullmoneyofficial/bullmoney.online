import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST: create digital art purchase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, digitalArtId, pricePaid, fileFormat } = body;

    if (!userEmail || !digitalArtId || !fileFormat) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('digital_art_purchases')
      .insert({
        user_email: userEmail,
        digital_art_id: digitalArtId,
        price_paid: pricePaid || 0,
        file_format: fileFormat,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ purchase: data });
  } catch (err: any) {
    console.error('[digital-art-purchases] POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create purchase' }, { status: 500 });
  }
}

// GET: fetch purchases by email
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const { data, error } = await supabase
      .from('digital_art_purchases')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ purchases: data || [] });
  } catch (err: any) {
    console.error('[digital-art-purchases] GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch purchases' }, { status: 500 });
  }
}
