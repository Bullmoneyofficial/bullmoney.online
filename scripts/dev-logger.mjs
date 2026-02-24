#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  BullMoney Dev Logger v4.0 — Ultra Premium Terminal Dashboard   ║
 * ║  Live stats · Timing bars · Route icons · Sparklines            ║
 * ║  Animated compiles · Grouped output · Session analytics         ║
 * ║  + Cold Start Prevention - Auto-warmup critical routes          ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { spawn } from 'child_process';
import { resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';

// ─── COLD START PREVENTION ─────────────────────────────────────
const DEV_PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${DEV_PORT}`;

// Warmup strategy:
// - Always safe/fast: API warmup (keeps edge/node handlers hot)
// - Expensive in dev: page warmup (forces large route compiles like /store)
//
// Opt-in page warmup via:
//   WARMUP_PAGES=1   → warms '/'
//   WARMUP_STORE=1   → also warms '/store'
const WARMUP_API_ROUTES = [
  '/api/warmup',
  '/api/health',
  '/api/version',
  '/api/geo-detect',
];

const WARMUP_PAGE_ROUTES = [];
if (process.env.WARMUP_PAGES === '1') {
  WARMUP_PAGE_ROUTES.push('/');
  if (process.env.WARMUP_STORE === '1') WARMUP_PAGE_ROUTES.push('/store');
}

const WARMUP_ROUTES = [...WARMUP_API_ROUTES, ...WARMUP_PAGE_ROUTES];

// Skip warmup/keep-alive for fastest cold compile (export FAST_DEV=1 or SKIP_WARMUP=1)
const SKIP_WARMUP = process.env.FAST_DEV === '1' || process.env.SKIP_WARMUP === '1';

// Keep-alive interval (2 minutes in dev - more aggressive than prod)
const KEEPALIVE_INTERVAL = 2 * 60 * 1000;
let keepAliveTimer = null;
let isServerReady = false;

async function warmupRoute(route) {
  try {
    const res = await fetch(`${BASE_URL}${route}`, {
      method: 'HEAD',
      headers: { 'User-Agent': 'BullMoney-Dev-Warmup/1.0' }
    });
    return { route, status: res.status, ok: res.ok };
  } catch (err) {
    return { route, status: 0, ok: false, error: err.message };
  }
}

async function runWarmup(silent = false) {
  if (SKIP_WARMUP) return [];
  if (!isServerReady) return;
  
  const results = await Promise.all(WARMUP_ROUTES.map(warmupRoute));
  
  if (!silent) {
    const success = results.filter(r => r.ok).length;
    const total = results.length;
    const GREEN = `\x1b[38;2;100;220;130m`;
    const AMBER = `\x1b[38;2;255;170;40m`;
    const GHOST = `\x1b[38;2;55;58;70m`;
    const X = `\x1b[0m`;
    const B = `\x1b[1m`;
    
    if (success === total) {
      process.stdout.write(`  ${GREEN}${B}⚡${X} ${GHOST}Warmed ${success}/${total} routes${X}\n`);
    } else {
      process.stdout.write(`  ${AMBER}${B}⚡${X} ${GHOST}Warmed ${success}/${total} routes${X}\n`);
    }
  }
  
  return results;
}

function startKeepAlive() {
  if (SKIP_WARMUP) return;
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  
  // Initial warmup after server starts (with small delay for full initialization)
  setTimeout(() => {
    runWarmup(false);
  }, 1500);
  
  // Periodic keep-alive pings
  keepAliveTimer = setInterval(() => {
    runWarmup(true); // Silent pings
  }, KEEPALIVE_INTERVAL);
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

// ─── ANSI HELPERS ──────────────────────────────────────────────
const esc       = (code) => `\x1b[${code}m`;
const rgb       = (r, g, b) => esc(`38;2;${r};${g};${b}`);
const bgRgb     = (r, g, b) => esc(`48;2;${r};${g};${b}`);
const ANSI_RE   = /\x1b\[[0-9;]*m/g;
const stripAnsi = (s) => s.replace(ANSI_RE, '');

const B = esc(1);        // bold
const D = esc(2);        // dim
const I = esc(3);        // italic
const U = esc(4);        // underline
const X = esc(0);        // reset

// ─── BRAND PALETTE ─────────────────────────────────────────────
const GOLD     = rgb(255, 200, 50);
const AMBER    = rgb(255, 170, 40);
const HONEY    = rgb(230, 185, 70);
const WHITE    = rgb(245, 245, 250);
const SNOW     = rgb(220, 222, 228);
const SILVER   = rgb(160, 165, 175);
const SLATE    = rgb(120, 125, 138);
const DIM      = rgb(80, 82, 100);
const GHOST    = rgb(55, 58, 70);
const VOID     = rgb(38, 40, 50);
const GREEN    = rgb(100, 220, 130);
const MINT     = rgb(130, 235, 170);
const RED      = rgb(255, 95, 95);
const CORAL    = rgb(255, 130, 120);
const YELLOW   = rgb(255, 220, 80);
const BLUE     = rgb(100, 160, 255);
const SKY      = rgb(130, 190, 255);
const CYAN     = rgb(80, 220, 230);
const TEAL     = rgb(60, 200, 180);
const PURPLE   = rgb(170, 130, 255);
const LAVENDER = rgb(190, 165, 255);
const PINK     = rgb(255, 130, 180);
const ORANGE   = rgb(255, 145, 50);
const PEACH    = rgb(255, 180, 120);

// ── Backgrounds ──
const BG_GREEN  = bgRgb(12, 36, 22);
const BG_RED    = bgRgb(42, 12, 12);
const BG_YELLOW = bgRgb(40, 36, 10);
const BG_BLUE   = bgRgb(10, 22, 44);
const BG_PURPLE = bgRgb(26, 16, 46);
const BG_CYAN   = bgRgb(8, 30, 35);
const BG_DARK   = bgRgb(18, 18, 25);
const BG_PANEL  = bgRgb(24, 24, 32);
const BG_GOLD   = bgRgb(42, 35, 10);

// ─── GRADIENT TEXT ─────────────────────────────────────────────
function grad(text, from, to) {
  const len = Math.max(text.length - 1, 1);
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const t = i / len;
    const r = Math.round(from[0] + (to[0] - from[0]) * t);
    const g = Math.round(from[1] + (to[1] - from[1]) * t);
    const b = Math.round(from[2] + (to[2] - from[2]) * t);
    out += `\x1b[38;2;${r};${g};${b}m${text[i]}`;
  }
  return out + X;
}

function grad3(text, a, b, c) {
  const len = Math.max(text.length - 1, 1);
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const t = i / len;
    let from, to, lt;
    if (t < 0.5) { from = a; to = b; lt = t * 2; }
    else { from = b; to = c; lt = (t - 0.5) * 2; }
    const r = Math.round(from[0] + (to[0] - from[0]) * lt);
    const g = Math.round(from[1] + (to[1] - from[1]) * lt);
    const bl = Math.round(from[2] + (to[2] - from[2]) * lt);
    out += `\x1b[38;2;${r};${g};${bl}m${text[i]}`;
  }
  return out + X;
}

// ─── BOX DRAWING ───────────────────────────────────────────────
const BX = { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│', hh: '━', hhh: '┄', ltee: '├', rtee: '┤' };

// ─── LIVE STATS ────────────────────────────────────────────────
const stats = {
  requests: 0, api: 0, pages: 0, assets: 0, errors: 0,
  totalMs: 0, fastest: Infinity, slowest: 0,
  startTime: Date.now(), compiles: 0, cached: 0,
  methods: {}, recentMs: [], statusCodes: {},
  routes: new Map(),
};

function track(method, path, status, ms) {
  stats.requests++;
  if (path.startsWith('/api')) stats.api++;
  else if (path.match(/\.(js|css|png|jpg|svg|ico|woff|json|map)(\?|$)/)) stats.assets++;
  else stats.pages++;
  if (status >= 400) stats.errors++;
  stats.totalMs += ms;
  if (ms < stats.fastest) stats.fastest = ms;
  if (ms > stats.slowest) stats.slowest = ms;
  if (ms < 8) stats.cached++;
  stats.methods[method] = (stats.methods[method] || 0) + 1;
  stats.statusCodes[status] = (stats.statusCodes[status] || 0) + 1;
  stats.recentMs.push(ms);
  if (stats.recentMs.length > 30) stats.recentMs.shift();
  const routeKey = `${method} ${path.split('?')[0]}`;
  const r = stats.routes.get(routeKey) || { hits: 0, totalMs: 0 };
  r.hits++; r.totalMs += ms;
  stats.routes.set(routeKey, r);
}

// ─── SPARKLINE ─────────────────────────────────────────────────
function sparkline(values, width = 14) {
  if (values.length < 2) return '';
  const bars = '▁▂▃▄▅▆▇█';
  const slice = values.slice(-width);
  const min = Math.min(...slice);
  const max = Math.max(...slice, 1);
  const range = max - min || 1;
  return slice.map(v => {
    const idx = Math.min(Math.round(((v - min) / range) * 7), 7);
    const t = (v - min) / range;
    // green → amber → red
    const r = Math.round(100 + 155 * t);
    const g = Math.round(220 - 140 * t);
    const b = Math.round(130 - 100 * t);
    return `\x1b[38;2;${r};${g};${b}m${bars[idx]}`;
  }).join('') + X;
}

// ─── TIMING BAR ────────────────────────────────────────────────
function timingBar(ms, maxMs = 3000) {
  const W = 8;
  const filled = Math.min(Math.round((ms / maxMs) * W), W);
  const empty = W - filled;
  const t = Math.min(ms / maxMs, 1);
  // green gradient to red
  const r = Math.round(80 + 175 * t);
  const g = Math.round(220 - 160 * t);
  const b = Math.round(130 - 100 * t);
  const fc = `\x1b[38;2;${r};${g};${b}m`;
  return `${fc}${'━'.repeat(filled)}${X}${VOID}${'┄'.repeat(empty)}${X}`;
}

// ─── STATUS BADGE ──────────────────────────────────────────────
function statusBadge(code) {
  const c = parseInt(code, 10);
  if (c >= 200 && c < 300) return `${BG_GREEN}${B} ${GREEN}${c} ${X}`;
  if (c >= 300 && c < 400) return `${BG_BLUE}${B} ${BLUE}${code} ${X}`;
  if (c === 404)           return `${BG_YELLOW}${B} ${YELLOW}${code} ${X}`;
  if (c >= 400 && c < 500) return `${BG_RED}${B} ${ORANGE}${code} ${X}`;
  if (c >= 500)            return `${BG_RED}${B} ${RED}${code} ${X}`;
  return `${DIM}${code}${X}`;
}

// ─── TIMING TEXT ───────────────────────────────────────────────
function parseMs(s) {
  if (!s) return NaN;
  s = s.trim();
  if (s.endsWith('ms')) return parseFloat(s);
  if (s.endsWith('s'))  return parseFloat(s) * 1000;
  if (s.endsWith('µs')) return parseFloat(s) / 1000;
  return parseFloat(s);
}

function timeStr(ms, raw) {
  if (isNaN(ms)) return `${DIM}${raw}${X}`;
  if (ms < 5)    return `${GREEN}${B}${raw}${X}`;
  if (ms < 50)   return `${MINT}${raw}${X}`;
  if (ms < 200)  return `${TEAL}${raw}${X}`;
  if (ms < 800)  return `${AMBER}${raw}${X}`;
  if (ms < 2000) return `${ORANGE}${raw}${X}`;
  return `${RED}${B}${raw}${X}`;
}

function speedIcon(ms) {
  if (ms < 8)    return `${GREEN}${B}⚡${X}`;
  if (ms < 80)   return `${MINT}◆${X}`;
  if (ms < 300)  return `${TEAL}●${X}`;
  if (ms < 1000) return `${AMBER}●${X}`;
  if (ms < 3000) return `${ORANGE}◉${X}`;
  return `${RED}${B}◉${X}`;
}

// ─── METHOD BADGE ──────────────────────────────────────────────
function methodBadge(method) {
  const styles = {
    GET:     [BG_BLUE,   BLUE],
    POST:    [BG_GREEN,  GREEN],
    PUT:     [BG_GOLD,   AMBER],
    PATCH:   [BG_PURPLE, PURPLE],
    DELETE:  [BG_RED,    RED],
    HEAD:    [BG_DARK,   SLATE],
    OPTIONS: [BG_DARK,   SLATE],
  };
  const [bg, fg] = styles[method] || [BG_DARK, WHITE];
  return `${bg} ${fg}${B}${method.padEnd(7)}${X}${bg} ${X}`;
}

// ─── ROUTE ICON ────────────────────────────────────────────────
function routeIcon(path) {
  if (path.startsWith('/api'))        return `${GOLD}◈${X}`;
  if (path.match(/\.(png|jpg|svg|ico|gif|webp)/)) return `${GHOST}◻${X}`;
  if (path.match(/\.(js|css|map)/))   return `${GHOST}◇${X}`;
  if (path === '/')                   return `${CYAN}◉${X}`;
  return `${PURPLE}◆${X}`;
}

// ─── PATH FORMATTER ────────────────────────────────────────────
function formatPath(rawPath) {
  const [path, query] = rawPath.split('?');
  const segs = path.split('/').filter(Boolean);
  let out = '';
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (s === 'api')            out += `${GOLD}${B}/api${X}`;
    else if (s === '_vercel')   out += `${VOID}/_vercel${X}`;
    else if (i === segs.length - 1) out += `${WHITE}${B}/${s}${X}`;
    else                        out += `${SILVER}/${s}${X}`;
  }
  if (!out) out = `${WHITE}${B}/${X}`;
  if (query) {
    const q = query.length > 32 ? query.slice(0, 30) + '…' : query;
    out += `${VOID}?${DIM}${q}${X}`;
  }
  return out;
}

// ─── COMPILE DETAIL FORMATTER ──────────────────────────────────
function fmtDetail(detail) {
  return detail.replace(
    /(\w[\w.]*?):\s*(\d+[\d.]*(?:ms|s|µs))/g,
    (_, label, time) => {
      const ms = parseMs(time);
      const c = ms < 3 ? GHOST : ms < 50 ? DIM : ms < 200 ? SLATE : ms < 800 ? AMBER : ORANGE;
      return `${GHOST}${label}${DIM}:${c}${time}${X}`;
    }
  );
}

// ─── BANNER ────────────────────────────────────────────────────
function printBanner() {
  const W = 60;
  const hbar = '━'.repeat(W);
  const topB = grad3(BX.tl + hbar + BX.tr, [255, 200, 50], [255, 140, 30], [200, 100, 20]);
  const botB = grad3(BX.bl + hbar + BX.br, [200, 100, 20], [255, 140, 30], [255, 200, 50]);

  const pipe = `${GOLD}${B}┃${X}`;
  const pad = (content, visLen) => {
    const sp = Math.max(0, W - visLen);
    return `  ${pipe} ${content}${' '.repeat(sp)} ${pipe}`;
  };

  const bull   = grad3('🐂  B U L L   M O N E Y', [255, 230, 120], [255, 190, 50], [255, 140, 20]);
  const sub    = `${SILVER}${I}Dev Server${X}  ${GHOST}━━${X}  ${SILVER}${I}Live Dashboard${X}  ${GHOST}━━${X}  ${SILVER}${I}v4.0${X}`;
  const ts     = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const tsLine = `${GHOST}${ts}${X}`;

  process.stdout.write([
    '',
    `  ${topB}`,
    pad('', 0),
    pad(`   ${bull}`, 25),
    pad(`   ${sub}`, 38),
    pad(`   ${tsLine}`, 8),
    pad('', 0),
    `  ${botB}`,
    '',
  ].join('\n') + '\n');
}

// ─── REQUEST FORMATTER ─────────────────────────────────────────
const REQ_RE = /^\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)\s+(\d{3})\s+in\s+([\d.]+(?:ms|s|µs))\s*(?:\((.+)\))?/;

function fmtRequest(line) {
  const clean = stripAnsi(line);
  const m = clean.match(REQ_RE);
  if (!m) return null;

  const [, method, path, status, total, detail] = m;
  const ms = parseMs(total);
  track(method, path, parseInt(status), ms);

  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  // Assemble the request line
  let out = `  ${GHOST}${ts}${X}`;
  out += ` ${speedIcon(ms)}`;
  out += ` ${routeIcon(path)}`;
  out += ` ${methodBadge(method)}`;
  out += ` ${formatPath(path)}`;
  out += `  ${statusBadge(status)}`;
  out += `  ${timeStr(ms, total)}`;
  out += `  ${timingBar(ms)}`;

  // Compile/render breakdown on a sub-line for slow requests
  if (detail && ms > 100) {
    out += `\n             ${GHOST}╰─${X} ${fmtDetail(detail)}`;
  } else if (detail) {
    out += ` ${GHOST}(${X}${fmtDetail(detail)}${GHOST})${X}`;
  }

  // Sparkline every 6 requests
  if (stats.requests % 6 === 0 && stats.recentMs.length >= 4) {
    const avg = Math.round(stats.totalMs / stats.requests);
    out += `\n  ${grad('─'.repeat(62), [40, 42, 55], [30, 30, 40])}`;
    out += `\n  ${GHOST}│${X} ${sparkline(stats.recentMs, 18)}  ${GHOST}avg${X} ${avg < 100 ? GREEN : avg < 500 ? TEAL : AMBER}${avg}ms${X}  ${GHOST}·${X}  ${GOLD}${B}${stats.requests}${X} ${GHOST}reqs${X}` +
      (stats.errors > 0 ? `  ${GHOST}·${X}  ${RED}${stats.errors}${X} ${GHOST}err${X}` : '') +
      `  ${GHOST}│${X}`;
    out += `\n  ${grad('─'.repeat(62), [30, 30, 40], [40, 42, 55])}`;
  }

  return out;
}

// ─── COMPILING FORMATTER ───────────────────────────────────────
const compileFrames = ['◜', '◠', '◝', '◞', '◡', '◟'];

function fmtCompile(line) {
  const clean = stripAnsi(line);
  const m = clean.match(/○\s+Compiling\s+(.*?)\s*\.{3}/);
  if (!m) return null;
  stats.compiles++;
  const frame = compileFrames[stats.compiles % compileFrames.length];
  const route = m[1];
  const icon = routeIcon(route);
  return `\n  ${PURPLE}${B}${frame}${X} ${SLATE}Compiling${X}  ${icon} ${CYAN}${B}${route}${X} ${GHOST}…${X}`;
}

// ─── STARTUP FORMATTER ─────────────────────────────────────────
function fmtStartup(line) {
  const clean = stripAnsi(line);

  // ── Next.js version line ──
  if (clean.includes('Next.js')) {
    const ver = clean.match(/Next\.js\s+([\d.]+)/)?.[1];
    if (!ver) return null;
    const mode = clean.includes('Turbopack') ? 'Turbopack' : 'Webpack';
    const modeCol = mode === 'Turbopack' ? CYAN : AMBER;
    printBanner();
    const sep = grad('┄'.repeat(60), [80, 80, 100], [40, 40, 55]);
    return [
      `  ${grad3('▲', [255, 220, 100], [255, 170, 30], [255, 120, 20])} ${WHITE}${B}Next.js${X} ${GOLD}${B}${ver}${X}  ${GHOST}·${X}  ${modeCol}${B}${mode}${X}`,
      `  ${sep}`,
    ].join('\n');
  }

  // ── Server info ──
  if (clean.match(/^\s*-\s*Local:/)) {
    const url = clean.match(/(https?:\/\/[^\s]+)/)?.[1] || '';
    return `  ${GOLD}${B}┃${X}  ${GHOST}Local${X}      ${GREEN}${B}${U}${url}${X}`;
  }
  if (clean.match(/^\s*-\s*Network:/)) {
    const url = clean.match(/(https?:\/\/[^\s]+)/)?.[1] || '';
    return `  ${GOLD}${B}┃${X}  ${GHOST}Network${X}    ${TEAL}${U}${url}${X}`;
  }
  if (clean.match(/^\s*-\s*Environments:/)) {
    const env = clean.replace(/^\s*-\s*Environments:\s*/, '').trim();
    return `  ${GOLD}${B}┃${X}  ${GHOST}Env${X}        ${SILVER}${env}${X}`;
  }

  // ── Experiments header ──
  if (clean.match(/^\s*-\s*Experiments/)) {
    return `  ${GOLD}${B}┃${X}  ${GHOST}Features${X}`;
  }

  // ── Starting / Ready (check BEFORE experiment flags) ──
  if (clean.includes('✓ Starting')) {
    return [
      `  ${GOLD}${B}┃${X}`,
      `  ${grad3(BX.bl + '━'.repeat(42), [255, 200, 50], [180, 140, 40], [80, 80, 100])}`,
      '',
      `  ${AMBER}${B}◌${X} ${SILVER}${I}Initializing server…${X}`,
    ].join('\n');
  }

  if (clean.includes('✓ Ready in')) {
    const ms = clean.match(/([\d.]+(?:ms|s))/)?.[1] || '';
    const bar = grad3('━'.repeat(62), [100, 220, 130], [80, 220, 230], [255, 200, 50]);
    
    // Start cold-start prevention
    isServerReady = true;
    startKeepAlive();
    
    return [
      '',
      `  ${GREEN}${B}✓${X}  ${WHITE}${B}Server ready${X}  ${GHOST}in${X}  ${GREEN}${B}${ms}${X}`,
      '',
      `  ${bar}`,
      '',
      `  ${GHOST}${I}  Monitoring requests…${X}  ${sparkline([10, 30, 20, 10, 5, 8, 12])}  ${GHOST}│${X}  ${CYAN}Keep-alive active${X}`,
      '',
    ].join('\n');
  }

  // ── Experiment flags ──
  const exp = clean.match(/^\s*(✓|·)\s+(\w[\w.]+)\s*$/);
  if (exp) {
    const [, marker, name] = exp;
    if (marker === '✓') {
      return `  ${GOLD}${B}┃${X}    ${GREEN}${B}✓${X} ${WHITE}${name}${X}`;
    }
    return `  ${GOLD}${B}┃${X}    ${GHOST}·${X} ${DIM}${name}${X}`;
  }

  return null;
}

// ─── PORT WARNING ──────────────────────────────────────────────
function fmtPortWarning(line) {
  const clean = stripAnsi(line);
  const m = clean.match(/Port\s+(\d+)\s+is in use.*?port\s+(\d+)/);
  if (m) return `\n  ${AMBER}${B}⚠${X}  ${SILVER}Port ${GOLD}${B}${m[1]}${X} ${SILVER}busy${X}  ${GHOST}→${X}  ${GREEN}${B}${m[2]}${X}\n`;
  return null;
}

// ─── ERROR FORMATTER ───────────────────────────────────────────
function fmtError(line) {
  const clean = stripAnsi(line);
  if (clean.match(/⨯|Error:|EADDRINUSE|ENOENT|FATAL|UnhandledRejection/i)) {
    return `  ${RED}${B}✖${X}  ${CORAL}${clean.trim()}${X}`;
  }
  if (clean.includes('Warning:') || clean.includes('warn -')) {
    return `  ${YELLOW}${B}▲${X}  ${PEACH}${clean.trim()}${X}`;
  }
  return null;
}

// ─── BREAKING NEWS ─────────────────────────────────────────────
function fmtNews(line) {
  const m = line.match(/\[Breaking News\]\s*(.*)/);
  if (m) return `  ${PINK}${B}📰${X}  ${GHOST}${m[1]}${X}`;
  return null;
}

// ─── STATS DASHBOARD ──────────────────────────────────────────
let lastStatsDash = 0;

function statsDashboard() {
  if (stats.requests < 8) return null;
  const now = Date.now();
  if (now - lastStatsDash < 25000) return null;
  lastStatsDash = now;

  const up = Math.round((now - stats.startTime) / 1000);
  const mm = Math.floor(up / 60);
  const ss = up % 60;
  const avg = Math.round(stats.totalMs / stats.requests);
  const rps = (stats.requests / Math.max(up, 1)).toFixed(1);
  const spark = sparkline(stats.recentMs, 20);

  const topL = grad3(BX.tl + '━'.repeat(64) + BX.tr, [80, 80, 100], [60, 60, 80], [80, 80, 100]);
  const botL = grad3(BX.bl + '━'.repeat(64) + BX.br, [80, 80, 100], [60, 60, 80], [80, 80, 100]);
  const pipe = `${GHOST}┃${X}`;

  const row1 = [
    `${GOLD}${B}${stats.requests}${X} ${GHOST}reqs${X}`,
    `${TEAL}${stats.api}${X} ${GHOST}api${X}`,
    `${PURPLE}${stats.pages}${X} ${GHOST}pages${X}`,
    `${SILVER}${stats.assets}${X} ${GHOST}static${X}`,
    stats.errors > 0 ? `${RED}${B}${stats.errors}${X} ${GHOST}err${X}` : null,
  ].filter(Boolean).join(`  ${GHOST}·${X}  `);

  const row2 = [
    `${GHOST}avg${X} ${avg < 100 ? GREEN : avg < 500 ? TEAL : AMBER}${B}${avg}ms${X}`,
    `${GHOST}fast${X} ${GREEN}${Math.round(stats.fastest)}ms${X}`,
    `${GHOST}slow${X} ${RED}${Math.round(stats.slowest)}ms${X}`,
    `${GHOST}rps${X} ${SKY}${rps}${X}`,
    `${GHOST}up${X} ${SILVER}${mm}m${ss}s${X}`,
  ].join(`  ${GHOST}·${X}  `);

  return [
    `  ${topL}`,
    `  ${pipe}  ${spark}   ${row1}  ${pipe}`,
    `  ${pipe}  ${' '.repeat(20)}${row2}  ${pipe}`,
    `  ${botL}`,
  ].join('\n');
}

// ─── MASTER FORMATTER ──────────────────────────────────────────
function formatLine(raw) {
  const line = raw.trimEnd();
  if (!line) return '';

  const result = fmtRequest(line)
    || fmtCompile(line)
    || fmtStartup(line)
    || fmtPortWarning(line)
    || fmtError(line)
    || fmtNews(line)
    || `  ${DIM}${stripAnsi(line)}${X}`;

  const dash = statsDashboard();
  return dash ? result + '\n' + dash : result;
}

// ─── SESSION SUMMARY ON EXIT ───────────────────────────────────
function printSummary() {
  if (stats.requests < 1) return;

  const avg = Math.round(stats.totalMs / stats.requests);
  const dur = Math.round((Date.now() - stats.startTime) / 1000);
  const mm = Math.floor(dur / 60);
  const ss = dur % 60;
  const rps = (stats.requests / Math.max(dur, 1)).toFixed(1);

  const W = 62;
  const topB = grad3(BX.tl + '━'.repeat(W) + BX.tr, [255, 200, 50], [255, 140, 30], [200, 100, 20]);
  const midB = grad3(BX.ltee + '─'.repeat(W) + BX.rtee, [200, 100, 20], [180, 120, 30], [200, 100, 20]);
  const botB = grad3(BX.bl + '━'.repeat(W) + BX.br, [200, 100, 20], [255, 140, 30], [255, 200, 50]);
  const pipe = `${GOLD}${B}┃${X}`;

  const r = (content) => `  ${pipe}  ${content}`;

  // Top routes by total time
  const topRoutes = [...stats.routes.entries()]
    .sort((a, b) => b[1].totalMs - a[1].totalMs)
    .slice(0, 4);

  const routeLines = topRoutes.map(([key, val]) => {
    const avgMs = Math.round(val.totalMs / val.hits);
    const col = avgMs < 100 ? GREEN : avgMs < 500 ? TEAL : avgMs < 1500 ? AMBER : RED;
    return r(`   ${GHOST}${val.hits}×${X} ${SILVER}${key.length > 38 ? key.slice(0, 36) + '…' : key.padEnd(38)}${X} ${col}${avgMs}ms avg${X}`);
  });

  process.stdout.write([
    '',
    `  ${topB}`,
    r(`${grad3('Session Summary', [255, 230, 120], [255, 180, 50], [255, 140, 20])}`),
    r(''),
    r(`${WHITE}${B}${stats.requests}${X} ${GHOST}total requests${X}  ${GHOST}·${X}  ${TEAL}${stats.api}${X} ${GHOST}api${X}  ${GHOST}·${X}  ${PURPLE}${stats.pages}${X} ${GHOST}pages${X}  ${GHOST}·${X}  ${SILVER}${stats.assets}${X} ${GHOST}static${X}` +
      (stats.errors > 0 ? `  ${GHOST}·${X}  ${RED}${B}${stats.errors}${X} ${GHOST}errors${X}` : '')),
    r(`${GHOST}avg${X} ${avg < 100 ? GREEN : AMBER}${B}${avg}ms${X}  ${GHOST}·${X}  ${GHOST}fast${X} ${GREEN}${Math.round(stats.fastest)}ms${X}  ${GHOST}·${X}  ${GHOST}slow${X} ${RED}${Math.round(stats.slowest)}ms${X}  ${GHOST}·${X}  ${GHOST}rps${X} ${SKY}${rps}${X}  ${GHOST}·${X}  ${GHOST}cache${X} ${GREEN}${stats.cached}${X}`),
    r(`${GHOST}uptime${X} ${SILVER}${mm}m ${ss}s${X}  ${GHOST}·${X}  ${GHOST}compiles${X} ${PURPLE}${stats.compiles}${X}  ${GHOST}·${X}  ${sparkline(stats.recentMs, 20)}`),
    r(''),
    `  ${midB}`,
    r(`${GHOST}${I}Hot Routes${X}`),
    ...routeLines,
    r(''),
    `  ${botB}`,
    '',
  ].join('\n') + '\n');
}

// ─── PROCESS SPAWNER ───────────────────────────────────────────
const args = process.argv.slice(2);
const localNext = resolve('node_modules', '.bin', 'next');
const nextBin = existsSync(localNext) ? localNext : 'next';

// Prevent multiple dev servers from writing to `.next/dev` at the same time.
// This is especially important with Turbopack persistence, which can corrupt
// the dev output if two instances overlap.
const lockDir = resolve('.next');
const lockPath = resolve(lockDir, 'dev-server.lock.json');

function pidIsRunning(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function acquireLock() {
  mkdirSync(lockDir, { recursive: true });

  if (existsSync(lockPath)) {
    try {
      const raw = readFileSync(lockPath, 'utf8');
      const parsed = JSON.parse(raw);
      const lockedPid = parsed?.pid;
      if (pidIsRunning(lockedPid)) {
        const startedAt = parsed?.startedAt ? new Date(parsed.startedAt).toLocaleString() : 'unknown time';
        process.stdout.write(
          `\n${RED}${B}✖${X}  ${CORAL}Another dev server is already running (pid ${lockedPid}, started ${startedAt}).${X}\n` +
          `  ${PEACH}Stop the existing process (or close the old VS Code task) before starting a new one.${X}\n\n`
        );
        process.exit(1);
      }
    } catch {
      // Ignore unreadable/invalid lock; we'll overwrite it.
    }
  }

  const payload = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    args,
  };
  writeFileSync(lockPath, JSON.stringify(payload, null, 2));
}

function releaseLock() {
  try {
    if (existsSync(lockPath)) unlinkSync(lockPath);
  } catch {
    // Best-effort cleanup.
  }
}

acquireLock();

const child = spawn(nextBin, ['dev', ...args], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', FORCE_COLOR: '1' },
});

let stdoutBuf = '';
let stderrBuf = '';

function processChunk(chunk, buf) {
  buf += chunk.toString();
  const lines = buf.split('\n');
  buf = lines.pop() || '';
  for (const ln of lines) {
    const out = formatLine(ln);
    if (out) process.stdout.write(out + '\n');
  }
  return buf;
}

child.stdout.on('data', (d) => { stdoutBuf = processChunk(d, stdoutBuf); });
child.stderr.on('data', (d) => { stderrBuf = processChunk(d, stderrBuf); });

child.on('close', (code) => {
  if (stdoutBuf.trim()) process.stdout.write(formatLine(stdoutBuf) + '\n');
  if (stderrBuf.trim()) process.stdout.write(formatLine(stderrBuf) + '\n');
  stopKeepAlive();
  printSummary();
  releaseLock();
  process.exit(code || 0);
});

process.on('SIGINT',  () => {
  stopKeepAlive();
  releaseLock();
  child.kill('SIGINT');
});
process.on('SIGTERM', () => {
  stopKeepAlive();
  releaseLock();
  child.kill('SIGTERM');
});
process.on('exit', () => {
  stopKeepAlive();
  releaseLock();
});
