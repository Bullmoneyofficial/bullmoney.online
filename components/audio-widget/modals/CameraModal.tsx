import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconFlare, IconSwitchHorizontal } from "@tabler/icons-react";
import { SoundEffects } from "@/app/hooks/useSoundEffects";
import { Z_INDEX } from "../constants/zIndex";
import { useMobilePerformance } from "@/hooks/useMobilePerformance";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CameraModal = React.memo(function CameraModal({
  isOpen,
  onClose,
}: CameraModalProps) {
  const { shouldSkipHeavyEffects } = useMobilePerformance();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [filter, setFilter] = useState<'none' | 'sepia' | 'grayscale' | 'invert' | 'hue'>('none');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const animationRef = useRef<number | null>(null);

  // Liquid animation effect
  useEffect(() => {
    if (!isOpen) return;
    
    const animate = () => {
      if (turbulenceRef.current) {
        const time = Date.now() / 3000;
        const val = 0.006 + Math.sin(time) * 0.003;
        turbulenceRef.current.setAttribute('baseFrequency', `${val} ${val}`);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isOpen]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode } 
      }).then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }).catch(console.error);
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setFlashActive(true);
    SoundEffects.success();
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0);
    }
    
    setTimeout(() => setFlashActive(false), 150);
  }, [facingMode]);

  const filterStyles: Record<string, string> = {
    none: '',
    sepia: 'sepia(100%)',
    grayscale: 'grayscale(100%)',
    invert: 'invert(100%)',
    hue: 'hue-rotate(180deg) saturate(200%)'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 flex items-center justify-center bg-black/90 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-md'}`}
          style={{ zIndex: Z_INDEX.CAMERA_MODAL }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, rotateY: -30 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0.8, rotateY: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
            className="relative w-[85vw] max-w-[340px] aspect-[9/16] rounded-[45px] overflow-hidden"
            style={{ perspective: 1000 }}
          >
            {/* SVG Liquid Filter */}
            <svg className="absolute w-0 h-0">
              <defs>
                <filter id="camera-liquid-distortion">
                  <feTurbulence ref={turbulenceRef} type="fractalNoise" baseFrequency="0.008" numOctaves="3" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
            </svg>

            {/* iPhone Frame */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1f] via-[#0f0f12] to-[#1a1a1f] rounded-[45px] border-[4px] border-slate-700/60 shadow-[0_0_80px_rgba(0,0,0,0.9),inset_0_2px_2px_rgba(255,255,255,0.05)]">
              {/* Titanium Edge */}
              <div className="absolute inset-[2px] rounded-[41px] border border-slate-600/30" />
              
              {/* Dynamic Island */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                <div className="bg-black rounded-full px-6 py-2 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-slate-600">
                    <motion.div className="w-full h-full rounded-full bg-white/40" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={shouldSkipHeavyEffects ? {} : { duration: 1.5, repeat: Infinity }} />
                  </div>
                  <span className="text-[9px] text-white/60 font-medium">Recording</span>
                </div>
              </div>

              {/* Camera View with Reflective Effect */}
              <div className="absolute inset-[6px] rounded-[39px] overflow-hidden bg-black">
                {/* Reflective shimmer overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-transparent z-20 pointer-events-none"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={shouldSkipHeavyEffects ? {} : { duration: 4, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Video Feed */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ 
                    filter: `url(#camera-liquid-distortion) ${filterStyles[filter]}`,
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                  }}
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Flash Effect */}
                <AnimatePresence>
                  {flashActive && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 bg-white z-50"
                    />
                  )}
                </AnimatePresence>

                {/* Camera UI Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 z-30">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mt-8">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      className={`w-10 h-10 rounded-full bg-black/60 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-md'} flex items-center justify-center border border-white/10`}
                    >
                      <IconX className="w-5 h-5 text-white" />
                    </motion.button>
                    
                    <div className="flex gap-2">
                      {(['none', 'sepia', 'grayscale', 'hue'] as const).map((f) => (
                        <motion.button
                          key={f}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setFilter(f)}
                          className={`w-9 h-9 rounded-full ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-md'} flex items-center justify-center text-[7px] font-bold uppercase border ${
                            filter === f 
                              ? "bg-white text-black border-white" 
                              : "bg-black/60 text-white/70 border-white/10"
                          }`}
                        >
                          {f === 'none' ? '○' : f.slice(0, 2)}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Center Focus Ring */}
                  <div className="flex-1 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.03, 1],
                        borderColor: ['rgba(255,255,255,0.2)', 'rgba(255, 255, 255,0.5)', 'rgba(255,255,255,0.2)']
                      }}
                      transition={shouldSkipHeavyEffects ? {} : { duration: 2, repeat: Infinity }}
                      className="w-40 h-40 rounded-full border-2 flex items-center justify-center"
                    >
                      <motion.div 
                        className="w-2 h-2 rounded-full bg-white/60"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={shouldSkipHeavyEffects ? {} : { duration: 1, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>

                  {/* Bottom Controls */}
                  <div className="flex items-center justify-center gap-6 mb-4">
                    {/* Switch Camera */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}
                      className={`w-12 h-12 rounded-full bg-black/60 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-md'} flex items-center justify-center border border-white/10`}
                    >
                      <IconSwitchHorizontal className="w-5 h-5 text-white" />
                    </motion.button>

                    {/* Capture Button */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={capturePhoto}
                      className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-white/30 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                    >
                      <motion.div 
                        className="w-16 h-16 rounded-full border-4 border-black/20"
                        whileHover={{ borderColor: 'rgba(0,0,0,0.4)' }}
                      />
                    </motion.button>

                    {/* Flash Toggle */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className={`w-12 h-12 rounded-full bg-black/60 ${shouldSkipHeavyEffects ? '' : 'backdrop-blur-md'} flex items-center justify-center border border-white/10`}
                    >
                      <IconFlare className="w-5 h-5 text-yellow-400" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
