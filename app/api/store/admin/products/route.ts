import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { z } from 'zod';

// ============================================================================
// ADMIN PRODUCTS API - CREATE & LIST PRODUCTS
// ============================================================================

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  base_price: z.number().min(0.01),
  compare_at_price: z.number().min(0).optional(),
  category_id: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  variants: z.array(z.object({
    sku: z.string().min(1),
    name: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
    price_modifier: z.number().default(0),
    stock_quantity: z.number().int().min(0).default(0),
    is_active: z.boolean().default(true),
  })).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);

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

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        variants(count),
        images:product_images(url, is_primary)
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (status === 'active') {
      query = query.eq('status', 'ACTIVE');
    } else if (status === 'inactive') {
      query = query.eq('status', 'DRAFT');
    } else if (status === 'archived') {
      query = query.eq('status', 'ARCHIVED');
    }

    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data: products, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      data: products,
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.error('Admin products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

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
    const validated = createProductSchema.parse(body);

    // Check slug uniqueness
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', validated.slug)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      );
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        short_description: validated.short_description,
        base_price: validated.base_price,
        compare_at_price: validated.compare_at_price,
        category_id: validated.category_id,
        is_active: validated.is_active,
        is_featured: validated.is_featured,
        tags: validated.tags || [],
        details: validated.details || {},
      })
      .select()
      .single();

    if (productError) throw productError;

    // Create variants
    const variantsToInsert = validated.variants.map((variant, index) => ({
      product_id: product.id,
      sku: variant.sku,
      name: variant.name,
      size: variant.size,
      color: variant.color,
      price_modifier: variant.price_modifier,
      stock_quantity: variant.stock_quantity,
      is_active: variant.is_active,
    }));

    const { error: variantError } = await supabase
      .from('variants')
      .insert(variantsToInsert);

    if (variantError) {
      // Rollback product creation
      await supabase.from('products').delete().eq('id', product.id);
      throw variantError;
    }

    return NextResponse.json({ product }, { status: 201 });

  } catch (error) {
    console.error('Admin create product error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
