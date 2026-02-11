import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { FpsDisplay, MinimizedFpsDisplay } from '@/components/ultimate-hub/components/FpsWidgets';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useFpsMonitor } from '@/components/ultimate-hub/hooks/useFpsMonitor';

export const FpsPill = memo(({ 
  fps, 
  deviceTier, 
  isMinimized, 
  onTogglePanel,
  onToggleMinimized,
  onOpenDevicePanel
}: {
  fps: number;
  deviceTier: string;
  isMinimized: boolean;
  onTogglePanel: () => void;
  onToggleMinimized: () => void;
  onOpenDevicePanel: () => void;
}) => {
  const { jankScore = 0 } = useFpsMonitor();
  
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1, scale: isMinimized ? 0.9 : 1 }}
      className="fixed right-0 z-[250000] pointer-events-none"
      style={{ top: '50%', transform: 'translateY(-50%)', paddingRight: 'calc(env(safe-area-inset-right, 0px) + 8px)' }}
    >
      {/* Desktop Info Label - To the right of button */}
      <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-4 pointer-events-none z-[250001]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: isMinimized ? 0 : 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="text-left"
        >
          <div 
            className="text-base font-bold text-black whitespace-nowrap mb-1"
            style={{ textShadow: 'none' }}
          >
            📊 Click for Device Info
          </div>
          <div 
            className="text-sm text-black whitespace-nowrap font-medium"
            style={{ textShadow: 'none' }}
          >
            Trades • Live Streams • Performance
          </div>
        </motion.div>
      </div>

      <motion.div
        whileHover="hover"
        animate={isMinimized ? "minimized" : "initial"}
        className="relative pointer-events-auto cursor-pointer"
      >
        <motion.div
          variants={{
            initial: { x: 0, scale: 1 },
            hover: { x: -8, scale: 1.02 },
            minimized: { x: 2, scale: 0.95 }
          }}
          className="relative rounded-l-3xl bg-linear-to-br from-white/90 via-white/70 to-white/60 backdrop-blur-2xl border-y border-l border-black/10 shadow-2xl hover:border-black/15 hover:shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            SoundEffects.click();
            if (isMinimized) onToggleMinimized();
            else onOpenDevicePanel();
          }}
          onMouseEnter={() => {
            SoundEffects.hover();
            if (isMinimized) onToggleMinimized();
          }}
        >
          <AnimatePresence mode="popLayout">
            {isMinimized ? (
              <motion.div
                key="minimized"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="px-2 py-1.5"
              >
                <MinimizedFpsDisplay fps={fps} />
              </motion.div>
            ) : (
              <motion.div
                key="full"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="px-2 py-2"
              >
                <div className="flex items-center gap-1">
                  <ChevronRight size={14} className="text-black rotate-180" />
                  <FpsDisplay fps={fps} deviceTier={deviceTier} jankScore={jankScore} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});
FpsPill.displayName = 'FpsPill';
