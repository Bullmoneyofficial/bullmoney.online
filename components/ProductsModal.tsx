"use client";

import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type TargetAndTransition } from 'framer-motion';
import { 
  X, 
  Search, 
  ChevronDown,
  ArrowUpNarrowWide, 
  ArrowDownWideNarrow,
  ShoppingCart,
  Package,
  ExternalLink,
  CreditCard
} from 'lucide-react';
import { ShimmerLine, ShimmerBorder } from '@/components/ui/UnifiedShimmer';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useShop, Product, Category } from '@/components/ShopContext';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { useProductsModalUI } from '@/contexts/UIStateContext';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

// Modal Context
interface ModalState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalState | undefined>(undefined);

const useModalState = () => {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('useModalState must be used within ProductsModal');
  return context;
};

// Price formatting utility
const formatPriceDisplay = (price: string | number | undefined): string => {
  if (price === undefined || price === null) return "0.00";
  const num = Number(price);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
};

type PlanOption = {
  label?: string;
  price?: number;
  interval?: string;
  buy_url?: string;
  trial_days?: number;
};

type VipProduct = Product & {
  id: string;
  comingSoon?: boolean;
  planOptions?: PlanOption[];
};

// Sort Direction type
type SortDirection = 'asc' | 'desc';

// Filters type
type Filters = {
  search: string;
  category: string;
};

// Main Modal Component - Now uses centralized UIStateContext for mutual exclusion
export const ProductsModal = memo(() => {
  // Use centralized UI state for mutual exclusion with other modals
  const { isOpen, setIsOpen } = useProductsModalUI();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <ModalContext.Provider value={{ isOpen, setIsOpen }}>
      {/* ProductsTrigger removed - modal is now opened via context (openProductsModal) */}
      {createPortal(
        <AnimatePresence>
          {isOpen && <ProductsContent />}
        </AnimatePresence>,
        document.body
      )}
    </ModalContext.Provider>
  );
});
ProductsModal.displayName = 'ProductsModal';

// Trigger Button
const ProductsTrigger = memo(() => {
  const { setIsOpen } = useModalState();
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);

  const handleTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    SoundEffects.click();
    setIsOpen(true);
  }, [setIsOpen]);
  
  return (
    <button
      onClick={handleClick}
      onTouchEnd={handleTouch}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-full h-full absolute inset-0 cursor-pointer bg-transparent border-0 outline-none z-[100]"
      style={{ 
        background: 'transparent',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      aria-label="Open Products"
    />
  );
});
ProductsTrigger.displayName = 'ProductsTrigger';

