import { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { TRADING_TIPS } from '@/components/ultimate-hub/constants';

export const TradingTipPill = memo(() => {
  const [tipIndex, setTipIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpinning(true);
      setTimeout(() => {
        setTipIndex(p => (p + 1) % TRADING_TIPS.length);
        setIsSpinning(false);
      }, 800);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-r-full bg-white/90 backdrop-blur-xl border-y border-r border-black/10 shadow-sm px-1.5 py-1 overflow-hidden max-w-[180px]">
      <div className="flex items-center gap-1.5 relative z-10">
        <motion.div animate={isSpinning ? { rotate: 360, scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5 }}>
          <Sparkles className="w-2.5 h-2.5 text-black" />
        </motion.div>
        <div className="h-3 flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.span
              key={tipIndex}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="absolute inset-0 flex items-center text-[7px] text-black/80 font-medium whitespace-nowrap truncate"
            >
              {TRADING_TIPS[tipIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
TradingTipPill.displayName = 'TradingTipPill';
