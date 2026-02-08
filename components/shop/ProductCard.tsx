'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingBag, Heart, X, ExternalLink, CreditCard, Smartphone, Wallet } from 'lucide-react';
import CountUp from '@/components/CountUp';
import TextType from '@/components/TextType';
import { CryptoPayButton } from '@/components/shop/CryptoPayButton';
import { CryptoCheckoutTrigger } from '@/components/shop/CryptoCheckoutInline';
import { ProductMediaCarousel } from '@/components/shop/ProductMediaCarousel';
import type { ProductWithDetails } from '@/types/store';
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { toast } from 'sonner';
import { EncryptedText } from '@/components/Mainpage/encrypted-text';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { PinContainer } from '@/components/ui/3d-pin';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// BRAND LOGO SVG COMPONENTS
// ============================================================================

const WhopLogo = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6.5L6.5 17.5L10 9.5L13.5 17.5L18 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20.5" cy="7" r="1.8" fill="currentColor"/>
  </svg>
);

const SkrillLogo = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 8.5C7 8.5 8.5 6 12 6C15.5 6 17 8 17 9.5C17 11 16 12 14 12.5L10 13.5C8 14 7 15 7 16.5C7 18 8.5 20 12 20C15.5 20 17 17.5 17 17.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="12" y1="4" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const StripeLogo = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.918 3.757 7.085c0 4.29 2.626 5.635 5.474 6.695 1.886.7 2.552 1.203 2.552 2.012 0 .942-.812 1.481-2.284 1.481-1.844 0-4.606-.838-6.532-2.012L2 20.844C3.766 21.978 6.665 23 9.837 23c2.642 0 4.81-.634 6.345-1.832 1.637-1.276 2.462-3.143 2.462-5.522 0-4.39-2.667-5.735-4.668-6.496z" fill="currentColor"/>
  </svg>
);

// ============================================================================
// PRODUCT CARD - LUXURY GLASS MORPHISM DESIGN
// Mobile-First with Touch-Friendly Interactions
// ============================================================================

interface ProductCardProps {
  product: ProductWithDetails;
  compact?: boolean;
}

