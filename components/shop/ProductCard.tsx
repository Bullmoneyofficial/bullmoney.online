'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingBag, Heart, X, ExternalLink, CreditCard, Smartphone } from 'lucide-react';
import type { ProductWithDetails } from '@/types/store';
import { useCartStore } from '@/stores/cart-store';
import { toast } from 'sonner';
import { EncryptedText } from '@/components/Mainpage/encrypted-text';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';
import { PinContainer } from '@/components/ui/3d-pin';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';

// ============================================================================
// PRODUCT CARD - LUXURY GLASS MORPHISM DESIGN
// Mobile-First with Touch-Friendly Interactions
// ============================================================================

interface ProductCardProps {
  product: ProductWithDetails;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [mounted, setMounted] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const { addItem } = useCartStore();

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

  // Long press handlers
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      setShowQuickView(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    if (!isLongPress) {
      setShowQuickView(true);
    }
    setIsLongPress(false);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleDirectCheckout = async (paymentMethod: string) => {
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
    } else {
      const whopLink = `https://whop.com/checkout/${product.slug}`;
      window.open(whopLink, '_blank');
      toast.success(`Opening ${paymentMethod} checkout`);
    }
  };

  const handleBuyNow = async () => {
    // Coming soon - Stripe checkout disabled temporarily
    toast('Coming Soon!', {
      icon: '🚀',
      duration: 3000,
    });
    return;
  };

  const getCheckoutItems = () => {
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
  };

