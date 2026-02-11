import { memo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Wifi, WifiOff } from 'lucide-react';

export const StatCard = memo(({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  color = 'blue',
  subValue,
  animate = true,
  dataSource
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: typeof Cpu;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'cyan' | 'purple';
  subValue?: string;
  animate?: boolean;
  dataSource?: 'device' | 'browser' | 'estimated';
}) => {
  const colorClasses = {
    blue: 'from-white/20 to-white/10 border-black/10 text-black',
    green: 'from-white/20 to-white/10 border-black/10 text-black',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    cyan: 'from-white/20 to-white/10 border-black/10 text-black',
    purple: 'from-white/20 to-white/10 border-black/10 text-black',
  };
  
  const sourceLabels = {
    device: 'Real Device',
    browser: 'Browser API',
    estimated: 'Estimated'
  };
  
  const sourceColors = {
    device: 'text-black',
    browser: 'text-black',
    estimated: 'text-black'
  };
  
  const sourceGlow = '0 0 6px #ffffff';

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-2.5 rounded-xl bg-linear-to-br ${colorClasses[color]} border backdrop-blur-sm overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-medium text-black/50 uppercase tracking-wide truncate">{label}</span>
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${colorClasses[color].split(' ').pop()}`} style={{ filter: `drop-shadow(${sourceGlow})` }} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-black text-black tabular-nums">{value}</span>
        {unit && <span className="text-[9px] text-black/40 font-medium">{unit}</span>}
      </div>
      {subValue && <div className="text-[8px] text-black/40 mt-0.5 truncate">{subValue}</div>}
      {dataSource && (
        <div className={`text-[7px] font-medium mt-1 truncate ${sourceColors[dataSource]}`} style={{ textShadow: sourceGlow }}>
          {sourceLabels[dataSource]}
        </div>
      )}
    </motion.div>
  );
});
StatCard.displayName = 'StatCard';

export const PerformanceRing = memo(({ 
  value, 
  maxValue = 100, 
  label, 
  color = 'blue',
  size = 60 
}: {
  value: number;
  maxValue?: number;
  label: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'cyan';
  size?: number;
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colors = {
    blue: { stroke: '#1d4ed8', glow: 'rgba(29, 78, 216, 0.3)' },
    green: { stroke: '#15803d', glow: 'rgba(21, 128, 61, 0.3)' },
    amber: { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
    red: { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
    cyan: { stroke: '#0e7490', glow: 'rgba(14, 116, 144, 0.3)' },
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors[color].stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${colors[color].glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black text-black tabular-nums">{Math.round(percentage)}%</span>
        </div>
      </div>
      <span className="text-[8px] text-black/50 mt-1 font-medium">{label}</span>
    </div>
  );
});
PerformanceRing.displayName = 'PerformanceRing';

export const ConnectionStatusBadge = memo(({ isOnline, effectiveType }: { isOnline: boolean; effectiveType: string }) => {
  const getSpeedColor = () => {
    if (!isOnline) return 'red';
    if (effectiveType === '4g') return 'green';
    if (effectiveType === '3g') return 'amber';
    return 'red';
  };

  const color = getSpeedColor();
  const colorClasses = {
    green: 'bg-white text-black border-black/15',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${colorClasses[color]}`}>
      <motion.div
        className={`w-2 h-2 rounded-full ${color === 'green' ? 'bg-white' : color === 'amber' ? 'bg-amber-400' : 'bg-red-400'}`}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-[10px] font-bold uppercase">
        {isOnline ? effectiveType.toUpperCase() : 'OFFLINE'}
      </span>
      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
    </div>
  );
});
ConnectionStatusBadge.displayName = 'ConnectionStatusBadge';
