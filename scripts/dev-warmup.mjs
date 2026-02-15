#!/usr/bin/env node
/**
 * ✅ DEV WARMUP SCRIPT
 * 
 * Standalone script to pre-warm critical routes in development.
 * Run this alongside your dev server or call it manually.
 * 
 * Usage:
 *   node scripts/dev-warmup.mjs           # One-time warmup
 *   node scripts/dev-warmup.mjs --watch   # Continuous keep-alive mode
 */

const DEV_PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${DEV_PORT}`;

// Critical routes to pre-warm
const WARMUP_ROUTES = [
  '/api/warmup',
  '/api/health',
  '/api/version',
  '/api/geo-detect',
  '/',
  '/store',
  '/community',
];

// ANSI colors
const GREEN = '\x1b[38;2;100;220;130m';
const AMBER = '\x1b[38;2;255;170;40m';
const RED = '\x1b[38;2;255;95;95m';
const CYAN = '\x1b[38;2;80;220;230m';
const DIM = '\x1b[38;2;80;82;100m';
const B = '\x1b[1m';
const X = '\x1b[0m';

async function warmupRoute(route) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${route}`, {
      method: 'HEAD',
      headers: { 'User-Agent': 'BullMoney-Dev-Warmup/1.0' }
    });
    const ms = Date.now() - start;
    return { route, status: res.status, ok: res.ok, ms };
  } catch (err) {
    return { route, status: 0, ok: false, error: err.message, ms: Date.now() - start };
  }
}

async function runWarmup() {
  console.log(`\n${CYAN}${B}⚡${X} ${DIM}Warming up dev server at${X} ${B}${BASE_URL}${X}\n`);
  
  const results = await Promise.all(WARMUP_ROUTES.map(warmupRoute));
  
  for (const r of results) {
    const icon = r.ok ? `${GREEN}✓${X}` : `${RED}✗${X}`;
    const time = r.ms < 100 ? `${GREEN}${r.ms}ms${X}` : r.ms < 500 ? `${AMBER}${r.ms}ms${X}` : `${RED}${r.ms}ms${X}`;
    const status = r.ok ? `${DIM}${r.status}${X}` : `${RED}${r.status || 'FAIL'}${X}`;
    console.log(`  ${icon} ${r.route.padEnd(25)} ${status.padEnd(10)} ${time}`);
  }
  
  const success = results.filter(r => r.ok).length;
  const total = results.length;
  const avgMs = Math.round(results.reduce((a, r) => a + r.ms, 0) / total);
  
  console.log(`\n  ${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${X}`);
  
  if (success === total) {
    console.log(`  ${GREEN}${B}✓${X} ${success}/${total} routes warmed ${DIM}(avg ${avgMs}ms)${X}\n`);
  } else {
    console.log(`  ${AMBER}${B}⚠${X} ${success}/${total} routes warmed ${DIM}(avg ${avgMs}ms)${X}\n`);
  }
  
  return success === total;
}

async function watchMode() {
  const INTERVAL = 2 * 60 * 1000; // 2 minutes
  
  console.log(`${CYAN}${B}♻${X}  ${DIM}Keep-alive mode - pinging every 2 minutes${X}`);
  console.log(`${DIM}   Press Ctrl+C to stop${X}\n`);
  
  // Initial warmup
  await runWarmup();
  
  // Keep-alive loop
  setInterval(async () => {
    const now = new Date().toLocaleTimeString();
    console.log(`\n${DIM}[${now}]${X} ${CYAN}Keep-alive ping...${X}`);
    
    const results = await Promise.all(WARMUP_ROUTES.map(warmupRoute));
    const ok = results.filter(r => r.ok).length;
    const total = results.length;
    
    if (ok === total) {
      console.log(`  ${GREEN}${B}✓${X} ${ok}/${total} routes warm`);
    } else {
      console.log(`  ${AMBER}${B}⚠${X} ${ok}/${total} routes warm`);
    }
  }, INTERVAL);
}

// Main
const args = process.argv.slice(2);
const isWatch = args.includes('--watch') || args.includes('-w');

if (isWatch) {
  watchMode();
} else {
  runWarmup().then(success => {
    process.exit(success ? 0 : 1);
  });
}
