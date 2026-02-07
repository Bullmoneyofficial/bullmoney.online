'use client';

import { motion } from 'framer-motion';
import { AVAILABLE_COINS } from '@/lib/crypto-wallets';

// ============================================================================
// CRYPTO ACCEPTED BANNER - Shows supported crypto on the store page
// Lightweight animated ticker for the store/product pages
// ============================================================================

export function CryptoAcceptedBanner() {
  return (
    <div className="w-full overflow-hidden py-3 border-y border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-center gap-6 flex-wrap px-4">
        <span className="text-white/40 text-xs font-medium uppercase tracking-wider shrink-0">
          Crypto Accepted
        </span>
        <div className="flex items-center gap-4">
          {AVAILABLE_COINS.map((coin, i) => (
            <motion.div
              key={coin.coin}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5"
            >
              <span className="text-sm" style={{ color: coin.color }}>
                {coin.symbol}
              </span>
              <span className="text-white/60 text-xs font-medium">
                {coin.coin}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
