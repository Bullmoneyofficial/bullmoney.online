import React, { useEffect, useRef, useId, useState, useCallback } from 'react';
import './GlassSurface.css';

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;           // Controls mobile blur amount
  displace?: number;       // Controls desktop liquid distortion
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: 'R' | 'G' | 'B';
  yChannel?: 'R' | 'G' | 'B';
  mixBlendMode?: React.CSSProperties['mixBlendMode'];
  className?: string;
  style?: React.CSSProperties;
}

const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = '100%',
  height = '100%',
  borderRadius = 50,
  blur = 8,
  displace = 0, // Ensure this is destructured so it is defined
  backgroundOpacity = 0,
  saturation = 1.2,
  distortionScale = 20,
  redOffset = 5,
  greenOffset = 10,
  blueOffset = 15,
  xChannel = 'R',
  yChannel = 'G',
  className = '',
  style = {}
}) => {
  const id = useId();
  const cleanId = id.replace(/:/g, '');
  const filterId = `glass-filter-${cleanId}`;
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  // We use `any` here for simplicity with SVG refs in TS, or you can use specific types defined above
  const feImageRef = useRef<any>(null);
  const redChannelRef = useRef<any>(null);
  const blueChannelRef = useRef<any>(null);
  const gaussianBlurRef = useRef<any>(null);

  const [isIOS, setIsIOS] = useState(false);

  // 1. Detect iOS
  useEffect(() => {
    const checkIOS = () => {
      if (typeof window === 'undefined') return false;
      const userAgent = window.navigator.userAgent.toLowerCase();
      // Detect iPhone, iPad, iPod or Mac with Touch (iPad Pro)
      return /iphone|ipad|ipod/.test(userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };
    setIsIOS(checkIOS());
  }, []);

  // 2. Logic for generating the Desktop Liquid Map
  const generateDisplacementMap = () => {
    if (!containerRef.current) return '';
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width || 300;
    const h = rect.height || 150;
    
    const svgContent = `
      <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#000" />
            <stop offset="50%" stop-color="#f00" />
            <stop offset="100%" stop-color="#000" />
          </linearGradient>
          <linearGradient id="gradBlue" x1="100%" y1="0%" x2="0%" y2="100%">
             <stop offset="0%" stop-color="#000" />
             <stop offset="50%" stop-color="#00f" />
             <stop offset="100%" stop-color="#000" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="black" />
        <circle cx="${w/2}" cy="${h/2}" r="${Math.min(w,h)/1.5}" fill="url(#gradRed)" />
        <rect width="100%" height="100%" fill="url(#gradBlue)" style="mix-blend-mode: screen" />
      </svg>
    `;
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  const updateSVG = useCallback(() => {
    if (feImageRef.current && !isIOS) {
      feImageRef.current.setAttribute('href', generateDisplacementMap());
    }
  }, [isIOS]);

  // 3. Update SVG Filters (Desktop Only)
  useEffect(() => {
    if (isIOS) return;

    updateSVG();

    [
      { ref: redChannelRef, offset: redOffset },

      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });

    if (gaussianBlurRef.current) {
      // This is where 'displace' is used. It is defined in props above.
      gaussianBlurRef.current.setAttribute('stdDeviation', displace.toString());
    }
  }, [
    distortionScale, redOffset, greenOffset, blueOffset,
    xChannel, yChannel, displace, isIOS, width, height, updateSVG
  ]);

  // 4. Resize Observer
  useEffect(() => {
    if (!containerRef.current || isIOS) return;
    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(updateSVG));
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isIOS, updateSVG]);

  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-opacity': backgroundOpacity,
    '--glass-saturation': saturation,
    '--blur': `${blur}px`, // Passed to CSS for mobile
    '--filter-id': `url(#${filterId})`,
  } as React.CSSProperties;

  // Determine active class
  const surfaceClass = isIOS ? 'glass-mobile-3d' : 'glass-desktop-svg';

  return (
    <div
      ref={containerRef}
      className={`glass-surface ${surfaceClass} ${className}`}
      style={containerStyle}
    >
      {/* IOS: Fake Liquid Layer (CSS Gradients) */}
      {isIOS && <div className="mobile-liquid-layer"></div>}

      {/* DESKTOP: Real SVG Filter */}
      {!isIOS && (
        <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
              <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
              
              {/* Red Channel */}
              <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" result="dispRed" />
              <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
              
             
              {/* Blue Channel */}
              <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" result="dispBlue" />
              <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
              
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              
              <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation={displace} />
            </filter>
          </defs>
        </svg>
      )}

      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;