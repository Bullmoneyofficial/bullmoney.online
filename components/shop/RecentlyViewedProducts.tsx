'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { useRecentlyViewedStore, type RecentlyViewedItem } from '@/stores/recently-viewed-store';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// RECENTLY VIEWED PRODUCTS - Section for PDP/Store
// ============================================================================

interface RecentlyViewedProductsProps {
  currentProductId?: string; // Exclude current product
  limit?: number;
}

export function RecentlyViewedProducts({ currentProductId, limit = 8 }: RecentlyViewedProductsProps) {
  const { items, clearAll } = useRecentlyViewedStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filtered = items
    .filter((item) => item.productId !== currentProductId)
    .slice(0, limit);

  if (filtered.length === 0) return null;

  return (
    <section className="max-w-[1800px] mx-auto px-4 md:px-8 py-12 border-t border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-white/40" />
          <h2 className="text-xl font-light text-white">Recently Viewed</h2>
        </div>
        <button
          onClick={clearAll}
          className="text-xs text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Clear
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {filtered.map((item, index) => (
          <motion.div
            key={item.productId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={`/store/product/${item.slug}`}
              className="group block"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10
                            group-hover:border-white/20 transition-colors">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width:640px) 50vw, (max-width:1024px) 25vw, 12.5vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">B</div>
                )}
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-white text-xs truncate group-hover:text-white/80 transition-colors">{item.name}</p>
                <p className="text-white/50 text-xs">{useCurrencyLocaleStore.getState().formatPrice(item.price)}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
