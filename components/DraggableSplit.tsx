"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';

interface DraggableSplitProps {
  children: [React.ReactNode, React.ReactNode];
  initialRatio?: number;
}

const DraggableSplit: React.FC<DraggableSplitProps> = ({ children, initialRatio = 0.5 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragMetricsRef = useRef({ top: 0, height: 0 }); // Cache metrics here
  const [splitRatio, setSplitRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);

  // 1. Calculate ratio using Cached Metrics (No Layout Thrashing)
  const updateSplit = useCallback((clientY: number) => {
    const { top, height } = dragMetricsRef.current;
    if (height === 0) return;

    // Calculate relative position
    const newY = clientY - top;
    let newRatio = newY / height;
    
    // Clamp between 20% and 80%
    newRatio = Math.max(0.2, Math.min(0.8, newRatio));
    setSplitRatio(newRatio);
  }, []);

  // 2. Handle Start: Cache dimensions ONCE
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    // Prevent default to stop text selection or native scrolling start
    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    dragMetricsRef.current = { top: rect.top, height: rect.height };
    
    setIsDragging(true);
    
    // Capture pointer ensures events keep tracking even if you mouse off the divider
    (e.target as Element).setPointerCapture(e.pointerId);
    
    document.body.style.cursor = 'row-resize';
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
    document.body.style.cursor = '';
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    // No need for preventDefault here because we used touch-action: none
    updateSplit(e.clientY);
  }, [isDragging, updateSplit]);

  return (
    // CLS FIX: Fixed 800px height prevents layout shift
    <div
      ref={containerRef}
      className="flex flex-col w-full overflow-hidden relative bg-black rounded-lg touch-none spline-container"
      data-spline-scene
      style={{
        height: '800px',
        minHeight: '800px',
        maxHeight: '800px',
        contain: 'strict',
      }}
    >
      {/* Top Section */}
      <div
        style={{ height: `${splitRatio * 100}%` }}
        className="w-full relative overflow-hidden"
      >
        <div className="absolute inset-0 pb-1.5" style={{ contain: 'layout' }}> {/* Padding bottom for divider space */}
            {children[0]}
        </div>
      </div>

      {/* Divider Handle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        // "touch-action: none" is CRITICAL for mobile performance
        className={`h-3 -mt-1.5 z-50 flex-shrink-0 cursor-row-resize relative group transition-colors duration-200 select-none touch-none ${
          isDragging ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-500/10'
        }`}
      >
        {/* Visual Line (Purely decorative, does not handle events) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className={`h-1 w-12 rounded-full transition-all duration-300 shadow-sm ${
             isDragging 
               ? 'bg-blue-500 w-16 scale-110' 
               : 'bg-white/40 backdrop-blur-md group-hover:bg-blue-500'
           }`} />
        </div>
      </div>

      {/* Bottom Section */}
      <div
        style={{ height: `${(1 - splitRatio) * 100}%` }}
        className="w-full relative overflow-hidden"
      >
         <div className="absolute inset-0 pt-1.5" style={{ contain: 'layout' }}> {/* Padding top for divider space */}
            {children[1]}
        </div>
      </div>
    </div>
  );
};

export default DraggableSplit;
