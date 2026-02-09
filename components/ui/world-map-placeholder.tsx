'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DottedMap from 'dotted-map';

interface WorldMapPlaceholderProps {
  className?: string;
}

const SVG_MAP = new DottedMap({ height: 55, grid: 'diagonal' }).getSVG({
  radius: 0.7,
  color: '#000000DD',
  shape: 'circle',
  backgroundColor: '#FFFFFF',
});

const SVG_MAP_FILL = new DottedMap({ height: 68, grid: 'vertical' }).getSVG({
  radius: 0.5,
  color: '#00000055',
  shape: 'circle',
  backgroundColor: 'transparent',
});

export function WorldMapPlaceholder({ className }: WorldMapPlaceholderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const lastDistanceRef = useRef<number | null>(null);
  const lastScaleRef = useRef(1);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const clampOffset = useCallback((value: number, max: number) => {
    return Math.min(max, Math.max(-max, value));
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }, [isMobile]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const points = pointersRef.current;
    if (!points.has(event.pointerId)) return;
    const prevPoint = points.get(event.pointerId);
    points.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (points.size === 1) {
      if (!prevPoint) return;
      const dx = event.clientX - prevPoint.x;
      const dy = event.clientY - prevPoint.y;
      const maxOffset = 240 * scale;
      setOffset((prev) => ({
        x: clampOffset(prev.x + dx, maxOffset),
        y: clampOffset(prev.y + dy, maxOffset),
      }));
      return;
    }

    if (points.size === 2) {
      const [a, b] = Array.from(points.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastDistanceRef.current === null) {
        lastDistanceRef.current = distance;
        lastScaleRef.current = scale;
        return;
      }
      const delta = distance / lastDistanceRef.current;
      const nextScale = Math.min(1.8, Math.max(1, lastScaleRef.current * delta));
      setScale(nextScale);
      lastDistanceRef.current = distance;
      return;
    }
  }, [clampOffset, isMobile, scale]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      lastDistanceRef.current = null;
      lastScaleRef.current = scale;
    }
  }, [isMobile, scale]);

  return (
    <div
      className={`relative h-full w-full ${className || ''}`.trim()}
      aria-hidden="true"
      style={isMobile ? { touchAction: 'none' } : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          transformOrigin: 'center',
          transition: pointersRef.current.size ? 'none' : 'transform 180ms ease-out',
        }}
      >
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(SVG_MAP_FILL)}`}
          className="absolute inset-0 h-full w-full object-cover [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
          alt=""
          draggable={false}
        />
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(SVG_MAP)}`}
          className="absolute inset-0 h-full w-full object-cover [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
          alt="world map"
          draggable={false}
        />
      </div>
    </div>
  );
}
