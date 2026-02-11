#!/usr/bin/env node

/**
 * Platform Detection Helper
 * Automatically detects your system and recommends optimal npm scripts
 */

import os from 'os';
import { execSync } from 'child_process';

const platform = os.platform();
const arch = os.arch();
const cpus = os.cpus().length;
const totalMem = Math.round(os.totalmem() / (1024 ** 3)); // GB
const freeMem = Math.round(os.freemem() / (1024 ** 3)); // GB

const isAppleSilicon = platform === 'darwin' && arch === 'arm64';
const isIntelMac = platform === 'darwin' && (arch === 'x64' || arch === 'ia32');
const isWindows = platform === 'win32';
const isLinux = platform === 'linux';

console.log('\n🔍 Platform Detection\n');
console.log('═══════════════════════════════════════════════════════');
console.log(`Platform:       ${platform}`);
console.log(`Architecture:   ${arch}`);
console.log(`CPUs:           ${cpus} cores`);
console.log(`Total Memory:   ${totalMem} GB`);
console.log(`Free Memory:    ${freeMem} GB`);
console.log('═══════════════════════════════════════════════════════\n');

// Detect Node.js version
const nodeVersion = process.version;
console.log(`Node.js:        ${nodeVersion}`);

// Check if running native ARM on Apple Silicon
if (isAppleSilicon) {
  try {
    const nodeArch = execSync('node -p "process.arch"', { encoding: 'utf-8' }).trim();
    if (nodeArch === 'arm64') {
      console.log('✅ Running native ARM64 Node.js (optimal!)');
    } else {
      console.log('⚠️  Running x64 Node.js via Rosetta 2 (slower)');
      console.log('   Recommendation: Install ARM64 Node.js for 30-50% faster builds');
      console.log('   Download: https://nodejs.org/en/download/');
    }
  } catch (e) {
    // Ignore error
  }
}

console.log('\n');

// Recommend optimal scripts
console.log('🚀 Recommended npm scripts for your system:\n');

if (isAppleSilicon) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║           🍎 Apple Silicon (M1/M2/M3) Detected         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('  Development (Recommended):');
  console.log('  → npm run dev:silicon      # 20GB memory, max performance');
  console.log('  → npm run dev:fast         # 16GB memory, very fast');
  console.log('  → npm run dev              # 12GB memory, standard\n');
  console.log('  Building:');
  console.log('  → npm run build:silicon    # 16GB memory, fastest builds');
  console.log('  → npm run build            # 8GB memory, standard\n');
  console.log('  Why Apple Silicon is faster:');
  console.log('  ✅ Native ARM64 binaries (30-50% faster)');
  console.log('  ✅ Unified memory architecture (faster access)');
  console.log('  ✅ Better power efficiency (less throttling)');
  console.log('  ✅ More aggressive parallelization\n');
  
  if (totalMem >= 16) {
    console.log('  💡 You have 16GB+ RAM - use dev:silicon for best performance!');
  } else if (totalMem >= 8) {
    console.log('  💡 You have 8GB+ RAM - use dev:fast for good performance');
  } else {
    console.log('  💡 You have <8GB RAM - use dev:standard to avoid swapping');
  }
  
} else if (isIntelMac) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║            💻 Intel Mac Detected                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('  Development (Recommended):');
  console.log('  → npm run dev:fast         # 16GB memory, fast');
  console.log('  → npm run dev              # 12GB memory, standard\n');
  console.log('  Building:');
  console.log('  → npm run build            # 8GB memory, standard\n');
  
  if (totalMem >= 16) {
    console.log('  💡 You have 16GB+ RAM - use dev:fast for best performance');
  } else if (totalMem >= 8) {
    console.log('  💡 You have 8GB+ RAM - use dev for good performance');
  } else {
    console.log('  💡 You have <8GB RAM - use dev:standard to avoid swapping');
  }
  
} else if (isWindows) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║            🪟 Windows Detected                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('  Development (Recommended):');
  console.log('  → npm run dev:windows      # 12GB memory, Windows-optimized');
  console.log('  → npm run dev:fast         # 16GB memory, maximum speed');
  console.log('  → npm run dev              # 12GB memory, standard\n');
  console.log('  Building:');
  console.log('  → npm run build:windows    # 12GB memory, Windows paths');
  console.log('  → npm run build            # 8GB memory, standard\n');
  console.log('  Windows-specific optimizations:');
  console.log('  ✅ Normalized path separators (forward slashes)');
  console.log('  ✅ Long path support enabled');
  console.log('  ✅ Faster builds with disabled pathinfo');
  console.log('  ✅ cross-env for environment variables\n');
  
  if (totalMem >= 16) {
    console.log('  💡 You have 16GB+ RAM - use dev:fast for best performance');
  } else if (totalMem >= 8) {
    console.log('  💡 You have 8GB+ RAM - use dev:windows for optimized performance');
  } else {
    console.log('  💡 You have <8GB RAM - use dev:standard to avoid swapping');
  }
  
} else if (isLinux) {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║            🐧 Linux Detected                           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('  Development (Recommended):');
  console.log('  → npm run dev:fast         # 16GB memory, fast');
  console.log('  → npm run dev              # 12GB memory, standard\n');
  console.log('  Building:');
  console.log('  → npm run build            # 8GB memory, standard\n');
  
  if (totalMem >= 16) {
    console.log('  💡 You have 16GB+ RAM - use dev:fast for best performance');
  } else if (totalMem >= 8) {
    console.log('  💡 You have 8GB+ RAM - use dev for good performance');
  } else {
    console.log('  💡 You have <8GB RAM - use dev:standard to avoid swapping');
  }
}

console.log('\n');

// Performance tips
console.log('⚡ Performance Tips:\n');
console.log('  1. Close unused applications to free up RAM');
console.log('  2. Use SSD for faster file access (avoid HDDs)');
console.log('  3. Keep Node.js updated (latest LTS recommended)');
console.log('  4. Use --turbo flag for Turbopack (2-3x faster HMR)');
console.log('  5. Disable antivirus scanning for node_modules folder');

if (isAppleSilicon) {
  console.log('  6. Install native ARM64 packages when available');
  console.log('  7. Use Homebrew ARM64 version (/opt/homebrew)');
}

if (isWindows) {
  console.log('  6. Run terminal as Administrator for faster npm installs');
  console.log('  7. Use Windows Terminal instead of CMD for better performance');
  console.log('  8. Enable Developer Mode for faster file operations');
}

console.log('\n═══════════════════════════════════════════════════════\n');
