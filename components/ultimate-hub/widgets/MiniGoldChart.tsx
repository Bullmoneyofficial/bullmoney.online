import { memo, useEffect, useRef } from 'react';

export const MiniGoldChart = memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear any existing content
    containerRef.current.innerHTML = '';
    
    // Create TradingView advanced chart widget with candlesticks
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: "OANDA:XAUUSD",
      width: "100%",
      height: "100%",
      locale: "en",
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1", // 1 = Candlestick
      hide_top_toolbar: true,
      hide_legend: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      backgroundColor: "rgba(0, 0, 0, 0)",
      gridColor: "rgba(255, 255, 255, 0.1)",
      hide_volume: true,
      support_host: "https://www.tradingview.com"
    });
    
    containerRef.current.appendChild(script);
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-hidden rounded-sm pointer-events-none"
      style={{ 
        filter: 'saturate(0) brightness(1.8) sepia(1) hue-rotate(190deg) saturate(2.5) contrast(1.1)',
        background: 'rgba(0, 0, 0, 0.9)',
        minHeight: '100px'
      }}
    />
  );
});
MiniGoldChart.displayName = 'MiniGoldChart';
