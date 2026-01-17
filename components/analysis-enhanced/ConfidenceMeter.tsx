"use client";

import React, { memo } from 'react';
import { motion } from 'framer-motion';

interface ConfidenceMeterProps {
  score: number; // 1-10
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getConfidenceColor = (score: number): string => {
  if (score <= 3) return 'from-red-500 to-red-600';
  if (score <= 5) return 'from-yellow-500 to-orange-500';
  if (score <= 7) return 'from-blue-500 to-blue-600';
  return 'from-green-500 to-emerald-500';
};

const getConfidenceLabel = (score: number): string => {
  if (score <= 2) return 'Very Low';
  if (score <= 4) return 'Low';
  if (score <= 6) return 'Moderate';
  if (score <= 8) return 'High';
  return 'Very High';
};

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export const ConfidenceMeter = memo(({
  score,
  showLabel = true,
  size = 'md',
  className = '',
}: ConfidenceMeterProps) => {
  const clampedScore = Math.max(1, Math.min(10, score));
  const percentage = (clampedScore / 10) * 100;
  const colorGradient = getConfidenceColor(clampedScore);
  const label = getConfidenceLabel(clampedScore);

  return (
    <div className={`${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-400">Confidence</span>
          <span className="text-xs font-medium text-white">
            {clampedScore}/10 <span className="text-neutral-500">({label})</span>
          </span>
        </div>
      )}

      <div className={`relative w-full bg-neutral-800 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        {/* Background segments */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-neutral-700/50 last:border-r-0"
            />
          ))}
        </div>

        {/* Filled portion */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colorGradient} rounded-full`}
        />

        {/* Indicator dot */}
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-neutral-900"
          style={{ left: `calc(${percentage}% - 0px)` }}
        />
      </div>
    </div>
  );
});

ConfidenceMeter.displayName = 'ConfidenceMeter';

// Compact version for feed cards
export const ConfidenceIndicator = memo(({ score }: { score: number }) => {
  const clampedScore = Math.max(1, Math.min(10, score));
  const colorGradient = getConfidenceColor(clampedScore);

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-8 h-1.5 bg-neutral-800 rounded-full overflow-hidden`}>
        <div
          className={`h-full bg-gradient-to-r ${colorGradient} rounded-full`}
          style={{ width: `${(clampedScore / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs text-neutral-400">{clampedScore}/10</span>
    </div>
  );
});

ConfidenceIndicator.displayName = 'ConfidenceIndicator';

export default ConfidenceMeter;
