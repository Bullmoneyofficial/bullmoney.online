"use client";

import { useState, useEffect, useCallback, memo, useRef, useMemo } from "react";
import { useUnifiedPerformance } from "@/hooks/useDesktopPerformance";

// ============================================================================
// BULLMONEY COMMUNITY — Live Telegram Hub
// Displays ALL Telegram group messages with pill-tab navigation,
// breaking-news urgency, RGB blue neon signal-provider style
// ============================================================================

interface TelegramPost {
  id: string;
  text: string;
  date: string;
  views?: string;
  hasMedia: boolean;
  channel: string;
  channelName: string;
}

// Navbar logo used as group display picture
const GROUP_LOGO = "/ONcc2l601.svg";

// Color scheme: BLUE = free groups, RED = news/shop, PURPLE = VIP
const COLORS = {
  blue:   { primary: "#3b82f6", light: "#60a5fa", rgb: "59,130,246",  gradient: "linear-gradient(135deg, #2563eb, #3b82f6)" },
  red:    { primary: "#ef4444", light: "#f87171", rgb: "239,68,68",   gradient: "linear-gradient(135deg, #dc2626, #ef4444)" },
  purple: { primary: "#a855f7", light: "#c084fc", rgb: "168,85,247",  gradient: "linear-gradient(135deg, #9333ea, #a855f7)" },
} as const;

// All channels including Bullmoneyshop
const COMMUNITY_CHANNELS = [
  { key: "all",    label: "ALL",          username: "",                  handle: "",                  isPrivate: false, scheme: "blue"   as const },
  { key: "trades", label: "FREE TRADES",  username: "bullmoneywebsite",   handle: "@bullmoneywebsite", isPrivate: false, scheme: "blue"   as const },
  { key: "shop",   label: "NEWS & SHOP",  username: "Bullmoneyshop",     handle: "@Bullmoneyshop",    isPrivate: false, scheme: "red"    as const },
  { key: "main",   label: "LIVESTREAMS",  username: "bullmoneyfx",       handle: "@bullmoneyfx",      isPrivate: false, scheme: "blue"   as const },
  { key: "vip",    label: "VIP TRADES",   username: "+yW5jIfxJpv9hNmY0", handle: "VIP Group",         isPrivate: true,  scheme: "purple" as const },
  { key: "vip2",   label: "VIP ALERTS",   username: "+uvegzpHfYdU2ZTZk", handle: "VIP Alerts",        isPrivate: true,  scheme: "purple" as const },
] as const;

type ChannelKey = typeof COMMUNITY_CHANNELS[number]["key"];
type ColorScheme = typeof COMMUNITY_CHANNELS[number]["scheme"];

