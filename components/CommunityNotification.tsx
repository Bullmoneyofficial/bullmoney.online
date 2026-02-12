"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import { SoundEffects } from "@/app/hooks/useSoundEffects";

// ============================================================================
// COMMUNITY NOTIFICATION — Global Telegram New-Message Overlay
// Matches CookieConsentDesktop — bottom-right popup, same card style.
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

// Poll ALL channels for ALL users (VIP messages just won't return data for non-VIP)
const POLL_CHANNELS = ["trades", "shop", "main", "vip"];
const POLL_INTERVAL = 1000; // 1s — near-instant

const CHANNEL_META: Record<string, { label: string }> = {
  trades: { label: "FREE TRADES" },
  shop:   { label: "NEWS & SHOP" },
  main:   { label: "LIVESTREAMS" },
  vip:    { label: "VIP TRADES" },
  vip2:   { label: "VIP ALERTS" },
};


// ── Notification chime: using centralized SoundEffects system ──
function playNotificationSound() {
  SoundEffects.telegram();
}

// ── Deduplicate key for a post ──
function postKey(p: TelegramPost) {
  return `${p.channel}::${p.id}`;
}

// ============================================================================
// EXPORTED COMPONENT — mount once in layout, works globally
// ============================================================================

export default function CommunityNotification() {
  const [notification, setNotification] = useState<TelegramPost | null>(null);
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [skippedPosts, setSkippedPosts] = useState<TelegramPost[]>([]);
  const [shaking, setShaking] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const queueRef = useRef<TelegramPost[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // Portal target
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Ctrl+T test shortcut — simulates queue (press multiple times)
  const testCountRef = useRef(0);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "t") {
        e.preventDefault();
        testCountRef.current++;
        const n = testCountRef.current;
        const channels = ["trades", "shop", "main", "vip"];
        const ch = channels[n % channels.length];
        const labels = { trades: "FREE TRADES", shop: "NEWS & SHOP", main: "LIVESTREAMS", vip: "VIP TRADES" };
        const fake: TelegramPost = {
          id: `test-${Date.now()}-${n}`,
          text: `Test notification #${n}. Press Ctrl+T again to add more to the queue.`,
          date: new Date().toISOString(),
          hasMedia: n % 3 === 0,
          channel: ch,
          channelName: labels[ch as keyof typeof labels] || "TEST",
        };

        // If minimized, add to skipped pile
        if (minimized) {
          setSkippedPosts(prev => [fake, ...prev]);
          return;
        }

        // If already showing a notification, queue it
        if (notification) {
          queueRef.current.push(fake);
        } else {
          setNotification(fake);
          setVisible(true);
          playNotificationSound();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [notification, minimized]);

  // Dismiss handler — show next in queue
  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift()!;
        setNotification(next);
        setVisible(true);
        playNotificationSound();
      } else {
        setNotification(null);
      }
    }, 350);
  }, []);

  // Dismiss all — clear queue and close
  const dismissAll = useCallback(() => {
    queueRef.current = [];
    setVisible(false);
    setTimeout(() => setNotification(null), 350);
  }, []);

  // Read later — push current to bell pill, show next or close
  const readLater = useCallback(() => {
    if (notification) {
      setSkippedPosts(prev => [...prev, notification]);
    }
    setVisible(false);
    setTimeout(() => {
      if (queueRef.current.length > 0) {
        const next = queueRef.current.shift()!;
        setNotification(next);
        setVisible(true);
      } else {
        setNotification(null);
        setMinimized(true);
      }
    }, 350);
  }, [notification]);

  // Minimize — skip all to pill
  const minimize = useCallback(() => {
    const all = notification ? [notification, ...queueRef.current] : [...queueRef.current];
    queueRef.current = [];
    setVisible(false);
    setTimeout(() => {
      setNotification(null);
      setSkippedPosts(all);
      setMinimized(true);
    }, 350);
  }, [notification]);

  // Toggle list preview
  const toggleList = useCallback(() => {
    setListExpanded(prev => !prev);
  }, []);

  // Open a specific message from the list
  const openFromList = useCallback((index: number) => {
    if (skippedPosts.length === 0) return;
    const chosen = skippedPosts[index];
    const rest = skippedPosts.filter((_, i) => i !== index);
    queueRef.current = rest;
    setSkippedPosts([]);
    setListExpanded(false);
    setMinimized(false);
    setNotification(chosen);
    setVisible(true);
    playNotificationSound();
  }, [skippedPosts]);

  // Restore from pill — show first skipped
  const restore = useCallback(() => {
    if (skippedPosts.length === 0) return;
    const [first, ...rest] = skippedPosts;
    queueRef.current = rest;
    setSkippedPosts([]);
    setListExpanded(false);
    setMinimized(false);
    setNotification(first);
    setVisible(true);
    playNotificationSound();
  }, [skippedPosts]);

  // ── Shake bell every 30s if unread notifications ──
  useEffect(() => {
    if (!minimized || skippedPosts.length === 0) return;
    // Shake immediately when minimized
    setShaking(true);
    const stopInitial = setTimeout(() => setShaking(false), 820);
    const interval = setInterval(() => {
      setShaking(true);
      setTimeout(() => setShaking(false), 820);
    }, 30000);
    return () => { clearTimeout(stopInitial); clearInterval(interval); };
  }, [minimized, skippedPosts.length]);

  // Click outside list to collapse
  useEffect(() => {
    if (!listExpanded) return;
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setListExpanded(false);
      }
    };
    const t = setTimeout(() => window.addEventListener('mousedown', handler), 100);
    return () => { clearTimeout(t); window.removeEventListener('mousedown', handler); };
  }, [listExpanded]);

  // Esc key — minimize
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") minimize(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, minimize]);

  // Click outside — minimize to pill
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        minimize();
      }
    };
    // Use timeout so the click that opened it doesn't immediately close
    const t = setTimeout(() => window.addEventListener("mousedown", handler), 100);
    return () => { clearTimeout(t); window.removeEventListener("mousedown", handler); };
  }, [visible, minimize]);

  // ── Polling — fetch ALL channels for every user ──
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const results = await Promise.allSettled(
          POLL_CHANNELS.map(async (key) => {
            const res = await fetch(`/api/telegram/channel?channel=${key}&t=${Date.now()}`, { cache: "no-store" });
            if (!res.ok) return [];
            const data = await res.json();
            return ((data.posts || []) as TelegramPost[]).map(p => ({ ...p, _key: key }));
          })
        );

        if (!active) return;

        const allPosts: TelegramPost[] = [];
        results.forEach(r => {
          if (r.status === "fulfilled") allPosts.push(...(r.value as TelegramPost[]));
        });

        // On first load, just seed the seen set — no notifications
        if (initialLoadRef.current) {
          allPosts.forEach(p => seenIdsRef.current.add(postKey(p)));
          initialLoadRef.current = false;
          return;
        }

        // Find new posts we haven't seen
        const fresh: TelegramPost[] = [];
        allPosts.forEach(p => {
          const k = postKey(p);
          if (!seenIdsRef.current.has(k)) {
            seenIdsRef.current.add(k);
            fresh.push(p);
          }
        });

        // Cap seen set at 500 to avoid memory leak
        if (seenIdsRef.current.size > 500) {
          const arr = Array.from(seenIdsRef.current);
          seenIdsRef.current = new Set(arr.slice(arr.length - 300));
        }

        if (fresh.length === 0) return;

        // Sort newest first
        fresh.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // If minimized, add to skipped pile (update pill count)
        if (minimized) {
          setSkippedPosts(prev => [...fresh, ...prev]);
          return;
        }

        // If no notification showing, show the newest; queue the rest
        if (!notification) {
          const [first, ...rest] = fresh;
          queueRef.current.push(...rest);
          setNotification(first);
          setVisible(true);
          playNotificationSound();
        } else {
          // Queue all
          queueRef.current.push(...fresh);
        }
      } catch { /* silent */ }
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => { active = false; clearInterval(id); };
   
  }, []);

  if (!portalTarget) return null;

  // ── Minimized pill on right side + toast ──
  const pillTop = typeof window !== 'undefined' && window.innerWidth >= 768 ? 223 : 203;
  const latestSkipped = skippedPosts[0];
  const previewText = latestSkipped?.text
    ? latestSkipped.text.length > 60 ? latestSkipped.text.slice(0, 60) + '…' : latestSkipped.text
    : '';

  if (minimized && skippedPosts.length > 0) {
    return createPortal(
      <div ref={listRef} style={{ position: 'fixed', right: 16, top: pillTop, zIndex: 2147483647, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes cn-pillIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
          @keyframes cn-pillPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}50%{box-shadow:0 0 0 4px rgba(255,255,255,0.08)}}
          @keyframes cn-shake{0%,100%{transform:rotate(0)}10%{transform:rotate(14deg)}20%{transform:rotate(-12deg)}30%{transform:rotate(10deg)}40%{transform:rotate(-8deg)}50%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}70%{transform:rotate(2deg)}80%{transform:rotate(0)}}
          @keyframes cn-toastIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
          @keyframes cn-listIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        `}} />

        {/* Bell pill */}
        <button
          onClick={() => { SoundEffects.click(); toggleList(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px 10px 14px',
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            cursor: 'pointer',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            transition: 'background 0.15s ease, padding-right 0.15s ease',
            animation: 'cn-pillIn .4s cubic-bezier(.22,1,.36,1) forwards',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#111'; e.currentTarget.style.paddingRight = '20px'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0a0a0a'; e.currentTarget.style.paddingRight = '16px'; }}
          aria-label={`${skippedPosts.length} notifications waiting`}
        >
          <span style={{ display: 'inline-flex', animation: shaking ? 'cn-shake .8s ease' : 'none', transformOrigin: 'top center' }}>
            <Bell size={14} color="#fff" strokeWidth={2} />
          </span>
          <span>{skippedPosts.length}</span>
        </button>

        {/* Expanded list view */}
        {listExpanded ? (
          <div
            style={{
              width: 300,
              maxHeight: 380,
              overflowY: 'auto',
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              animation: 'cn-listIn .35s cubic-bezier(.22,1,.36,1) forwards',
            }}
          >
            {/* List header */}
            <div style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                Notifications ({skippedPosts.length})
              </span>
              <button
                onClick={() => { SoundEffects.close(); setSkippedPosts([]); setListExpanded(false); setMinimized(false); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  padding: '2px 4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                Clear all
              </button>
            </div>

            {/* Message items */}
            {skippedPosts.map((post, i) => {
              const label = (CHANNEL_META[post.channel] || CHANNEL_META.trades).label;
              const preview = post.text
                ? post.text.length > 80 ? post.text.slice(0, 80) + '…' : post.text
                : 'Media message';
              return (
                <button
                  key={postKey(post)}
                  onClick={() => { SoundEffects.click(); openFromList(i); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: i < skippedPosts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                      {formatTime(post.date)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12,
                    lineHeight: '17px',
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {preview}
                  </p>
                  {post.hasMedia && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3, display: 'inline-block' }}>
                      📎 Media
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Toast below bell — collapsed preview */
          <div
            onClick={() => { SoundEffects.click(); toggleList(); }}
            style={{
              maxWidth: 220,
              padding: '10px 14px',
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              animation: 'cn-toastIn .5s cubic-bezier(.22,1,.36,1) forwards',
            }}
          >
            {previewText && (
              <p style={{
                fontSize: 11,
                lineHeight: '16px',
                color: 'rgba(255,255,255,0.55)',
                margin: '0 0 6px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}>
                {previewText}
              </p>
            )}
            <p style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.35)',
              margin: 0,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}>
              Check your notifications
            </p>
          </div>
        )}
      </div>,
      portalTarget
    );
  }

  if (!notification) return null;

  const meta = CHANNEL_META[notification.channel] || CHANNEL_META.trades;
  const channelLabel = notification.channelName || meta.label;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: visible ? 'cn-slideIn .4s cubic-bezier(.22,1,.36,1) forwards' : 'cn-slideOut .3s ease forwards',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cn-slideIn{from{transform:translateY(80px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes cn-slideOut{from{transform:translateY(0);opacity:1}to{transform:translateY(80px);opacity:0}}
      `}} />

      <div
        ref={cardRef}
        style={{
          width: 420,
          background: '#0a0a0a',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: 'auto',
          overflow: 'hidden',
          boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={18} color="#fff" strokeWidth={1.5} />
              <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
                {channelLabel}
              </span>
            </div>
            <button
              onClick={() => { SoundEffects.close(); dismiss(); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                padding: '0 2px',
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Subtitle */}
          <p style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.4)',
            margin: '8px 0 0',
            lineHeight: 1.4,
          }}>
            New message from BullMoney · {formatTime(notification.date)}
          </p>

          {/* Message text */}
          <div style={{
            marginTop: 14,
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
          }}>
            <p style={{
              fontSize: 14,
              lineHeight: '22px',
              color: 'rgba(255,255,255,0.7)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {notification.text}
            </p>
            {notification.hasMedia && (
              <div style={{
                marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)',
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
                Contains media
              </div>
            )}
          </div>

          {/* Queue indicator */}
          {queueRef.current.length > 0 && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '8px 0 0', textAlign: 'center' }}>
              +{queueRef.current.length} more {queueRef.current.length === 1 ? 'update' : 'updates'}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => { SoundEffects.click(); dismiss(); }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            >
              Dismiss
            </button>
            <button
              onClick={() => { SoundEffects.click(); readLater(); }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            >
              Read Later
            </button>
            <button
              onClick={() => { SoundEffects.confirm(); dismiss(); }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 8,
                border: 'none',
                background: '#fff',
                color: '#000',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Got it
            </button>
          </div>

          {/* Got it all — separate full-width button to skip all remaining */}
          {queueRef.current.length >= 2 && (
            <button
              onClick={() => { SoundEffects.confirm(); dismissAll(); }}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '10px 0',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'border-color 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
            >
              Got it all · Skip {queueRef.current.length} remaining
            </button>
          )}
        </div>
      </div>
    </div>,
    portalTarget
  );
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}
