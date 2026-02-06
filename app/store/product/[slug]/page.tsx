import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { ProductInfo } from '@/components/shop/ProductInfo';
import { RelatedProducts } from '@/components/shop/RelatedProducts';
import { ProductReviews } from '@/components/shop/ProductReviews';
import { RecentlyViewedProducts } from '@/components/shop/RecentlyViewedProducts';

// ============================================================================
// PRODUCT DETAIL PAGE (PDP)
// ============================================================================

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/store/products/${slug}`, {
    next: { revalidate: 60 },
  });
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
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
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.short_description || product.description?.slice(0, 160),
      images: product.primary_image ? [product.primary_image] : [],
    },
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