  const cardContent = (
    <>
      <motion.article
        className="group relative h-full w-full flex flex-col cursor-pointer"
        style={{ isolation: 'isolate' }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // Open expanded view on both mobile and desktop
          e.preventDefault();
          setShowQuickView(true);
        }}
      >
      {/* Image Container - Glassmorphism Border with Shimmer */}
      <div
        className={`relative overflow-hidden bg-white/5 ${
          compact ? 'aspect-[4/5] rounded-lg' : 'aspect-[3/4] rounded-xl md:rounded-2xl'
        }`}
      >
          {/* Animated Shimmer Border */}
          <div className="absolute inset-0 rounded-xl md:rounded-2xl p-[1px] overflow-hidden z-[1]">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
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
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {product.primary_image ? (
            <Image
              src={product.primary_image.startsWith('/') ? product.primary_image : `/${product.primary_image.replace(/^public\//, '')}`}
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

          {/* Badges */}
          <div className="absolute top-2 md:top-3 left-2 md:left-3 flex flex-col gap-1.5 z-[100]">
            {hasDiscount && (
              <motion.span 
                className="relative px-2 md:px-3 py-0.5 md:py-1 text-white text-[10px] md:text-xs font-semibold rounded-full shadow-lg overflow-hidden"
                style={{ 
                  backgroundColor: '#3b82f6',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)' 
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
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
                <span className="relative z-10">
                  <EncryptedText 
                    text={`-${discount}%`}
                    interval={100}
                    revealDelayMs={30}
                    className="tracking-wide"
                  />
                </span>
              </motion.span>
            )}
            {!isInStock && (
              <span className="px-2 md:px-3 py-0.5 md:py-1 bg-black text-white text-[10px] md:text-xs rounded-full border border-white/10">
                Sold out
              </span>
            )}
            {product.featured && isInStock && (
              <motion.span 
                className="relative px-2 md:px-3 py-0.5 md:py-1 text-white text-[10px] md:text-xs font-medium rounded-full overflow-hidden"
                style={{ backgroundColor: '#3b82f6' }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
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
        <div className={`mt-1.5 flex-1 flex flex-col relative z-[100] ${compact ? 'space-y-1' : 'md:mt-4 space-y-1.5 md:space-y-2'}`}>
          {product.category && !compact && (
            <p className="text-white/40 text-[10px] md:text-xs uppercase tracking-wider truncate">
              {product.category.name}
            </p>
          )}
          
          <h3 className={`text-white font-medium group-hover:text-white/80 transition-colors ${compact ? 'text-xs md:text-sm line-clamp-1' : 'text-sm md:text-base line-clamp-2'}`}>
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 md:gap-2">
            <span className={`text-white font-semibold ${compact ? 'text-sm' : 'text-sm md:text-base'}`}>
              ${price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-white/40 line-through text-xs md:text-sm">
                ${comparePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Variant Preview - Hidden on compact */}
          {!compact && product.variants && product.variants.length > 1 && (
            <div className="hidden md:flex items-center gap-1.5 pt-1">
              {product.variants.slice(0, 4).map((variant) => (
                variant.options?.color && (
                  <div
                    key={variant.id}
                    className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ 
                      backgroundColor: variant.options.color.toLowerCase() === 'white' 
                        ? '#ffffff' 
                        : variant.options.color.toLowerCase() 
                    }}
                    title={variant.options.color}
                  />
                )
              ))}
              {product.variants.length > 4 && (
                <span className="text-white/40 text-xs">+{product.variants.length - 4}</span>
              )}
            </div>
          )}
          
          {/* Mobile variant count */}
          {!compact && product.variants && product.variants.length > 1 && (
            <p className="md:hidden text-white/40 text-[10px]">
              {product.variants.length} options
            </p>
          )}
        </div>
    </motion.article>

    {/* Quick View Modal - Rendered via Portal (detached from card) */}
    {mounted && createPortal(
      <AnimatePresence>
        {showQuickView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black backdrop-blur-sm overflow-hidden"
          onClick={() => setShowQuickView(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full h-full max-w-7xl max-h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <CardItem translateZ={50} className="fixed top-6 right-6 z-50">
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                {/* Animated Shimmer Border */}
                <div className="absolute inset-0 rounded-full p-[1px] overflow-hidden z-[1]">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
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
                <div className="absolute inset-0 border border-white/20 rounded-full pointer-events-none z-[2]" />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />
                
                {/* Button Content */}
                <motion.button
                  onClick={() => setShowQuickView(false)}
                  className="relative w-full h-full rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  <X className="w-6 h-6 text-white" />
                </motion.button>
              </div>
            </CardItem>

            {/* Scrollable Content */}
            <div className="min-h-full p-6 md:p-12 flex items-center justify-center bg-black">
              <div className="w-full max-w-6xl bg-black">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 bg-black">
                  {/* Product Image - Larger */}
                  <div className="relative w-full aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden bg-black border border-white/20">
                    {product.primary_image ? (
                      <Image
                        src={product.primary_image.startsWith('/') ? product.primary_image : `/${product.primary_image.replace(/^public\//, '')}`}
                        alt={product.name}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/20 text-8xl font-light">B</span>
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-4 left-4 px-4 py-2 text-white text-sm font-bold rounded-full" style={{ backgroundColor: 'rgb(25, 86, 180)' }}>
                        -{discount}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col space-y-6">
                    <div className="space-y-3">
                      {product.category && (
                        <p className="text-sm uppercase tracking-wider font-semibold" style={{ color: 'rgb(25, 86, 180)' }}>
                          {product.category.name}
                        </p>
                      )}
                      <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                        {product.name}
                      </h1>
                      
                      {/* Subtitle/Short Description */}
                      {product.description && (
                        <p className="text-lg text-white/70 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-4 py-4 border-y border-white/10">
                      <span className="text-5xl font-bold text-white">
                        ${(selectedVariant?.price || price).toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-2xl text-white/40 line-through">
                            ${comparePrice.toFixed(2)}
                          </span>
                          <span className="px-4 py-1.5 text-white text-base font-semibold rounded-full" style={{ backgroundColor: 'rgb(25, 86, 180)' }}>
                            Save {discount}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* Variants */}
                    {product.variants && product.variants.length > 1 && (
                      <CardItem translateZ={30} className="w-full">
                        <div>
                          <p className="text-white text-base font-semibold mb-3">Select Your Option:</p>
                          <div className="flex flex-wrap gap-3">
                            {product.variants.map((variant, index) => (
                              <div key={variant.id} className="relative">
                                {/* Animated Shimmer Border */}
                                <div className="absolute inset-0 rounded-xl p-[1px] overflow-hidden z-[1]">
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
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
                                
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />
                                
                                {/* Button */}
                                <motion.button
                                  onClick={() => setSelectedVariant(variant)}
                                  style={{
                                    backgroundColor: selectedVariant?.id === variant.id ? 'rgb(25, 86, 180)' : 'rgba(255, 255, 255, 0.05)',
                                  }}
                                  className={`relative px-6 py-3 rounded-xl transition-all font-medium text-white ${
                                    selectedVariant?.id === variant.id
                                      ? 'scale-105 shadow-lg'
                                      : 'text-white/80 hover:text-white'
                                  }`}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05, duration: 0.3 }}
                                >
                                  {variant.options?.size || variant.options?.color || `Option ${variant.id}`}
                                </motion.button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardItem>
                    )}

                {/* Stock Status */}
                <div className="flex items-center gap-3 p-4 bg-black rounded-xl border border-white/20">
                  <div className={`w-3 h-3 rounded-full ${isInStock ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className={`text-base font-semibold ${isInStock ? 'text-green-400' : 'text-red-400'}`}>
                    {isInStock ? '✓ In Stock - Ready to Ship' : '✗ Out of Stock'}
                  </span>
                </div>

                {/* Payment Options */}
                <div className="space-y-4 pt-6 bg-black">
                  <p className="text-white text-base font-semibold">Secure Checkout:</p>
                  
                  {/* Buy Now Button - Direct Stripe Checkout */}
                  <CardItem translateZ={40} className="w-full">
                    <div className="relative w-full overflow-hidden rounded-xl">
                      {/* Animated Shimmer Border */}
                      <div className="absolute inset-0 rounded-xl p-[1px] overflow-hidden z-[1]">
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
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
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />
                      
                      {/* COMING_SOON_BUTTON: To re-enable, change disabled to {!isInStock}, restore onClick={handleBuyNow}, change bg color to rgb(25, 86, 180), and text to "Buy Now with Stripe" */}
                      <motion.button
                        // onClick={handleBuyNow} // COMING_SOON: Uncomment to re-enable
                        disabled={true}
                        style={{
                          backgroundColor: 'rgb(75, 75, 75)',
                        }}
                        className="relative w-full py-5 opacity-60 text-white text-lg font-bold rounded-xl transition-all cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 0.6, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>Coming Soon</span>
                      </motion.button>
                    </div>
                  </CardItem>

                  {/* Alternative Payment Methods */}
                  <CardItem translateZ={35} className="w-full">
                    <div className="grid grid-cols-2 gap-3 w-full">
                      {/* Whop Pay Button */}
                      <div className="relative overflow-hidden rounded-xl">
                        {/* Animated Shimmer Border */}
                        <div className="absolute inset-0 rounded-xl p-[1px] overflow-hidden z-[1]">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
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
                        
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />
                        
                        {/* Button */}
                        <motion.button
                          onClick={() => handleDirectCheckout('Whop')}
                          disabled={!isInStock}
                          style={{
                            backgroundColor: 'rgb(25, 86, 180)',
                          }}
                          className="relative w-full py-4 hover:opacity-90 disabled:opacity-50 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:cursor-not-allowed shadow-lg text-sm font-bold"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.1 }}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm font-medium">Whop Pay</span>
                        </motion.button>
                      </div>
                      
                      {/* Add to Cart Button */}
                      <div className="relative overflow-hidden rounded-xl">
                        {/* Animated Shimmer Border */}
                        <div className="absolute inset-0 rounded-xl p-[1px] overflow-hidden z-[1]">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
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
                        
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-10 pointer-events-none" />
                        
                        {/* Button */}
                        <motion.button
                          onClick={handleQuickAdd}
                          disabled={!isInStock}
                          style={{
                            backgroundColor: 'rgb(25, 86, 180)',
                          }}
                          className="relative w-full py-4 hover:opacity-90 disabled:opacity-50 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:cursor-not-allowed shadow-lg text-sm font-bold"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.15 }}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span className="text-sm font-medium">Add to Cart</span>
                        </motion.button>
                      </div>
                    </div>
                  </CardItem>

                  <div className="flex items-center justify-center gap-3 text-white/40 text-xs pt-2">
                    <span>🔒 Secure Payment</span>
                    <span>•</span>
                    <span>💳 All Cards Accepted</span>
                    <span>•</span>
                    <span>📱 Apple & Google Pay</span>
                  </div>
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
          style={{ zIndex: 10 }}
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
              >
                {cardContent}
              </HoverBorderGradient>
            </div>
          </PinContainer>
          
          {/* Floating Buttons - Outside all card effects */}
          <motion.button
            onClick={(e) => { e.stopPropagation(); handleLike(e); }}
            className={`absolute top-2 md:top-3 right-2 md:right-3 h-8 w-8 md:h-10 md:w-10 rounded-full 
                       bg-black/80 border border-white/10
                       flex items-center justify-center
                       transition-all duration-300
                       ${isLiked ? 'text-sky-400' : 'text-white/70'}`}
            style={{ zIndex: 200 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </motion.button>
          
          <motion.button
            onClick={(e) => { e.stopPropagation(); handleQuickAdd(e); }}
            className={`absolute -bottom-5 left-1/2 -translate-x-1/2 h-10 md:h-11 px-5 md:px-6 rounded-full 
                       bg-white text-black flex items-center justify-center gap-2 shadow-2xl
                       border-2 border-black/10
                       hover:scale-105 hover:bg-gray-50 hover:shadow-xl
                       transition-all duration-200 active:scale-95
                       ${isAdding ? 'scale-95' : ''}
                       ${!isInStock ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ zIndex: 200 }}
            whileTap={{ scale: 0.95 }}
            disabled={!isInStock || isAdding}
          >
            {isAdding ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
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
        style={{ zIndex: 10 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowQuickView(true);
        }}
      >
        <CardContainer className="h-full w-full" containerClassName="py-0 h-full w-full">
          <CardBody className="h-full w-full p-0">
            <CardItem translateZ="100" className="h-full w-full">
              <HoverBorderGradient
                containerClassName={compact ? 'rounded-lg h-full w-full' : 'rounded-xl md:rounded-2xl h-full w-full'}
                className="p-0 bg-transparent h-full w-full"
                as="div"
              >
                {cardContent}
              </HoverBorderGradient>
            </CardItem>
          </CardBody>
        </CardContainer>
        
        {/* Floating Buttons - Outside all card effects */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); handleLike(e); }}
          className={`absolute top-2 md:top-3 right-2 md:right-3 h-8 w-8 md:h-10 md:w-10 rounded-full 
                     bg-black/80 border border-white/10
                     flex items-center justify-center
                     transition-all duration-300
                     ${isLiked ? 'text-sky-400' : 'text-white/70'}`}
          style={{ zIndex: 200 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </motion.button>
        
        <motion.button
          onClick={(e) => { e.stopPropagation(); handleQuickAdd(e); }}
          className={`absolute -bottom-5 left-1/2 -translate-x-1/2 h-10 md:h-11 px-5 md:px-6 rounded-full 
                     bg-white text-black flex items-center justify-center gap-2 shadow-2xl
                     border-2 border-black/10
                     hover:scale-105 hover:bg-gray-50 hover:shadow-xl
                     transition-all duration-200 active:scale-95
                     ${isAdding ? 'scale-95' : ''}
                     ${!isInStock ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ zIndex: 200 }}
          whileTap={{ scale: 0.95 }}
          disabled={!isInStock || isAdding}
        >
          {isAdding ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
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
