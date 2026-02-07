'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Heart, Truck, Shield, RotateCcw, Check, Ruler, Package } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';
import { toast } from 'sonner';
import CountUp from '@/components/CountUp';
import TextType from '@/components/TextType';
import { ShareProductButton } from '@/components/shop/ShareProductButton';
import { BackInStockButton } from '@/components/shop/BackInStockButton';
import { ShippingReturnsModal } from '@/components/shop/ShippingReturnsModal';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { SizeGuideModal } from '@/components/shop/SizeGuideModal';
import { CryptoCheckoutTrigger } from '@/components/shop/CryptoCheckoutInline';
import type { ProductWithDetails, Variant } from '@/types/store';

// ============================================================================
// PRODUCT INFO - ADD TO CART WITH STOCK VALIDATION
// ============================================================================

interface ProductInfoProps {
  product: ProductWithDetails;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const searchParams = useSearchParams();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [autoAddTriggered, setAutoAddTriggered] = useState(false);
  const { addItem, hasItem, openCart } = useCartStore();
  const { toggleItem, hasItem: isWishlisted } = useWishlistStore();
  const { addItem: addRecentlyViewed } = useRecentlyViewedStore();
  const formatPrice = useCurrencyLocaleStore((s) => s.formatPrice);

  const wishlisted = isWishlisted(product.id);

  // Extract unique options from variants
  const optionTypes = new Map<string, Set<string>>();
  product.variants?.forEach((variant) => {
    Object.entries(variant.options).forEach(([key, value]) => {
      if (value) {
        if (!optionTypes.has(key)) {
          optionTypes.set(key, new Set());
        }
        optionTypes.get(key)!.add(value);
      }
    });
  });

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Select first variant by default
  useEffect(() => {
    if (product.variants?.length) {
      const firstVariant = product.variants[0];
      setSelectedVariant(firstVariant);
      setSelectedOptions(firstVariant.options as Record<string, string>);
    }
  }, [product.variants]);

