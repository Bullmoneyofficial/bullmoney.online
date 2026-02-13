"use client";

import { useEffect, useRef, useState } from 'react';

interface PixiEditorProps {
  onExport?: () => void;
}

export default function PixiEditor({ onExport }: PixiEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pixiReady, setPixiReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadPixi = async () => {
      try {
        const PIXI = (await import('pixi.js')) as any;
        if (!mounted || !containerRef.current) return;

        const app = new PIXI.Application() as any;
        await app.init({
          width: 1200,
          height: 800,
          backgroundColor: 0xffffff,
          antialias: true
        });

        const appCanvas = app.canvas ?? app.view;
        if (appCanvas) {
          containerRef.current.appendChild(appCanvas);
        }

        // Welcome text
        const text = new PIXI.Text({
          text: 'PixiJS WebGL Editor',
          style: {
            fontFamily: '-apple-system, system-ui, sans-serif',
            fontSize: 58,
            fontWeight: 'bold',
            fill: 0x1d1d1f,
            align: 'center'
          }
        });
        text.x = 600 - text.width / 2;
        text.y = 320;
        app.stage.addChild(text);

        const subText = new PIXI.Text({
          text: 'Ultra-Fast 2D WebGL Renderer',
          style: {
            fontFamily: '-apple-system, system-ui, sans-serif',
            fontSize: 24,
            fill: 0x1d1d1f,
            fillAlpha: 0.6,
            align: 'center'
          }
        });
        subText.x = 600 - subText.width / 2;
        subText.y = 390;
        app.stage.addChild(subText);

        // Sample shapes
        const circle = new PIXI.Graphics();
        circle.circle(0, 0, 50);
        circle.fill({ color: 0x007aff, alpha: 0.8 });
        circle.x = 400;
        circle.y = 550;
        circle.eventMode = 'static';
        circle.cursor = 'pointer';
        circle.on('pointerdown', (e: any) => {
          circle.dragging = true;
          circle.dragData = e.data.global.clone();
        });
        app.stage.addChild(circle);

        const rect = new PIXI.Graphics();
        rect.roundRect(0, 0, 100, 100, 10);
        rect.fill({ color: 0x34c759, alpha: 0.8 });
        rect.x = 550;
        rect.y = 500;
        rect.eventMode = 'static';
        rect.cursor = 'pointer';
        app.stage.addChild(rect);

        const star = new PIXI.Graphics();
        star.star(0, 0, 5, 50, 30);
        star.fill({ color: 0xff9500, alpha: 0.8 });
        star.x = 750;
        star.y = 550;
        star.eventMode = 'static';
        star.cursor = 'pointer';
        app.stage.addChild(star);

        // Store PIXI globally
        (window as any).PIXI = PIXI;
        (window as any).pixiApp = app;

        appRef.current = app;
        setPixiReady(true);

      } catch (err) {
        console.error("Failed to load PixiJS:", err);
        setError(err instanceof Error ? err.message : "Failed to load PixiJS");
      }
    };

    loadPixi();

    return () => {
      mounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
      }
    };
  }, []);

  const addCircle = () => {
    const app = appRef.current;
    const PIXI = (window as any).PIXI;
    if (!app || !PIXI) return;

    const circle = new PIXI.Graphics();
    circle.circle(0, 0, 50);
    circle.fill({ 
      color: Math.random() * 0xffffff, 
      alpha: 0.8 
    });
    circle.x = Math.random() * 1000 + 100;
    circle.y = Math.random() * 600 + 100;
    circle.eventMode = 'static';
    circle.cursor = 'pointer';
    app.stage.addChild(circle);
  };

  const addRect = () => {
    const app = appRef.current;
    const PIXI = (window as any).PIXI;
    if (!app || !PIXI) return;

    const rect = new PIXI.Graphics();
    rect.roundRect(0, 0, 100, 100, 10);
    rect.fill({ 
      color: Math.random() * 0xffffff, 
      alpha: 0.8 
    });
    rect.x = Math.random() * 1000 + 100;
    rect.y = Math.random() * 600 + 100;
    rect.eventMode = 'static';
    rect.cursor = 'pointer';
    app.stage.addChild(rect);
  };

  const clearCanvas = () => {
    const app = appRef.current;
    if (!app) return;
    
    app.stage.removeChildren();
  };

  const handleExport = () => {
    const app = appRef.current;
    if (!app) return;

    const canvas = app.canvas ?? app.view;
    const dataURL = canvas.toDataURL('image/png', 2);
    const link = document.createElement('a');
    link.download = `pixi-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    if (onExport) onExport();
  };

  if (error) {
    return (
      <div className="studio-fallback-wrapper">
        <div className="studio-info-box" style={{ maxWidth: '600px' }}>
          <p><strong>PixiJS Load Error</strong></p>
          <p style={{ marginTop: '8px' }}>{error}</p>
          <p style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
            Install PixiJS: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>npm install pixi.js</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pixi-editor-wrapper">
      <div 
        ref={containerRef} 
        style={{ 
          maxWidth: '100%', 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }} 
      />
      
      {pixiReady && (
        <div className="pixi-actions" style={{
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
            href="https://pixijs.com/guides" 
            target="_blank" 
            rel="noopener noreferrer"
            className="studio-btn studio-btn-ghost"
          >
            PixiJS Guides
          </a>
        </div>
      )}

      {!pixiReady && !error && (
        <div className="studio-loading-state" style={{ minHeight: '200px' }}>
          <div className="studio-spinner"></div>
          <div className="studio-loading-text">Loading PixiJS...</div>
        </div>
      )}
    </div>
  );
}
