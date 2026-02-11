import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bitcoin, ChevronRight, Coins } from 'lucide-react';
import { TradingTipPill } from '@/components/ultimate-hub/components/TradingTipPill';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

export const TradingPill = memo(({ prices, isExpanded, onToggle }: {
  prices: { xauusd: string; btcusd: string };
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  // Currency formatting - subscribe to store for reactivity
  const { formatPrice } = useCurrencyLocaleStore();
  
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 z-[250000] pointer-events-none"
      style={{ top: 'calc(5rem + env(safe-area-inset-top, 0px) + 28px)', paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 2px)' }}
    >
      <motion.div
        whileHover={{ x: 12, scale: 1.05, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}
        className="relative pointer-events-auto cursor-pointer"
        onClick={onToggle}
        animate={{ x: [0, 8, 0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
      >
        <div className="relative rounded-r-full bg-white/90 backdrop-blur-xl border-y border-r border-black/10 shadow-sm hover:border-black/15">
          <motion.div
            className="absolute inset-0 rounded-r-full bg-linear-to-r from-white/20 via-white/10 to-transparent"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ filter: 'blur(8px)' }}
          />
          
          <div className="px-2 py-1.5 flex items-center gap-1.5 relative z-10">
            <motion.div
              className="w-2 h-2 bg-white rounded-full"
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1], boxShadow: ['0 0 0px rgba(255, 255, 255, 1)', '0 0 8px rgba(255, 255, 255, 0.8)', '0 0 0px rgba(255, 255, 255, 1)'] }}
              transition={{ duration: 1, repeat: Infinity }}
            />

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <Coins className="w-3 h-3 text-black" />
                <span className="text-[9px] font-bold text-black">{formatPrice(parseFloat(prices.xauusd) || 0)}</span>
              </div>
              <div className="w-px h-2.5 bg-black" />
              <div className="flex items-center gap-0.5">
                <Bitcoin className="w-3 h-3 text-black" />
                <span className="text-[9px] font-bold text-black">{formatPrice(parseFloat(prices.btcusd) || 0)}</span>
              </div>
            </div>

            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronRight className="w-3 h-3 text-black/50" />
            </motion.div>
          </div>
        </div>
        
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5"
          >
            <TradingTipPill />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
});
TradingPill.displayName = 'TradingPill';
