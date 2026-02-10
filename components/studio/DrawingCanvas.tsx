"use client";

import { useEffect, useRef, useState } from "react";

interface DrawingCanvasProps {
  onExport?: () => void;
  canvasWidth?: number;
  canvasHeight?: number;
  fitContainer?: boolean;
  showToolbar?: boolean;
  showFooter?: boolean;
  className?: string;
}

export default function DrawingCanvas({
  onExport,
  canvasWidth = 1200,
  canvasHeight = 800,
  fitContainer = false,
  showToolbar = true,
  showFooter = true,
  className,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#007aff');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Welcome message
    ctx.fillStyle = 'rgba(29, 29, 31, 0.15)';
    ctx.font = '700 56px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Native Drawing Canvas', canvas.width / 2, canvas.height / 2 - 40);

    ctx.font = '400 24px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(29, 29, 31, 0.1)';
    ctx.fillText('Click and drag to draw • No dependencies required', canvas.width / 2, canvas.height / 2 + 20);

  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (e.type === 'mousedown') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `drawing-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });

    if (onExport) onExport();
  };

  const colors = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#1d1d1f'];

  return (
    <div className={`drawing-canvas-wrapper${className ? ` ${className}` : ''}`}>
      {showToolbar && (
        <div
          className="drawing-toolbar"
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.03)',
            borderRadius: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Tool:</span>
            <button
              className={`studio-btn ${tool === 'pen' ? 'studio-btn-primary' : ''}`}
              onClick={() => setTool('pen')}
            >
              ✏️ Pen
            </button>
            <button
              className={`studio-btn ${tool === 'eraser' ? 'studio-btn-primary' : ''}`}
              onClick={() => setTool('eraser')}
            >
              🧹 Eraser
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Color:</span>
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '3px solid #000' : '2px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title={c}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Size:</span>
            <input
              type="range"
              min="1"
              max="50"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              style={{ width: '120px' }}
            />
            <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>{lineWidth}px</span>
          </div>

          <button className="studio-btn" onClick={clearCanvas}>
            🗑️ Clear
          </button>
          <button className="studio-btn studio-btn-primary" onClick={handleExport}>
            💾 Export
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          maxWidth: fitContainer ? 'none' : '100%',
          width: fitContainer ? '100%' : undefined,
          height: fitContainer ? '100%' : 'auto',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          cursor: tool === 'pen' ? 'crosshair' : 'not-allowed',
          touchAction: 'none',
          display: 'block'
        }}
      />

      {showFooter && (
        <div style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(0,0,0,0.5)', textAlign: 'center' }}>
          <p>✨ Pure HTML5 Canvas • Zero dependencies • Works offline</p>
        </div>
      )}
    </div>
  );
}
