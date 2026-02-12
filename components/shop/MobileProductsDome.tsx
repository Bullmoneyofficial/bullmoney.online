// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Sparkles, ArrowRight, Zap, Star, TrendingUp, Gift } from 'lucide-react';
import { useProductsModalUI } from '@/contexts/UIStateContext';
import type { ProductWithDetails } from '@/types/store';

// Dynamic import for DomeGallery to avoid SSR issues
const DomeGallery = memo(dynamic(() => import('@/components/DomeGallery'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="animate-pulse text-white/30 text-sm">Loading gallery...</div>
    </div>
  ),
}));

// ============================================================================
// MOBILE PRODUCTS DOME - Interactive 3D Gallery for Mobile
// Displays all VIP products and Store products in a beautiful dome carousel
// ============================================================================

interface VipProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  imageUrl?: string;
  visible?: boolean;
  coming_soon?: boolean;
}

interface DomeImage {
  src: string;
  alt: string;
}

// TrueBlue theme
const BLUE_THEME = {
  primary: '#1956B4',
  glow: '#1956B4',
};

// Fallback images if no products are available
const FALLBACK_IMAGES: DomeImage[] = [
  { src: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=800&q=80', alt: 'Trading Chart' },
  { src: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80', alt: 'Bitcoin' },
  { src: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=800&q=80', alt: 'Crypto' },
  { src: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80', alt: 'Trading' },
  { src: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80', alt: 'Market' },
];

export function MobileProductsDome() {
  const [vipProducts, setVipProducts] = useState<VipProduct[]>([]);
  const [storeProducts, setStoreProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  const { setIsOpen: openProductsModal } = useProductsModalUI();

  // Fetch VIP products
  const fetchVipProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/store/vip');
      if (!response.ok) throw new Error('Failed to fetch VIP products');
      const data = await response.json();
      const visibleProducts = (data.data || []).filter((p: VipProduct) => p.visible !== false);
      setVipProducts(visibleProducts);
    } catch (error) {
      console.error('Failed to fetch VIP products:', error);
    }
  }, []);

  // Fetch Store products (now VIP products)
  const fetchStoreProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/store/vip');
      if (!response.ok) throw new Error('Failed to fetch VIP products');
      const data = await response.json();
      const normalized = (data.data || [])
        .filter((item: any) => item.visible !== false)
        .map((item: any, index: number) => {
          const imageUrl = item.image_url || item.imageUrl || null;
          return {
            id: item.id || `vip-${index + 1}`,
            name: item.name || `VIP Access ${index + 1}`,
            images: imageUrl
              ? [{
                  id: `${item.id || `vip-${index + 1}`}-image-1`,
                  product_id: item.id || `vip-${index + 1}`,
                  url: imageUrl,
                  alt_text: item.name || `VIP Access ${index + 1}`,
                  sort_order: 0,
                  is_primary: true,
                  created_at: '',
                  updated_at: '',
                }]
              : [],
          } as ProductWithDetails;
        });
      setStoreProducts(normalized);
    } catch (error) {
      console.error('Failed to fetch VIP products:', error);
    }
  }, []);

  // Initialize
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchVipProducts(), fetchStoreProducts()]);
      setLoading(false);
      // Only set visible after data is loaded
      setIsVisible(true);
    };
    
    fetchAll();
  }, [fetchVipProducts, fetchStoreProducts]);

  // Combine all product images for the dome - MEMO: Only compute once when products first load
  const [stableImages, setStableImages] = useState<DomeImage[] | null>(null);
  
  useEffect(() => {
    // Only set images once when products first load
    if (stableImages !== null) return;
    if (loading) return;
    
    const images: DomeImage[] = [];
    
    // Add VIP product images
    vipProducts.forEach((product) => {
      const imageUrl = product.image_url || product.imageUrl;
      if (imageUrl) {
        images.push({
          src: imageUrl,
          alt: product.name || 'VIP Product',
        });
      }
    });
    
    // Add Store product images (primary images first)
    storeProducts.forEach((product) => {
      const primaryImage = product.images?.find((img) => img.is_primary);
      const firstImage = product.images?.[0];
      const imageUrl = primaryImage?.url || firstImage?.url;
      
      if (imageUrl) {
        images.push({
          src: imageUrl,
          alt: product.name || 'Store Product',
        });
      }
    });
    
    // If no images, use fallback
    if (images.length === 0) {
      setStableImages(FALLBACK_IMAGES);
      return;
    }
    
    // Ensure we have enough images for a good dome experience (minimum 7)
    if (images.length < 7) {
      // Duplicate images to fill the dome
      const originalLength = images.length;
      while (images.length < 7) {
        images.push(images[images.length % originalLength]);
      }
    }
    
    setStableImages(images);
  }, [loading, vipProducts, storeProducts, stableImages]);

  return (
    <section 
      className="relative min-h-[50vh] h-[55vh] max-h-[60vh] sm:h-[65vh] sm:max-h-[70vh] flex flex-col overflow-visible bg-black"
      style={{ contain: 'layout style', willChange: 'transform' }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${BLUE_THEME.primary}20 0%, transparent 60%)`,
          }}
        />
      </div>
      
      {/* Dome Gallery Container */}
      <div className="flex-1 relative z-10 overflow-visible" style={{ transform: 'translateZ(0)', contain: 'strict' }}>
        <AnimatePresence mode="wait">
          {!loading && isVisible && stableImages && (
            <motion.div
              key="dome-gallery"
              className="absolute inset-0 overflow-visible"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <DomeGallery
                images={stableImages}
                fit={0.5}
                minRadius={150}
                maxVerticalRotationDeg={0}
                segments={12}
                dragDampening={2}
                grayscale
                imageBorderRadius="8px"
                openedImageBorderRadius="8px"
                overlayBlurColor="#000000"
                openedImageWidth="180px"
                openedImageHeight="180px"
                autoRotate={true}
                autoRotateSpeed={0.3}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
                <div 
                  className="absolute inset-0 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: `${BLUE_THEME.primary} transparent transparent transparent` }}
                />
              </div>
              <span className="text-white/40 text-xs">Loading products...</span>
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Bottom Content Overlay */}
      <motion.div
        className="relative z-20 px-4 sm:px-6 pb-4 sm:pb-6 pt-2 sm:pt-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        {/* Fade gradient from black */}
        <div className="absolute inset-x-0 -top-12 sm:-top-16 h-12 sm:h-16 bg-linear-to-t from-black to-transparent pointer-events-none" />
        
        {/* Stats Row */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-2 sm:mb-4 text-[10px] sm:text-xs text-white/50">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" style={{ color: BLUE_THEME.primary }} />
            <span>{vipProducts.length} VIP Tiers</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="w-3 h-3" style={{ color: BLUE_THEME.primary }} />
            <span>{storeProducts.length} Products</span>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-center text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
          BULLMONEY <span style={{ color: BLUE_THEME.primary }}>STORE</span>
        </h1>
        
        <p className="text-center text-white/50 text-xs sm:text-sm mb-3 sm:mb-4">
          Premium trading education & merchandise
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {/* Primary CTA */}
          <motion.button
            onClick={() => openProductsModal(true)}
            className="w-full py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl bg-black text-white font-medium overflow-hidden
                     border border-white/20 transition-all duration-300 relative"
            whileTap={{ scale: 0.98 }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm">
              <Sparkles className="w-4 h-4" style={{ color: BLUE_THEME.primary }} />
              <span>EXPLORE VIP</span>
            </span>
            {/* Shimmer effect - GPU CSS */}
            <div
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 store-shimmer-fast"
            />
          </motion.button>
          
          {/* Secondary - Browse Store */}
          <motion.button
            onClick={() => {
              // Scroll to bottom of page to show all products
              window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'smooth'
              });
            }}
            className="w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-white/80 font-medium
                     transition-all duration-300 active:bg-white/10 text-xs sm:text-sm"
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Browse All Products</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </motion.button>
        </div>
        
        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-[9px] sm:text-[10px] text-white/40">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" style={{ color: BLUE_THEME.primary }} />
            <span>Instant Access</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3" style={{ color: BLUE_THEME.primary }} />
            <span>Premium Quality</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" style={{ color: BLUE_THEME.primary }} />
            <span>Expert Content</span>
          </div>
        </div>
      </motion.div>
      
      {/* Bottom edge glow */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
      />
    </section>
  );
}

export default MobileProductsDome;
