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
const MEMORY_GUARDIAN_INTERVAL_MS = 90000;
const DEFAULT_VOLATILE_LOCAL_TTL_MS = 2 * 60 * 1000;
const DEFAULT_VOLATILE_SESSION_TTL_MS = 60 * 1000;
const DEFAULT_SWEEP_BUDGET = 35;
const MEMORY_GUARDIAN_KEY = "bm_memory_guardian_started";

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

function parseMaybeJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getEntryTimestamp(value) {
  if (!value || typeof value !== "object") return null;

  const candidate =
    value.ts ??
    value.timestamp ??
    value.cachedAt ??
    value.createdAt ??
    value.updatedAt;

  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : null;
}

function getEntryExpiry(value) {
  if (!value || typeof value !== "object") return null;

  const candidate = value.exp ?? value.expiresAt ?? value.expiry;
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : null;
}

function pruneExpiredVolatileEntries(storage, options = {}) {
  const now = Date.now();
  const ttlMs = typeof options.ttlMs === "number" ? options.ttlMs : DEFAULT_VOLATILE_LOCAL_TTL_MS;
  const budget = typeof options.budget === "number" ? options.budget : DEFAULT_SWEEP_BUDGET;
  const patterns = Array.isArray(options.patterns) ? options.patterns : [];

  let removed = 0;
  let inspected = 0;

  try {
    for (let index = storage.length - 1; index >= 0 && inspected < budget; index--) {
      const key = storage.key(index);
      if (!key || isProtectedKey(key)) continue;

      const normalized = key.toLowerCase();
      if (!patterns.some((pattern) => normalized.includes(pattern))) continue;

      inspected += 1;

      const raw = storage.getItem(key);
      if (!raw) continue;

      const parsed = parseMaybeJSON(raw);
      if (!parsed) continue;

      const exp = getEntryExpiry(parsed);
      if (exp && exp <= now) {
        storage.removeItem(key);
        removed += 1;
        continue;
      }

      const ts = getEntryTimestamp(parsed);
      if (ts && now - ts > ttlMs) {
        storage.removeItem(key);
        removed += 1;
      }
    }
  } catch {
    return removed;
  }

  return removed;
}

function withIdle(fn, timeout = 1200) {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => fn(), { timeout });
    return;
  }
  setTimeout(fn, 120);
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

  const localTTLRemoved = pruneExpiredVolatileEntries(localStorage, {
    ttlMs: level >= 2 ? 90 * 1000 : DEFAULT_VOLATILE_LOCAL_TTL_MS,
    budget: level >= 2 ? 60 : DEFAULT_SWEEP_BUDGET,
    patterns: VOLATILE_LOCAL_PATTERNS,
  });

  try {
    sessionRemoved += safeRemoveByPatterns(sessionStorage, VOLATILE_SESSION_KEYS);

    sessionRemoved += pruneExpiredVolatileEntries(sessionStorage, {
      ttlMs: level >= 2 ? 45 * 1000 : DEFAULT_VOLATILE_SESSION_TTL_MS,
      budget: level >= 2 ? 60 : DEFAULT_SWEEP_BUDGET,
      patterns: VOLATILE_SESSION_KEYS,
    });

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
    return { localRemoved: localRemoved + localTTLRemoved, sessionRemoved };
  }

  return { localRemoved: localRemoved + localTTLRemoved, sessionRemoved };
}

export function runMemoryGuardianSweep() {
  if (typeof window === "undefined") {
    return { localRemoved: 0, sessionRemoved: 0 };
  }

  const localRemoved = pruneExpiredVolatileEntries(localStorage, {
    ttlMs: DEFAULT_VOLATILE_LOCAL_TTL_MS,
    budget: DEFAULT_SWEEP_BUDGET,
    patterns: VOLATILE_LOCAL_PATTERNS,
  });

  const sessionRemoved = pruneExpiredVolatileEntries(sessionStorage, {
    ttlMs: DEFAULT_VOLATILE_SESSION_TTL_MS,
    budget: DEFAULT_SWEEP_BUDGET,
    patterns: VOLATILE_SESSION_KEYS,
  });

  return { localRemoved, sessionRemoved };
}

export function initializeMemoryGuardian() {
  if (typeof window === "undefined") return () => {};

  let started = false;
  try {
    started = sessionStorage.getItem(MEMORY_GUARDIAN_KEY) === "1";
    if (!started) sessionStorage.setItem(MEMORY_GUARDIAN_KEY, "1");
  } catch {
    started = false;
  }

  if (started) return () => {};

  const runSweep = () => {
    withIdle(() => {
      runMemoryGuardianSweep();
    });
  };

  const intervalId = window.setInterval(runSweep, MEMORY_GUARDIAN_INTERVAL_MS);

  const onVisibilityChange = () => {
    if (document.hidden) runSweep();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  runSweep();

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    try {
      sessionStorage.removeItem(MEMORY_GUARDIAN_KEY);
    } catch {
      // ignore storage errors
    }
  };
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

    const path = typeof payload.path === "string" ? payload.path.toLowerCase() : "";
    const shouldWarmHero =
      path.startsWith("/store") ||
      path.startsWith("/shop") ||
      path.startsWith("/products") ||
      path.startsWith("/oldstore");

    if (shouldWarmHero) {
      fetch("/api/hero", {
        method: "GET",
        cache: "force-cache",
        credentials: "same-origin",
        headers: { "x-memory-boost": "1" },
      }).catch(() => undefined);
    }
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(send, { timeout: 1000 });
  } else {
    setTimeout(send, 100);
  }
}
