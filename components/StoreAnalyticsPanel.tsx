"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Eye,
  Heart,
  Gift,
  Tag,
  BarChart3,
  Globe,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Star,
  Layers,
  MapPin,
  CreditCard,
  Percent,
  Award,
  ShoppingBag,
} from "lucide-react";

// ============================================================================
// STORE ANALYTICS PANEL — Premium E-commerce Dashboard
// Shopify + Takealot inspired — glassmorphism, animated charts, rich visuals
// ============================================================================

// ─── Types ───
interface AnalyticsData {
  overview: {
    total_revenue: number;
    current_period_revenue: number;
    previous_period_revenue: number;
    revenue_growth: number;
    avg_order_value: number;
    total_orders: number;
    paid_orders: number;
    current_period_orders: number;
    orders_growth: number;
    today_revenue: number;
    today_orders: number;
    total_customers: number;
    new_customers_this_week: number;
    repeat_customers: number;
    repeat_rate: number;
    fulfillment_rate: number;
    needs_tracking: number;
    conversion_rate: string;
    cart_to_purchase_rate: string;
  };
  orders: {
    by_status: Record<string, number>;
    by_carrier: Record<string, number>;
    recent: Array<{
      order_number: string;
      email: string;
      customer_name: string;
      total: number;
      status: string;
      payment_status: string;
      tracking_number: string | null;
      carrier: string | null;
      items_count: number;
      created_at: string;
    }>;
  };
  charts: {
    revenue_by_day: Record<string, number>;
    orders_by_day: Record<string, number>;
  };
  products: {
    top_selling: Array<{ name: string; quantity: number; revenue: number }>;
    top_wishlisted: Array<{ name: string; count: number }>;
    top_demanded: Array<{ name: string; count: number }>;
  };
  customers: {
    top_spenders: Array<{ email: string; name: string; total: number; orders: number }>;
    top_countries: Array<{ country: string; count: number }>;
  };
  inventory: {
    wishlist_total: number;
    cart_total: number;
    active_cart_value: number;
    active_cart_users: number;
    back_in_stock_subs: number;
  };
  promos: {
    gift_cards_issued: number;
    gift_card_total_value: number;
    gift_card_remaining_balance: number;
    active_gift_cards: number;
    discount_codes_total: number;
    discount_codes_active: number;
  };
  events: {
    page_views: number;
    add_to_cart: number;
    purchases: number;
    searches: number;
    wishlist_adds: number;
  };
}

// ─── Formatters ───
const fmt = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const fmtFull = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2 }).format(n);

// ─── Inline CSS keyframes (injected once) ───
const ANALYTICS_STYLES = `
@keyframes sa-fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes sa-countUp {
  from { opacity: 0; filter: blur(4px); }
  to { opacity: 1; filter: blur(0); }
}
@keyframes sa-pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes sa-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes sa-bar-grow {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}
@keyframes sa-slideRight {
  from { width: 0%; }
}
.sa-fadein { animation: sa-fadeUp 0.5s ease-out both; }
.sa-fadein-1 { animation-delay: 0.04s; }
.sa-fadein-2 { animation-delay: 0.08s; }
.sa-fadein-3 { animation-delay: 0.12s; }
.sa-fadein-4 { animation-delay: 0.16s; }
.sa-fadein-5 { animation-delay: 0.2s; }
.sa-fadein-6 { animation-delay: 0.24s; }
.sa-fadein-7 { animation-delay: 0.28s; }
.sa-fadein-8 { animation-delay: 0.32s; }
.sa-glass {
  background: linear-gradient(135deg, rgba(15,23,42,0.7) 0%, rgba(30,41,59,0.5) 100%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(148,163,184,0.1);
}
.sa-glass-bright {
  background: linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.65) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(148,163,184,0.15);
}
.sa-bar-animate {
  transform-origin: bottom;
  animation: sa-bar-grow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.sa-shimmer-bg {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: sa-shimmer 3s ease-in-out infinite;
}
`;

