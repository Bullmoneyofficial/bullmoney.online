import { memo } from 'react';
import { AnimatePresence, motion, type TargetAndTransition } from 'framer-motion';
import { X } from 'lucide-react';
import { SoundEffects } from '@/app/hooks/useSoundEffects';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';

export const ModalWrapper = memo(({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = '520px',
  color = 'blue'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
  maxWidth?: string;
  color?: 'blue' | 'purple' | 'cyan';
}) => {
  const { isMobile, animations, shouldDisableBackdropBlur, shouldSkipHeavyEffects } = useMobilePerformance();
  
  const colorClasses = {
    blue: 'border-black/10 shadow-lg',
    purple: 'border-black/10 shadow-lg',
    cyan: 'border-black/10 shadow-lg'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={animations.modalBackdrop.initial as TargetAndTransition}
          animate={animations.modalBackdrop.animate as TargetAndTransition}
          exit={animations.modalBackdrop.exit as TargetAndTransition}
          className={`fixed inset-0 z-[2147483647] flex items-center justify-center p-3 sm:p-6 bg-black/60 ${shouldDisableBackdropBlur ? '' : 'backdrop-blur-md'}`}
          onClick={onClose}
        >
          {/* Tap hints - Skip on mobile for performance */}
          {!shouldSkipHeavyEffects && ['top', 'bottom', 'left', 'right'].map(pos => (
            <motion.div
              key={pos}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute text-${color}-300/50 text-xs pointer-events-none ${
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

          <motion.div
            initial={animations.modalContent.initial as TargetAndTransition}
            animate={animations.modalContent.animate as TargetAndTransition}
            exit={animations.modalContent.exit as TargetAndTransition}
            transition={animations.modalContent.transition}
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white border ${shouldDisableBackdropBlur ? '' : 'backdrop-blur-2xl'} ${isMobile ? '' : 'shadow-2xl'} ${colorClasses[color]}`}
            style={{ maxWidth, backgroundColor: '#ffffff', colorScheme: 'light' as const }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
ModalWrapper.displayName = 'ModalWrapper';
