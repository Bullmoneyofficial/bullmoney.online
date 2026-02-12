# BMBRAIN Runtime Scripts

Centralized runtime performance scripts used by `app/layout.tsx`.

## Production File
- **`bmbrain.min.js`** — Single combined file (all 5 modules). Loaded by layout.tsx.

## Source Files (for reference/editing)
- `inapp-shield.js` — In-app browser detection & fixes
- `network-optimizer.js` — Network strategy, prefetch, fetch wrapper
- `mobile-crash-shield.js` — Memory management, cleanup, defer
- `spline-universal.js` — 3D/Spline quality management (always-render)
- `offline-detect.js` — Offline detection with branded banner

## How it loads
Layout injects a single `<script>` for `bmbrain.min.js` with `afterInteractive` strategy.
All 5 modules execute in order within one IIFE — no separate HTTP requests.

## Shared state
All modules coordinate through `window.__BM_BRAIN__` and events:
- `bm:inapp` — in-app browser detected
- `bm:memory` — memory pressure level change
- `bm:network-strategy` — network strategy recomputed
- `bm:brain-ready` — all modules loaded
- `bullmoney-spline-visibility` — spline scene visibility change
- `bullmoney-performance-hint` — performance hint for React components
