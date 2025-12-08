import React, { useEffect, useRef, useId, useState } from 'react';
import './GlassSurface.css';

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
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
  borderWidth = 0.5,
  brightness = 50,
  opacity = 1,
  blur = 8,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1.2,
  distortionScale = 20,
  redOffset = 5,
  greenOffset = 10,
  blueOffset = 15,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'normal',
  className = '',
  style = {}
}) => {
  const id = useId();
  const cleanId = id.replace(/:/g, '');
  const filterId = `glass-filter-${cleanId}`;
  
  // Refs for SVG manipulation
  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  const [isIOS, setIsIOS] = useState(false);

  // Detect iOS specifically (because it strictly blocks SVG backdrop-filters)
  useEffect(() => {
    const checkIOS = () => {
      if (typeof window === 'undefined') return false;
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    setIsIOS(checkIOS());
  }, []);

  const generateDisplacementMap = () => {
    if (!containerRef.current) return '';
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width || 300;
    const h = rect.height || 150;
    
    // Create a dynamic liquid gradient map
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

  const updateSVG = () => {
    if (feImageRef.current && !isIOS) {
      feImageRef.current.setAttribute('href', generateDisplacementMap());
    }
  };

  useEffect(() => {
    if (isIOS) return;

    updateSVG();
    
    // Update SVG parameters dynamically
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });

    if (gaussianBlurRef.current) {
      gaussianBlurRef.current.setAttribute('stdDeviation', displace.toString());
    }
  }, [
    distortionScale, redOffset, greenOffset, blueOffset, 
    xChannel, yChannel, displace, isIOS, width, height
  ]);

  // Resize observer to keep the map proportional
  useEffect(() => {
    if (!containerRef.current || isIOS) return;
    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(updateSVG));
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [isIOS]);

  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-opacity': isIOS ? Math.max(0.1, backgroundOpacity) : backgroundOpacity,
    '--glass-saturation': saturation,
    '--filter-id': `url(#${filterId})`,
    '--chromatic-offset': `${distortionScale}px` // Used for CSS simulation on mobile
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`glass-surface ${isIOS ? 'glass-mobile-3d' : 'glass-desktop-svg'} ${className}`}
      style={containerStyle}
    >
      {/* On Mobile/iOS, we inject a "fake" chromatic aberration layer 
        using gradients to mimic the liquid look without the SVG filter 
      */}
      {isIOS && (
        <div className="mobile-liquid-layer"></div>
      )}

      {/* Actual SVG Filter Definition (Desktop/Android) */}
      {!isIOS && (
        <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
              <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
              <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" result="dispRed" />
              <feColorMatrix in="disppurple" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
              <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" result="dispGreen" />
              <feColorMatrix in="disppurple" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
              <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" result="dispBlue" />
              <feColorMatrix in="dispblue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
              <feBlend in="red" in2="purple" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.5" />
            </filter>
          </defs>
        </svg>
      )}

      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;