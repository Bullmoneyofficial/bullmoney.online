'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link'; // <--- 1. Import Link
import GlassSurface from './GlassSurface';
import './ShopScrollFunnel.css';

const ShopFunnel: React.FC = () => {
  const [scrollPos, setScrollPos] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = winScroll / height;
      setScrollPos(scrolled);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const dynamicDistortion = 15 + (scrollPos * 45);
  const dynamicBlur = 4 + (scrollPos * 4);

  return (
    <div className="funnel-page-wrapper">
      
      {/* --- LAYER 1: FIXED LENS --- */}
      <div className="glass-centering-wrapper">
        <div className="glass-bobbing-layer">
          <GlassSurface
            // RESPONSIVE WIDTH: 85% of phone screen, or 320px max
            width="min(85vw, 320px)"
            height="120px"
            borderRadius={60}
            borderWidth={0.5}
            distortionScale={dynamicDistortion}
            redOffset={10 + (scrollPos * 10)}
            blueOffset={-10 - (scrollPos * 10)}
            blur={dynamicBlur}
            opacity={0.7}
            mixBlendMode="normal"
            className="glass-lens"
          >
            {/* 2. Wrapped Button in Link to go to /shop */}
            <Link href="/shop" style={{ textDecoration: 'none' }}>
                <button 
                  className="enter-shop-btn"
                  style={{ 
                    cursor: 'pointer', 
                    position: 'relative', 
                    zIndex: 999 // Forces it above the glass texture
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

        {/* Image Section */}
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