function getColor(scheme: ColorScheme) { return COLORS[scheme] || COLORS.blue; }

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BullMoneyCommunity() {
  const [activeTab, setActiveTab] = useState<ChannelKey>("all");
  const [posts, setPosts] = useState<Record<string, TelegramPost[]>>({});
  const [loading, setLoading] = useState(true);
  const [newFlash, setNewFlash] = useState<TelegramPost | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const userScrollingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCountRef = useRef(0);
  
  // Performance detection
  const { isMobile, isTablet, shouldSkipHeavyEffects, performanceTier } = useUnifiedPerformance();
  const isMobileDevice = isMobile || isTablet;
  
  // Mobile-optimized settings
  const scrollSpeed = isMobileDevice ? 0.5 : 0.8;
  const fetchInterval = isMobileDevice ? 12000 : 8000; // Reduce polling for better perf
  const duplicateCount = isMobileDevice ? 2 : 3; // Less duplication on mobile
  const lastFetchRef = useRef(0);

  // Check VIP status from localStorage
  useEffect(() => {
    try {
      const session = localStorage.getItem("bullmoney_session");
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.is_vip) setIsVip(true);
      }
    } catch {}
  }, []);

  // Fetch all channel messages
  const fetchAll = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    const now = Date.now();
    if (now - lastFetchRef.current < fetchInterval - 1000) return;
    lastFetchRef.current = now;
    const channelKeys = ["trades", "shop", "main"];
    // Add VIP channels if user is VIP
    if (isVip) {
      channelKeys.push("vip");
    }

    try {
      const results = await Promise.allSettled(
        channelKeys.map(async (key) => {
          const res = await fetch(`/api/telegram/channel?channel=${key}&t=${Date.now()}`, { cache: "no-store" });
          if (!res.ok) return { key, posts: [] };
          const data = await res.json();
          return { key, posts: (data.posts || []) as TelegramPost[] };
        })
      );

      const newPosts: Record<string, TelegramPost[]> = {};
      let totalNew = 0;

      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value) {
          const { key, posts: channelPosts } = r.value;
          newPosts[key] = channelPosts;
          totalNew += channelPosts.length;
        }
      });

      setPosts(newPosts);

      // Flash newest message if count changed
      if (prevCountRef.current > 0 && totalNew > prevCountRef.current) {
        const allMsgs = Object.values(newPosts).flat();
        if (allMsgs.length > 0) {
          const newest = allMsgs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          setNewFlash(newest);
          setTimeout(() => setNewFlash(null), 5000);
        }
      }
      prevCountRef.current = totalNew;
    } catch {}
    setLoading(false);
  }, [isVip]);

  // Visibility observer for performance
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Only fetch if visible
    if (!isVisible) return;
    
    fetchAll();
    const id = setInterval(fetchAll, fetchInterval);
    return () => clearInterval(id);
  }, [fetchAll, isVisible, fetchInterval]);

  // Get filtered posts based on active tab
  const displayPosts = useMemo(() => {
    if (activeTab === "all") {
      return Object.values(posts)
        .flat()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return (posts[activeTab] || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeTab, posts]);

  // Auto-scroll (pauses when not visible)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || displayPosts.length === 0 || !isVisible) return;

    const tick = () => {
      if (!userScrollingRef.current && el && isVisible) {
        el.scrollLeft += scrollSpeed;
        const section = el.scrollWidth / duplicateCount;
        if (el.scrollLeft >= section * (duplicateCount - 1)) el.scrollLeft -= section;
        if (el.scrollLeft <= 0) el.scrollLeft += section;
      }
      autoScrollRef.current = requestAnimationFrame(tick);
    };
    autoScrollRef.current = requestAnimationFrame(tick);

    return () => {
      if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
    };
  }, [displayPosts, isVisible, scrollSpeed, duplicateCount]);

  const pauseAuto = useCallback(() => {
    userScrollingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      userScrollingRef.current = false;
    }, 3000);
  }, []);

  const onUserScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const section = el.scrollWidth / duplicateCount;
    if (el.scrollLeft >= section * (duplicateCount - 1)) el.scrollLeft -= section;
    if (el.scrollLeft <= 0) el.scrollLeft += section;
  }, [duplicateCount]);

  const totalMessages = Object.values(posts).flat().length;
  const channelsActive = Object.keys(posts).filter(k => (posts[k]?.length || 0) > 0).length;

  // Accessible tabs
  const visibleChannels = COMMUNITY_CHANNELS.filter(ch => {
    if (ch.key === "all") return true;
    if (ch.isPrivate && !isVip) return false;
    return true;
  });

  if (!loading && totalMessages === 0) return null;

  const panelMinHeight = isMobileDevice ? 320 : 'calc(100vh - 220px)';
  const messageRowHeight = isMobileDevice ? 160 : 260;

  return (
    <div ref={containerRef} className="w-full" style={{ background: "#000", minHeight: panelMinHeight }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .bmc-glow{box-shadow:0 0 20px rgba(59,130,246,.15),0 0 60px rgba(59,130,246,.05),inset 0 1px 0 rgba(59,130,246,.1)}
        .bmc-border{border:1px solid rgba(59,130,246,.2)}
        .bmc-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        .bmc-scroll::-webkit-scrollbar{display:none}
        .bmc-row{display:flex;gap:12px;width:max-content;padding:0 12px}
        .bmc-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        .bmc-tabs::-webkit-scrollbar{display:none}
        .bmc-card{flex-shrink:0;width:340px;display:flex;gap:10px;padding:12px;
          border-radius:10px;border:1px solid rgba(59,130,246,.15);background:rgba(9,9,11,.9);
          text-decoration:none;color:inherit;transition:all .2s ease;position:relative;overflow:hidden}
        .bmc-card:hover{background:rgba(59,130,246,.08);border-color:rgba(59,130,246,.35);
          box-shadow:0 0 20px rgba(59,130,246,.1)}
        .bmc-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,rgba(59,130,246,.4),transparent);opacity:0;
          transition:opacity .2s}
        .bmc-card:hover::before{opacity:1}
        .bmc-avatar{flex-shrink:0;width:42px;height:42px;border-radius:50%;display:flex;
          align-items:center;justify-content:center;position:relative;overflow:hidden;padding:6px}
        .bmc-avatar img{width:100%;height:100%;object-fit:contain;filter:brightness(1.1)}
        .bmc-avatar::after{content:'';position:absolute;inset:-2px;border-radius:50%;
          border:1.5px solid var(--ch-ring,rgba(59,130,246,.3));animation:bmc-pulse 3s ease infinite}
        .bmc-flash{animation:bmc-flashIn .5s ease}
        .bmc-new-dot{position:absolute;top:-1px;right:-1px;width:8px;height:8px;background:#3b82f6;
          border-radius:50%;border:1.5px solid #000;animation:bmc-pulse 1.5s ease infinite}
        @keyframes bmc-pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes bmc-flashIn{0%{opacity:0;transform:translateY(-8px) scale(.95)}100%{opacity:1;transform:none}}
        .bmc-pill{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;
          border-radius:9999px;font-size:11px;font-weight:600;letter-spacing:.04em;
          text-transform:uppercase;cursor:pointer;border:1px solid transparent;
          transition:all .2s ease;white-space:nowrap;user-select:none;position:relative}
        .bmc-pill:hover{transform:translateY(-1px)}
        .bmc-pill.active{color:#fff;border-color:rgba(var(--pill-rgb),.5);
          background:rgba(var(--pill-rgb),1);
          box-shadow:0 0 16px rgba(var(--pill-rgb),.3),0 0 40px rgba(var(--pill-rgb),.1)}
        .bmc-pill.inactive{background:rgba(var(--pill-rgb),.08);color:rgba(var(--pill-rgb),.7);
          border-color:rgba(var(--pill-rgb),.15)}
        .bmc-pill.inactive:hover{background:rgba(var(--pill-rgb),.15);color:rgba(var(--pill-rgb),.9);
          border-color:rgba(var(--pill-rgb),.3);box-shadow:0 0 12px rgba(var(--pill-rgb),.1)}
        .bmc-pill .bmc-count{font-size:9px;background:rgba(255,255,255,.15);padding:1px 5px;
          border-radius:8px;font-weight:700}
        .bmc-pill.inactive .bmc-count{background:rgba(59,130,246,.15)}
        .bmc-alert{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;
          max-width:420px;width:calc(100% - 32px);padding:12px 16px;border-radius:12px;
          background:rgba(0,0,0,.95);border:1px solid rgba(59,130,246,.4);
          box-shadow:0 0 30px rgba(59,130,246,.2),0 8px 32px rgba(0,0,0,.6);
          animation:bmc-alertSlide .4s ease;backdrop-filter:blur(20px)}
        @keyframes bmc-alertSlide{0%{opacity:0;transform:translateX(-50%) translateY(-20px)}100%{opacity:1;transform:translateX(-50%) translateY(0)}}
      `}} />

      {/* ── HEADER ── */}
      <div className="px-4 pt-4 pb-2">
        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inset-0 rounded-full bg-blue-500 opacity-75" />
              <span className="relative rounded-full h-2.5 w-2.5 bg-blue-600" />
            </div>
            <span className="text-[11px] font-bold text-blue-400 tracking-[.15em] uppercase">LIVE</span>
            <span className="h-4 w-px bg-zinc-700/60" />
            <h2 className="text-sm font-bold tracking-wide uppercase" style={{ color: "#3b82f6", textShadow: "0 0 12px rgba(59,130,246,.4)" }}>
              BULLMONEY COMMUNITY
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {channelsActive > 0 && (
              <span className="px-2 py-0.5 text-[9px] font-bold rounded-full" style={{ background: "rgba(59,130,246,.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,.2)" }}>
                {channelsActive} GROUPS LIVE
              </span>
            )}
            <span className="text-[10px] text-zinc-600">{totalMessages} updates</span>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-[10px] text-zinc-500 leading-relaxed mb-3 max-w-2xl" style={{ letterSpacing: ".02em" }}>
          See all our community updates — trades, news, info &amp; chats — all here on our website without needing the Telegram app
        </p>

        {/* ── PILL TABS ── */}
        <div className="bmc-tabs flex items-center gap-2 pb-1">
          {visibleChannels.map((ch) => {
            const count = ch.key === "all" ? totalMessages : (posts[ch.key]?.length || 0);
            const isActive = activeTab === ch.key;
            const c = getColor(ch.scheme);
            return (
              <button
                key={ch.key}
                onClick={() => setActiveTab(ch.key)}
                className={`bmc-pill ${isActive ? "active" : "inactive"}`}
                style={{ "--pill-rgb": c.rgb } as React.CSSProperties}
              >
                <img src={GROUP_LOGO} alt="" className="w-4 h-4 object-contain" />
                <span>{ch.label}</span>
                {count > 0 && <span className="bmc-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,.3), transparent)" }} />

      {/* ── LOADING STATE ── */}
      {loading && (
        <div className="flex items-center justify-center h-40 gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-400 text-xs">Connecting to Telegram groups...</span>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && displayPosts.length === 0 && (
        <div className="flex items-center justify-center h-40 text-zinc-500 text-xs">
          No messages in this channel yet — check back soon
        </div>
      )}

      {/* ── SCROLLABLE MESSAGE CARDS ── */}
      {displayPosts.length > 0 && (
        <div style={{ position: "relative", height: messageRowHeight, padding: "10px 0 6px" }}>
          <div
            ref={scrollRef}
            className="bmc-scroll"
            style={{ height: "100%", paddingLeft: 0, paddingRight: 0 }}
            onScroll={onUserScroll}
            onMouseDown={pauseAuto}
            onTouchStart={pauseAuto}
            onWheel={pauseAuto}
          >
            <div className="bmc-row">
              {/* Duplicate for infinite scroll */}
              {Array.from({ length: duplicateCount }).map(set =>
                displayPosts.map((post) => (
                  <MessageCard key={`${set}-${post.id}-${post.channel}`} post={post} />
                ))
              )}
            </div>
          </div>
          {/* Gradient fades */}
          <div className="absolute top-0 left-0 bottom-0 w-10 bg-linear-to-r from-black to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 right-0 bottom-0 w-10 bg-linear-to-l from-black to-transparent pointer-events-none z-10" />
        </div>
      )}

      {/* ── BOTTOM BAR ── */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          {COMMUNITY_CHANNELS.filter(c => c.key !== "all" && !c.isPrivate).map(ch => {
            const c = getColor(ch.scheme);
            return (
              <a
                key={ch.key}
                href={`https://t.me/${ch.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[9px] text-zinc-500 transition-colors"
                style={{ ['--hover' as string]: c.light }}
                onMouseEnter={e => (e.currentTarget.style.color = c.light)}
                onMouseLeave={e => (e.currentTarget.style.color = '')}
              >
                <img src={GROUP_LOGO} alt="" className="w-3 h-3 object-contain" />
                <span className="hidden sm:inline">{ch.handle}</span>
              </a>
            );
          })}
        </div>
        {!isVip && (
          <a
            href="/VIP"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide transition-all hover:scale-105"
            style={{ background: "rgba(168,85,247,.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,.25)" }}
          >
            Unlock VIP Channels
          </a>
        )}
      </div>

      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,.2), transparent)" }} />
    </div>
  );
}

