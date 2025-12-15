'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import GlassSurface from './GlassSurface';
import './ShopScrollFunnel.css';

// --- NEW UTILITY FUNCTION: Debounce a function call ---
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

const ShopFunnel: React.FC = () => {
  const latestScrollPosRef = useRef(0); 
  const [visualScrollPos, setVisualScrollPos] = useState(0); 

  const debouncedSetVisualScroll = useCallback(
    debounce((scrolledValue: number) => {
      setVisualScrollPos(scrolledValue);
    }, 16), 
    []
  );

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = winScroll / height;

      latestScrollPosRef.current = scrolled; 
      debouncedSetVisualScroll(scrolled);    
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [debouncedSetVisualScroll]);

  const scrollValue = visualScrollPos;
  const dynamicDistortion = 10 + (scrollValue * 40); 
  const dynamicBlur = 3 + (scrollValue * 3);         

  return (
    <div className="funnel-page-wrapper">
      
      {/* --- STYLES FOR TEXT SHIMMER --- */}
      <style jsx global>{`
        /* Define the gradient animation */
        @keyframes text-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: -200% 50%; }
        }

        .animate-text-shimmer {
          /* Premium Grey to White to Blue-ish White Gradient */
          background: linear-gradient(
            110deg, 
            #64748b 20%,   /* Darker Grey Start */
            #ffffff 48%,   /* White Peak */
            #a5b4fc 52%,   /* Subtle Indigo Hint */
            #64748b 80%    /* Darker Grey End */
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: text-shimmer 3s linear infinite;
          display: inline-block;
        }

        /* Make the button text shimmer too */
        .btn-text-shimmer {
            background: linear-gradient(
            110deg, 
            #ffffff 40%, 
            #4f46e5 50%, 
            #ffffff 60%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-shimmer 2.5s linear infinite;
          font-weight: 900;
        }
      `}</style>

      {/* --- LAYER 1: FIXED LENS --- */}
      <div className="glass-centering-wrapper">
        <div 
          className="glass-bobbing-layer"
          style={{ transform: 'translateZ(0)' }} 
        >
          <GlassSurface
            width="min(30vw, 250px)"
            height="50px"
            borderRadius={60}
            borderWidth={0.5}
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
                    zIndex: 999,
                    background: 'rgba(0,0,0,0.5)' // Added slight backing so shimmer pops
                  }}
                >
                  <span className="btn-text-shimmer">VIP ACCESS</span>
                </button>
            </Link>

          </GlassSurface>
        </div>
      </div>

      {/* --- LAYER 2: SCROLLING CONTENT --- */}
      <div className="scrolling-content">
        
        {/* Intro Section */}
        <div className="scroll-section intro">
          <h2 className="scroll-subtitle animate-text-shimmer" style={{ fontSize: '0.9rem', letterSpacing: '0.2em' }}>
            SCROLL DOWN
          </h2>
          <h1 className="scroll-title animate-text-shimmer">
            GET INTO THE BULLMONEY VIP <br/>COMMUNITY
          </h1>
        </div>

        {/* Image Section */}
        <div className="scroll-section image-sect">
           <div className="image-wrapper">
             <Image 
               src="https://images.pexels.com/photos/35224942/pexels-photo-35224942.png" 
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
           <h1 className="scroll-title animate-text-shimmer">
             REAL PREMIUM<br/>REAL QUALITY TRADES
           </h1>
        </div>

        {/* Footer Section */}
        <div className="scroll-section footer-sect">
           <p className="scroll-subtitle animate-text-shimmer" style={{ opacity: 0.9 }}>
             The Ultimate Trading Hub
             BullMoney is built for traders who demand more. Here, you'll access cutting-edge tools, premium insights, and real-time live trading streams to help you stay ahead of the market. Our community thrives on collaboration, consistency, and success join us today and take your trading to the next level.
             Trading involves risk and may not be suitable for everyone.
             BullMoney provides educational resources, tools, and strategies. Results vary, and we encourage responsible trading.
           </p>
        </div>
      </div>
    </div>
  );
};

export default ShopFunnel;