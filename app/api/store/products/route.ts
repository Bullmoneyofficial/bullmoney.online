import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ProductFilters } from '@/types/store';

// ============================================================================
// STORE PRODUCTS API - LIST WITH FILTERS AND PAGINATION
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const sortBy = searchParams.get('sort_by') as ProductFilters['sort_by'];
    const featured = searchParams.get('featured') === 'true';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug),
        images:product_images(id, url, alt_text, sort_order, is_primary),
        media:product_media(id, media_type, url, thumbnail_url, alt_text, title, duration_seconds, width, height, sort_order, is_primary, metadata),
        variants(id, sku, name, options, price_adjustment, inventory_count)
      `, { count: 'exact' })
      .eq('status', 'ACTIVE');

    // Apply filters
    if (category) {
      // Get category by slug
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();
      
      if (categoryData) {
        query = query.eq('category_id', categoryData.id);
      }
    }

    if (minPrice) {
      query = query.gte('base_price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('base_price', parseFloat(maxPrice));
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    if (featured) {
      query = query.eq('featured', true);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        query = query.order('base_price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('base_price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Store products query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Transform data
    const transformedProducts = (products || []).map(product => {
      const primaryImage = product.images?.find((img: { is_primary: boolean }) => img.is_primary);
      const sortedImages = product.images?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
      const sortedMedia = product.media?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
      
      return {
        ...product,
        images: sortedImages || [],
        media: sortedMedia || [],
        primary_image: primaryImage?.url || sortedImages?.[0]?.url || sortedMedia?.[0]?.url || null,
        total_inventory: product.variants?.reduce(
          (sum: number, v: { inventory_count: number }) => sum + (v.inventory_count || 0),
          0
        ) || 0,
      };
    });

    return NextResponse.json({
      data: transformedProducts,
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Store products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
