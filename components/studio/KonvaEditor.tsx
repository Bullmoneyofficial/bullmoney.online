"use client";

import { useEffect, useRef, useState } from "react";

interface KonvaEditorProps {
  onExport?: () => void;
}

export default function KonvaEditor({ onExport }: KonvaEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [konvaReady, setKonvaReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadKonva = async () => {
      try {
        const Konva = await import("konva");
        if (!mounted || !containerRef.current) return;

        const stage = new Konva.default.Stage({
          container: containerRef.current,
          width: 1200,
          height: 800,
        });

        const layer = new Konva.default.Layer();
        stage.add(layer);

        // Background
        const background = new Konva.default.Rect({
          x: 0,
          y: 0,
          width: 1200,
          height: 800,
          fill: '#ffffff',
        });
        layer.add(background);

        // Welcome text
        const welcomeText = new Konva.default.Text({
          x: 600,
          y: 350,
          text: 'Konva.js Editor',
          fontSize: 58,
          fontFamily: '-apple-system, system-ui, sans-serif',
          fontStyle: 'bold',
          fill: '#1d1d1f',
          align: 'center',
          offsetX: 300,
        });
        layer.add(welcomeText);

        const subText = new Konva.default.Text({
          x: 600,
          y: 420,
          text: 'Free & Open Source Canvas Library',
          fontSize: 24,
          fontFamily: '-apple-system, system-ui, sans-serif',
          fill: 'rgba(29, 29, 31, 0.6)',
          align: 'center',
          offsetX: 300,
        });
        layer.add(subText);

        // Sample shapes
        const circle = new Konva.default.Circle({
          x: 400,
          y: 550,
          radius: 50,
          fill: '#007aff',
          opacity: 0.8,
          draggable: true,
        });
        layer.add(circle);

        const rect = new Konva.default.Rect({
          x: 550,
          y: 500,
          width: 100,
          height: 100,
          fill: '#34c759',
          opacity: 0.8,
          draggable: true,
          cornerRadius: 10,
        });
        layer.add(rect);

        const star = new Konva.default.Star({
          x: 750,
          y: 550,
          numPoints: 5,
          innerRadius: 30,
          outerRadius: 50,
          fill: '#ff9500',
          opacity: 0.8,
          draggable: true,
        });
        layer.add(star);

        layer.draw();

        stageRef.current = stage;
        layerRef.current = layer;
        
        // Store Konva globally for use in add functions
        (window as any).Konva = Konva.default;
        
        setKonvaReady(true);

      } catch (err) {
        console.error("Failed to load Konva.js:", err);
        setError(err instanceof Error ? err.message : "Failed to load Konva.js");
      }
    };

    loadKonva();

    return () => {
      mounted = false;
      if (stageRef.current) {
        stageRef.current.destroy();
      }
    };
  }, []);

  const handleExport = () => {
    if (!stageRef.current) return;

    const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `konva-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    if (onExport) onExport();
  };

  const addRect = () => {
    if (!layerRef.current) return;
    
    const Konva = (window as any).Konva;
    if (!Konva) return;

    const rect = new Konva.Rect({
      x: Math.random() * 1000 + 100,
      y: Math.random() * 600 + 100,
      width: 100,
      height: 100,
      fill: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      opacity: 0.8,
      draggable: true,
      cornerRadius: 10,
    });

    layerRef.current.add(rect);
    layerRef.current.draw();
  };

  const addCircle = () => {
    if (!layerRef.current) return;
    
    const Konva = (window as any).Konva;
    if (!Konva) return;

    const circle = new Konva.Circle({
      x: Math.random() * 1000 + 100,
      y: Math.random() * 600 + 100,
      radius: 50,
      fill: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      opacity: 0.8,
      draggable: true,
    });

    layerRef.current.add(circle);
    layerRef.current.draw();
  };

  const clearCanvas = () => {
    if (!layerRef.current) return;
    layerRef.current.destroyChildren();
    layerRef.current.draw();
  };

  if (error) {
    return (
      <div className="studio-fallback-wrapper">
        <div className="studio-info-box" style={{ maxWidth: '600px' }}>
          <p><strong>Konva.js Load Error</strong></p>
          <p style={{ marginTop: '8px' }}>{error}</p>
          <p style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
            Install Konva.js: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>npm install konva react-konva</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="konva-editor-wrapper">
      <div ref={containerRef} style={{ 
        maxWidth: '100%', 
        overflow: 'auto',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        background: '#ffffff'
      }} />
      
      {konvaReady && (
        <div className="konva-actions" style={{
          marginTop: '24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button className="studio-btn" onClick={addRect}>
            + Rectangle
          </button>
          <button className="studio-btn" onClick={addCircle}>
            + Circle
          </button>
          <button className="studio-btn" onClick={clearCanvas}>
            Clear
          </button>
          <button className="studio-btn studio-btn-primary" onClick={handleExport}>
            Export PNG
          </button>
          <a 
            href="https://konvajs.org/docs/index.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="studio-btn studio-btn-ghost"
          >
            Konva Docs
          </a>
        </div>
      )}

      {!konvaReady && !error && (
        <div className="studio-loading-state" style={{ minHeight: '200px' }}>
          <div className="studio-spinner"></div>
          <div className="studio-loading-text">Loading Konva.js...</div>
        </div>
      )}
    </div>
  );
}
