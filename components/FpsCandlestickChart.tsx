"use client";

/**
 * FPS Candlestick Chart - MT5 Style Trading Chart
 * Shows FPS data as OHLC candlesticks with real-time updates
 * Uses navbar color scheme and glass UI styling
 */

import React, { useState, useRef, useEffect } from 'react';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface FpsCandlestickChartProps {
  fps: number;
  maxFps?: number;
  height?: number;
  width?: number;
  candleCount?: number;
}

const FpsCandlestickChart: React.FC<FpsCandlestickChartProps> = ({
  fps,
  maxFps = 120,
  height = 60,
  width = 180,
  candleCount = 12,
}) => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const fpsBufferRef = useRef<number[]>([]);
  const lastCandleTimeRef = useRef(Date.now());

  // Initialize with empty candles
  useEffect(() => {
    setCandles(
      Array(candleCount)
        .fill(null)
        .map((_, i) => ({
          timestamp: Date.now() - (candleCount - i) * 1000,
          open: 60,
          high: 60,
          low: 60,
          close: 60,
        }))
    );
  }, [candleCount]);

  // Track mounted state to prevent updates after unmount
  const isMountedRef = useRef(true);
  const fpsRef = useRef(fps);
  
  // Keep fps ref updated without triggering effect re-run
  useEffect(() => {
    fpsRef.current = fps;
  });
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update FPS data and create candles - empty deps, uses refs
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMountedRef.current) return;
      
      fpsBufferRef.current.push(fpsRef.current);

      // Create a new candle every 500ms (faster updates)
      if (Date.now() - lastCandleTimeRef.current >= 500) {
        if (fpsBufferRef.current.length > 0) {
          const open = fpsBufferRef.current[0];
          const close = fpsBufferRef.current[fpsBufferRef.current.length - 1];
          const high = Math.max(...fpsBufferRef.current);
          const low = Math.min(...fpsBufferRef.current);

          if (isMountedRef.current) {
            setCandles((prev) => {
              const newCandles = [...prev.slice(1), { timestamp: Date.now(), open, high, low, close }];
              return newCandles;
            });
          }

          fpsBufferRef.current = [];
          lastCandleTimeRef.current = Date.now();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, []); // Empty deps - uses refs for fps value

  const getColorForCandle = (candle: CandleData) => {
    // Bullish (close > open) = bright white, Bearish (close < open) = light gray
    if (candle.close >= candle.open) {
      // Bullish - use bright white
      const intensity = Math.min((candle.close / maxFps) * 100, 100);
      if (intensity > 85) return '#FFFFFF'; // Pure white
      if (intensity > 70) return '#F3F4F6'; // White-100
      return '#E5E7EB'; // White-200
    } else {
      // Bearish - use light gray
      const intensity = Math.min((candle.close / maxFps) * 100, 100);
      if (intensity < 30) return '#9CA3AF'; // Gray-400
      if (intensity < 50) return '#D1D5DB'; // Gray-300
      return '#E5E7EB'; // Gray-200
    }
  };

  const wickColor = '#D1D5DB'; // Light gray
  const gridColor = 'rgba(209, 213, 219, 0.08)'; // Almost invisible light gray

  const candleWidth = (width - 8) / candleCount;
  const padding = 4;

  // Use a stable animation duration to prevent glitching
  // Fixed constant duration keeps animation smooth regardless of FPS changes
  const animationDuration = 2; // Constant 2 second duration for stability

  return (
    <div className="fps-chart-container relative overflow-hidden rounded-lg" style={{ width, height }} data-fps-chart>
      {/* Glass background - NO BLUR */}
      <div className="absolute inset-0 bg-linear-to-br from-white/15 via-white/10 to-slate-900/25 border border-white/20" />

      {/* SVG Chart */}
      <svg width={width} height={height} className="relative z-10">
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          
          {/* Animation keyframes style */}
          <style>{`
            @keyframes candleFlowRight {
              0% {
                opacity: 1;
              }
              100% {
                opacity: 1;
              }
            }
            
            .candle-group {
              animation: candleFlowRight ${animationDuration}s linear infinite;
              will-change: auto;
            }
          `}</style>
        </defs>

        {/* Animated candlesticks group */}
        <g className="candle-group"
           style={{
             animation: `candleFlowRight ${animationDuration}s linear infinite`,
             backfaceVisibility: 'hidden',
           }}>
          {/* Area fill under candles */}
          <path
            d={candles.reduce((path, candle, index) => {
              const x = padding + index * candleWidth + candleWidth / 2;
              const normalizedClose = (candle.close / maxFps) * height;
              const y = height - normalizedClose;
              return path + (index === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
            }, '') + ` L ${width} ${height} L 0 ${height} Z`}
            fill="url(#areaGradient)"
            opacity={0.3}
          />

          {/* Smooth line connecting candles */}
          <polyline
            points={candles.map((candle, index) => {
              const x = padding + index * candleWidth + candleWidth / 2;
              const normalizedClose = (candle.close / maxFps) * height;
              const y = height - normalizedClose;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            opacity={0.6}
          />

          {/* Grid lines - horizontal - almost invisible */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={`grid-h-${ratio}`}
              x1={0}
              y1={height * ratio}
              x2={width}
              y2={height * ratio}
              stroke={gridColor}
              strokeWidth={0.5}
              strokeDasharray="2,3"
              opacity={0.15}
            />
          ))}

          {/* Y-axis labels - light gray */}
          <text x={3} y={10} fontSize="10" fill="rgba(209, 213, 219, 0.5)" fontWeight="bold" fontFamily="monospace">
            120
          </text>
          <text x={3} y={height - 2} fontSize="10" fill="rgba(209, 213, 219, 0.5)" fontWeight="bold" fontFamily="monospace">
            0
          </text>

        {/* Candlesticks */}
        {candles.map((candle, index) => {
          const x = padding + index * candleWidth + candleWidth / 2;

          // Normalize values to 0-100 scale
          const normalizedOpen = (candle.open / maxFps) * height;
          const normalizedHigh = (candle.high / maxFps) * height;
          const normalizedLow = (candle.low / maxFps) * height;
          const normalizedClose = (candle.close / maxFps) * height;

          // Invert for SVG coordinate system (top = high)
          const y1 = height - normalizedHigh;
          const y2 = height - normalizedLow;
          const bodyTop = height - Math.max(normalizedOpen, normalizedClose);
          const bodyHeight = Math.abs(normalizedClose - normalizedOpen) || 2;

          const color = getColorForCandle(candle);
          const bodyColor = color;
          const isLatest = index === candles.length - 1;

          return (
            <g key={`candle-${index}`}>
              {/* Wick */}
              <line x1={x} y1={y1} x2={x} y2={y2} stroke={wickColor} strokeWidth={1.2} opacity={0.5} />

              {/* Body - more prominent */}
              <rect
                x={x - candleWidth * 0.35}
                y={bodyTop}
                width={candleWidth * 0.7}
                height={Math.max(bodyHeight, 2.5)}
                fill={bodyColor}
                opacity={isLatest ? 1 : 0.85}
                style={{
                  filter: isLatest ? `drop-shadow(0 0 3px ${bodyColor}80)` : 'none',
                  transition: 'all 0.15s ease',
                }}
              />

              {/* Border for definition */}
              <rect
                x={x - candleWidth * 0.35}
                y={bodyTop}
                width={candleWidth * 0.7}
                height={Math.max(bodyHeight, 2.5)}
                fill="none"
                stroke={bodyColor}
                strokeWidth={0.5}
                opacity={0.3}
              />

              {/* Glow effect on latest candle */}
              {isLatest && (
                <circle
                  cx={x}
                  cy={height - normalizedClose}
                  r={3}
                  fill={color}
                  opacity={0.8}
                  style={{
                    filter: `drop-shadow(0 0 4px ${color}90)`,
                    animation: 'pulse 1s ease-in-out infinite',
                  }}
                />
              )}
            </g>
          );
        })}
        </g>
      </svg>

      {/* Pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
          }
        }
      `}</style>
    </div>
  );
};

export default FpsCandlestickChart;
