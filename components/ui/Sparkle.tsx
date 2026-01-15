"use client";

import { useEffect, useState, memo, CSSProperties } from 'react';

interface SparkleProps {
  color?: string;
  count?: number;
  minSize?: number;
  maxSize?: number;
  overflowPx?: number;
  fadeOutSpeed?: number;
  flicker?: boolean;
  flickerSpeed?: 'slow' | 'fast' | 'slowest';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
}

const Sparkle = memo(function Sparkle({
  color = 'gold',
  count = 50,
  minSize = 4,
  maxSize = 12,
  overflowPx = 0,
  fadeOutSpeed = 10,
  flicker = true,
  flickerSpeed = 'slow',
}: SparkleProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: minSize + Math.random() * (maxSize - minSize),
        opacity: 0.4 + Math.random() * 0.6,
        delay: Math.random() * 2,
      });
    }
    setParticles(newParticles);
  }, [count, minSize, maxSize]);

  const flickerDuration = flickerSpeed === 'slowest' ? '3s' : flickerSpeed === 'slow' ? '2s' : '1s';

  const containerStyle: CSSProperties = {
    position: 'absolute',
    inset: -overflowPx,
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 10,
  };

  return (
    <div style={containerStyle}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            borderRadius: '50%',
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${color}, 0 0 ${particle.size}px ${color}`,
            animation: flicker
              ? `sparkle-flicker ${flickerDuration} ease-in-out infinite`
              : undefined,
            animationDelay: `${particle.delay}s`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes sparkle-flicker {
          0%, 100% {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
      `}</style>
    </div>
  );
});

export default Sparkle;
