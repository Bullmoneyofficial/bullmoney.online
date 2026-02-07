'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { CryptoPaymentModal } from '@/components/shop/CryptoPaymentModal';

// ============================================================================
// CRYPTO PAY BUTTON - Reusable button that opens the crypto payment modal
// Drop this into any product card, expanded view, or checkout page
// ============================================================================

interface CryptoPayButtonProps {
  productName: string;
  productImage?: string | null;
  priceUSD: number;
  productId: string;
  variantId?: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'compact';
  onPaymentSubmitted?: (txHash: string, coin: string, network: string) => void;
}

export function CryptoPayButton({
  productName,
  productImage,
  priceUSD,
  productId,
  variantId,
  quantity = 1,
  disabled = false,
  className = '',
  variant = 'primary',
  onPaymentSubmitted,
}: CryptoPayButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const baseClasses = {
    primary: 'w-full py-4 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg',
    secondary: 'w-full py-3 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all border border-white/20 hover:border-white/40',
    compact: 'px-4 py-2 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all',
  };

  return (
    <>
      <div className={`relative overflow-hidden rounded-xl ${variant !== 'compact' ? 'w-full' : ''}`}>
        {variant !== 'compact' && (
          <>
            {/* Animated Shimmer Border */}
            <div className="absolute inset-0 rounded-xl p-px overflow-hidden z-1">
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-20 store-shimmer-border" style={{ width: '100%' }} />
              <div className="absolute inset-px bg-transparent rounded-xl" />
            </div>
            {/* Static White Border */}
            <div className="absolute inset-0 border border-white/20 rounded-xl pointer-events-none z-2" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-white/10 to-transparent z-10 pointer-events-none" />
          </>
        )}
        
        <motion.button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowModal(true);
          }}
          disabled={disabled}
          className={`relative ${baseClasses[variant]} ${className}`}
          style={{
            backgroundColor: variant === 'secondary' ? 'rgba(255, 255, 255, 0.05)' : 'rgb(245, 158, 11)',
          }}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          <Wallet className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          <span>Pay with Crypto</span>
          {variant === 'primary' && (
            <span className="ml-1 text-xs opacity-70">₿ Ξ ◎</span>
          )}
        </motion.button>
      </div>

      <CryptoPaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        productName={productName}
        productImage={productImage}
        priceUSD={priceUSD}
        productId={productId}
        variantId={variantId}
        quantity={quantity}
        onPaymentSubmitted={(txHash, coin, network) => {
          onPaymentSubmitted?.(txHash, coin, network);
          // Don't close modal - let the confirmation step show
        }}
      />
    </>
  );
}