// Product Card Component - Matches store ProductCard styling
const ProductCard = memo(({ 
  product, 
  onClick,
  isMobile
}: { 
  product: Product & { id: string; comingSoon?: boolean; planOptions?: PlanOption[] }; 
  onClick: () => void;
  isMobile: boolean;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { formatPrice } = useCurrencyLocaleStore();
  
  // Direct link open on first tap (mobile) or click
  const handleOpenLink = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    SoundEffects.click();
    // Always open expanded view first for better UX
    onClick();
  }, [onClick]);

  // For mobile: single tap opens expanded view
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleOpenLink(e);
  }, [handleOpenLink]);

  const hasDiscount = false; // VIP products don't have discounts currently
  const isInStock = !product.comingSoon;

  return (
    <motion.article
      ref={cardRef}
      className="group relative h-full w-full flex flex-col cursor-pointer"
      style={{ isolation: 'isolate' }}
      whileHover={isMobile ? {} : { scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={handleOpenLink}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image Container - Glassmorphism Border with Shimmer */}
      <div className="relative overflow-hidden bg-white/5 aspect-[3/4] rounded-xl md:rounded-2xl">
        {/* Animated Shimmer Border */}
        <div className="absolute inset-0 rounded-xl md:rounded-2xl p-[1px] overflow-hidden z-[1]">
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-20"
            style={{ width: '100%', filter: 'blur(20px)' }}
            animate={{
              x: ['-50%', '50%'],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div className="absolute inset-[1px] bg-transparent rounded-xl md:rounded-2xl" />
        </div>
        
        {/* Static White Border */}
        <div className="absolute inset-0 border border-white/20 rounded-xl md:rounded-2xl pointer-events-none z-[2]" />
        
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />
        
        {/* Product Image */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          draggable={false}
        />

        {/* Badges */}
        <div className="absolute top-2 md:top-3 left-2 md:left-3 flex flex-col gap-1.5 z-[100]">
          {product.comingSoon && (
            <motion.span 
              className="relative px-2 md:px-3 py-0.5 md:py-1 text-white text-[10px] md:text-xs font-semibold rounded-full shadow-lg overflow-hidden bg-white/20 backdrop-blur-md border border-white/30"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="relative z-10">Coming Soon</span>
            </motion.span>
          )}
          {product.category && (
            <motion.span 
              className="relative px-2 md:px-3 py-0.5 md:py-1 text-white text-[10px] md:text-xs font-medium rounded-full overflow-hidden bg-[rgb(25,86,180)] backdrop-blur-md"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
                style={{ width: '100%' }}
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                  repeatDelay: 1,
                }}
              />
              <span className="relative z-10">{product.category}</span>
            </motion.span>
          )}
        </div>

        {/* External Link indicator */}
        {!product.comingSoon && (
          <div className="absolute top-2 md:top-3 right-2 md:right-3 h-8 w-8 md:h-10 md:w-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center z-[100]">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mt-1.5 flex-1 flex flex-col relative z-[100] md:mt-4 space-y-1.5 md:space-y-2">
        <h3 className="text-white font-medium group-hover:text-white/80 transition-colors text-sm md:text-base line-clamp-2">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-white/50 text-xs line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-1.5 md:gap-2 pt-1">
          <span className="text-white font-semibold text-sm md:text-base">
            {formatPrice(Number(product.price))}
          </span>
          {product.planOptions && product.planOptions.length > 1 && (
            <span className="text-white/40 text-xs">+{product.planOptions.length - 1} plans</span>
          )}
        </div>
      </div>
    </motion.article>
  );
});
ProductCard.displayName = 'ProductCard';

// Main Content
const ProductsContent = memo(() => {
  const { setIsOpen } = useModalState();
  const { state: { /*products, categories*/ } } = useShop();
  const { formatPrice } = useCurrencyLocaleStore();
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  const [vipProducts, setVipProducts] = useState<VipProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedProduct, setExpandedProduct] = useState<VipProduct | null>(null);

  // ESC key to close expanded product modal
  useEffect(() => {
    if (!expandedProduct) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedProduct(null);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [expandedProduct]);

  useEffect(() => {
    const fetchVip = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/store/vip');
        if (!res.ok) throw new Error('Failed to load VIP tiers');
        const json = await res.json();

        const normalized: VipProduct[] = (json.data || []).map((item: any, idx: number) => {
          const planOptions: PlanOption[] = Array.isArray(item.plan_options) ? item.plan_options : [];
          const primaryPrice = item.price ?? planOptions[0]?.price ?? 0;
          const primaryBuyUrl = item.buy_url || planOptions[0]?.buy_url || undefined;

          return {
            id: item.id || `vip-${idx}`,
            name: item.name,
            description: item.description || '',
            price: Number(primaryPrice) || 0,
            category: 'VIP',
            imageUrl: item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
            visible: item.visible !== false, // default to visible if column absent
            comingSoon: Boolean(item.coming_soon),
            buyUrl: primaryBuyUrl,
            planOptions,
          };
        });

        setVipProducts(normalized);
        setError(null);
      } catch (err: any) {
        console.error('VIP fetch failed', err);
        setError(err?.message || 'Failed to load VIP tiers');
      } finally {
        setLoading(false);
      }
    };
    fetchVip();
  }, []);

  const toggleSortDirection = () => {
    SoundEffects.click();
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const vipCategories = useMemo<Category[]>(() => [{ id: 'vip', name: 'VIP' }], []);

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = vipProducts.filter((p) => {
      if (!p.visible) return false;

      const searchMatch = p.name.toLowerCase().includes(filters.search.toLowerCase());
      const categoryMatch = filters.category === "all" || p.category === filters.category;
      
      return searchMatch && categoryMatch;
    });

    return filtered.sort((a, b) => {
      const priceA = parseFloat(String(a.price).replace(/[^0-9.]/g, '')) || 0;
      const priceB = parseFloat(String(b.price).replace(/[^0-9.]/g, '')) || 0;
      return sortDirection === 'asc' ? priceA - priceB : priceB - priceA;
    });
  }, [vipProducts, filters, sortDirection]);

  const handleClose = useCallback(() => {
    SoundEffects.click();
    setIsOpen(false);
  }, [setIsOpen]);

  // Handle backdrop touch for mobile
  const handleBackdropTouch = useCallback((e: React.TouchEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      handleClose();
    }
  }, [handleClose]);

  return (
    <motion.div
      initial={animations.modalBackdrop.initial}
      animate={animations.modalBackdrop.animate as TargetAndTransition}
      exit={animations.modalBackdrop.exit}
      transition={animations.modalBackdrop.transition}
      className="fixed inset-0 z-[2147483647] flex items-center justify-center p-3 sm:p-6"
      style={{
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={handleClose}
      onTouchEnd={handleBackdropTouch}
    >
      {/* Tap to close hint - simplified for mobile */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/70 text-xs font-medium pointer-events-none border border-white/10"
      >
        Tap outside to close
      </motion.div>
      
      {/* Modal - Apple Glass Style */}
      <motion.div
        initial={animations.modalContent.initial}
        animate={animations.modalContent.animate as TargetAndTransition}
        exit={animations.modalContent.exit}
        transition={animations.modalContent.transition}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05))',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* Shimmer Border - skip on mobile */}
        {!shouldSkipHeavyEffects && (
          <div className="absolute inset-[-2px] overflow-hidden rounded-3xl pointer-events-none z-0">
            <ShimmerBorder color="white" intensity="low" />
          </div>
        )}
        
        {/* Inner Container */}
        <div className="relative z-10 rounded-3xl overflow-hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col">
          {!shouldSkipHeavyEffects && <ShimmerLine color="white" />}
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">BullMoney VIP</h2>
                <p className="text-xs text-white/50">Premium trading products</p>
              </div>
            </div>
            
            <motion.button
              whileHover={isMobile ? {} : { scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              onTouchEnd={(e) => { e.stopPropagation(); handleClose(); }}
              className="p-3 min-w-[48px] min-h-[48px] rounded-full bg-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center border border-white/10"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* Filters Bar */}
          <div className="p-3 border-b border-white/10 flex flex-col sm:flex-row gap-3 flex-shrink-0 bg-black/10">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search products..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative w-full sm:w-44">
              <select
                value={filters.category}
                onChange={(e) => { SoundEffects.click(); setFilters((f) => ({ ...f, category: e.target.value })); }}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-white/30 cursor-pointer transition-all"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <option value="all" className="bg-black text-white">All Categories</option>
                {vipCategories.map((c: Category) => (
                  <option key={c._id || c.id} value={c.name} className="bg-black text-white">{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 pointer-events-none" />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={toggleSortDirection}
              onTouchEnd={(e) => { e.stopPropagation(); toggleSortDirection(); }}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-95"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              {sortDirection === 'asc' ? <ArrowUpNarrowWide size={16} /> : <ArrowDownWideNarrow size={16} />}
              {sortDirection === 'asc' ? "Low → High" : "High → Low"}
            </button>
          </div>
          
          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-white/60">Loading VIP tiers…</div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-red-300">
                <p className="mb-2">Failed to load VIP tiers.</p>
                <p className="text-sm text-red-200/80">{error}</p>
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pb-8">
                {filteredAndSortedProducts.map((p) => {
                  const pid = p._id || p.id!;
                  return (
                    <div key={pid} className="relative pb-6">
                      <ProductCard
                        product={{ ...p, id: pid }}
                        onClick={() => setExpandedProduct({ ...p, id: pid })}
                        isMobile={isMobile}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-2xl bg-white/5 mb-4">
                  <Package className="w-10 h-10 text-white/30" />
                </div>
                <p className="text-white/50">No products found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Expanded Product View - Apple Glass Style */}
      <AnimatePresence>
        {expandedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/90 backdrop-blur-sm overflow-hidden p-8 sm:p-10 md:p-8"
            onClick={() => setExpandedProduct(null)}
            onTouchEnd={(e) => { if (e.target === e.currentTarget) setExpandedProduct(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              className="relative w-full max-w-[85vw] sm:max-w-2xl md:max-w-4xl lg:max-w-7xl max-h-[85vh] overflow-y-auto"
            >
              {/* Close Button - Sticky on scroll */}
              <div className="sticky top-4 right-4 md:top-6 md:right-6 z-[60] float-right mb-2">
                <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden shadow-xl">
                  {/* Animated Shimmer Border */}
                  <div className="absolute inset-0 rounded-full p-[1px] overflow-hidden z-[1]">
                    <motion.div
                      className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-20"
                      style={{ width: '100%', filter: 'blur(20px)' }}
                      animate={{
                        x: ['-50%', '50%'],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <div className="absolute inset-[1px] bg-transparent rounded-full" />
                  </div>
                  
                  {/* Static White Border */}
                  <div className="absolute inset-0 border border-white/30 rounded-full pointer-events-none z-[2]" />
                  
                  {/* Button Content */}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExpandedProduct(null);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExpandedProduct(null);
                    }}
                    className="relative w-full h-full rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center transition-colors touch-manipulation"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    aria-label="Close"
                  >
                    <X className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="min-h-full p-3 sm:p-6 md:p-8 lg:p-12 flex items-center justify-center bg-black">
                <div className="w-full max-w-6xl bg-black">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 md:gap-8 lg:gap-12 bg-black">
                    {/* Product Image - Larger */}
                    <div className="relative w-full aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden bg-black border border-white/20">
                      <img
                        src={expandedProduct.imageUrl}
                        alt={expandedProduct.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                      
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 px-4 py-2 text-white text-sm font-bold rounded-full bg-[rgb(25,86,180)]">
                        {expandedProduct.category}
                      </div>
                      
                      {/* Coming Soon Badge */}
                      {expandedProduct.comingSoon && (
                        <div className="absolute top-4 right-4 px-4 py-2 text-white text-sm font-bold rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                          Coming Soon
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col space-y-6">
                      <div className="space-y-3">
                        <p className="text-sm uppercase tracking-wider font-semibold text-[rgb(25,86,180)]">
                          {expandedProduct.category}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                          {expandedProduct.name}
                        </h1>
                        
                        {/* Description */}
                        {expandedProduct.description && (
                          <p className="text-lg text-white/70 leading-relaxed">
                            {expandedProduct.description}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-4 py-4 border-y border-white/10">
                        <span className="text-5xl font-bold text-white">
                          {formatPrice(Number(expandedProduct.price))}
                        </span>
                      </div>

                      {/* Plan Options */}
                      {expandedProduct.planOptions && expandedProduct.planOptions.length > 0 && (
                        <div>
                          <p className="text-white text-base font-semibold mb-3">Select Your Plan:</p>
                          <div className="flex flex-wrap gap-3">
                            {expandedProduct.planOptions.map((opt, idx) => {
                              const url = opt.buy_url || expandedProduct.buyUrl;
                              return (
                                <div key={`${expandedProduct.id}-plan-${idx}`} className="relative">
                                  {/* Animated Shimmer Border */}
                                  <div className="absolute inset-0 rounded-xl p-[1px] overflow-hidden z-[1]">
                                    <motion.div
                                      className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-20"
                                      style={{ width: '100%', filter: 'blur(20px)' }}
                                      animate={{
                                        x: ['-50%', '50%'],
                                      }}
                                      transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                      }}
                                    />
                                    <div className="absolute inset-[1px] bg-transparent rounded-xl" />
                                  </div>
                                  
                                  {/* Static White Border */}
                                  <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none z-[2]" />
                                  
                                  {/* Button */}
                                  <motion.button
                                    onClick={() => {
                                      SoundEffects.click();
                                      if (!url) return;
                                      window.open(url, "_blank", "noopener,noreferrer");
                                    }}
                                    className="relative px-6 py-4 rounded-xl transition-all font-medium text-white bg-[rgb(25,86,180)] hover:bg-[rgb(35,96,190)]"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                                  >
                                    <div className="flex flex-col items-start">
                                      <span className="font-semibold">{opt.label || 'Plan'}</span>
                                      <span className="text-white/80 text-sm">{formatPrice(Number(opt.price ?? expandedProduct.price))}{opt.interval ? `/${opt.interval}` : ''}</span>
                                      {opt.trial_days && <span className="text-emerald-300 text-xs mt-1">{opt.trial_days}-day free trial</span>}
                                    </div>
                                  </motion.button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Stock Status */}
                      <div className="flex items-center gap-3 p-4 bg-black rounded-xl border border-white/20">
                        <div className={`w-3 h-3 rounded-full ${!expandedProduct.comingSoon ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                        <span className={`text-base font-semibold ${!expandedProduct.comingSoon ? 'text-green-400' : 'text-yellow-400'}`}>
                          {!expandedProduct.comingSoon ? '✓ Available Now' : '⏳ Coming Soon'}
                        </span>
                      </div>

                      {/* Payment Options */}
                      <div className="space-y-4 pt-6 bg-black">
                        <p className="text-white text-base font-semibold">Secure Checkout:</p>
                        
                        {/* Button Row */}
                        <div className="flex gap-3">
                          {/* Buy Now / Coming Soon Button */}
                          <div className="relative flex-1 overflow-hidden rounded-xl">
                            {/* Animated Shimmer Border */}
                            <div className="absolute inset-0 rounded-xl p-[1px] overflow-hidden z-[1]">
                              <motion.div
                                className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-20"
                                style={{ width: '100%', filter: 'blur(20px)' }}
                                animate={{
                                  x: ['-50%', '50%'],
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }}
                              />
                              <div className="absolute inset-[1px] bg-transparent rounded-xl" />
                            </div>
                            
                            {/* Static White Border */}
                            <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none z-[2]" />
                            
                            {/* Button */}
                            <motion.button
                              onClick={() => {
                                SoundEffects.click();
                                const url = expandedProduct.buyUrl?.trim() || expandedProduct.planOptions?.[0]?.buy_url?.trim();
                                if (url) {
                                  window.open(url, "_blank", "noopener,noreferrer");
                                }
                              }}
                              disabled={expandedProduct.comingSoon || !expandedProduct.buyUrl}
                              style={{
                                backgroundColor: expandedProduct.comingSoon ? 'rgb(75, 75, 75)' : 'rgb(25, 86, 180)',
                              }}
                              className={`relative w-full py-5 text-white text-lg font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg ${
                                expandedProduct.comingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 active:scale-98'
                              }`}
                              whileHover={expandedProduct.comingSoon ? {} : { scale: 1.02 }}
                              whileTap={expandedProduct.comingSoon ? {} : { scale: 0.98 }}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: expandedProduct.comingSoon ? 0.6 : 1, y: 0 }}
                              transition={{ duration: 0.4 }}
                            >
                              {expandedProduct.comingSoon ? (
                                <>
                                  <CreditCard className="w-5 h-5" />
                                  <span>Coming Soon</span>
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="w-5 h-5" />
                                  <span>Get Access Now</span>
                                </>
                              )}
                            </motion.button>
                          </div>

                          {/* How to Pay with Crypto Button */}
                          <div className="relative overflow-hidden rounded-xl">
                            {/* Animated Shimmer Border */}
                            <div className="absolute inset-0 rounded-xl p-[1px] overflow-hidden z-[1]">
                              <motion.div
                                className="absolute inset-0 bg-linear-to-r from-transparent via-blue-400 to-transparent opacity-20"
                                style={{ width: '100%', filter: 'blur(20px)' }}
                                animate={{
                                  x: ['-50%', '50%'],
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }}
                              />
                              <div className="absolute inset-[1px] bg-transparent rounded-xl" />
                            </div>
                            
                            {/* Static Border */}
                            <div className="absolute inset-0 border border-blue-500/30 rounded-xl pointer-events-none z-[2]" />
                            
                            {/* Button */}
                            <motion.a
                              href="/crypto-guide"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => SoundEffects.click()}
                              className="relative h-full px-6 py-5 text-blue-400 hover:text-blue-300 text-base font-bold rounded-xl transition-all flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.05 }}
                            >
                              <span className="text-xl">🪙</span>
                              <span className="whitespace-nowrap">How to Use Crypto</span>
                            </motion.a>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-3 text-white/40 text-xs pt-2">
                          <span>🔒 Secure Payment</span>
                          <span>•</span>
                          <span>💳 All Cards Accepted</span>
                          <span>•</span>
                          <span>📱 Instant Access</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
ProductsContent.displayName = 'ProductsContent';
