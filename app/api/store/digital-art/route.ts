import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    let query = supabase
      .from('digital_art')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('digital-art GET error:', error);
      return NextResponse.json({ arts: [], error: error.message }, { status: 500 });
    }

    // Map DB rows to component-friendly shape
    const arts = (data || []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      artist: row.artist,
      price: Number(row.price),
      image: row.image,
      thumbnail: row.thumbnail,
      description: row.description,
      category: row.category,
      fileFormats: row.file_formats || [],
      resolution: row.resolution,
      dimensions: row.dimensions,
      tags: row.tags || [],
      downloads: row.downloads || 0,
      featured: row.featured,
    }));

    return NextResponse.json({ arts });
  } catch (err: any) {
    console.error('digital-art route error:', err);
    return NextResponse.json({ arts: [], error: err.message }, { status: 500 });
  }
}
