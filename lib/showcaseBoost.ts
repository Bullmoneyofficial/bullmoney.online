"use client";

type ShowcaseBoostOptions = {
  pageId?: string;
  path?: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};

const DEFAULT_ROUTES = ["/store", "/games", "/design"];
const PREFETCH_BY_PAGE: Record<string, string[]> = {
  home: ["/store", "/games", "/design"],
  store: ["/store/checkout", "/design", "/games"],
  games: ["/games/dice", "/games/mines", "/store"],
  design: ["/", "/store", "/games"],
};

function getInAppBrowser(userAgent: string): boolean {
  return /Instagram|FBAN|FBAV|TikTok|musical_ly|Twitter|GSA|Line\//i.test(userAgent);
}

function addLinkOnce(rel: string, href: string, as?: string) {
  const selector = as
    ? `link[rel=\"${rel}\"][href=\"${href}\"][as=\"${as}\"]`
    : `link[rel=\"${rel}\"][href=\"${href}\"]`;

  if (document.head.querySelector(selector)) return;

  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  if (as) link.as = as;
  document.head.appendChild(link);
}

export function triggerShowcaseBoost(options: ShowcaseBoostOptions = {}) {
  if (typeof window === "undefined") return;

  const path = options.path || window.location.pathname || "/";
  const pageId = options.pageId || "unknown";
  const sessionKey = `bm_showcase_boosted_${pageId || path}`;

  try {
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");
  } catch {
    // ignore storage restrictions
  }

  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection;
  const isSaveData = Boolean(connection?.saveData);
  const isSlowConnection = /(2g|slow-2g)/i.test(connection?.effectiveType || "");
  const isInApp = getInAppBrowser(navigator.userAgent);
  const routes = PREFETCH_BY_PAGE[pageId] || DEFAULT_ROUTES;

  addLinkOnce("preconnect", window.location.origin);

  const prefetchTargets = isInApp ? routes.slice(0, 2) : routes;
  for (const href of prefetchTargets) {
    addLinkOnce("prefetch", href, "document");
  }

  window.dispatchEvent(new CustomEvent("bm-showcase-boost", { detail: { pageId, path, inApp: isInApp } }));

  const sendBoostPing = () => {
    const payload = JSON.stringify({ pageId, path, ts: Date.now(), inApp: isInApp });
    const beaconUrl = "/api/showcase-boost";

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(beaconUrl, blob);
      return;
    }

    fetch(beaconUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
      cache: "no-store",
      credentials: "same-origin",
    }).catch(() => undefined);
  };

  const warmDocument = () => {
    if (isSaveData || isSlowConnection) return;

    const firstRoute = prefetchTargets[0];
    if (!firstRoute) return;

    fetch(firstRoute, {
      method: "GET",
      cache: "force-cache",
      credentials: "same-origin",
      headers: { "x-showcase-boost": "1" },
    }).catch(() => undefined);
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => {
      sendBoostPing();
      warmDocument();
    }, { timeout: 1200 });
  } else {
    setTimeout(() => {
      sendBoostPing();
      warmDocument();
    }, 120);
  }
}

export function setShowcaseRunningMode(active: boolean) {
  if (typeof document === "undefined") return;

  const html = document.documentElement;
  const body = document.body;

  if (active) {
    html.setAttribute("data-showcase-running", "true");
    body?.setAttribute("data-showcase-running", "true");
    window.dispatchEvent(new CustomEvent("bm-showcase-running", { detail: { active: true } }));
    return;
  }

  html.removeAttribute("data-showcase-running");
  body?.removeAttribute("data-showcase-running");
  window.dispatchEvent(new CustomEvent("bm-showcase-running", { detail: { active: false } }));
}
