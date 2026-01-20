import React, { useEffect, useState, useMemo, memo, useRef } from 'react';
import { useGlobalTheme } from '@/contexts/GlobalThemeProvider';
import { useAudioSettings } from '@/contexts/AudioSettingsProvider';
import { useComponentLifecycle } from '@/lib/UnifiedPerformanceSystem';
import './MovingTradingTip.css';

interface MovingTradingTipProps {
  tip: { target: string; text: string; buttonIndex: number };
  buttonRefs: React.RefObject<(HTMLDivElement | null)[]>;
  dockRef: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
}

export const MovingTradingTip = memo(({ 
  tip, 
  buttonRefs,
  dockRef,
  isVisible 
}: MovingTradingTipProps) => {
  const { activeTheme } = useGlobalTheme();
  const { tipsMuted } = useAudioSettings();
  
  // Use unified performance system for shimmer optimization
  const perf = useComponentLifecycle('movingTip', 3);
  const shimmerEnabled = perf.shimmerEnabled;
  
  const tipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const tipWidth = 280; // Fixed tip width for centering
  
  // Get theme filter for consistency with navbar
  const themeFilter = useMemo(() => activeTheme?.mobileFilter || 'none', [activeTheme?.mobileFilter]);
  
  // Calculate position based on button ref - stable calculation
  // Reset and recalculate when tip changes
  useEffect(() => {
    // First reset the animation state for the new tip
    setIsAnimating(false);
    setIsReady(false);
    
    const calculatePosition = () => {
      if (!buttonRefs.current || !dockRef.current) return false;
      
      const button = buttonRefs.current[tip.buttonIndex];
      const dock = dockRef.current;
      
      if (!button || !dock) return false;
      
      const buttonRect = button.getBoundingClientRect();
      const dockRect = dock.getBoundingClientRect();
      
      // Validate that we have real position data
      if (buttonRect.width <= 0 || dockRect.width <= 0 || dockRect.bottom <= 0) {
        return false;
      }
      
      // Calculate the center position of the button
      const buttonCenterX = buttonRect.left + buttonRect.width / 2;
      
      // Calculate tip position - center under the button with viewport clamping
      const viewportWidth = window.innerWidth;
      const halfTipWidth = tipWidth / 2;
      
      // Clamp the x position to keep tip within viewport with padding
      const minX = halfTipWidth + 16;
      const maxX = viewportWidth - halfTipWidth - 16;
      const clampedX = Math.max(minX, Math.min(maxX, buttonCenterX));
      
      // Fixed Y position below dock
      const yPos = dockRect.bottom + 16;
      
      setPosition({
        x: clampedX - halfTipWidth, // Convert to left position
        y: yPos
      });
      
      return true;
    };
    
    // Initial calculation with retry - add small delay to ensure DOM is ready
    let retryCount = 0;
    const maxRetries = 10;
    let cancelled = false;
    
    const tryCalculate = () => {
      if (cancelled) return;
      
      if (calculatePosition()) {
        setIsReady(true);
        // Small delay before showing animation
        requestAnimationFrame(() => {
          if (!cancelled) {
            setIsAnimating(true);
          }
        });
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryCalculate, 150); // Increased delay for better DOM readiness
      }
    };
    
    // Start calculation after a brief delay to ensure refs are populated
    const initialTimeout = setTimeout(tryCalculate, 50);
    
    // Update on resize with debounce
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        calculatePosition();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [tip.buttonIndex, buttonRefs, dockRef]);
  
  if (tipsMuted || !isVisible) return null;
  
  // Don't render until position is calculated
  if (!isReady || position.y < 50) return null;
  
  return (
    <div
      ref={tipRef}
      className={`moving-trading-tip hidden lg:block ${isAnimating ? 'moving-trading-tip-visible' : 'moving-trading-tip-enter'}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        filter: themeFilter,
        width: `${tipWidth}px`,
      }}
    >
      <div className="relative">
        {/* Arrow pointing up - neon */}
        <div className="trading-tip-arrow" />
        
        {/* Tip container - neon glow */}
        <div className="trading-tip-container">
          {/* Shimmer effect */}
          {shimmerEnabled && (
            <div className="trading-tip-shimmer" />
          )}
          
          <div className="trading-tip-content">
            {/* Pulse indicator */}
            <div className="trading-tip-pulse">
              <span className="trading-tip-pulse-ring" />
              <span className="trading-tip-pulse-dot" />
            </div>
            
            {/* Target label - neon text */}
            <span className="trading-tip-target">
              {tip.target}
            </span>
            
            {/* Divider - neon */}
            <div className="trading-tip-divider" />
            
            {/* Tip text - neon glow */}
            <span className="trading-tip-text">
              {tip.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

MovingTradingTip.displayName = 'MovingTradingTip';
