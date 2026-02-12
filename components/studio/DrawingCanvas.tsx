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
  const isDrawingRef = useRef(false);
  const [color, setColor] = useState('#007aff');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const lineWidthRef = useRef(lineWidth);

  // Keep refs in sync
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { lineWidthRef.current = lineWidth; }, [lineWidth]);

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
  }, [canvasWidth, canvasHeight]);

  const getPos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const stroke = (x: number, y: number, isStart: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (toolRef.current === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidthRef.current * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = lineWidthRef.current;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isStart) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getPos(e.clientX, e.clientY);
    if (!pos) return;
    isDrawingRef.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    stroke(pos.x, pos.y, true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const pos = getPos(e.clientX, e.clientY);
    if (!pos) return;
    stroke(pos.x, pos.y, false);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
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

    </div>
  );
}
