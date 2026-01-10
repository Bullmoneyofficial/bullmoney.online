"use client";
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface DraggableSplitProps {
  children: [React.ReactNode, React.ReactNode];
  initialRatio?: number;
}

const DraggableSplit: React.FC<DraggableSplitProps> = ({ children, initialRatio = 0.5 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);

  const updateSplit = useCallback((clientY: number) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newY = clientY - containerRect.top;
    let newRatio = newY / containerRect.height;
    newRatio = Math.max(0.2, Math.min(0.8, newRatio));
    setSplitRatio(newRatio);
  }, []);

  const handleStart = useCallback(() => {
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';
  }, []);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updateSplit(e.clientY);
  }, [isDragging, updateSplit]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updateSplit(e.touches[0].clientY);
  }, [isDragging, updateSplit]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-[800px] overflow-hidden relative bg-black/5 rounded-lg"
    >
      <div
        style={{ height: `calc(${splitRatio * 100}% - 6px)` }}
        className="overflow-hidden"
      >
        {children[0]}
      </div>

      <div
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        className={`h-3 flex-shrink-0 cursor-row-resize relative group transition-all duration-200 ${
          isDragging ? 'bg-blue-500' : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`h-1 w-12 rounded-full transition-all duration-200 ${
            isDragging ? 'bg-white scale-110' : 'bg-white/60 group-hover:bg-white/80'
          }`} />
        </div>
      </div>

      <div
        style={{ height: `calc(${(1 - splitRatio) * 100}% - 6px)` }}
        className="overflow-hidden"
      >
        {children[1]}
      </div>
    </div>
  );
};

export default DraggableSplit;
