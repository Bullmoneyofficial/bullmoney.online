import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST: save a design
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, name, productType, canvasData, previewUrl, sourceUploadId, sourceArtId, width, height } = body;

    if (!userEmail || !productType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.from('print_designs').insert({
      user_email: userEmail,
      name: name || 'Untitled Design',
      product_type: productType,
      canvas_data: canvasData || {},
      preview_url: previewUrl || null,
      source_upload_id: sourceUploadId || null,
      source_art_id: sourceArtId || null,
      width: width || null,
      height: height || null,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ design: data });
  } catch (err: any) {
    console.error('[print-designs] POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save design' }, { status: 500 });
  }
}

// GET: fetch user's designs
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const { data, error } = await supabase
      .from('print_designs')
      .select('*')
      .eq('user_email', email)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ designs: data || [] });
  } catch (err: any) {
    console.error('[print-designs] GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch designs' }, { status: 500 });
  }
}

// PATCH: update a design
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, canvasData, previewUrl } = body;

    if (!id) return NextResponse.json({ error: 'Design ID required' }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (canvasData !== undefined) updates.canvas_data = canvasData;
    if (previewUrl !== undefined) updates.preview_url = previewUrl;

    const { data, error } = await supabase
      .from('print_designs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ design: data });
  } catch (err: any) {
    console.error('[print-designs] PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update design' }, { status: 500 });
  }
}
