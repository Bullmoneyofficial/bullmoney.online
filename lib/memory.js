"use client";

const VOLATILE_LOCAL_PATTERNS = [
  "_temp",
  "_volatile",
  "scroll_",
  "hover_",
  "_preview",
  "_cache_tmp",
  "_ephemeral",
  "bm_mem_tmp",
];

const VOLATILE_SESSION_KEYS = [
  "animation_state",
  "scroll_position_cache",
  "hover_states",
  "modal_history",
  "tooltip_cache",
  "bm_last_scroll",
  "bm_transition_state",
];

const PROTECTED_PATTERNS = [
  "auth",
  "token",
  "user",
  "session",
  "wallet",
  "supabase",
  "nextauth",
  "theme",
  "locale",
  "cart",
];

const MEMORY_BOOST_INTERVAL_MS = 30000;

function isProtectedKey(key) {
  const normalized = String(key || "").toLowerCase();
  return PROTECTED_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function safeRemoveByPatterns(storage, patterns) {
  let removed = 0;

  try {
    for (let index = storage.length - 1; index >= 0; index--) {
      const key = storage.key(index);
      if (!key || isProtectedKey(key)) continue;

      const normalized = key.toLowerCase();
      if (patterns.some((pattern) => normalized.includes(pattern))) {
        storage.removeItem(key);
        removed++;
      }
    }
  } catch {
    return removed;
  }

  return removed;
}

function shouldSendMemoryBoost() {
  try {
    const lastRaw = sessionStorage.getItem("bm_memory_boost_last_ts");
    const last = lastRaw ? Number(lastRaw) : 0;
    const now = Date.now();
    if (now - last < MEMORY_BOOST_INTERVAL_MS) return false;
    sessionStorage.setItem("bm_memory_boost_last_ts", String(now));
    return true;
  } catch {
    return true;
  }
}

export function clearVolatileMemoryStorage(level = 0) {
  if (typeof window === "undefined") {
    return { localRemoved: 0, sessionRemoved: 0 };
  }

  const localRemoved = safeRemoveByPatterns(localStorage, VOLATILE_LOCAL_PATTERNS);
  let sessionRemoved = 0;

  try {
    sessionRemoved += safeRemoveByPatterns(sessionStorage, VOLATILE_SESSION_KEYS);

    if (level >= 2) {
      for (let index = sessionStorage.length - 1; index >= 0; index--) {
        const key = sessionStorage.key(index);
        if (!key || isProtectedKey(key)) continue;
        if (key.startsWith("_sc_") || key.startsWith("bm_showcase_") || key.startsWith("bm_mem_")) {
          sessionStorage.removeItem(key);
          sessionRemoved++;
        }
      }
    }
  } catch {
    return { localRemoved, sessionRemoved };
  }

  return { localRemoved, sessionRemoved };
}

export function triggerMemoryBoost(options = {}) {
  if (typeof window === "undefined") return;
  if (!shouldSendMemoryBoost()) return;

  const payload = {
    source: options.source || "idle-cleanup",
    level: typeof options.level === "number" ? options.level : 0,
    path: options.path || window.location.pathname || "/",
    ts: Date.now(),
  };

  const send = () => {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/memory-boost", blob);
    } else {
      fetch("/api/memory-boost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        keepalive: true,
        cache: "no-store",
        credentials: "same-origin",
      }).catch(() => undefined);
    }

    const nav = navigator;
    const connection = nav.connection;
    const isSaveData = Boolean(connection && connection.saveData);
    const isSlow = Boolean(connection && /(2g|slow-2g)/i.test(connection.effectiveType || ""));

    if (isSaveData || isSlow) return;

    fetch("/api/hero", {
      method: "GET",
      cache: "force-cache",
      credentials: "same-origin",
      headers: { "x-memory-boost": "1" },
    }).catch(() => undefined);
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(send, { timeout: 1000 });
  } else {
    setTimeout(send, 100);
  }
}
