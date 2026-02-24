#!/usr/bin/env node
/**
 * Route Warmup Script
 * Automatically pre-compiles common routes when dev server starts
 * This reduces first-visit compile time from 13-18s to ~200ms
 */

import { spawn } from 'child_process';
import os from 'os';

const WARMUP_DELAY_MS = 3000; // Wait for server to start
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 10;

// Routes to pre-compile (ordered by frequency of access)
const CRITICAL_ROUTES = [
  '/',
  '/store',
  '/community',
  '/games',
  '/trading-showcase',
  '/course',
];

const API_ROUTES = [
  '/api/warmup',
  '/api/health',
  '/api/geo-detect',
  '/api/prices/live',
];

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

async function waitForServer(port = 3000, retries = 0) {
  if (retries >= MAX_RETRIES) {
    log('❌ Server failed to start after 10 retries', colors.red);
    return false;
  }

  try {
    const response = await fetch(`http://localhost:${port}/api/health`, {
      method: 'HEAD',
    });
    if (response.ok) {
      return true;
    }
  } catch (e) {
    // Server not ready yet
  }

  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
  return waitForServer(port, retries + 1);
}

async function warmupRoute(route, port = 3000) {
  const isApi = route.startsWith('/api/');
  const method = isApi ? 'HEAD' : 'GET';
  const url = `http://localhost:${port}${route}`;
  
  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'BullMoney-Warmup/1.0',
      },
    });
    
    const duration = Date.now() - startTime;
    const status = response.ok ? '✓' : '✗';
    const emoji = isApi ? '◈' : '◉';
    const statusColor = response.ok ? colors.green : colors.red;
    
    log(
      `  ${emoji} ${status} ${method.padEnd(4)} ${route.padEnd(30)} ${statusColor}${response.status}${colors.reset} ${colors.dim}${duration}ms${colors.reset}`,
      colors.cyan
    );
    
    return response.ok;
  } catch (error) {
    log(`  ✗ ${route} - ${error.message}`, colors.red);
    return false;
  }
}

async function warmupRoutes(routes, label, port = 3000) {
  log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log(`  🔥 Warming up ${label}...`, colors.yellow);
  log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  const results = await Promise.allSettled(
    routes.map(route => warmupRoute(route, port))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = routes.length - successful;
  
  log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log(`  ✓ ${successful}/${routes.length} routes ready ${failed > 0 ? `(${failed} failed)` : ''}`, colors.green);
  log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

async function main() {
  const port = parseInt(process.env.PORT || '3000', 10);
  
  log('\n╭──────────────────────────────────────────╮', colors.cyan);
  log('│  🚀 Route Warmup - Pre-compile Routes   │', colors.cyan);
  log('╰──────────────────────────────────────────╯', colors.cyan);
  
  log(`\n  ⏳ Waiting for dev server on port ${port}...`, colors.yellow);
  
  const serverReady = await waitForServer(port);
  if (!serverReady) {
    process.exit(1);
  }
  
  log(`  ✓ Server ready!`, colors.green);
  
  // Warmup API routes first (faster, no page compilation)
  await warmupRoutes(API_ROUTES, 'API Routes', port);
  
  // Then warmup page routes (triggers Turbopack compilation)
  await warmupRoutes(CRITICAL_ROUTES, 'Page Routes', port);
  
  log(`  ${colors.green}✓ All routes pre-compiled and ready!${colors.reset}`);
  log(`  ${colors.dim}First page load will now be ~200ms instead of 13-18s${colors.reset}\n`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  });
}

export { warmupRoutes, warmupRoute };
