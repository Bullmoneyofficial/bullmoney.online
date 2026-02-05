import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { z } from 'zod';

// ============================================================================
// ADMIN PRODUCT IMAGES API - SAVE IMAGE REFERENCES
// ============================================================================

const imagesSchema = z.object({
  product_id: z.string().uuid(),
  images: z.array(z.object({
    product_id: z.string().uuid(),
    url: z.string().url(),
    is_primary: z.boolean(),
    sort_order: z.number().int().min(0),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const body = await request.json();

    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    }

    // Validate input
    const validated = imagesSchema.parse(body);

    // Verify product exists
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', validated.product_id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Insert images
    const { data: images, error } = await supabase
      .from('product_images')
      .insert(validated.images)
      .select();

    if (error) throw error;

    return NextResponse.json({ images }, { status: 201 });

  } catch (error) {
    console.error('Admin product images error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save images' },
      { status: 500 }
    );
  }
}