export const ProductCard = memo(function ProductCard({ product, compact = false }: ProductCardProps) {
  const formatPrice = useCurrencyLocaleStore((s) => s.formatPrice);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [payMethod, setPayMethod] = useState<'whop' | 'skrill' | 'cart' | 'stripe'>('cart');
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isScrolling = useRef(false);
  const { addItem } = useCartStore();
  const { toggleItem, hasItem: isWishlisted } = useWishlistStore();
  const isLiked = isWishlisted(product.id);

  const price = product.base_price;
  const comparePrice = product.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > price;
  const discount = hasDiscount ? Math.round((1 - price / comparePrice) * 100) : 0;
  
  const isInStock = (product.total_inventory || 0) > 0;
  const defaultVariant = product.variants?.[0];
  
  // Determine which 3D effect to use based on product ID (50/50 split)
  const use3DPin = typeof product.id === 'string' 
    ? product.id.charCodeAt(0) % 2 === 0 
    : (product.id as number) % 2 === 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (defaultVariant) {
      setSelectedVariant(defaultVariant);
    }
  }, [defaultVariant]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showQuickView) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showQuickView]);

  // ESC key to close modal
  useEffect(() => {
    if (!showQuickView) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuickView(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showQuickView]);

  // Long press handlers with scroll detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isScrolling.current = false;
    
    longPressTimer.current = setTimeout(() => {
      if (!isScrolling.current) {
        setIsLongPress(true);
        setShowQuickView(true);
      }
    }, 500);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
    
    // If finger moved more than 10px, it's a scroll
    if (deltaX > 10 || deltaY > 10) {
      isScrolling.current = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Don't open quick view here — let onClick handle it to avoid double-fire
    // touchEnd fires before the synthetic click event on mobile
    
    setIsLongPress(false);
    touchStartPos.current = null;
    isScrolling.current = false;
  }, []);

  const handleQuickAdd = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!defaultVariant) {
      toast.error('Please select options on the product page');
      return;
    }
    
    if (!isInStock) {
      toast.error('Out of stock');
      return;
    }

    setIsAdding(true);
    
    // Small delay for animation
    await new Promise(resolve => setTimeout(resolve, 150));
    
    addItem(product, defaultVariant, 1);
    toast.success('Added to cart', {
      icon: <ShoppingBag className="w-4 h-4" />,
    });
    
    setIsAdding(false);
  }, [defaultVariant, isInStock, addItem, product]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.base_price,
      image: product.primary_image || null,
    });
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  }, [toggleItem, product]);

  const handleDirectCheckout = useCallback(async (paymentMethod: string) => {
    if (paymentMethod === 'Stripe') {
      try {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: [{
              productId: product.id,
              variantId: selectedVariant?.id || defaultVariant?.id,
              name: product.name,
              description: product.description,
              price: selectedVariant?.price || price,
              quantity: 1,
              image: product.primary_image,
            }],
            metadata: {
              productId: product.id,
              variantId: selectedVariant?.id || defaultVariant?.id,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Stripe API error:', response.status, errorText);
          throw new Error(`API returned ${response.status}: ${errorText.slice(0, 100)}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned invalid response. Please check your Stripe configuration.');
        }

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else if (data.error) {
          toast.error(data.error);
        } else {
          toast.error('Failed to create checkout session');
        }
      } catch (error: any) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'Failed to initiate checkout. Please try again.');
      }
    } else if (paymentMethod === 'Skrill') {
      try {
        const response = await fetch('/api/skrill/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            variantId: selectedVariant?.id || defaultVariant?.id,
            name: product.name,
            description: product.description,
            price: selectedVariant?.price || price,
            quantity: 1,
            image: product.primary_image,
          }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error(data.error || 'Failed to create Skrill checkout');
        }
      } catch (error: any) {
        console.error('Skrill checkout error:', error);
        toast.error('Failed to initiate Skrill checkout');
      }
    } else {
      const whopLink = `https://whop.com/checkout/${product.slug}`;
      window.open(whopLink, '_blank');
      toast.success(`Opening ${paymentMethod} checkout`);
    }
  }, [product, selectedVariant, defaultVariant, price]);

  const handleBuyNow = useCallback(async () => {
    // Coming soon - Stripe checkout disabled temporarily
    toast('Coming Soon!', {
      icon: '🚀',
      duration: 3000,
    });
    return;
  }, []);

  const getCheckoutItems = useCallback(() => {
    if (!selectedVariant) return [];
    
    return [{
      productId: product.id.toString(),
      variantId: selectedVariant.id.toString(),
      name: product.name,
      description: product.description || undefined,
      price: selectedVariant.price || product.base_price,
      quantity: 1,
      image: product.primary_image,
    }];
  }, [selectedVariant, product]);

  const cardContent = (
    <>
      <motion.article
        className="group relative h-full w-full flex flex-col cursor-pointer"
        style={{ isolation: 'isolate', touchAction: 'manipulation', zIndex: 1, contain: 'layout style paint' }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // Open expanded view on click - don't stopPropagation to allow 
          // parent wrappers (PinContainer/outer div) to handle it too if needed
          setShowQuickView(true);
        }}
      >
      {/* Image Container - Glassmorphism Border with Shimmer */}
      <div
        className={`relative overflow-hidden bg-white/5 ${
          compact ? 'aspect-4/5 rounded-lg' : 'aspect-3/4 rounded-xl md:rounded-2xl'
        }`}
      >
          {/* Animated Shimmer Border - GPU CSS animation */}
          <div className="absolute inset-0 rounded-xl md:rounded-2xl p-px overflow-hidden z-1">
            <div
              className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-20 store-shimmer-border"
            />
            <div className="absolute inset-px bg-transparent rounded-xl md:rounded-2xl" />
          </div>
          
          {/* Static White Border */}
          <div className="absolute inset-0 border border-white/20 rounded-xl md:rounded-2xl pointer-events-none z-2" />
          
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {product.primary_image ? (
            <Image
              src={(() => {
                let src = product.primary_image;
                // Strip leading slash from absolute URLs
                if (src.startsWith('/http://') || src.startsWith('/https://')) {
                  src = src.substring(1);
                }
                // Return absolute URLs as-is
                if (src.startsWith('http://') || src.startsWith('https://')) {
                  return src;
                }
                // Handle relative paths
                return src.startsWith('/') ? src : `/${src.replace(/^public\//, '')}`;
              })()}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-white/10 to-white/5">
              <span className="text-white/20 text-4xl md:text-6xl font-light">B</span>
            </div>
          )}

          {/* Badges - Apple style black/white */}
          <div className="absolute top-2 md:top-3 left-2 md:left-3 flex flex-col gap-1.5" style={{ zIndex: 9990 }}>
            {hasDiscount && (
              <motion.span 
                className="relative px-2 md:px-3 py-0.5 md:py-1 bg-white text-black text-[10px] md:text-xs font-bold rounded-full shadow-lg overflow-hidden"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Shimmer effect - GPU CSS animation */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent store-shimmer-fast"
                />
                <span className="relative z-10">
                  -<CountUp to={discount} from={0} duration={1} className="tracking-wide" />%
                </span>
              </motion.span>
            )}
            {!isInStock && (
              <span className="px-2 md:px-3 py-0.5 md:py-1 bg-black/80 backdrop-blur-sm text-white text-[10px] md:text-xs rounded-full border border-white/20 shadow-lg font-semibold">
                Sold out
              </span>
            )}
            {product.featured && isInStock && (
              <motion.span 
                className="relative px-2 md:px-3 py-0.5 md:py-1 bg-white text-black text-[10px] md:text-xs font-bold rounded-full overflow-hidden shadow-lg"
              >
                {/* Shimmer effect - GPU CSS animation */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent store-shimmer-fast"
                />
                <span className="relative z-10">
                  <EncryptedText 
                    text="Featured"
                    interval={100}
                    revealDelayMs={30}
                    className="tracking-wide"
                  />
                </span>
              </motion.span>
            )}
          </div>

          {/* Wishlist & Add buttons moved outside card wrapper - see end of component */}
        </div>

        {/* Product Info */}
        <div className={`mt-1.5 flex-1 flex flex-col relative ${compact ? 'space-y-1' : 'md:mt-4 space-y-1.5 md:space-y-2'}`} style={{ zIndex: 9990 }}>
          {product.category && !compact && (
            <p className="text-white/40 text-[10px] md:text-xs uppercase tracking-wider truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              <TextType text={product.category.name} typingSpeed={Math.max(5, 25 - product.category.name.length)} showCursor={false} loop={false} as="span" />
            </p>
          )}
          
          <h3 className={`text-white font-medium group-hover:text-white/80 transition-colors drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${compact ? 'text-xs md:text-sm line-clamp-1' : 'text-sm md:text-base line-clamp-2'}`}>
            <TextType text={product.name} typingSpeed={Math.max(5, 25 - product.name.length / 2)} showCursor={false} loop={false} as="span" />
          </h3>

          <div className="flex items-center gap-1.5 md:gap-2">
            <span className={`text-white font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${compact ? 'text-sm' : 'text-sm md:text-base'}`}>
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-white/40 line-through text-xs md:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>

          {/* Variant Preview - Hidden on compact */}
          {!compact && product.variants && product.variants.length > 1 && (
            <div className="hidden md:flex items-center gap-1.5 pt-1">
              {product.variants
                .slice(0, 4)
                .filter((variant) => variant.options?.color)
                .map((variant) => (
                  <div
                    key={variant.id}
                    className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ 
                      backgroundColor: variant.options!.color!.toLowerCase() === 'white' 
                        ? '#ffffff' 
                        : variant.options!.color!.toLowerCase() 
                    }}
                    title={variant.options!.color}
                  />
              ))}
              {product.variants.length > 4 && (
                <span className="text-white/40 text-xs">+{product.variants.length - 4}</span>
              )}
            </div>
          )}
          
          {/* Mobile variant count */}
          {!compact && product.variants && product.variants.length > 1 && (
            <p className="md:hidden text-white/40 text-[10px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              {product.variants.length} options
            </p>
          )}
        </div>
    </motion.article>

    {/* Quick View Modal - Rendered via Portal ONLY when opened (lazy mount) */}
    {mounted && showQuickView && createPortal(
      <AnimatePresence>
        {showQuickView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto p-4 sm:p-6 md:p-8"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowQuickView(false);
          }}
          style={{ pointerEvents: 'all' }}
        >
          {/* Close Button - Detached from modal, floats above everything */}
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQuickView(false);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQuickView(false);
            }}
            className="fixed top-3 right-3 md:top-5 md:right-5 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/30 flex items-center justify-center transition-all shadow-2xl z-[10001] cursor-pointer"
            style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 0.15 } }}
            exit={{ opacity: 0, scale: 0 }}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" strokeWidth={2.5} />
          </motion.button>

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-[96vw] sm:max-w-xl md:max-w-3xl lg:max-w-6xl max-h-[90vh] overflow-y-auto my-auto bg-black/95 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{ pointerEvents: 'all' }}
          >
            {/* Scrollable Content */}
            <div className="w-full px-3 sm:px-4 md:px-8 lg:px-10 py-4 md:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-10">
                {/* Product Media Carousel - Images & Videos */}
                <div className="relative w-full aspect-square overflow-visible">
                  {product.media && product.media.length > 0 ? (
                    <ProductMediaCarousel
                      media={product.media}
                      productName={product.name}
                      autoPlay={false}
                      showThumbnails={true}
                      enableZoom={true}
                      enableFullscreen={true}
                    />
                  ) : product.primary_image ? (
                    // Fallback to single image if no media array
                    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-xl">
                      <Image
                        src={(() => {
                          let src = product.primary_image;
                          // Strip leading slash from absolute URLs
                          if (src.startsWith('/http://') || src.startsWith('/https://')) {
                            src = src.substring(1);
                          }
                          // Return absolute URLs as-is
                          if (src.startsWith('http://') || src.startsWith('https://')) {
                            return src;
                          }
                          // Handle relative paths
                          return src.startsWith('/') ? src : `/${src.replace(/^public\//, '')}`;
                        })()}
                        alt={product.name}
                        fill
                        className="object-cover"
                        priority
                      />
                      {/* Discount Badge */}
                      {hasDiscount && (
                        <div className="absolute top-3 left-3 md:top-4 md:left-4 px-3 py-1.5 md:px-4 md:py-2 bg-white text-black text-xs md:text-sm font-bold rounded-full shadow-lg">
                          -<CountUp to={discount} from={0} duration={1} className="" />% OFF
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-xl flex items-center justify-center">
                      <span className="text-white/20 text-8xl font-light">B</span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex flex-col space-y-4 md:space-y-6">
                  <div className="space-y-2 md:space-y-3">
                    {product.category && (
                      <p className="text-xs md:text-sm uppercase tracking-widest font-semibold text-white/50">
                        <TextType text={product.category.name} typingSpeed={Math.max(5, 25 - product.category.name.length)} showCursor={false} loop={false} as="span" />
                      </p>
                    )}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                      <TextType text={product.name} typingSpeed={Math.max(8, 30 - product.name.length / 2)} showCursor cursorCharacter="_" cursorBlinkDuration={0.5} loop={false} as="span" />
                    </h1>
                    
                    {/* Subtitle/Short Description */}
                    {product.description && (
                      <p className="text-sm md:text-base lg:text-lg text-white/60 leading-relaxed">
                        <TextType text={product.description} typingSpeed={Math.max(2, 15 - product.description.length / 20)} showCursor={false} loop={false} as="span" />
                      </p>
                    )}
                  </div>

                  {/* Price - Apple style */}
                  <div className="flex items-center gap-3 md:gap-4 py-3 md:py-4 border-y border-white/10">
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                      {formatPrice(selectedVariant?.price || price)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-lg sm:text-xl md:text-2xl text-white/40 line-through">
                          {formatPrice(comparePrice)}
                        </span>
                        <span className="px-3 py-1 md:px-4 md:py-1.5 bg-white text-black text-xs md:text-sm font-bold rounded-full shadow-lg">
                          Save <CountUp to={discount} from={0} duration={1} className="" />%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Variants - Apple style */}
                  {product.variants && product.variants.length > 1 && (
                    <div className="w-full">
                      <p className="text-white text-sm md:text-base font-semibold mb-3 md:mb-4">Select Your Option:</p>
                      <div className="flex flex-wrap gap-2 md:gap-3">
                        {product.variants.map((variant, index) => (
                          <motion.button
                            key={variant.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedVariant(variant);
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedVariant(variant);
                            }}
                            style={{
                              pointerEvents: 'all',
                              touchAction: 'manipulation'
                            }}
                            className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl transition-all font-medium text-sm md:text-base border-2 ${
                              selectedVariant?.id === variant.id
                                ? 'bg-white text-black border-white shadow-lg'
                                : 'bg-white/5 text-white border-white/30 hover:bg-white/10 hover:border-white/50'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                          >
                            {variant.options?.size || variant.options?.color || `Option ${variant.id}`}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock Status - Apple style */}
                  <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${isInStock ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className={`text-xs sm:text-sm md:text-base font-medium ${isInStock ? 'text-green-400' : 'text-red-400'}`}>
                      {isInStock ? '✓ In Stock - Ready to Ship' : '✗ Out of Stock'}
                    </span>
                  </div>

                  {/* Payment Options - Apple style black and white */}
                  <div className="space-y-3 md:space-y-4 pt-4 md:pt-6">
                    <p className="text-white text-sm md:text-base font-semibold">Secure Checkout:</p>
                    
                    {/* Pay with Crypto - Inline Checkout */}
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                    >
                      <CryptoCheckoutTrigger
                        productName={product.name}
                        productImage={product.primary_image}
                        priceUSD={selectedVariant?.price || price}
                        productId={product.id.toString()}
                        variantId={selectedVariant?.id?.toString()}
                        quantity={1}
                        disabled={!isInStock}
                      />
                    </div>

                    {/* Unified Payment Picker + Action Button */}
                    <div className="w-full flex flex-col gap-0">
                      {/* Payment Method Picker Tabs */}
                      <div 
                        className="grid grid-cols-4 w-full rounded-t-2xl overflow-hidden border border-white/20 border-b-0"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onTouchEnd={(e) => { e.stopPropagation(); }}
                        style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                      >
                        {/* Cart Tab */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('cart'); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('cart'); }}
                          className={`py-3 md:py-3.5 text-[10px] md:text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            payMethod === 'cart'
                              ? 'bg-white text-black shadow-inner'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                          style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                        >
                          <ShoppingBag className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                          <span>Cart</span>
                        </button>

                        {/* Whop Tab */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('whop'); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('whop'); }}
                          className={`py-3 md:py-3.5 text-[10px] md:text-xs font-bold transition-all border-l border-white/10 flex flex-col items-center justify-center gap-0.5 ${
                            payMethod === 'whop'
                              ? 'bg-white text-black shadow-inner'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                          style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                        >
                          <WhopLogo className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                          <span>Whop</span>
                        </button>

                        {/* Skrill Tab */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('skrill'); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('skrill'); }}
                          className={`py-3 md:py-3.5 text-[10px] md:text-xs font-bold transition-all border-l border-white/10 flex flex-col items-center justify-center gap-0.5 ${
                            payMethod === 'skrill'
                              ? 'bg-white text-black shadow-inner'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                          style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                        >
                          <SkrillLogo className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                          <span>Skrill</span>
                          <span className="text-[7px] md:text-[8px] opacity-50 leading-none -mt-0.5">Soon</span>
                        </button>

                        {/* Stripe Tab */}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('stripe'); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setPayMethod('stripe'); }}
                          className={`py-3 md:py-3.5 text-[10px] md:text-xs font-bold transition-all border-l border-white/10 flex flex-col items-center justify-center gap-0.5 ${
                            payMethod === 'stripe'
                              ? 'bg-white text-black shadow-inner'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                          style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                        >
                          <StripeLogo className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                          <span>Stripe</span>
                          <span className="text-[7px] md:text-[8px] opacity-50 leading-none -mt-0.5">Soon</span>
                        </button>
                      </div>

                      {/* Action Button - changes based on selected method */}
                      <AnimatePresence mode="wait">
                        <motion.button
                          key={payMethod}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (payMethod === 'cart') {
                              handleQuickAdd();
                            } else if (payMethod === 'stripe') {
                              handleBuyNow();
                            } else {
                              handleDirectCheckout(payMethod === 'whop' ? 'Whop' : 'Skrill');
                            }
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          disabled={payMethod === 'stripe' || payMethod === 'skrill' || !isInStock}
                          style={{
                            pointerEvents: 'all',
                            touchAction: 'manipulation'
                          }}
                          className={`w-full py-3.5 md:py-4 rounded-b-2xl transition-all flex items-center justify-center gap-2 text-sm md:text-base font-bold border-2 border-t-0 border-white/20 shadow-lg ${
                            payMethod === 'stripe' || payMethod === 'skrill'
                              ? 'bg-white/10 text-white/40 cursor-not-allowed'
                              : payMethod === 'cart'
                                ? 'bg-white hover:bg-white/90 text-black'
                                : 'bg-black hover:bg-black/80 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                          whileHover={payMethod !== 'stripe' && payMethod !== 'skrill' ? { scale: 1.02 } : {}}
                          whileTap={payMethod !== 'stripe' && payMethod !== 'skrill' ? { scale: 0.98 } : {}}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {payMethod === 'whop' && (
                            <>
                              <WhopLogo className="w-5 h-5 md:w-6 md:h-6" />
                              <span>Pay with Whop</span>
                            </>
                          )}
                          {payMethod === 'skrill' && (
                            <>
                              <SkrillLogo className="w-5 h-5 md:w-6 md:h-6" />
                              <span>Skrill — Coming Soon</span>
                            </>
                          )}
                          {payMethod === 'cart' && (
                            <>
                              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                              <span>Add to Cart</span>
                            </>
                          )}
                          {payMethod === 'stripe' && (
                            <>
                              <StripeLogo className="w-5 h-5 md:w-6 md:h-6" />
                              <span>Stripe — Coming Soon</span>
                            </>
                          )}
                        </motion.button>
                      </AnimatePresence>
                    </div>

                    {/* Crypto Guide Link */}
                    <motion.a
                      href="/crypto-guide"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => { e.stopPropagation(); }}
                      onTouchEnd={(e) => { e.stopPropagation(); }}
                      className="w-full py-2.5 md:py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs md:text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10"
                      style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span>How to Pay with Crypto</span>
                    </motion.a>

                    {/* Security Badges */}
                    <div className="flex items-center justify-center gap-2 md:gap-3 text-white/40 text-xs pt-3 flex-wrap">
                      <span>🔒 Secure</span>
                      <span>•</span>
                      <span>💳 Cards</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden md:inline">📱 Apple Pay</span>
                      <span className="hidden md:inline">•</span>
                      <span>₿ Crypto</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );

  if (use3DPin) {
    return (
      <>
        <div 
          className="h-full w-full flex items-center justify-center relative cursor-pointer" 
          style={{ zIndex: 50, contentVisibility: 'auto', containIntrinsicSize: 'auto 400px' } as React.CSSProperties}
        >
          <PinContainer
            title={product.name}
            containerClassName="w-full h-full"
            onClick={() => setShowQuickView(true)}
          >
            <div className="flex flex-col p-0 tracking-tight w-full h-full">
              <HoverBorderGradient
                containerClassName={compact ? 'rounded-lg w-full h-full' : 'rounded-xl md:rounded-2xl w-full h-full'}
                className="p-0 bg-transparent w-full h-full"
                as="div"
                onClick={() => setShowQuickView(true)}
              >
                {cardContent}
              </HoverBorderGradient>
            </div>
          </PinContainer>
          
          {/* Floating Buttons - Outside all card effects */}
          <motion.button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(e); }}
            className={`absolute top-2 md:top-3 right-2 md:right-3 h-8 w-8 md:h-10 md:w-10 rounded-full 
                       bg-black/80 border border-white/10
                       flex items-center justify-center
                       transition-all duration-300 pointer-events-auto
                       ${isLiked ? 'text-sky-400' : 'text-white/70'}`}
            style={{ zIndex: 9999 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </motion.button>
          
          <motion.button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickAdd(e); }}
            className={`absolute -bottom-5 md:bottom-10 left-1/2 -translate-x-1/2 h-10 md:h-11 px-5 md:px-6 rounded-full 
                       bg-white text-black flex items-center justify-center gap-2 shadow-2xl
                       border-2 border-black/10
                       hover:scale-105 hover:bg-gray-50 hover:shadow-xl
                       transition-all duration-200 active:scale-95 pointer-events-auto
                       ${isAdding ? 'scale-95' : ''}
                       ${!isInStock ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ zIndex: 9999 }}
            whileTap={{ scale: 0.95 }}
            disabled={!isInStock || isAdding}
          >
            {isAdding ? (
              <div
                className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full store-spin"
              />
            ) : (
              <>
                <Plus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
                <span className="text-xs md:text-sm font-semibold tracking-wide">Add</span>
              </>
            )}
          </motion.button>
        </div>
      </>
    );
  }

  return (
    <>
      <div 
        className="block h-full w-full relative cursor-pointer" 
        style={{ zIndex: 50, touchAction: 'manipulation', contentVisibility: 'auto', containIntrinsicSize: 'auto 400px' } as React.CSSProperties}
        onClick={() => setShowQuickView(true)}
      >
        <CardContainer className="h-full w-full" containerClassName="py-0 h-full w-full">
          <CardBody className="h-full w-full p-0">
            <CardItem translateZ="100" className="h-full w-full" onClick={() => setShowQuickView(true)}>
              <HoverBorderGradient
                containerClassName={compact ? 'rounded-lg h-full w-full' : 'rounded-xl md:rounded-2xl h-full w-full'}
                className="p-0 bg-transparent h-full w-full"
                as="div"
                onClick={() => setShowQuickView(true)}
              >
                {cardContent}
              </HoverBorderGradient>
            </CardItem>
          </CardBody>
        </CardContainer>
        
        {/* Floating Buttons - Outside all card effects */}
        <motion.button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(e); }}
          className={`absolute top-2 md:top-3 right-2 md:right-3 h-8 w-8 md:h-10 md:w-10 rounded-full 
                     bg-black/80 border border-white/10
                     flex items-center justify-center
                     transition-all duration-300 pointer-events-auto
                     ${isLiked ? 'text-sky-400' : 'text-white/70'}`}
          style={{ zIndex: 9999 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </motion.button>
        
        <motion.button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleQuickAdd(e); }}
          className={`absolute -bottom-5 md:bottom-10 left-1/2 -translate-x-1/2 h-10 md:h-11 px-5 md:px-6 rounded-full 
                     bg-white text-black flex items-center justify-center gap-2 shadow-2xl
                     border-2 border-black/10
                     hover:scale-105 hover:bg-gray-50 hover:shadow-xl
                     transition-all duration-200 active:scale-95 pointer-events-auto
                     ${isAdding ? 'scale-95' : ''}
                     ${!isInStock ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ zIndex: 9999 }}
          whileTap={{ scale: 0.95 }}
          disabled={!isInStock || isAdding}
        >
          {isAdding ? (
            <div
              className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full store-spin"
            />
          ) : (
            <>
              <Plus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
              <span className="text-xs md:text-sm font-semibold tracking-wide">Add</span>
            </>
          )}
        </motion.button>
      </div>
    </>
  );
});
