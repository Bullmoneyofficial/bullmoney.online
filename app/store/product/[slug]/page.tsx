import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { ProductInfo } from '@/components/shop/ProductInfo';
import { RelatedProducts } from '@/components/shop/RelatedProducts';
import { ProductReviews } from '@/components/shop/ProductReviews';
import { RecentlyViewedProducts } from '@/components/shop/RecentlyViewedProducts';
import { makeAlternatesMetadata } from '@/lib/seo-languages';

// ============================================================================
// PRODUCT DETAIL PAGE (PDP)
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
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

    if (error || !product) return null;

    // Sort images & media
    const sortedImages = product.images?.sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    );
    const sortedMedia = product.media?.sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    );
    const primaryImage = product.images?.find((img: { is_primary: boolean }) => img.is_primary);

    // Filter approved reviews
    const approvedReviews = product.reviews?.filter(
      (review: { is_approved?: boolean }) => review.is_approved !== false
    );

    // Get related products
    const { data: relatedProducts } = await supabase
      .from('products')
      .select(`
        id, name, slug, base_price, compare_at_price,
        images:product_images(url, is_primary)
      `)
      .eq('status', 'ACTIVE')
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .limit(4);

    const transformedRelated = relatedProducts?.map((p: any) => ({
      ...p,
      primary_image: p.images?.find((img: { is_primary: boolean }) => img.is_primary)?.url || p.images?.[0]?.url,
    }));

    return {
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
    };
  } catch (err) {
    console.error('getProduct error:', err);
    return null;
  }
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  
  if (!product) {
    return {
      title: 'Product Not Found | Bullmoney Store',
    };
  }

  return {
    title: product.seo_title || `${product.name} | Bullmoney Store`,
    description: product.seo_description || product.short_description || product.description?.slice(0, 160),
    openGraph: {
      title: product.seo_title || product.name,
      description: product.seo_description || product.short_description,
      images: product.primary_image ? [{ url: product.primary_image }] : [],
      type: 'website',
      url: `https://www.bullmoney.shop/store/product/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.short_description || product.description?.slice(0, 160),
      images: product.primary_image ? [product.primary_image] : [],
    },
    alternates: makeAlternatesMetadata(`/store/product/${slug}`),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map((img: { url: string }) => img.url),
    brand: {
      '@type': 'Brand',
      name: 'Bullmoney',
    },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: product.base_price,
      highPrice: product.variants?.length 
        ? Math.max(...product.variants.map((v: { price_adjustment: number }) => product.base_price + v.price_adjustment))
        : product.base_price,
      priceCurrency: 'USD',
      availability: product.total_inventory > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    },
    ...(product.details?.rating_stats && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.details.rating_stats.average,
        reviewCount: product.details.rating_stats.count,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-black text-white">
        {/* Main Product Section */}
        <section className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Gallery */}
            <ProductGallery images={product.images} productName={product.name} />
            
            {/* Product Info */}
            <ProductInfo product={product} />
          </div>
        </section>

        {/* Description & Details */}
        {product.description && (
          <section className="max-w-[1800px] mx-auto px-4 md:px-8 py-16 border-t border-white/10">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-light mb-6">Details</h2>
              <div 
                className="text-white/70 leading-relaxed prose prose-invert"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
              
              {product.details && Object.keys(product.details).length > 0 && (
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {product.details.material && (
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-white/40 text-sm mb-1">Material</p>
                      <p>{product.details.material}</p>
                    </div>
                  )}
                  {product.details.dimensions && (
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-white/40 text-sm mb-1">Dimensions</p>
                      <p>
                        {product.details.dimensions.width} x {product.details.dimensions.height}
                        {product.details.dimensions.depth && ` x ${product.details.dimensions.depth}`}
                      </p>
                    </div>
                  )}
                  {product.details.care_instructions && (
                    <div className="p-4 bg-white/5 rounded-xl col-span-2">
                      <p className="text-white/40 text-sm mb-1">Care</p>
                      <p>{product.details.care_instructions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <Suspense fallback={<div className="h-96 animate-pulse bg-white/5" />}>
          <ProductReviews 
            productId={product.id} 
            reviews={product.reviews}
            ratingStats={product.details?.rating_stats}
          />
        </Suspense>

        {/* Related Products */}
        {product.related_products?.length > 0 && (
          <RelatedProducts products={product.related_products} />
        )}

        {/* Recently Viewed Products */}
        <RecentlyViewedProducts currentProductId={product.id} />
      </div>
    </>
  );
}
