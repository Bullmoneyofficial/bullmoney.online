'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import TextType from '@/components/TextType';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// RELATED PRODUCTS SECTION
// ============================================================================

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  primary_image: string | null;
}

interface RelatedProductsProps {
  products: RelatedProduct[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products.length) return null;

  return (
    <section className="max-w-[1800px] mx-auto px-4 md:px-8 py-16 border-t border-white/10">
      <h2 className="text-2xl font-light mb-8">You May Also Like</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={`/store/product/${product.slug}`} className="group block">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 mb-4">
                {product.primary_image ? (
                  <Image
                    src={(() => {
                      let src = product.primary_image;
                      if (src.startsWith('/http://') || src.startsWith('/https://')) {
                        src = src.substring(1);
                      }
                      if (src.startsWith('http://') || src.startsWith('https://')) {
                        return src;
                      }
                      return src.startsWith('/') ? src : `/${src.replace(/^public\//, '')}`;
                    })()}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/20 text-4xl font-light">B</span>
                  </div>
                )}
              </div>
              
              <h3 className="font-medium line-clamp-1 group-hover:text-white/80 transition-colors">
                <TextType text={product.name} typingSpeed={Math.max(5, 25 - product.name.length / 2)} showCursor={false} loop={false} as="span" />
              </h3>
              
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/80">{useCurrencyLocaleStore.getState().formatPrice(product.base_price)}</span>
                {product.compare_at_price && product.compare_at_price > product.base_price && (
                  <span className="text-white/40 line-through text-sm">
                    {useCurrencyLocaleStore.getState().formatPrice(product.compare_at_price)}
                  </span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
