import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST: save upload record
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail, filename, fileUrl, thumbnailUrl, fileSize, mimeType, width, height, dpi } = body;

    if (!userEmail || !filename || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase.from('print_uploads').insert({
      user_email: userEmail,
      filename,
      file_url: fileUrl,
      thumbnail_url: thumbnailUrl || null,
      file_size: fileSize || 0,
      mime_type: mimeType || null,
      width: width || null,
      height: height || null,
      dpi: dpi || 72,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ upload: data });
  } catch (err: any) {
    console.error('[print-uploads] POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save upload' }, { status: 500 });
  }
}

// GET: fetch user's uploads
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const { data, error } = await supabase
      .from('print_uploads')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ uploads: data || [] });
  } catch (err: any) {
    console.error('[print-uploads] GET error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch uploads' }, { status: 500 });
  }
}
