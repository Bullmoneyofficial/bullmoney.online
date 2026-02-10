"use client";

import { useEffect, useRef, useState } from 'react';

interface TwoEditorProps {
  onExport?: () => void;
}

export default function TwoEditor({ onExport }: TwoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [twoReady, setTwoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const twoInstanceRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadTwo = async () => {
      try {
        const Two = await import('two.js');
        if (!mounted || !containerRef.current) return;

        const two = new Two.default({
          width: 1200,
          height: 800,
          autostart: true
        }).appendTo(containerRef.current);

        // Background
        const bg = two.makeRectangle(600, 400, 1200, 800);
        bg.fill = '#ffffff';
        bg.noStroke();

        // Welcome text
        const text = two.makeText('Two.js 2D Engine', 600, 350, {
          family: '-apple-system, system-ui, sans-serif',
          size: 58,
          weight: 'bold',
          fill: '#1d1d1f',
          alignment: 'center'
        });

        const subText = two.makeText('Minimal 2D Drawing API', 600, 420, {
          family: '-apple-system, system-ui, sans-serif',
          size: 24,
          fill: 'rgba(29, 29, 31, 0.6)',
          alignment: 'center'
        });

        // Sample shapes
        const circle = two.makeCircle(400, 550, 50);
        circle.fill = 'rgba(0, 122, 255, 0.8)';
        circle.noStroke();

        const rect = two.makeRoundedRectangle(600, 550, 100, 100, 10);
        rect.fill = 'rgba(52, 199, 89, 0.8)';
        rect.noStroke();

        const star = two.makeStar(800, 550, 30, 50, 5);
        star.fill = 'rgba(255, 149, 0, 0.8)';
        star.noStroke();

        two.update();

        twoInstanceRef.current = two;
        setTwoReady(true);

      } catch (err) {
        console.error("Failed to load Two.js:", err);
        setError(err instanceof Error ? err.message : "Failed to load Two.js");
      }
    };

    loadTwo();

    return () => {
      mounted = false;
      if (twoInstanceRef.current) {
        twoInstanceRef.current.clear();
      }
    };
  }, []);

  const addCircle = () => {
    if (!twoInstanceRef.current) return;
    
    const two = twoInstanceRef.current;
    const circle = two.makeCircle(
      Math.random() * 1000 + 100,
      Math.random() * 600 + 100,
      50
    );
    circle.fill = `hsl(${Math.random() * 360}, 70%, 60%)`;
    circle.opacity = 0.8;
    circle.noStroke();
    two.update();
  };

  const addRect = () => {
    if (!twoInstanceRef.current) return;
    
    const two = twoInstanceRef.current;
    const rect = two.makeRoundedRectangle(
      Math.random() * 1000 + 100,
      Math.random() * 600 + 100,
      100, 100, 10
    );
    rect.fill = `hsl(${Math.random() * 360}, 70%, 60%)`;
    rect.opacity = 0.8;
    rect.noStroke();
    two.update();
  };

  const clearCanvas = () => {
    if (!twoInstanceRef.current) return;
    
    twoInstanceRef.current.clear();
    twoInstanceRef.current.update();
  };

  const handleExport = () => {
    if (!containerRef.current) return;

    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png', 2);
    const link = document.createElement('a');
    link.download = `two-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    if (onExport) onExport();
  };

  if (error) {
    return (
      <div className="studio-fallback-wrapper">
        <div className="studio-info-box" style={{ maxWidth: '600px' }}>
          <p><strong>Two.js Load Error</strong></p>
          <p style={{ marginTop: '8px' }}>{error}</p>
          <p style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
            Install Two.js: <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>npm install two.js</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="two-editor-wrapper">
      <div 
        ref={containerRef} 
        style={{ 
          maxWidth: '100%', 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          background: '#ffffff'
        }} 
      />
      
      {twoReady && (
        <div className="two-actions" style={{
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
            href="https://two.js.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="studio-btn studio-btn-ghost"
          >
            Two.js Docs
          </a>
        </div>
      )}

      {!twoReady && !error && (
        <div className="studio-loading-state" style={{ minHeight: '200px' }}>
          <div className="studio-spinner"></div>
          <div className="studio-loading-text">Loading Two.js...</div>
        </div>
      )}
    </div>
  );
}