function useInjectStyles() {
  useEffect(() => {
    const id = "sa-analytics-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = ANALYTICS_STYLES;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

// ─── SVG Area Chart ───
function AreaChart({ data, height = 100, color = "#10b981", gradientId = "areaGrad" }: { data: Record<string, number>; height?: number; color?: string; gradientId?: string }) {
  const entries = Object.entries(data);
  const values = entries.map(([, v]) => v);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 600;
  const h = height;
  const pad = 2;

  const points = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${w - pad},${h} L${pad},${h} Z`;
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <filter id={`${gradientId}-glow`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${gradientId}-glow)`} />
        {values.map((v, i) => {
          const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
          const y = h - pad - ((v - min) / range) * (h - pad * 2);
          return (
            <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: "crosshair" }}>
              <rect x={x - 10} y={0} width={20} height={h} fill="transparent" />
              {hoverIdx === i && (
                <>
                  <line x1={x} y1={0} x2={x} y2={h} stroke="rgba(148,163,184,0.2)" strokeWidth="1" strokeDasharray="4,3" />
                  <circle cx={x} cy={y} r="5" fill={color} stroke="white" strokeWidth="2" />
                </>
              )}
            </g>
          );
        })}
      </svg>
      {hoverIdx !== null && (
        <div className="absolute pointer-events-none z-20 bg-slate-800/95 border border-slate-600/60 rounded-lg px-3 py-1.5 text-xs shadow-xl backdrop-blur-sm"
          style={{ left: `${(hoverIdx / Math.max(values.length - 1, 1)) * 100}%`, top: -8, transform: "translateX(-50%)" }}>
          <div className="text-slate-400 text-[10px]">{entries[hoverIdx]?.[0]?.slice(5)}</div>
          <div className="text-white font-bold">{fmt(values[hoverIdx])}</div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[9px] text-slate-500/60 pointer-events-none" style={{ transform: "translateY(100%)", paddingTop: 4 }}>
        <span>{entries[0]?.[0]?.slice(5)}</span>
        <span>{entries[Math.floor(entries.length / 2)]?.[0]?.slice(5)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

// ─── SVG Donut Chart ───
function DonutChart({ segments, size = 90, strokeWidth = 10 }: { segments: Array<{ value: number; color: string; label: string }>; size?: number; strokeWidth?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(51,65,85,0.5)" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = circumference * pct;
          const gap = circumference - dash;
          const currentOffset = offset;
          offset += pct * circumference;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-currentOffset} strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 3px ${seg.color}40)` }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-white font-bold text-sm leading-none">{total.toLocaleString()}</div>
        <div className="text-slate-500 text-[8px] mt-0.5">TOTAL</div>
      </div>
    </div>
  );
}

// ─── Sparkline ───
function Sparkline({ values, color = "#10b981", width = 60, height = 20 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Circular progress ring ───
function ProgressRing({ value, max: maxVal = 100, size = 44, strokeWidth = 4, color = "#10b981" }: { value: number; max?: number; size?: number; strokeWidth?: number; color?: string }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / (maxVal || 1), 1);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(51,65,85,0.4)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 3px ${color}50)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">
        {Math.round(pct * 100)}%
      </div>
    </div>
  );
}

// ─── Funnel step ───
function FunnelStep({ label, value, maxValue, color, dropoff, icon, delay = 0 }: {
  label: string; value: number; maxValue: number; color: string; dropoff?: number | null; icon: React.ReactNode; delay?: number;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="sa-fadein" style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="p-1 rounded-md" style={{ background: `${color}20`, color }}>{icon}</span>
          <span className="text-slate-300 font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm tabular-nums">{value.toLocaleString()}</span>
          {dropoff !== null && dropoff !== undefined && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-400/80 bg-red-500/10 rounded-full px-1.5 py-0.5">
              <ArrowDownRight className="w-2.5 h-2.5" /> {dropoff}%
            </span>
          )}
        </div>
      </div>
      <div className="h-2.5 bg-slate-800/70 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.max(pct, 1)}%`, background: `linear-gradient(90deg, ${color}, ${color}90)`, boxShadow: `0 0 12px ${color}30`,
            animation: "sa-slideRight 1s ease-out both", animationDelay: `${delay + 0.2}s` }}
        />
      </div>
    </div>
  );
}

