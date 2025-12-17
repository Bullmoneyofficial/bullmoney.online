// src/components/themes/MiniDashboardPreview.tsx
"use client";
import React from 'react';

export const MiniDashboardPreview = ({ color, isUnavailable }: { color: string, isUnavailable: boolean }) => (
    <div className={`w-full h-full p-2 flex flex-col gap-1 ${isUnavailable ? 'opacity-50' : 'bg-gray-900'}`} style={{ filter: 'brightness(2.0)' }}>
      {/* Ticker/Status Bar */}
      <div className="flex justify-between items-center h-2 mb-1">
        <div className="w-1/4 h-full bg-white/50 rounded-sm font-mono text-[8px]">BTC</div>
        <div className="w-1/5 h-full rounded-sm text-[8px]" style={{ backgroundColor: color, opacity: 0.8 }}>+1.2%</div>
      </div>

      <div className="flex flex-1 w-full gap-1">
          {/* Main Chart Area */}
          <div className="w-2/3 h-full rounded border border-white/10 p-[2px] flex flex-col justify-end overflow-hidden bg-gray-950">
            <div className="flex h-full w-full justify-between items-end">
              {[...Array(12)].map((_, i) => {
                const isGreen = i % 3 === 0 || i % 4 === 1;
                const height = (i % 6) * 10 + 20;
                const candleColor = isGreen ? '#10B981' : '#EF4444'; 
                return (
                  <div key={i} className="flex flex-col items-center justify-end w-[4px] mx-[1px]" style={{ height: '90%' }}>
                    <div className="w-[1px] bg-white/50" style={{ height: `${100 - height}%` }} />
                    <div className="w-[3px] rounded-t-[1px]" style={{ height: `${height}%`, backgroundColor: candleColor }} />
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Simulated Order Book */}
          <div className="w-1/3 h-full rounded border border-white/10 flex flex-col justify-between overflow-hidden text-[7px] font-mono">
              <div className="flex flex-col flex-1 gap-[1px] p-[1px]">
                  {[...Array(4)].map((_, i) => (
                      <div key={`ask-${i}`} className="h-1/8 bg-red-800/40" style={{ width: `${60 - i * 10}%` }}>SELL</div>
                  ))}
              </div>
              <div className="h-3 bg-white/10 flex items-center justify-center font-bold" style={{ color }}>PRICE</div>
              <div className="flex flex-col flex-1 gap-[1px] p-[1px]">
                  {[...Array(4)].map((_, i) => (
                      <div key={`bid-${i}`} className="h-1/8 bg-green-800/40 text-right" style={{ width: `${30 + i * 15}%`, marginLeft: 'auto' }}>BUY</div>
                  ))}
              </div>
          </div>
      </div>
    </div>
);