// ============================================================================
// MESSAGE CARD — Telegram-style message bubble with group avatar
// ============================================================================
const MessageCard = memo(function MessageCard({ post }: { post: TelegramPost }) {
  // Find channel info
  const channelInfo = COMMUNITY_CHANNELS.find(c => 
    c.username === post.channel || c.key === post.channel
  );
  const channelKey = channelInfo?.key || "trades";
  const channelLabel = channelInfo?.label || post.channelName || "Community";
  const scheme = channelInfo?.scheme || "blue";
  const c = getColor(scheme);

  const isRecent = Date.now() - new Date(post.date).getTime() < 300000; // 5 min
  const timeAgo = getTimeAgo(post.date);

  return (
    <a
      href={channelInfo?.isPrivate ? undefined : `https://t.me/${post.channel}/${post.id}`}
      target={channelInfo?.isPrivate ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="bmc-card"
      style={{
        borderColor: isRecent ? `rgba(${c.rgb},.35)` : undefined,
        ["--ch-ring" as string]: `rgba(${c.rgb},.3)`,
      }}
    >
      {/* Group Avatar — Logo */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div
          className="bmc-avatar"
          style={{ background: c.gradient, ["--ch-ring" as string]: `rgba(${c.rgb},.4)` }}
        >
          <img src={GROUP_LOGO} alt={channelLabel} />
          {isRecent && <span className="bmc-new-dot" style={{ background: c.primary }} />}
        </div>
        <span className="text-[7px] uppercase tracking-wider text-center leading-tight w-11 truncate" style={{ color: `rgba(${c.rgb},.5)` }}>
          {channelKey}
        </span>
      </div>

      {/* Message Content */}
      <div className="flex flex-col justify-between min-w-0 flex-1 py-px">
        {/* Header: channel name + time */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold truncate" style={{ color: c.primary }}>
              {channelLabel}
            </span>
            {isRecent && (
              <span className="px-1.5 py-px text-[7px] font-black uppercase rounded-sm animate-pulse" style={{ background: `rgba(${c.rgb},.2)`, color: c.light }}>
                NEW
              </span>
            )}
          </div>
          <span className="text-[9px] shrink-0" style={{ color: isRecent ? c.light : "#52525b" }}>
            {timeAgo}
          </span>
        </div>

        {/* Message text — emojis & full text preserved */}
        <p className="text-[11px] leading-3.75 text-white/85 line-clamp-3 whitespace-pre-wrap wrap-break-word" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          {post.text}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-2">
            {post.hasMedia && (
              <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: `rgba(${c.rgb},.1)`, color: `rgba(${c.rgb},.7)` }}>
                Media
              </span>
            )}
            {post.views && (
              <span className="text-[8px] text-zinc-600">{post.views} views</span>
            )}
          </div>
          <span className="text-[8px]" style={{ color: `rgba(${c.rgb},.4)` }}>
            View →
          </span>
        </div>
      </div>
    </a>
  );
});
