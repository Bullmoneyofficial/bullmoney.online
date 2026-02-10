"use client";

import { useEffect, useRef, useCallback } from "react";

interface FallbackCanvasProps {
  onExport?: () => void;
  onRetry?: () => void;
  error?: string | null;
}

export default function FallbackCanvas({ onExport, onRetry, error }: FallbackCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 800;

    // White background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8f8f8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid pattern
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Center icon/graphic
    ctx.fillStyle = 'rgba(0, 122, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2 - 80, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#007aff';
    ctx.font = '800 72px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✎', canvas.width / 2, canvas.height / 2 - 80);

    // Title
    ctx.fillStyle = '#1d1d1f';
    ctx.font = '600 42px -apple-system, system-ui, sans-serif';
    ctx.fillText('HTML5 Canvas Mode', canvas.width / 2, canvas.height / 2 + 40);

    // Subtitle
    ctx.font = '400 20px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(29, 29, 31, 0.6)';
    ctx.fillText('Lightweight fallback mode using native browser APIs', canvas.width / 2, canvas.height / 2 + 80);

    if (error) {
      ctx.font = '400 16px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 59, 48, 0.8)';
      ctx.fillText(`Error: ${error.slice(0, 60)}${error.length > 60 ? '...' : ''}`, canvas.width / 2, canvas.height / 2 + 120);
    }

    // Features list
    const features = [
      '✓ Zero external dependencies',
      '✓ Works 100% offline',
      '✓ Fast & lightweight',
      '✓ Privacy-focused (no tracking)'
    ];

    ctx.font = '500 16px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(29, 29, 31, 0.5)';
    ctx.textAlign = 'left';
    
    features.forEach((feature, index) => {
      const yOffset = canvas.height - 180 + (index * 32);
      ctx.fillText(feature, 60, yOffset);
    });

    // Info badge
    ctx.fillStyle = 'rgba(0, 122, 255, 0.08)';
    ctx.fillRect(canvas.width - 480, canvas.height - 200, 420, 160);
    
    ctx.font = '600 15px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#007aff';
    ctx.textAlign = 'left';
    ctx.fillText('🌟 Free Open-Source Alternatives', canvas.width - 460, canvas.height - 170);
    
    const alternatives = [
      '✓ Fabric.js - Professional canvas (Primary)',
      '✓ Konva.js - High-performance 2D',
      '✓ Paper.js - Vector graphics scripting',
      '✓ P5.js - Creative coding',
      '✓ Excalidraw - Sketch diagrams',
      '✓ TLDraw - Collaborative whiteboard'
    ];
    
    ctx.font = '400 12px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(29, 29, 31, 0.7)';
    
    alternatives.forEach((alt, index) => {
      const yOffset = canvas.height - 140 + (index * 20);
      ctx.fillText(alt, canvas.width - 460, yOffset);
    });

  }, [error]);

  useEffect(() => {
    initCanvas();

    const handleResize = () => {
      if (canvasRef.current) {
        initCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `design-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });

    if (onExport) onExport();
  };

  return (
    <div className="fallback-canvas-wrapper">
      <canvas 
        ref={canvasRef} 
        className="studio-canvas-el"
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }} 
      />
      <div className="fallback-actions" style={{
        marginTop: '24px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button className="studio-btn studio-btn-primary" onClick={handleExport}>
          📥 Export Canvas
        </button>
        {onRetry && (
          <button className="studio-btn" onClick={onRetry}>
            🔄 Retry Fabric.js
          </button>
        )}
        <a 
          href="https://github.com/fabricjs/fabric.js" 
          target="_blank" 
          rel="noopener noreferrer"
          className="studio-btn studio-btn-ghost"
          title="Fabric.js - Powerful and free HTML5 canvas library"
        >
          Fabric.js
        </a>
        <a 
          href="https://konvajs.org/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="studio-btn studio-btn-ghost"
          title="Konva.js - 2D canvas framework"
        >
          Konva.js
        </a>
        <a 
          href="http://paperjs.org/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="studio-btn studio-btn-ghost"
          title="Paper.js - Vector graphics scripting"
        >
          Paper.js
        </a>
        <a 
          href="https://p5js.org/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="studio-btn studio-btn-ghost"
          title="P5.js - Creative coding library"
        >
          P5.js
        </a>
        <a 
          href="https://excalidraw.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="studio-btn studio-btn-ghost"
          title="Excalidraw - Virtual whiteboard for sketching hand-drawn diagrams"
        >
          Excalidraw
        </a>
        <a 
          href="https://www.tldraw.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="studio-btn studio-btn-ghost"
          title="TLDraw - Free collaborative whiteboard"
        >
          TLDraw
        </a>
        <a 
          href="https://two.js.org/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="studio-btn studio-btn-ghost"
          title="Two.js - 2D drawing API"
        >
          Two.js
        </a>
        <a 
          href="https://threejs.org/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="studio-btn studio-btn-ghost"
          title="Three.js - 3D JavaScript library"
        >
          Three.js
        </a>
        <a 
          href="https://pixijs.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="studio-btn studio-btn-ghost"
          title="PixiJS - Fast 2D WebGL renderer"
        >
          PixiJS
        </a>
      </div>
    </div>
  );
}
