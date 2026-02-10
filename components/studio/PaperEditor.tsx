"use client";

import { useEffect, useRef, useState } from 'react';

interface PaperEditorProps {
  onExport?: () => void;
}

export default function PaperEditor({ onExport }: PaperEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paperReady, setPaperReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadPaper = async () => {
      try {
        const paper = await import('paper');
        if (!mounted || !canvasRef.current) return;

        // Setup Paper.js
        paper.setup(canvasRef.current);
        
        // Store paper globally for use in functions
        (window as any).paper = paper;

        // Create welcome text
        const text = new paper.PointText({
          point: new paper.Point(600, 350),
          content: 'Paper.js Vector Editor',
          fillColor: '#1d1d1f',
          fontFamily: '-apple-system, system-ui, sans-serif',
          fontWeight: 'bold',
          fontSize: 58,
          justification: 'center'
        });

        const subText = new paper.PointText({
          point: new paper.Point(600, 420),
          content: 'Vector Graphics Scripting Framework',
          fillColor: 'rgba(29, 29, 31, 0.6)',
          fontFamily: '-apple-system, system-ui, sans-serif',
          fontSize: 24,
          justification: 'center'
        });

        // Create sample shapes
        const circle = new paper.Path.Circle({
          center: new paper.Point(400, 550),
          radius: 50,
          fillColor: '#007aff',
          opacity: 0.8
        });

        const rect = new paper.Path.Rectangle({
          point: new paper.Point(500, 500),
          size: new paper.Size(100, 100),
          radius: 10,
          fillColor: '#34c759',
          opacity: 0.8
        });

        const star = new paper.Path.Star({
          center: new paper.Point(700, 550),
          points: 5,
          radius1: 30,
          radius2: 50,
          fillColor: '#ff9500',
          opacity: 0.8
        });

        // Make shapes draggable
        [circle, rect, star].forEach(shape => {
          shape.onMouseDrag = function(event: any) {
            this.position = this.position.add(event.delta);
          };
        });

        paper.view.draw();
        setPaperReady(true);

      } catch (err) {
        console.error("Failed to load Paper.js:", err);
        setError(err instanceof Error ? err.message : "Failed to load Paper.js");
      }
    };

    loadPaper();

    return () => {
      mounted = false;
    };
  }, []);

  const addCircle = () => {
    const paper = (window as any).paper;
    if (!paper) return;

    const circle = new paper.Path.Circle({
      center: new paper.Point(Math.random() * 1000 + 100, Math.random() * 600 + 100),
      radius: 50,
      fillColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
      opacity: 0.8
    });

    circle.onMouseDrag = function(event: any) {
      this.position = this.position.add(event.delta);
    };
  };

  const addRect = () => {
    const paper = (window as any).paper;
    if (!paper) return;

    const rect = new paper.Path.Rectangle({
      point: new paper.Point(Math.random() * 1000 + 100, Math.random() * 600 + 100),
      size: new paper.Size(100, 100),
      radius: 10,
      fillColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
      opacity: 0.8
    });

    rect.onMouseDrag = function(event: any) {
      this.position = this.position.add(event.delta);
    };
  };

  const clearCanvas = () => {
    const paper = (window as any).paper;
    if (!paper || !paper.project) return;
    
    paper.project.activeLayer.removeChildren();
    paper.view.draw();
  };

  const handleExport = () => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL('image/png', 2);
    const link = document.createElement('a');
    link.download = `paper-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    if (onExport) onExport();
  };

  if (error) {
    return (
      <div className="studio-fallback-wrapper">
        <div className="studio-info-box" style={{ maxWidth: '600px' }}>
          <p><strong>Paper.js Load Error</strong></p>
          <p style={{ marginTop: '8px' }}>{error}</p>
          <p style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
            Install Paper.js: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>npm install paper</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-editor-wrapper">
      <canvas 
        ref={canvasRef} 
        id="paperCanvas"
        width={1200}
        height={800}
        style={{ 
          maxWidth: '100%', 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          background: '#ffffff',
          display: 'block'
        }} 
      />
      
      {paperReady && (
        <div className="paper-actions" style={{
          marginTop: '24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button className="studio-btn" onClick={addCircle}>
            + Circle
          </button>
          <button className="studio-btn" onClick={addRect}>
            + Rectangle
          </button>
          <button className="studio-btn" onClick={clearCanvas}>
            Clear
          </button>
          <button className="studio-btn studio-btn-primary" onClick={handleExport}>
            Export PNG
          </button>
          <a 
            href="http://paperjs.org/tutorials/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="studio-btn studio-btn-ghost"
          >
            Paper.js Docs
          </a>
        </div>
      )}

      {!paperReady && !error && (
        <div className="studio-loading-state" style={{ minHeight: '200px' }}>
          <div className="studio-spinner"></div>
          <div className="studio-loading-text">Loading Paper.js...</div>
        </div>
      )}
    </div>
  );
}
