'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import GlassSurface from './GlassSurface'; 
import './ShopScrollFunnel.css';

// 1. Define Props to accept the state from your parent/layout
interface ShopScrollFunnelProps {
  isMenuOpen?: boolean; // Default to false if not passed
}

const ShopScrollFunnel: React.FC<ShopScrollFunnelProps> = ({ isMenuOpen = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalDistance = rect.height - windowHeight;
      const scrolled = -rect.top;

      let scrollProgress = scrolled / totalDistance;
      scrollProgress = Math.max(0, Math.min(1, scrollProgress));
      
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        setProgress(scrollProgress);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const distortion = -150 + (progress * 150); 
  const colorOffset = 30 - (progress * 30);   
  const blurAmount = 15 - (progress * 15);    
  const scale = 0.85 + (progress * 0.15);     
  
  // Unlocks at 75% scroll
  const isUnlocked = progress > 0.75;
  
  // 2. Logic: Only show if scrolled AND menu is closed
  const shouldShowButton = isUnlocked && !isMenuOpen;

  return (
    <div className="funnel-scroll-container" ref={containerRef}>
      <div className="funnel-sticky-wrapper">
        
        <div className="bg-text" style={{ 
          transform: `translate(-50%, calc(-50% + ${progress * 150}px))`,
          color: `rgba(255, 215, 0, ${0.1 + (progress * 0.1)})`,
          pointerEvents: 'none'
        }}>
          MEMBERS<br />ONLY
        </div>

        <div className="glass-wrapper" style={{ transform: `scale(${scale})` }}>
          <GlassSurface
            width="min(90vw, 650px)"
            height="min(50vh, 500px)"
            borderRadius={30}
            borderWidth={0.5}
            distortionScale={distortion}
            redOffset={colorOffset}
            blueOffset={-colorOffset}
            blur={blurAmount}
            opacity={0.5 + (progress * 0.5)}
            mixBlendMode="hard-light"
            className="border-white/20" 
          >
            <div className="funnel-content">
              <span className="label" style={{ 
                opacity: 0.7 + (progress * 0.3),
                color: isUnlocked ? '#4ade80' : '#fff'
              }}>
                {isUnlocked ? 'ACCESS GRANTED' : 'ENCRYPTED CONNECTION'}
              </span>
              
              <h1 className="headline" style={{ 
                letterSpacing: `${15 - (progress * 15)}px`,
                filter: `blur(${blurAmount / 2}px)`,
                opacity: isUnlocked ? 0 : 1, 
                transition: 'opacity 0.3s ease',
              }}>
                LOCKED
              </h1>

              {/* 3. Updated Style Logic */}
              <div className="action-area" style={{ 
                opacity: shouldShowButton ? 1 : 0, 
                transform: `translateY(${(1 - progress) * 40}px)`,
                // Important: Ensure pointer events are off when hidden
                pointerEvents: shouldShowButton ? 'auto' : 'none', 
                position: 'relative',
                zIndex: 100,
                transition: 'opacity 0.3s ease' // Smooth fade out when menu opens
              }}>
                
                <Link href="/shop" className="enter-shop-btn">
                    VIP ACCESS
                </Link>

              </div>
            </div>
          </GlassSurface>
        </div>

        <div className="scroll-indicator" style={{ opacity: 1 - progress }}>
          <span>SCROLL TO UNLOCK</span>
          <div className="line"></div>
        </div>

      </div>
    </div>
  );
};

export default ShopScrollFunnel;