"use client";

import React, { useState, useEffect, memo } from 'react';
import { motion, useMotionValue, useSpring } from "framer-motion";

// --- UTILS: MOBILE DETECTION HOOK (Local Copy) ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isTouch && (window.innerWidth <= 768 || isMobileUA));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

// --- EXPORTED COMPONENT: GHOST CURSOR FOR LOADER ---
const GhostLoaderCursor = memo(() => {
  const isMobile = useIsMobile();
  
  const mouse = { x: useMotionValue(0), y: useMotionValue(0) };
  
  const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 };
  const smoothOptions2 = { damping: 30, stiffness: 200, mass: 0.8 };
  const smoothOptions3 = { damping: 40, stiffness: 150, mass: 1 };

  const x = useSpring(mouse.x, smoothOptions);
  const y = useSpring(mouse.y, smoothOptions);
  const x2 = useSpring(mouse.x, smoothOptions2);
  const y2 = useSpring(mouse.y, smoothOptions2);
  const x3 = useSpring(mouse.x, smoothOptions3);
  const y3 = useSpring(mouse.y, smoothOptions3);

  useEffect(() => {
    if (isMobile) return; 
    
    const manageMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      mouse.x.set(clientX);
      mouse.y.set(clientY);
    };
    window.addEventListener("mousemove", manageMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", manageMouseMove);
  }, [mouse.x, mouse.y, isMobile]);

  if (isMobile) return null;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none"> 
      <motion.div 
        style={{ left: x3, top: y3 }}
        className="fixed w-32 h-32 rounded-full bg-blue-600/30 blur-[40px] -translate-x-1/2 -translate-y-1/2 mix-blend-screen will-change-transform"
      />
      <motion.div 
        style={{ left: x2, top: y2 }}
        className="fixed w-12 h-12 rounded-full bg-blue-400/50 blur-[12px] -translate-x-1/2 -translate-y-1/2 mix-blend-screen will-change-transform"
      />
      <motion.div 
        style={{ left: x, top: y }}
        className="fixed w-4 h-4 rounded-full bg-cyan-100 shadow-[0_0_40px_rgba(34,211,238,1)] -translate-x-1/2 -translate-y-1/2 z-10 will-change-transform"
      />
    </div>
  );
});
GhostLoaderCursor.displayName = "GhostLoaderCursor";

export default GhostLoaderCursor;