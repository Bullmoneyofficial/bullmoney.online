import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import type { CandleData } from '@/components/ultimate-hub/types';
import { getFpsColor } from '@/components/ultimate-hub/styles';

export const FpsCandlestickChart = memo(({ fps, width = 80, height = 48, candleCount = 8 }: {
  fps: number; width?: number; height?: number; candleCount?: number;
}) => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const fpsBufferRef = useRef<number[]>([]);
  const lastCandleTimeRef = useRef(Date.now());
  const fpsRef = useRef(fps);
  const mountedRef = useRef(true);

  useEffect(() => { fpsRef.current = fps; });
  
  useEffect(() => {
    mountedRef.current = true;
    setCandles(Array(candleCount).fill(null).map((_, i) => ({
      timestamp: Date.now() - (candleCount - i) * 1000,
      open: 60, high: 60, low: 60, close: 60,
    })));
    return () => { mountedRef.current = false; };
  }, [candleCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      fpsBufferRef.current.push(fpsRef.current);

      if (Date.now() - lastCandleTimeRef.current >= 500) {
        if (fpsBufferRef.current.length > 0) {
          const open = fpsBufferRef.current[0];
          const close = fpsBufferRef.current[fpsBufferRef.current.length - 1];
          const high = Math.max(...fpsBufferRef.current);
          const low = Math.min(...fpsBufferRef.current);

          if (mountedRef.current) {
            setCandles(prev => [...prev.slice(1), { timestamp: Date.now(), open, high, low, close }]);
          }
          fpsBufferRef.current = [];
          lastCandleTimeRef.current = Date.now();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const candleWidth = (width - 8) / candleCount;
  const padding = 4;
  const maxFps = 120;

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ width, height }}>
      <div className="absolute inset-0 bg-linear-to-br from-white/15 via-white/5 to-slate-900/25 border border-black/10" />
      <svg width={width} height={height} className="relative z-10">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line key={pct} x1={padding} y1={height * pct} x2={width - padding} y2={height * pct}
            stroke="rgba(209, 213, 219, 0.08)" strokeWidth="0.5" />
        ))}
        
        {/* Candles */}
        {candles.map((candle, i) => {
          const x = padding + i * candleWidth + candleWidth / 2;
          const isBullish = candle.close >= candle.open;
          const color = isBullish ? '#FFFFFF' : '#9CA3AF';
          
          const yHigh = padding + ((maxFps - candle.high) / maxFps) * (height - padding * 2);
          const yLow = padding + ((maxFps - candle.low) / maxFps) * (height - padding * 2);
          const yOpen = padding + ((maxFps - candle.open) / maxFps) * (height - padding * 2);
          const yClose = padding + ((maxFps - candle.close) / maxFps) * (height - padding * 2);
          
          return (
            <g key={i}>
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke="#D1D5DB" strokeWidth="1" />
              <rect
                x={x - candleWidth * 0.3}
                y={Math.min(yOpen, yClose)}
                width={candleWidth * 0.6}
                height={Math.max(Math.abs(yClose - yOpen), 1)}
                fill={color}
                rx="1"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
});
FpsCandlestickChart.displayName = 'FpsCandlestickChart';

export const FpsDisplay = memo(({ fps, deviceTier, jankScore }: { fps: number; deviceTier: string; jankScore?: number }) => {
  const colors = getFpsColor(fps);
  
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-lg bg-linear-to-br from-white/90 via-white/70 to-white/60 border border-black/15" />
      <div className="relative px-2 py-1.5 flex items-center gap-2">
        <FpsCandlestickChart fps={fps} />
        <div className="flex flex-col gap-0.5 min-w-[40px]">
          <div className="flex items-center gap-1">
            <Activity size={10} className="text-black neon-blue-icon" />
            <span className="text-sm font-black neon-blue-text" style={{ color: colors.text }}>{fps}</span>
          </div>
          <div className="text-[8px] font-mono font-bold uppercase neon-blue-text tracking-wide">
            {deviceTier}
            {jankScore && jankScore > 0.1 && (
              <span className="text-orange-400 ml-1">↓{Math.round(jankScore * 100)}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
FpsDisplay.displayName = 'FpsDisplay';

export const MinimizedFpsDisplay = memo(({ fps }: { fps: number }) => {
  const colors = getFpsColor(fps);
  const digits = String(fps).padStart(2, '0').split('');
  
  return (
    <div className="flex items-center gap-0.5">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Activity size={11} className="text-black neon-blue-icon drop-shadow-sm" />
      </motion.div>
      <div className="flex overflow-hidden rounded" style={{ background: colors.bg }}>
        {digits.map((digit, idx) => (
          <div key={idx} className="relative w-[10px] h-[16px] overflow-hidden">
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black tabular-nums neon-blue-text"
              style={{ color: colors.text, textShadow: `0 0 8px ${colors.glow}` }}>
              {digit}
            </span>
          </div>
        ))}
      </div>
      <span className="text-[7px] neon-blue-text font-bold uppercase tracking-wider ml-0.5">fps</span>
    </div>
  );
});
MinimizedFpsDisplay.displayName = 'MinimizedFpsDisplay';
