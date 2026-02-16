import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ProductFilters } from '@/types/store';

// ============================================================================
// STORE PRODUCTS API - LIST WITH FILTERS AND PAGINATION
// Respects admin display-mode setting (global vs vip)
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper: read the current store display mode from site_settings
async function getDisplayMode(): Promise<{ mode: 'global' | 'vip' | 'timer'; timer_end?: string; timer_headline?: string; timer_subtext?: string }> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('store_display_mode, store_timer_end, store_timer_headline, store_timer_subtext')
      .limit(1)
      .single();

    if (error || !data?.store_display_mode) return { mode: 'global' };
    return {
      mode: data.store_display_mode as 'global' | 'vip' | 'timer',
      timer_end: data.store_timer_end,
      timer_headline: data.store_timer_headline,
      timer_subtext: data.store_timer_subtext,
    };
  } catch {
    return { mode: 'global' };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin-configured display mode
    const displayConfig = await getDisplayMode();
    const displayMode = displayConfig.mode;

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

    // ---- TIMER MODE: return no products, just timer metadata ----
    if (displayMode === 'timer') {
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        limit,
        has_more: false,
        display_mode: 'timer',
        timer_end: displayConfig.timer_end || null,
        timer_headline: displayConfig.timer_headline || 'Something big is coming',
        timer_subtext: displayConfig.timer_subtext || 'New products dropping soon. Stay tuned.',
      });
    }

    // ---- VIP MODE: return VIP products from bullmoney_vip table ----
    if (displayMode === 'vip') {
      let vipQuery = supabase
        .from('bullmoney_vip')
        .select('*', { count: 'exact' });

      // Apply search filter to VIP products
      if (search) {
        vipQuery = vipQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply price filters to VIP products
      if (minPrice) {
        vipQuery = vipQuery.gte('price', parseFloat(minPrice));
      }
      if (maxPrice) {
        vipQuery = vipQuery.lte('price', parseFloat(maxPrice));
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_asc':
          vipQuery = vipQuery.order('price', { ascending: true });
          break;
        case 'price_desc':
          vipQuery = vipQuery.order('price', { ascending: false });
          break;
        default:
          vipQuery = vipQuery.order('sort_order', { ascending: true }).order('price', { ascending: true });
      }

      // Apply pagination
      vipQuery = vipQuery.range(offset, offset + limit - 1);

      const { data: vipProducts, error: vipError, count: vipCount } = await vipQuery;

      if (vipError) {
        console.error('VIP products query error:', vipError);
        return NextResponse.json(
          { error: 'Failed to fetch VIP products' },
          { status: 500 }
        );
      }

      // Transform VIP products to match the same shape as regular products
      const transformedVip = (vipProducts || []).map(vip => ({
        id: vip.id,
        name: vip.name,
        slug: vip.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || vip.id,
        description: vip.description,
        base_price: vip.price,
        status: vip.coming_soon ? 'COMING_SOON' : 'ACTIVE',
        buy_url: vip.buy_url,
        featured: false,
        tags: ['vip'],
        created_at: vip.created_at,
        updated_at: vip.updated_at,
        category: null,
        images: vip.image_url ? [{ id: vip.id, url: vip.image_url, alt_text: vip.name, sort_order: 0, is_primary: true }] : [],
        media: [],
        variants: [],
        primary_image: vip.image_url || null,
        total_inventory: 0,
        _source: 'vip',
        coming_soon: vip.coming_soon || false,
        plan_options: vip.plan_options || [],
      }));

      return NextResponse.json({
        data: transformedVip,
        total: vipCount || 0,
        page,
        limit,
        has_more: (vipCount || 0) > offset + limit,
        display_mode: 'vip',
      });
    }

    // ---- GLOBAL MODE: return regular products from products table ----

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
      display_mode: 'global',
    });
  } catch (error) {
    console.error('Store products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
