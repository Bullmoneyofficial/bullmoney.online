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
      {/* Image Container */}
      <div className="relative overflow-hidden bg-[#f5f5f7] aspect-[3/4] rounded-xl md:rounded-2xl border border-black/10">
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-linear-to-t from-white/40 via-transparent to-transparent z-10 pointer-events-none" />
        
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
              className="px-2 md:px-3 py-0.5 md:py-1 text-white text-[10px] md:text-xs font-semibold rounded-full shadow-lg bg-black"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Coming Soon
            </motion.span>
          )}
          {product.category && (
            <motion.span 
              className="px-2 md:px-3 py-0.5 md:py-1 text-white text-[10px] md:text-xs font-medium rounded-full bg-black"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="relative z-10">{product.category}</span>
            </motion.span>
          )}
        </div>

        {/* External Link indicator */}
        {!product.comingSoon && (
          <div className="absolute top-2 md:top-3 right-2 md:right-3 h-8 w-8 md:h-10 md:w-10 rounded-full bg-white border border-black/10 flex items-center justify-center z-[100] shadow-lg">
            <ExternalLink className="w-4 h-4 text-black" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mt-1.5 flex-1 flex flex-col relative z-[100] md:mt-4 space-y-1.5 md:space-y-2">
        <h3 className="text-black font-medium group-hover:text-black/70 transition-colors text-sm md:text-base line-clamp-2">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-black/50 text-xs line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-1.5 md:gap-2 pt-1">
          <span className="text-black font-semibold text-sm md:text-base">
            {formatPrice(Number(product.price))}
          </span>
          {product.planOptions && product.planOptions.length > 1 && (
            <span className="text-black/40 text-xs">+{product.planOptions.length - 1} plans</span>
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
      className="fixed inset-0 z-[2147483647] bg-black/60 backdrop-blur-md"
      onClick={handleClose}
      onTouchEnd={handleBackdropTouch}
    >
      {/* Tap to close hint */}
      {!isMobile && ['top', 'bottom', 'left', 'right'].map(pos => (
        <motion.div
          key={pos}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute text-blue-300/50 text-xs pointer-events-none ${
            pos === 'top' ? 'top-4 left-1/2 -translate-x-1/2' :
            pos === 'bottom' ? 'bottom-4 left-1/2 -translate-x-1/2' :
            pos === 'left' ? 'left-2 top-1/2 -translate-y-1/2' :
            'right-2 top-1/2 -translate-y-1/2'
          }`}
        >
          {pos === 'top' || pos === 'bottom' ? (
            <span>↑ Tap anywhere to close ↑</span>
          ) : (
            <span style={{ writingMode: 'vertical-rl' }}>Tap to close</span>
          )}
        </motion.div>
      ))}
      
      {/* Modal - Apple Glass Style */}
      <motion.div
        initial={animations.modalContent.initial}
        animate={animations.modalContent.animate as TargetAndTransition}
        exit={animations.modalContent.exit}
        transition={animations.modalContent.transition}
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="relative w-full max-w-[96vw] sm:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-hidden my-auto mx-auto bg-white text-black rounded-2xl md:rounded-3xl border border-black/10 shadow-2xl"
      >
        {/* Inner Container */}
        <div className="relative z-10 overflow-hidden max-h-[92vh] flex flex-col">
          
          {/* Header */}
          <div className="sticky top-0 z-30 flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 bg-black backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">BullMoney VIP</h2>
                <p className="text-xs text-white/70">Premium trading products</p>
              </div>
            </div>
            
            <motion.button
              whileHover={isMobile ? {} : { scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleClose}
              onTouchEnd={(e) => { e.stopPropagation(); handleClose(); }}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all shadow-lg cursor-pointer"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <X className="w-4 h-4 text-white" strokeWidth={2.5} />
            </motion.button>
          </div>
          
          {/* Filters Bar */}
          <div className="p-3 border-b border-black/10 flex flex-col sm:flex-row gap-3 flex-shrink-0 bg-white">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search products..."
                className="w-full bg-white border border-black/10 rounded-xl pl-10 pr-4 py-3 text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-black/30 transition-all"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative w-full sm:w-44">
              <select
                value={filters.category}
                onChange={(e) => { SoundEffects.click(); setFilters((f) => ({ ...f, category: e.target.value })); }}
                className="w-full appearance-none bg-white border border-black/10 rounded-xl pl-4 pr-10 py-3 text-sm text-black focus:outline-none focus:border-black/30 cursor-pointer transition-all"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <option value="all">All Categories</option>
                {vipCategories.map((c: Category) => (
                  <option key={c._id || c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4 pointer-events-none" />
            </div>

            {/* Sort Toggle */}
            <button
              onClick={toggleSortDirection}
              onTouchEnd={(e) => { e.stopPropagation(); toggleSortDirection(); }}
              className="px-4 py-3 rounded-xl bg-white border border-black/10 hover:border-black/30 text-black text-xs font-medium flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-95"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              {sortDirection === 'asc' ? <ArrowUpNarrowWide size={16} /> : <ArrowDownWideNarrow size={16} />}
              {sortDirection === 'asc' ? "Low → High" : "High → Low"}
            </button>
          </div>
          
          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-black/60">Loading VIP tiers…</div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-red-600">
                <p className="mb-2">Failed to load VIP tiers.</p>
                <p className="text-sm text-red-500/80">{error}</p>
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
                <div className="p-4 rounded-2xl bg-black/5 mb-4">
                  <Package className="w-10 h-10 text-black/30" />
                </div>
                <p className="text-black/50">No products found matching your filters.</p>
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
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-md overflow-hidden p-3 sm:p-6 md:p-8"
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
              className="relative w-full max-w-[96vw] sm:max-w-5xl lg:max-w-6xl max-h-[92vh] overflow-y-auto bg-white text-black rounded-2xl md:rounded-3xl border border-black/10 shadow-2xl"
            >
              {/* Close Button */}
              <div className="sticky top-0 z-30 border-b border-white/10 bg-black backdrop-blur-md">
                <div className="flex items-center justify-between p-4">
                  <h2 className="text-lg font-bold text-white">Product Details</h2>
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
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all shadow-lg z-40 cursor-pointer"
                    style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 } }}
                    exit={{ opacity: 0, scale: 0 }}
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="w-full px-4 sm:px-6 md:px-10 py-6 md:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                    {/* Product Image */}
                    <div className="space-y-4 lg:sticky lg:top-24 self-start">
                      <div className="rounded-3xl border border-black/10 bg-white shadow-sm p-3">
                        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f5f5f7]">
                          <img
                            src={expandedProduct.imageUrl}
                            alt={expandedProduct.name}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                          {expandedProduct.comingSoon && (
                            <div className="absolute top-3 left-3 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-full shadow-md">
                              Coming Soon
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">Availability</p>
                          <p className="mt-1 font-medium text-black">
                            {!expandedProduct.comingSoon ? 'Available now' : 'Coming soon'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">Category</p>
                          <p className="mt-1 font-medium text-black">{expandedProduct.category}</p>
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col space-y-6">
                      <div className="space-y-2">
                        {expandedProduct.category && (
                          <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">
                            {expandedProduct.category}
                          </p>
                        )}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-black">
                          {expandedProduct.name}
                        </h1>
                        {expandedProduct.description && (
                          <p className="text-sm md:text-base text-black/60 leading-relaxed">
                            {expandedProduct.description}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex flex-wrap items-center gap-3 py-3 border-y border-black/10">
                        <span className="text-3xl md:text-4xl font-semibold text-black">
                          {formatPrice(Number(expandedProduct.price))}
                        </span>
                      </div>

                      {/* Plan Options */}
                      {expandedProduct.planOptions && expandedProduct.planOptions.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-black mb-3">Choose your plan</p>
                          <div className="flex flex-wrap gap-2">
                            {expandedProduct.planOptions.map((opt, idx) => {
                              const url = opt.buy_url || expandedProduct.buyUrl;
                              return (
                                <motion.button
                                  key={`${expandedProduct.id}-plan-${idx}`}
                                  onClick={() => {
                                    SoundEffects.click();
                                    if (!url) return;
                                    window.open(url, "_blank", "noopener,noreferrer");
                                  }}
                                  className="px-4 py-2.5 rounded-xl border text-sm font-medium transition-all bg-white text-black border-black/10 hover:border-black/30"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.04, duration: 0.25 }}
                                >
                                  <div className="flex flex-col items-start">
                                    <span className="font-semibold">{opt.label || 'Plan'}</span>
                                    <span className="text-black/60 text-xs">{formatPrice(Number(opt.price ?? expandedProduct.price))}{opt.interval ? `/${opt.interval}` : ''}</span>
                                    {opt.trial_days && <span className="text-green-600 text-xs mt-0.5">{opt.trial_days}-day free trial</span>}
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Highlights */}
                      <div className="rounded-2xl border border-black/10 bg-white p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-black/50">Status</p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${!expandedProduct.comingSoon ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <span className={`text-sm font-medium ${!expandedProduct.comingSoon ? 'text-green-600' : 'text-yellow-600'}`}>
                            {!expandedProduct.comingSoon ? '✓ Available Now' : '⏳ Coming Soon'}
                          </span>
                        </div>
                      </div>

                      {/* Checkout */}
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-black">Checkout</p>
                        <motion.button
                          onClick={() => {
                            SoundEffects.click();
                            const url = expandedProduct.buyUrl?.trim() || expandedProduct.planOptions?.[0]?.buy_url?.trim();
                            if (url) {
                              window.open(url, "_blank", "noopener,noreferrer");
                            }
                          }}
                          disabled={expandedProduct.comingSoon || !expandedProduct.buyUrl}
                          className={`w-full py-4 text-white text-base font-semibold rounded-2xl transition-all flex items-center justify-center gap-3 ${
                            expandedProduct.comingSoon ? 'bg-black/30 cursor-not-allowed' : 'bg-black hover:bg-black/90 active:scale-[0.98]'
                          }`}
                          whileHover={expandedProduct.comingSoon ? {} : { scale: 1.02 }}
                          whileTap={expandedProduct.comingSoon ? {} : { scale: 0.98 }}
                        >
                          {expandedProduct.comingSoon ? (
                            <><CreditCard className="w-5 h-5" /><span>Coming Soon</span></>
                          ) : (
                            <><ExternalLink className="w-5 h-5" /><span>Get Access Now</span></>
                          )}
                        </motion.button>

                        <div className="flex items-center justify-center gap-3 text-black/40 text-xs pt-2">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
ProductsContent.displayName = 'ProductsContent';
