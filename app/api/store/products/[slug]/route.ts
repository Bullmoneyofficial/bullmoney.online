import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// STORE SINGLE PRODUCT API - GET BY SLUG
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name, slug, description),
        images:product_images(id, url, alt_text, sort_order, is_primary),
        media:product_media(id, media_type, url, thumbnail_url, alt_text, title, duration_seconds, width, height, sort_order, is_primary, metadata),
        variants(id, sku, name, options, price_adjustment, inventory_count, low_stock_threshold),
        reviews(
          id,
          rating,
          title,
          content,
          is_verified_purchase,
          created_at,
          user:profiles(full_name, avatar_url)
        )
      `)
      .eq('slug', slug)
      .eq('status', 'ACTIVE')
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Sort images
    const sortedImages = product.images?.sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    );
    
    // Sort media
    const sortedMedia = product.media?.sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    );
    
    const primaryImage = product.images?.find((img: { is_primary: boolean }) => img.is_primary);

    // Filter approved reviews only
    const approvedReviews = product.reviews?.filter(
      (review: { is_approved?: boolean }) => review.is_approved !== false
    );

    // Get related products
    const { data: relatedProducts } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        base_price,
        compare_at_price,
        images:product_images(url, is_primary)
      `)
      .eq('status', 'ACTIVE')
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .limit(4);

    const transformedRelated = relatedProducts?.map(p => ({
      ...p,
      primary_image: p.images?.find((img: { is_primary: boolean }) => img.is_primary)?.url || p.images?.[0]?.url,
    }));

    return NextResponse.json({
      ...product,
      images: sortedImages,
      media: sortedMedia || [],
      primary_image: primaryImage?.url || sortedImages?.[0]?.url || sortedMedia?.[0]?.url || null,
      reviews: approvedReviews,
      related_products: transformedRelated,
      total_inventory: product.variants?.reduce(
        (sum: number, v: { inventory_count: number }) => sum + v.inventory_count,
        0
      ),
    });
  } catch (error) {
    console.error('Store product API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