// ─── Status config & pill ───
const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-300", dot: "bg-amber-400" },
  processing: { bg: "bg-blue-500/10", text: "text-blue-300", dot: "bg-blue-400" },
  shipped: { bg: "bg-violet-500/10", text: "text-violet-300", dot: "bg-violet-400" },
  delivered: { bg: "bg-emerald-500/10", text: "text-emerald-300", dot: "bg-emerald-400" },
  cancelled: { bg: "bg-red-500/10", text: "text-red-300", dot: "bg-red-400" },
  refunded: { bg: "bg-orange-500/10", text: "text-orange-300", dot: "bg-orange-400" },
  paid: { bg: "bg-green-500/10", text: "text-green-300", dot: "bg-green-400" },
};

function StatusPill({ status }: { status: string }) {
  const cfg = statusConfig[status] || { bg: "bg-slate-700/40", text: "text-slate-300", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} style={{ boxShadow: "0 0 6px currentColor" }} />
      {status}
    </span>
  );
}

// ─── Premium KPI Card ───
function KPICard({ label, value, subValue, growth, icon, gradient, sparkData, delay = 0 }: {
  label: string; value: string; subValue?: string; growth?: number | null;
  icon: React.ReactNode; gradient: string; sparkData?: number[]; delay?: number;
}) {
  return (
    <div className="sa-fadein sa-glass rounded-2xl p-3.5 sm:p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
      style={{ animationDelay: `${delay}s` }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: gradient }} />
      <div className="absolute inset-0 sa-shimmer-bg rounded-2xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 rounded-xl" style={{ background: `${gradient.split(",")[1]?.trim()?.split(" ")[0] || "rgba(255,255,255,0.1)"}15` }}>
            {icon}
          </div>
          <div className="flex items-center gap-1.5">
            {sparkData && sparkData.length > 1 && (
              <Sparkline values={sparkData} color={growth !== undefined && growth !== null && growth >= 0 ? "#10b981" : "#ef4444"} />
            )}
            {growth !== undefined && growth !== null && (
              <span className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                growth >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
              }`}>
                {growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(growth)}%
              </span>
            )}
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-white leading-none tracking-tight"
          style={{ animation: "sa-countUp 0.6s ease-out both", animationDelay: `${delay + 0.15}s` }}>
          {value}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">{label}</div>
        {subValue && <div className="text-[10px] text-slate-500/80 mt-0.5">{subValue}</div>}
      </div>
    </div>
  );
}

// ─── Section (collapsible, glass) ───
function Section({ title, icon, children, defaultOpen = true, badge, accentColor = "rgba(255,255,255,0.1)" }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
  defaultOpen?: boolean; badge?: string | number; accentColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sa-glass-bright rounded-2xl overflow-hidden sa-fadein">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/2 transition-colors">
        <div className="flex items-center gap-2.5 text-sm font-bold text-white">
          <span className="p-1.5 rounded-lg" style={{ background: `${accentColor}20` }}>{icon}</span>
          {title}
          {badge !== undefined && (
            <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full font-medium">{badge}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className="overflow-hidden transition-all duration-400"
        style={{ maxHeight: open ? "2000px" : "0px", opacity: open ? 1 : 0, transition: "max-height 0.4s ease, opacity 0.3s ease" }}>
        <div className="px-4 pb-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

// ─── Animated bar chart ───
function PremiumBarChart({ data, height = 120, barColor = "#10b981" }: { data: Record<string, number>; height?: number; barColor?: string }) {
  const entries = Object.entries(data);
  const values = entries.map(([, v]) => v);
  const max = Math.max(...values, 1);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-end gap-0.75 w-full" style={{ height }}>
        {entries.map(([key, val], i) => {
          const h = (val / max) * 100;
          const isToday = i === entries.length - 1;
          const isHovered = hoverIdx === i;
          return (
            <div key={key} className="flex-1 group relative flex flex-col items-center justify-end h-full"
              onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: "crosshair" }}>
              <div className="w-full rounded-t-[3px] sa-bar-animate relative"
                style={{
                  height: `${Math.max(h, 2)}%`,
                  background: isToday
                    ? `linear-gradient(to top, ${barColor}, ${barColor}dd)`
                    : isHovered ? `linear-gradient(to top, ${barColor}90, ${barColor}60)` : "linear-gradient(to top, rgba(148,163,184,0.25), rgba(148,163,184,0.1))",
                  boxShadow: isToday || isHovered ? `0 0 8px ${barColor}30` : "none",
                  animationDelay: `${i * 0.02}s`,
                  transition: "background 0.2s ease, box-shadow 0.2s ease",
                }}
              />
              {isHovered && (
                <div className="absolute z-30 bg-slate-800/95 border border-slate-600/60 rounded-lg px-2.5 py-1.5 shadow-2xl pointer-events-none backdrop-blur-sm"
                  style={{ bottom: `calc(${Math.max(h, 2)}% + 8px)`, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
                  <div className="text-[10px] text-slate-400">{key.slice(5)}</div>
                  <div className="text-xs text-white font-bold">{fmt(val)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 px-0.5">
        <span className="text-[9px] text-slate-500/70">{entries[0]?.[0]?.slice(5)}</span>
        <span className="text-[9px] text-slate-500/70">{entries[Math.floor(entries.length / 2)]?.[0]?.slice(5)}</span>
        <span className="text-[9px] text-emerald-500/80 font-medium">Today</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN PANEL
// ════════════════════════════════════════════════════════════════════

export default function StoreAnalyticsPanel() {
  useInjectStyles();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<"revenue" | "orders">("revenue");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/store/admin/analytics");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const revenueSparkData = useMemo(() => data ? Object.values(data.charts.revenue_by_day) : [], [data]);
  const ordersSparkData = useMemo(() => data ? Object.values(data.charts.orders_by_day) : [], [data]);

  // ─── Loading skeleton ───
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-slate-800/60 rounded-lg" />
          <div className="h-8 w-24 bg-slate-800/60 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800/40 rounded-2xl border border-slate-700/20" />
          ))}
        </div>
        <div className="h-48 bg-slate-800/40 rounded-2xl border border-slate-700/20" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-40 bg-slate-800/40 rounded-2xl border border-slate-700/20" />
          <div className="h-40 bg-slate-800/40 rounded-2xl border border-slate-700/20" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="p-4 rounded-full bg-red-500/10">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-sm">Failed to load analytics</p>
          <p className="text-red-300/80 text-xs mt-1">{error}</p>
        </div>
        <button onClick={fetchData}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-linear-to-r from-emerald-600 to-blue-600 text-white text-sm rounded-xl font-medium hover:from-emerald-500 hover:to-blue-500 transition-all shadow-lg shadow-emerald-500/20">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { overview: o, orders, charts, products, customers, inventory, promos, events } = data;
  const totalStatusOrders = Object.values(orders.by_status).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex items-center justify-between sa-fadein">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2.5">
            <div className="relative">
              <ShoppingBag className="w-6 h-6 text-emerald-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full" style={{ animation: "sa-pulse-ring 2s ease-out infinite" }} />
            </div>
            Store Analytics
          </h2>
          {lastRefresh && (
            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated {lastRefresh.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 sa-glass rounded-xl text-slate-300 text-xs font-medium hover:bg-white/10 hover:text-white transition-all active:scale-95">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* ═══════ LIVE TICKER ═══════ */}
      <div className="sa-glass rounded-xl px-4 py-2.5 flex items-center gap-4 overflow-x-auto text-xs sa-fadein" style={{ animationDelay: "0.05s" }}>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-semibold">LIVE</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <DollarSign className="w-3 h-3 text-emerald-400" />
          <span>Today: <span className="text-white font-bold">{fmt(o.today_revenue)}</span></span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <ShoppingCart className="w-3 h-3 text-blue-400" />
          <span>Orders: <span className="text-white font-bold">{o.today_orders}</span></span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <Users className="w-3 h-3 text-purple-400" />
          <span>Active carts: <span className="text-white font-bold">{inventory.active_cart_users}</span></span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <Target className="w-3 h-3 text-cyan-400" />
          <span>Conversion: <span className="text-white font-bold">{o.conversion_rate}%</span></span>
        </div>
      </div>

      {/* ═══════ KPI GRID ═══════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <KPICard label="Total Revenue" value={fmt(o.total_revenue)} subValue={`This month: ${fmt(o.current_period_revenue)}`}
          growth={o.revenue_growth} icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          gradient="linear-gradient(135deg, #10b981, #059669)" sparkData={revenueSparkData} delay={0.06} />
        <KPICard label="Total Orders" value={o.total_orders.toLocaleString()} subValue={`Paid: ${o.paid_orders} · Today: ${o.today_orders}`}
          growth={o.orders_growth} icon={<ShoppingCart className="w-5 h-5 text-blue-400" />}
          gradient="linear-gradient(135deg, #3b82f6, #2563eb)" sparkData={ordersSparkData} delay={0.1} />
        <KPICard label="Avg Order Value" value={fmtFull(o.avg_order_value)} subValue="Per paid order"
          icon={<BarChart3 className="w-5 h-5 text-amber-400" />} gradient="linear-gradient(135deg, #f59e0b, #d97706)" delay={0.14} />
        <KPICard label="Customers" value={o.total_customers.toLocaleString()} subValue={`New: ${o.new_customers_this_week} · Repeat: ${o.repeat_rate}%`}
          icon={<Users className="w-5 h-5 text-purple-400" />} gradient="linear-gradient(135deg, #a855f7, #7c3aed)" delay={0.18} />
        <KPICard label="Conversion Rate" value={`${o.conversion_rate}%`} subValue={`Cart→Buy: ${o.cart_to_purchase_rate}%`}
          icon={<Target className="w-5 h-5 text-cyan-400" />} gradient="linear-gradient(135deg, #06b6d4, #0891b2)" delay={0.22} />
        <KPICard label="Fulfillment" value={`${o.fulfillment_rate}%`} subValue={`${o.needs_tracking} need tracking`}
          icon={<Truck className="w-5 h-5 text-orange-400" />} gradient="linear-gradient(135deg, #f97316, #ea580c)" delay={0.26} />
        <KPICard label="Active Carts" value={inventory.active_cart_users.toLocaleString()} subValue={`Value: ${fmt(inventory.active_cart_value)}`}
          icon={<ShoppingBag className="w-5 h-5 text-pink-400" />} gradient="linear-gradient(135deg, #ec4899, #db2777)" delay={0.3} />
        <KPICard label="Wishlist Items" value={inventory.wishlist_total.toLocaleString()} subValue={`Back-in-stock: ${inventory.back_in_stock_subs}`}
          icon={<Heart className="w-5 h-5 text-red-400" />} gradient="linear-gradient(135deg, #ef4444, #dc2626)" delay={0.34} />
      </div>

      {/* ═══════ REVENUE & ORDERS CHART ═══════ */}
      <Section title="Revenue & Orders" icon={<Activity className="w-4 h-4 text-emerald-400" />} accentColor="#10b981">
        <div className="flex items-center gap-1 p-0.5 bg-slate-800/60 rounded-lg w-fit">
          <button onClick={() => setChartMode("revenue")}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              chartMode === "revenue" ? "bg-emerald-500/20 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-white"}`}>
            Revenue
          </button>
          <button onClick={() => setChartMode("orders")}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              chartMode === "orders" ? "bg-blue-500/20 text-blue-400 shadow-sm" : "text-slate-400 hover:text-white"}`}>
            Orders
          </button>
        </div>
        <div className="mt-2">
          {chartMode === "revenue"
            ? <AreaChart data={charts.revenue_by_day} height={130} color="#10b981" gradientId="revGrad" />
            : <AreaChart data={charts.orders_by_day} height={130} color="#3b82f6" gradientId="ordGrad" />}
        </div>
        <div className="mt-4">
          <div className="text-[11px] text-slate-400 font-medium mb-2 flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3" /> Daily Breakdown (30 Days)
          </div>
          <PremiumBarChart data={chartMode === "revenue" ? charts.revenue_by_day : charts.orders_by_day} height={80}
            barColor={chartMode === "revenue" ? "#10b981" : "#3b82f6"} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-slate-800/40 rounded-xl p-2.5 text-center">
            <div className="text-emerald-400 text-sm font-bold">{fmt(o.current_period_revenue)}</div>
            <div className="text-[10px] text-slate-500">This Period</div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-2.5 text-center">
            <div className="text-slate-300 text-sm font-bold">{fmt(o.previous_period_revenue)}</div>
            <div className="text-[10px] text-slate-500">Last Period</div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-2.5 text-center">
            <div className={`text-sm font-bold ${o.revenue_growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {o.revenue_growth >= 0 ? "+" : ""}{o.revenue_growth}%
            </div>
            <div className="text-[10px] text-slate-500">Growth</div>
          </div>
        </div>
      </Section>

      {/* ═══════ ORDER STATUS + DONUT ═══════ */}
      <Section title="Order Pipeline" icon={<Layers className="w-4 h-4 text-blue-400" />} badge={totalStatusOrders} accentColor="#3b82f6">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <DonutChart size={110} strokeWidth={12}
              segments={[
                { value: orders.by_status.pending || 0, color: "#f59e0b", label: "Pending" },
                { value: orders.by_status.processing || 0, color: "#3b82f6", label: "Processing" },
                { value: orders.by_status.shipped || 0, color: "#8b5cf6", label: "Shipped" },
                { value: orders.by_status.delivered || 0, color: "#10b981", label: "Delivered" },
                { value: orders.by_status.cancelled || 0, color: "#ef4444", label: "Cancelled" },
                { value: orders.by_status.refunded || 0, color: "#f97316", label: "Refunded" },
              ]} />
            <div className="text-[10px] text-slate-500 text-center">Order Distribution</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 w-full">
            {Object.entries(orders.by_status).map(([status, count]) => {
              const cfg = statusConfig[status] || { bg: "bg-slate-700/40", text: "text-slate-300", dot: "bg-slate-400" };
              const pct = totalStatusOrders > 0 ? Math.round((count / totalStatusOrders) * 100) : 0;
              return (
                <div key={status} className={`${cfg.bg} rounded-xl p-2.5 border border-transparent hover:border-white/10 transition-all`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`${cfg.text} text-[11px] font-semibold capitalize`}>{status}</span>
                    <span className={`${cfg.text} text-xs font-bold`}>{count}</span>
                  </div>
                  <div className="h-1 bg-slate-800/60 rounded-full overflow-hidden">
                    <div className={`h-full ${cfg.dot} rounded-full`} style={{ width: `${pct}%`, transition: "width 0.8s ease" }} />
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
        {Object.keys(orders.by_carrier).length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/30">
            <h4 className="text-[11px] text-slate-400 mb-2 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Truck className="w-3 h-3" /> Shipping Carriers
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(orders.by_carrier).map(([carrier, count]) => (
                <div key={carrier} className="sa-glass rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs">
                  <Package className="w-3 h-3 text-violet-400" />
                  <span className="font-semibold text-white">{carrier}</span>
                  <span className="text-slate-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ═══════ CONVERSION FUNNEL ═══════ */}
      <Section title="Conversion Funnel" icon={<Target className="w-4 h-4 text-cyan-400" />} accentColor="#06b6d4">
        <div className="space-y-3">
          {[
            { label: "Page Views", value: events.page_views, color: "#3b82f6", icon: <Eye className="w-3.5 h-3.5" /> },
            { label: "Searches", value: events.searches, color: "#8b5cf6", icon: <Search className="w-3.5 h-3.5" /> },
            { label: "Wishlist Adds", value: events.wishlist_adds, color: "#ec4899", icon: <Heart className="w-3.5 h-3.5" /> },
            { label: "Add to Cart", value: events.add_to_cart, color: "#f59e0b", icon: <ShoppingCart className="w-3.5 h-3.5" /> },
            { label: "Purchases", value: events.purchases, color: "#10b981", icon: <CreditCard className="w-3.5 h-3.5" /> },
          ].map((step, i, arr) => {
            const maxVal = arr[0].value || 1;
            const dropoff = i > 0 && arr[i - 1].value > 0
              ? Math.round(((arr[i - 1].value - step.value) / arr[i - 1].value) * 100) : null;
            return <FunnelStep key={step.label} {...step} maxValue={maxVal} dropoff={dropoff} delay={i * 0.08} />;
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3">
            <ProgressRing value={parseFloat(o.conversion_rate)} size={44} color="#06b6d4" />
            <div>
              <div className="text-xs font-bold text-white">{o.conversion_rate}%</div>
              <div className="text-[10px] text-slate-500">View → Purchase</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3">
            <ProgressRing value={parseFloat(o.cart_to_purchase_rate)} size={44} color="#10b981" />
            <div>
              <div className="text-xs font-bold text-white">{o.cart_to_purchase_rate}%</div>
              <div className="text-[10px] text-slate-500">Cart → Purchase</div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════ TOP PRODUCTS ═══════ */}
      <Section title="Product Performance" icon={<Package className="w-4 h-4 text-amber-400" />} badge={products.top_selling.length} accentColor="#f59e0b">
        {products.top_selling.length > 0 ? (
          <div className="space-y-2">
            {products.top_selling.map((p, i) => {
              const maxRev = products.top_selling[0]?.revenue || 1;
              const pct = (p.revenue / maxRev) * 100;
              const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
              return (
                <div key={i} className="relative group rounded-xl overflow-hidden sa-fadein" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="absolute left-0 top-0 bottom-0 rounded-xl transition-all duration-700"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, rgba(16,185,129,0.08), rgba(16,185,129,0.15))" }} />
                  <div className="relative flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm w-7 shrink-0 text-center">
                        {i < 3 ? medals[i] : <span className="text-[11px] text-slate-500 font-mono">#{i + 1}</span>}
                      </span>
                      <div className="min-w-0">
                        <span className="text-white text-sm font-medium truncate block">{p.name}</span>
                        <span className="text-[10px] text-slate-500">{p.quantity} units sold</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-emerald-400 font-bold text-sm">{fmt(p.revenue)}</span>
                      <span className="text-[10px] text-slate-500">{Math.round(pct)}% of top</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">No sales data yet</div>
        )}
        {(products.top_wishlisted.length > 0 || products.top_demanded.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-700/30">
            {products.top_wishlisted.length > 0 && (
              <div>
                <h4 className="text-[11px] text-slate-400 mb-2 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Heart className="w-3 h-3 text-pink-400" /> Most Wishlisted
                </h4>
                <div className="space-y-1">
                  {products.top_wishlisted.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-800/30 rounded-lg px-2.5 py-1.5 hover:bg-slate-800/50 transition-colors">
                      <span className="text-slate-300 truncate">{p.name}</span>
                      <span className="text-pink-400 font-bold shrink-0 ml-2 flex items-center gap-1">
                        <Heart className="w-2.5 h-2.5" /> {p.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {products.top_demanded.length > 0 && (
              <div>
                <h4 className="text-[11px] text-slate-400 mb-2 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-orange-400" /> High Demand (Back-in-Stock)
                </h4>
                <div className="space-y-1">
                  {products.top_demanded.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-800/30 rounded-lg px-2.5 py-1.5 hover:bg-slate-800/50 transition-colors">
                      <span className="text-slate-300 truncate">{p.name}</span>
                      <span className="text-orange-400 font-bold shrink-0 ml-2 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> {p.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ═══════ TOP CUSTOMERS ═══════ */}
      <Section title="Top Customers" icon={<Award className="w-4 h-4 text-purple-400" />} badge={customers.top_spenders.length} accentColor="#a855f7">
        {customers.top_spenders.length > 0 ? (
          <div className="space-y-2">
            {customers.top_spenders.map((c, i) => {
              const maxSpend = customers.top_spenders[0]?.total || 1;
              const pct = (c.total / maxSpend) * 100;
              const colors = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899"];
              return (
                <div key={i} className="relative rounded-xl overflow-hidden sa-fadein" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="absolute left-0 top-0 bottom-0 rounded-xl"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors[i % 5]}08, ${colors[i % 5]}14)` }} />
                  <div className="relative flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: `${colors[i % 5]}20`, color: colors[i % 5] }}>
                        {(c.name || c.email)?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white text-sm font-medium truncate">{c.name || "\u2014"}</div>
                        <div className="text-[10px] text-slate-500 truncate">{c.email}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-emerald-400 font-bold text-sm">{fmt(c.total)}</span>
                      <span className="text-[10px] text-slate-500">{c.orders} orders</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">No customer data yet</div>
        )}
      </Section>

      {/* ═══════ GEOGRAPHY ═══════ */}
      <Section title="Shipping Regions" icon={<Globe className="w-4 h-4 text-blue-400" />} badge={customers.top_countries.length} defaultOpen={false} accentColor="#3b82f6">
        {customers.top_countries.length > 0 ? (
          <div className="space-y-2">
            {customers.top_countries.map((c, i) => {
              const maxC = customers.top_countries[0]?.count || 1;
              const pct = (c.count / maxC) * 100;
              return (
                <div key={i} className="relative rounded-xl overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 rounded-xl" style={{ width: `${pct}%`, background: "linear-gradient(90deg, rgba(59,130,246,0.06), rgba(59,130,246,0.12))" }} />
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2.5 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-white font-medium">{c.country}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-1.5 w-16 sm:w-24 bg-slate-800/60 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-blue-300 font-bold text-xs tabular-nums w-12 text-right">{c.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">No shipping data yet</div>
        )}
      </Section>

      {/* ═══════ GIFT CARDS & PROMOS ═══════ */}
      <Section title="Gift Cards & Discounts" icon={<Gift className="w-4 h-4 text-pink-400" />} defaultOpen={false} accentColor="#ec4899">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Gift Cards Issued", value: promos.gift_cards_issued.toString(), icon: <Gift className="w-4 h-4" />, color: "from-pink-500/20 to-pink-500/5", textColor: "text-pink-300" },
            { label: "Total GC Value", value: fmt(promos.gift_card_total_value), icon: <DollarSign className="w-4 h-4" />, color: "from-emerald-500/20 to-emerald-500/5", textColor: "text-emerald-300" },
            { label: "GC Remaining", value: fmt(promos.gift_card_remaining_balance), icon: <CreditCard className="w-4 h-4" />, color: "from-amber-500/20 to-amber-500/5", textColor: "text-amber-300" },
            { label: "Active Gift Cards", value: promos.active_gift_cards.toString(), icon: <Star className="w-4 h-4" />, color: "from-violet-500/20 to-violet-500/5", textColor: "text-violet-300" },
            { label: "Discount Codes", value: promos.discount_codes_total.toString(), icon: <Tag className="w-4 h-4" />, color: "from-blue-500/20 to-blue-500/5", textColor: "text-blue-300" },
            { label: "Active Discounts", value: promos.discount_codes_active.toString(), icon: <Percent className="w-4 h-4" />, color: "from-green-500/20 to-green-500/5", textColor: "text-green-300" },
          ].map((item, i) => (
            <div key={i} className={`bg-linear-to-br ${item.color} rounded-xl p-3 border border-white/5 hover:border-white/10 transition-all`}>
              <div className={`${item.textColor} mb-1.5`}>{item.icon}</div>
              <div className={`text-lg font-bold ${item.textColor}`}>{item.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════ RECENT ORDERS TABLE ═══════ */}
      <Section title="Recent Orders" icon={<ShoppingCart className="w-4 h-4 text-emerald-400" />} badge={orders.recent.length} accentColor="#10b981">
        {orders.recent.length > 0 ? (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs min-w-160">
              <thead>
                <tr className="border-b border-slate-700/40">
                  {["Order", "Customer", "Items", "Total", "Status", "Tracking", "Date"].map(h => (
                    <th key={h} className="pb-2.5 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.recent.map((order, i) => (
                  <tr key={i} className="border-b border-slate-800/30 hover:bg-white/2 transition-colors sa-fadein"
                    style={{ animationDelay: `${i * 0.04}s` }}>
                    <td className="py-2.5 pr-3">
                      <span className="font-mono text-white bg-slate-800/60 px-1.5 py-0.5 rounded text-[10px]">
                        {order.order_number?.slice(0, 10) || "\u2014"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700/60 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                          {(order.customer_name || order.email)?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white truncate max-w-25 text-[11px]">{order.customer_name || "\u2014"}</div>
                          <div className="text-[9px] text-slate-500 truncate max-w-25">{order.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300 tabular-nums">{order.items_count}</td>
                    <td className="py-2.5 pr-3 text-emerald-400 font-bold tabular-nums">{fmtFull(order.total)}</td>
                    <td className="py-2.5 pr-3"><StatusPill status={order.status} /></td>
                    <td className="py-2.5 pr-3">
                      {order.tracking_number ? (
                        <div>
                          <div className="text-white font-mono text-[10px]">{order.tracking_number.slice(0, 14)}</div>
                          {order.carrier && <div className="text-[9px] text-slate-500">{order.carrier}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px]">{"\u2014"}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">No orders yet</div>
        )}
      </Section>

      {/* ═══════ FOOTER ═══════ */}
      <div className="text-center text-[10px] text-slate-600 py-2 sa-fadein">
        Bullmoney Store Analytics
      </div>
    </div>
  );
}
