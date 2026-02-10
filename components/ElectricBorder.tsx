'use client';

import React, { useEffect, useRef, CSSProperties, ReactNode } from 'react';
import './ElectricBorder.css';

// ── Pure math helpers (no hooks, stable references) ─────────────────

function random(x: number): number {
  return (Math.sin(x * 12.9898) * 43758.5453) % 1;
}

function noise2D(x: number, y: number): number {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;

  const a = random(i + j * 57);
  const b = random(i + 1 + j * 57);
  const c = random(i + (j + 1) * 57);
  const d = random(i + 1 + (j + 1) * 57);

  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);

  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}

function octavedNoise(
  x: number,
  octaves: number,
  lacunarity: number,
  gain: number,
  baseAmplitude: number,
  baseFrequency: number,
  time: number,
  seed: number,
  baseFlatness: number
): number {
  let y = 0;
  let amplitude = baseAmplitude;
  let frequency = baseFrequency;

  for (let i = 0; i < octaves; i++) {
    let octaveAmplitude = amplitude;
    if (i === 0) {
      octaveAmplitude *= baseFlatness;
    }
    y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
    frequency *= lacunarity;
    amplitude *= gain;
  }

  return y;
}

function getCornerPoint(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  arcLength: number,
  progress: number
): { x: number; y: number } {
  const angle = startAngle + progress * arcLength;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

function getRoundedRectPoint(
  t: number,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number
): { x: number; y: number } {
  const straightWidth = width - 2 * radius;
  const straightHeight = height - 2 * radius;
  const cornerArc = (Math.PI * radius) / 2;
  const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
  const distance = t * totalPerimeter;

  let accumulated = 0;

  if (distance <= accumulated + straightWidth) {
    const progress = (distance - accumulated) / straightWidth;
    return { x: left + radius + progress * straightWidth, y: top };
  }
  accumulated += straightWidth;

  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc;
    return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, progress);
  }
  accumulated += cornerArc;

  if (distance <= accumulated + straightHeight) {
    const progress = (distance - accumulated) / straightHeight;
    return { x: left + width, y: top + radius + progress * straightHeight };
  }
  accumulated += straightHeight;

  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc;
    return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, progress);
  }
  accumulated += cornerArc;

  if (distance <= accumulated + straightWidth) {
    const progress = (distance - accumulated) / straightWidth;
    return { x: left + width - radius - progress * straightWidth, y: top + height };
  }
  accumulated += straightWidth;

  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc;
    return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, progress);
  }
  accumulated += cornerArc;

  if (distance <= accumulated + straightHeight) {
    const progress = (distance - accumulated) / straightHeight;
    return { x: left, y: top + height - radius - progress * straightHeight };
  }
  accumulated += straightHeight;

  const progress = (distance - accumulated) / cornerArc;
  return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, progress);
}

// ── Component ───────────────────────────────────────────────────────

interface ElectricBorderProps {
  children?: ReactNode;
  color?: string;
  speed?: number;
  chaos?: number;
  borderRadius?: number;
  className?: string;
  style?: CSSProperties;
}

const ElectricBorder: React.FC<ElectricBorderProps> = ({
  children,
  color = '#5227FF',
  speed = 1,
  chaos = 0.12,
  borderRadius = 24,
  className,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store props in a ref so the rAF loop always reads the latest values
  // without needing them in the useEffect dependency array.
  const propsRef = useRef({ color, speed, chaos, borderRadius });
  propsRef.current = { color, speed, chaos, borderRadius };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let lastFrameTime = 0;
    let cancelled = false;

    const octaves = 10;
    const lacunarity = 1.6;
    const gain = 0.7;
    const baseFlatness = 0;
    const displacement = 60;
    const borderOffset = 60;

    let w = 0;
    let h = 0;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      w = rect.width + borderOffset * 2;
      h = rect.height + borderOffset * 2;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();

    const draw = (currentTime: number) => {
      if (cancelled) return;

      // First frame: seed so delta starts at ~0
      if (lastFrameTime === 0) lastFrameTime = currentTime;

      const dt = Math.min((currentTime - lastFrameTime) / 1000, 0.1);
      time += dt * propsRef.current.speed;
      lastFrameTime = currentTime;

      const { color: c, chaos: ch, borderRadius: br } = propsRef.current;
      const amplitude = ch;
      const frequency = 10;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.strokeStyle = c;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const scale = displacement;
      const left = borderOffset;
      const top = borderOffset;
      const bw = w - 2 * borderOffset;
      const bh = h - 2 * borderOffset;
      const maxR = Math.min(bw, bh) / 2;
      const radius = Math.min(br, maxR);

      const approxPerim = 2 * (bw + bh) + 2 * Math.PI * radius;
      const sampleCount = Math.floor(approxPerim / 2);

      ctx.beginPath();

      for (let i = 0; i <= sampleCount; i++) {
        const progress = i / sampleCount;
        const point = getRoundedRectPoint(progress, left, top, bw, bh, radius);

        const xN = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, time, 0, baseFlatness);
        const yN = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, time, 1, baseFlatness);

        const dx = point.x + xN * scale;
        const dy = point.y + yN * scale;

        if (i === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      }

      ctx.closePath();
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- reads props via ref

  const vars = {
    '--electric-border-color': color,
    borderRadius,
  } as CSSProperties;

  return (
    <div ref={containerRef} className={'electric-border ' + (className ?? '')} style={{ ...vars, ...style }}>
      <div className="eb-canvas-container">
        <canvas ref={canvasRef} className="eb-canvas" />
      </div>
      <div className="eb-layers">
        <div className="eb-glow-1" />
        <div className="eb-glow-2" />
        <div className="eb-background-glow" />
      </div>
      <div className="eb-content">{children}</div>
    </div>
  );
};

export default ElectricBorder;
