import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // poster, banner, etc.

    let query = supabase
      .from('print_products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('print-products GET error:', error);
      return NextResponse.json({ products: [], error: error.message }, { status: 500 });
    }

    // Map DB rows to component-friendly shape
    const products = (data || []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      type: row.type,
      basePrice: Number(row.base_price),
      image: row.image,
      description: row.description,
      customizable: row.customizable,
      printerCompatible: row.printer_compatible || [],
      sizes: row.sizes || [],
    }));

    return NextResponse.json({ products });
  } catch (err: any) {
    console.error('print-products route error:', err);
    return NextResponse.json({ products: [], error: err.message }, { status: 500 });
  }
}
