"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, AlertTriangle } from 'lucide-react';

interface PerfToastProps {
  toast: {
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null;
}

// BULLMONEY shimmer gradient
const getShimmerGradient = (color: string) =>
  `conic-gradient(from 90deg at 50% 50%, #00000000 0%, ${color} 50%, #00000000 100%)`;

export function PerfToast({ toast }: PerfToastProps) {
  if (!toast) return null;

  const primaryBlue = '#3b82f6';
  const successColor = '#10b981';
  const warningColor = '#f97316';

  const color = toast.type === 'success' ? successColor : toast.type === 'warning' ? warningColor : primaryBlue;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-32 left-1/2 -translate-x-1/2 z-[100000] pointer-events-none px-4"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 130px)',
          }}
        >
          <div className="relative rounded-xl overflow-hidden shadow-2xl max-w-md"
               style={{
                 boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px ${color}30, 0 0 20px ${color}20`
               }}>

            {/* Rotating shimmer effect - BULLMONEY style */}
            <motion.div
              className="absolute inset-[-100%]"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ background: getShimmerGradient(color) }}
            />

            <div className="absolute inset-[1.5px] rounded-xl bg-black/95 backdrop-blur-xl">
              {/* Top Accent Line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  boxShadow: `0 0 8px ${color}`,
                }}
              />

              <div className="px-4 py-3 flex items-center gap-3">
                {/* Icon */}
                <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                  <motion.div
                    className="absolute inset-[-100%]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    style={{ background: getShimmerGradient(color) }}
                  />
                  <div className="absolute inset-[1.5px] rounded-xl bg-black/80 flex items-center justify-center">
                    {toast.type === 'success' && <Check size={20} style={{ color }} className="drop-shadow-[0_0_8px_currentColor]" />}
                    {toast.type === 'info' && <Info size={20} style={{ color }} className="drop-shadow-[0_0_8px_currentColor]" />}
                    {toast.type === 'warning' && <AlertTriangle size={20} style={{ color }} className="drop-shadow-[0_0_8px_currentColor]" />}
                  </div>
                </div>

                {/* Message */}
                <p className="text-sm font-bold text-white leading-snug flex-1">
                  {toast.message}
                </p>
              </div>

              {/* Bottom Accent Line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[1px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
