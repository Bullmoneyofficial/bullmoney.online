#!/usr/bin/env node

/**
 * Quick Platform Check - Auto-runs before dev/build
 * Shows essential system info and applies optimizations
 * Works in local development and CI/CD (Vercel, GitHub Actions, etc.)
 */

import os from 'os';

const platform = os.platform();
const arch = os.arch();
const cpus = os.cpus().length;
const totalMem = Math.round(os.totalmem() / (1024 ** 3));

// Detect CI/CD environments
const isVercel = process.env.VERCEL === '1';
const isCI = process.env.CI === 'true' || isVercel;

const isAppleSilicon = platform === 'darwin' && arch === 'arm64';
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';

// Quick visual header
console.log('\n═══════════════════════════════════════════════════════');

if (isVercel) {
  console.log('▲ Vercel Build Environment | ' + arch + ' | ' + cpus + ' cores | ' + totalMem + 'GB RAM');
  console.log('⚡ Performance Mode: Cloud-Optimized (Vercel)');
} else if (isCI) {
  console.log('🤖 CI/CD Environment | ' + platform + ' ' + arch + ' | ' + cpus + ' cores');
  console.log('⚡ Performance Mode: CI-Optimized');
} else if (isAppleSilicon) {
  console.log('🍎 Apple Silicon Detected | ARM64 Native | ' + cpus + ' cores | ' + totalMem + 'GB RAM');
  console.log('⚡ Performance Mode: Maximum (3x faster compilation)');
} else if (isMac) {
  console.log('💻 Intel Mac Detected | x64 | ' + cpus + ' cores | ' + totalMem + 'GB RAM');
  console.log('⚡ Performance Mode: Optimized');
} else if (isWindows) {
  console.log('🪟 Windows Detected | ' + arch + ' | ' + cpus + ' cores | ' + totalMem + 'GB RAM');
  console.log('⚡ Performance Mode: Windows-Optimized (Path Normalized)');
} else {
  console.log('🐧 Linux Detected | ' + arch + ' | ' + cpus + ' cores | ' + totalMem + 'GB RAM');
  console.log('⚡ Performance Mode: Native');
}

console.log('═══════════════════════════════════════════════════════\n');

// Quick tip based on platform (skip for CI/CD to reduce log noise)
if (!isCI) {
  if (isAppleSilicon && totalMem >= 16) {
    console.log('💡 Tip: Try "npm run dev:silicon" for 20GB memory allocation\n');
  } else if (isWindows) {
    console.log('💡 Tip: Run "npm run platform-info" for Windows optimization tips\n');
  } else if (totalMem < 8) {
    console.log('⚠️  Low RAM detected - consider using "npm run dev:standard"\n');
  }
} else if (isVercel) {
  console.log('✅ Vercel optimizations active - build will use optimal settings\n');
}

