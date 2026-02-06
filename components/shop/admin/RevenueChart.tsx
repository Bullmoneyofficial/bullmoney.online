'use client';

import { useMemo } from 'react';
import type { RevenueDataPoint } from '@/types/store';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// REVENUE CHART - SIMPLE SVG LINE CHART
// ============================================================================

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate placeholder data
      return Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.random() * 1000 + 500,
        orders: Math.floor(Math.random() * 20) + 5,
      }));
    }
    return data;
  }, [data]);

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
  const minRevenue = Math.min(...chartData.map(d => d.revenue));
  const range = maxRevenue - minRevenue || 1;

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * chartWidth + padding.left;
    const y = chartHeight - ((d.revenue - minRevenue) / range) * chartHeight + padding.top;
    return { x, y, data: d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  // Area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  // Y-axis labels
  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const value = minRevenue + (range * (4 - i)) / 4;
    return {
      value: useCurrencyLocaleStore.getState().formatPrice(value),
      y: padding.top + (chartHeight * i) / 4,
    };
  });

  // X-axis labels (show every 5th date)
  const xLabels = chartData.filter((_, i) => i % 5 === 0 || i === chartData.length - 1).map((d, i, arr) => ({
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    x: (chartData.indexOf(d) / (chartData.length - 1)) * chartWidth + padding.left,
  }));

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex gap-8">
        <div>
          <p className="text-white/40 text-sm">Total Revenue</p>
          <p className="text-2xl font-light">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div>
          <p className="text-white/40 text-sm">Total Orders</p>
          <p className="text-2xl font-light">{totalOrders}</p>
        </div>
        <div>
          <p className="text-white/40 text-sm">Avg Order Value</p>
          <p className="text-2xl font-light">
            ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.2" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {yLabels.map((label, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={label.y}
            x2={width - padding.right}
            y2={label.y}
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4"
          />
        ))}

        {/* Area Fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="black"
              stroke="white"
              strokeWidth="2"
              className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            />
            <title>
              {new Date(point.data.date).toLocaleDateString()}: ${point.data.revenue.toFixed(2)} ({point.data.orders} orders)
            </title>
          </g>
        ))}

        {/* Y-axis Labels */}
        {yLabels.map((label, i) => (
          <text
            key={i}
            x={padding.left - 10}
            y={label.y}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-white/40 text-xs"
          >
            {label.value}
          </text>
        ))}

        {/* X-axis Labels */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={height - 10}
            textAnchor="middle"
            className="fill-white/40 text-xs"
          >
            {label.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
