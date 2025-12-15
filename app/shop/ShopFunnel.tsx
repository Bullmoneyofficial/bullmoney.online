'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import GlassSurface from './GlassSurface';
import './ShopScrollFunnel.css';

// --- NEW UTILITY FUNCTION: Debounce a function call ---
// This ensures setScrollPos is not called hundreds of times per second.
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return function(this: any, ...args: any[]) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(this, args);
      timeout = null;
    }, delay);
  };
};

// --- OPTIMIZATION 1: Use CSS-friendly state management for scroll ---
const ShopFunnel: React.FC = () => {
  // We switch to a ref/local variable for high-frequency scroll updates
  // to avoid causing excessive component re-renders.
  const latestScrollPosRef = useRef(0); 
  
  // This state is now only updated for the visual component on a DEBOUNCED timer.
  const [visualScrollPos, setVisualScrollPos] = useState(0); 

  // Debounced setter for the visual state
  const debouncedSetVisualScroll = useCallback(
    debounce((scrolledValue: number) => {
      setVisualScrollPos(scrolledValue);
    }, 16), // Debounce to ~60 FPS (1000ms / 60 frames = ~16ms)
    []
  );

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = winScroll / height;

      latestScrollPosRef.current = scrolled; // Update ref immediately
      debouncedSetVisualScroll(scrolled);    // Update state debounced
    };

    // OPTIMIZATION 2: Throttle scroll updates by debouncing the state setter.
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [debouncedSetVisualScroll]);

  // OPTIMIZATION 3: Limit the distortion and blur range slightly 
  // to reduce the extreme calculations on the GPU.
  // We use the debounced state here.
  const scrollValue = visualScrollPos;
  const dynamicDistortion = 10 + (scrollValue * 40); // Reduced range from 15-60 to 10-50
  const dynamicBlur = 3 + (scrollValue * 3);         // Reduced range from 4-8 to 3-6
  
  // NOTE: If performance is still an issue, consider removing the 
  // dynamic blur and distortion entirely and using a fixed value.

  return (
    <div className="funnel-page-wrapper">
      
      {/* --- LAYER 1: FIXED LENS --- */}
      <div className="glass-centering-wrapper">
        <div 
          className="glass-bobbing-layer"
          // OPTIMIZATION 4: Force hardware acceleration on the bobbing container
          // to isolate its movement from the rest of the page layout.
          style={{ transform: 'translateZ(0)' }} 
        >
          <GlassSurface
            width="min(30vw, 250px)"
            height="50px"
            borderRadius={60}
            borderWidth={0.5}
            // Use the debounced/limited values
            distortionScale={dynamicDistortion} 
            redOffset={10 + (scrollValue * 10)}
            blueOffset={-10 - (scrollValue * 10)}
            blur={dynamicBlur}
            opacity={0.7}
            mixBlendMode="normal"
            className="glass-lens"
          >
            <Link href="/shop" style={{ textDecoration: 'none' }}>
                <button 
                  className="enter-shop-btn"
                  style={{ 
                    cursor: 'pointer', 
                    position: 'relative', 
                    zIndex: 999 
                  }}
                >
                  VIP ACCESS
                </button>
            </Link>

          </GlassSurface>
        </div>
      </div>

      {/* --- LAYER 2: SCROLLING CONTENT --- */}
      <div className="scrolling-content">
        
        {/* Intro Section */}
        <div className="scroll-section intro">
          <h2 className="scroll-subtitle">SCROLL DOWN</h2>
          <h1 className="scroll-title">GET INTO THE BULLMONEY VIP <br/>COMMUNITY</h1>
        </div>

        {/* Image Section - This image is large, ensure it's properly compressed */}
        <div className="scroll-section image-sect">
           <div className="image-wrapper">
             <Image 
               src="https://img-v2-prod.whop.com/unsafe/rs:fit:256:0/plain/https%3A%2F%2Fassets-2-prod.whop.com%2Fuploads%2Fuser_7019238%2Fimage%2Faccess_passes%2F2025-11-21%2F27d96f33-7030-40a7-8f60-1097622d31b5.png@avif?w=256&q=75" 
               alt="Distorted Water"
               width={800}
               height={600}
               className="bg-image"
               priority
             />
           </div>
        </div>

        {/* Text Section */}
        <div className="scroll-section text-sect">
           <h1 className="scroll-title"> REAL PREMIUM<br/>REAL QUALITY TRADES</h1>
        </div>

        {/* Footer Section */}
        <div className="scroll-section footer-sect">
           <p className="scroll-subtitle">The Ultimate Trading Hub
BullMoney is built for traders who demand more. Here, you'll access cutting-edge tools, premium insights, and real-time live trading streams to help you stay ahead of the market. Our community thrives on collaboration, consistency, and success join us today and take your trading to the next level.
Trading involves risk and may not be suitable for everyone.
BullMoney provides educational resources, tools, and strategies. Results vary, and we encourage responsible trading. </p>
        </div>
      </div>
    </div>
  );
};

export default ShopFunnel;