  // Find matching variant when options change
  useEffect(() => {
    if (Object.keys(selectedOptions).length === 0) return;
    
    const matchingVariant = product.variants?.find((variant) =>
      Object.entries(selectedOptions).every(
        ([key, value]) => variant.options[key] === value
      )
    );
    
    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      // Reset quantity if it exceeds stock
      if (quantity > matchingVariant.inventory_count) {
        setQuantity(Math.max(1, matchingVariant.inventory_count));
      }
    }
  }, [product.variants, quantity]);

  // Track recently viewed
  useEffect(() => {
    addRecentlyViewed({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.base_price,
      image: product.primary_image || null,
      category: product.category?.name,
    });
  }, [product.id]);

  // Auto-add to cart when coming from wishlist "Buy Now" button
  useEffect(() => {
    const shouldAutoAdd = searchParams.get('addToCart') === 'true';
    if (shouldAutoAdd && selectedVariant && !autoAddTriggered) {
      const isInStock = selectedVariant.inventory_count > 0;
      if (isInStock) {
        setAutoAddTriggered(true);
        addItem(product as ProductWithDetails, selectedVariant, 1);
        openCart();
        toast.success(`${product.name} added to cart!`);
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('addToCart');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, selectedVariant, autoAddTriggered, product, addItem, openCart]);

  const price = product.base_price + (selectedVariant?.price_adjustment || 0);
  const comparePrice = product.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > price;
  const isInStock = selectedVariant ? selectedVariant.inventory_count > 0 : false;
  const isLowStock = selectedVariant && selectedVariant.inventory_count <= selectedVariant.low_stock_threshold;
  
  const isInCart = selectedVariant ? hasItem(product.id, selectedVariant.id) : false;

  const handleOptionSelect = (optionKey: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionKey]: value }));
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    const maxQuantity = selectedVariant?.inventory_count || 1;
    
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error('Please select all options');
      return;
    }

    if (!isInStock) {
      toast.error('This item is out of stock');
      return;
    }

    if (quantity > selectedVariant.inventory_count) {
      toast.error(`Only ${selectedVariant.inventory_count} available`);
      return;
    }

    addItem(product, selectedVariant, quantity);
    toast.success(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`);
  };

  const ratingStats = product.details?.rating_stats;

  return (
    <div className="lg:sticky lg:top-24 space-y-8 relative" style={{ zIndex: 100 }}>
      {/* Breadcrumb */}
      <nav className="text-sm text-white/40 flex items-center gap-2 flex-wrap">
        <Link href="/store" className="hover:text-white/60 transition-colors">Store</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link
              href={`/store?category=${product.category.slug || product.category.name.toLowerCase()}`}
              className="hover:text-white/60 transition-colors"
            >
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-white">{product.name}</span>
      </nav>

      {/* Title & Price */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"><TextType text={product.name} typingSpeed={Math.max(8, 30 - product.name.length / 2)} showCursor cursorCharacter="_" cursorBlinkDuration={0.5} loop={false} as="span" /></h1>
        
        {ratingStats && ratingStats.count > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(ratingStats.average) ? 'text-white' : 'text-white/20'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-white/60 text-sm">
              {ratingStats.average.toFixed(1)} ({ratingStats.count} reviews)
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{formatPrice(price)}</span>
          {hasDiscount && (
            <>
              <span className="text-xl text-white/40 line-through">{formatPrice(comparePrice)}</span>
              <span className="px-2 py-1 bg-white text-black text-xs font-medium rounded-md">
                Save <CountUp to={Math.round((1 - price / comparePrice) * 100)} from={0} duration={1} className="" />%
              </span>
            </>
          )}
        </div>

        {product.short_description && (
          <p className="text-white/60 leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">{product.short_description}</p>
        )}
      </div>

      {/* Variant Options */}
      {Array.from(optionTypes.entries()).map(([optionKey, values]) => (
        <div key={optionKey} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium uppercase tracking-wider text-white/60">
              {optionKey}: <span className="text-white">{selectedOptions[optionKey]}</span>
            </label>
            {optionKey.toLowerCase() === 'size' && (
              <button
                onClick={() => setShowSizeGuide(true)}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/70 transition-colors"
              >
                <Ruler className="w-3.5 h-3.5" />
                Size Guide
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(values).map((value) => {
              const isSelected = selectedOptions[optionKey] === value;
              // Check if this option combination has stock
              const variantWithOption = product.variants?.find(
                (v) => v.options[optionKey] === value &&
                  Object.entries(selectedOptions)
                    .filter(([k]) => k !== optionKey)
                    .every(([k, val]) => v.options[k] === val)
              );
              const hasStock = variantWithOption ? variantWithOption.inventory_count > 0 : true;
              
              // Render color swatches differently
              if (optionKey.toLowerCase() === 'color') {
                return (
                  <button
                    key={value}
                    onClick={() => handleOptionSelect(optionKey, value)}
                    disabled={!hasStock}
                    className={`relative w-10 h-10 rounded-full border-2 transition-all
                      ${isSelected ? 'border-white scale-110' : 'border-white/20'}
                      ${!hasStock ? 'opacity-30 cursor-not-allowed' : 'hover:border-white/60'}
                    `}
                    style={{ 
                      backgroundColor: value.toLowerCase() === 'white' ? '#ffffff' : value.toLowerCase() 
                    }}
                    title={value}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className={`w-5 h-5 ${value.toLowerCase() === 'white' ? 'text-black' : 'text-white'}`} />
                      </span>
                    )}
                    {!hasStock && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-8 h-0.5 bg-white/60 rotate-45 absolute" />
                      </span>
                    )}
                  </button>
                );
              }
              
              return (
                <button
                  key={value}
                  onClick={() => handleOptionSelect(optionKey, value)}
                  disabled={!hasStock}
                  className={`h-12 px-6 rounded-xl border transition-all text-sm font-medium
                    ${isSelected 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent text-white border-white/20 hover:border-white/40'
                    }
                    ${!hasStock ? 'opacity-30 cursor-not-allowed line-through' : ''}
                  `}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Quantity & Add to Cart */}
      <div className="space-y-4">
        {/* Stock Status */}
        <div className="flex items-center gap-2">
          {isInStock ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-white/60">
                {isLowStock 
                  ? `Only ${selectedVariant?.inventory_count} left` 
                  : 'In stock'
                }
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-white/60">Out of stock</span>
            </>
          )}
        </div>

        {/* Back in Stock - show when out of stock */}
        {!isInStock && (
          <BackInStockButton
            productId={product.id}
            productName={product.name}
            variantName={selectedVariant?.name}
          />
        )}

        {isInStock && (
        <>
        <div className="flex gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center h-14 bg-white/5 border border-white/10 rounded-xl">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="w-12 h-full flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={!selectedVariant || quantity >= selectedVariant.inventory_count}
              className="w-12 h-full flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <motion.button
            onClick={handleAddToCart}
            disabled={!isInStock || !selectedVariant}
            className="flex-1 h-14 px-8 bg-white text-black rounded-xl font-medium
                     flex items-center justify-center gap-3
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-white/90 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <ShoppingBag className="w-5 h-5" />
            {isInCart ? 'Add More' : 'Add to Cart'}
          </motion.button>

          {/* Wishlist Button */}
          <button
            onClick={() => {
              const added = toggleItem({
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price: product.base_price,
                image: product.primary_image || null,
              });
              toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
            }}
            className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-colors
              ${wishlisted 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
          >
            <Heart className={`w-5 h-5 ${wishlisted ? 'fill-white' : ''}`} />
          </button>

          {/* Share Button */}
          <ShareProductButton productName={product.name} />
        </div>
        
        {/* Pay with Crypto - Inline Checkout */}
        <CryptoCheckoutTrigger
          productName={product.name}
          productImage={product.primary_image}
          priceUSD={price}
          productId={product.id.toString()}
          variantId={selectedVariant?.id?.toString()}
          quantity={quantity}
          disabled={!isInStock || !selectedVariant}
        />

        {/* Crypto Guide Link */}
        <a
          href="/crypto-guide"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm text-white hover:text-white/90 bg-black hover:bg-black/90 border border-white/10 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          New to crypto? Learn how to pay →
        </a>
        </>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
        <button onClick={() => setShowShippingModal(true)} className="text-center p-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
          <Truck className="w-6 h-6 mx-auto mb-2 text-white/60" />
          <p className="text-xs text-white/60">Free Shipping</p>
          <p className="text-xs text-white/40">Orders {formatPrice(150)}+</p>
        </button>
        <button onClick={() => setShowShippingModal(true)} className="text-center p-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
          <Shield className="w-6 h-6 mx-auto mb-2 text-white/60" />
          <p className="text-xs text-white/60">Secure Payment</p>
          <p className="text-xs text-white/40">256-bit SSL</p>
        </button>
        <button onClick={() => setShowShippingModal(true)} className="text-center p-4 hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
          <RotateCcw className="w-6 h-6 mx-auto mb-2 text-white/60" />
          <p className="text-xs text-white/60">Easy Returns</p>
          <p className="text-xs text-white/40">30 day policy</p>
        </button>
      </div>

      {/* SKU */}
      {selectedVariant?.sku && (
        <p className="text-xs text-white/30">
          SKU: {selectedVariant.sku}
        </p>
      )}

      {/* Modals */}
      <ShippingReturnsModal isOpen={showShippingModal} onClose={() => setShowShippingModal(false)} />
      <SizeGuideModal isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} />
    </div>
  );
}
