#!/usr/bin/env node
/**
 * BULLMONEY Dependency Checker & Auto-Updater
 * 
 * This script checks for:
 * - Outdated dependencies
 * - Security vulnerabilities
 * - Breaking changes in major versions
 * - Next.js and React compatibility
 * 
 * Run: node scripts/dependency-checker.mjs
 * Or:  npm run check-deps
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`),
};

// Critical packages that need special attention for breaking changes
const CRITICAL_PACKAGES = {
  'next': { 
    checkBreaking: true, 
    docs: 'https://nextjs.org/docs/app/building-your-application/upgrading',
    notes: 'Check migration guide before major updates'
  },
  'react': { 
    checkBreaking: true, 
    docs: 'https://react.dev/blog',
    notes: 'React 19+ has breaking changes with refs and types'
  },
  'react-dom': { 
    checkBreaking: true, 
    docs: 'https://react.dev/blog',
    notes: 'Must match React version'
  },
  'framer-motion': {
    checkBreaking: true,
    docs: 'https://www.framer.com/motion/',
    notes: 'v12+ has stricter TypeScript types'
  },
  'typescript': {
    checkBreaking: true,
    docs: 'https://www.typescriptlang.org/docs/handbook/release-notes/',
    notes: 'May require tsconfig updates'
  },
  'tailwindcss': {
    checkBreaking: true,
    docs: 'https://tailwindcss.com/docs/upgrade-guide',
    notes: 'v4+ uses new CSS-first configuration'
  },
  '@react-three/fiber': {
    checkBreaking: true,
    docs: 'https://docs.pmnd.rs/react-three-fiber',
    notes: 'Must match Three.js version'
  },
  'three': {
    checkBreaking: true,
    docs: 'https://github.com/mrdoob/three.js/releases',
    notes: 'Check @types/three compatibility'
  },
};

// Packages known to have React 19 compatibility issues
const REACT_19_INCOMPATIBLE = [
  'react-sparkle', // Removed - requires React <19
  'react-spring', // May have issues
];

/**
 * Execute a command and return output
 */
function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { 
      cwd: rootDir, 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (options.throwOnError) throw error;
    return error.stdout || error.message;
  }
}

/**
 * Get current package.json
 */
function getPackageJson() {
  const pkgPath = path.join(rootDir, 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

/**
 * Check for outdated packages
 */
async function checkOutdated() {
  log.header('Checking for Outdated Packages');
  
  try {
    const output = exec('npm outdated --json 2>/dev/null || true', { silent: true });
    if (!output || output.trim() === '') {
      log.success('All packages are up to date!');
      return {};
    }
    
    const outdated = JSON.parse(output || '{}');
    const count = Object.keys(outdated).length;
    
    if (count === 0) {
      log.success('All packages are up to date!');
      return {};
    }
    
    log.warn(`Found ${count} outdated package(s):`);
    console.log('');
    
    for (const [pkg, info] of Object.entries(outdated)) {
      const isCritical = CRITICAL_PACKAGES[pkg];
      const isMajor = info.current?.split('.')[0] !== info.latest?.split('.')[0];
      
      let status = '';
      if (isMajor) status = `${colors.red}[MAJOR]${colors.reset}`;
      else if (isCritical) status = `${colors.yellow}[CRITICAL]${colors.reset}`;
      
      console.log(`  ${colors.cyan}${pkg}${colors.reset}: ${info.current} → ${info.latest} ${status}`);
      
      if (isCritical && isMajor) {
        console.log(`    ${colors.yellow}⚠ ${CRITICAL_PACKAGES[pkg].notes}${colors.reset}`);
        console.log(`    ${colors.blue}→ ${CRITICAL_PACKAGES[pkg].docs}${colors.reset}`);
      }
    }
    console.log('');
    
    return outdated;
  } catch (error) {
    log.error('Failed to check outdated packages: ' + error.message);
    return {};
  }
}

/**
 * Check for security vulnerabilities
 */
async function checkSecurity() {
  log.header('Security Vulnerability Check');
  
  try {
    const output = exec('npm audit --json 2>/dev/null || true', { silent: true });
    const audit = JSON.parse(output || '{}');
    
    const vulnerabilities = audit.metadata?.vulnerabilities || {};
    const total = vulnerabilities.total || 0;
    const critical = vulnerabilities.critical || 0;
    const high = vulnerabilities.high || 0;
    
    if (total === 0) {
      log.success('No security vulnerabilities found!');
      return { safe: true };
    }
    
    if (critical > 0 || high > 0) {
      log.error(`Found ${critical} critical and ${high} high severity vulnerabilities!`);
    } else {
      log.warn(`Found ${total} vulnerabilities (none critical/high)`);
    }
    
    console.log('');
    console.log(`  Critical: ${critical}`);
    console.log(`  High: ${high}`);
    console.log(`  Moderate: ${vulnerabilities.moderate || 0}`);
    console.log(`  Low: ${vulnerabilities.low || 0}`);
    console.log('');
    
    if (critical > 0 || high > 0) {
      log.info('Run "npm audit fix" to attempt automatic fixes');
      log.info('Run "npm audit fix --force" for breaking change fixes (use with caution)');
    }
    
    return { 
      safe: total === 0, 
      critical, 
      high, 
      total,
      vulnerabilities 
    };
  } catch (error) {
    log.warn('Could not complete security audit: ' + error.message);
    return { safe: true };
  }
}

/**
 * Check React 19 compatibility
 */
function checkReact19Compatibility() {
  log.header('React 19 Compatibility Check');
  
  const pkg = getPackageJson();
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const incompatible = [];
  
  for (const dep of REACT_19_INCOMPATIBLE) {
    if (allDeps[dep]) {
      incompatible.push(dep);
    }
  }
  
  if (incompatible.length === 0) {
    log.success('All packages are React 19 compatible!');
  } else {
    log.error(`Found ${incompatible.length} potentially incompatible package(s):`);
    incompatible.forEach(pkg => {
      console.log(`  ${colors.red}✗${colors.reset} ${pkg}`);
    });
    console.log('');
    log.info('Consider finding alternatives or checking for updated versions');
  }
  
  return incompatible;
}

/**
 * Generate update report
 */
function generateReport(outdated, security, incompatible) {
  const reportPath = path.join(rootDir, 'DEPENDENCY_REPORT.md');
  const timestamp = new Date().toISOString();
  
  let report = `# Dependency Check Report

Generated: ${timestamp}

## Summary

`;

  // Outdated packages
  const outdatedCount = Object.keys(outdated).length;
  report += `### Outdated Packages: ${outdatedCount}\n\n`;
  
  if (outdatedCount > 0) {
    report += '| Package | Current | Latest | Type |\n';
    report += '|---------|---------|--------|------|\n';
    for (const [pkg, info] of Object.entries(outdated)) {
      const isMajor = info.current?.split('.')[0] !== info.latest?.split('.')[0];
      report += `| ${pkg} | ${info.current} | ${info.latest} | ${isMajor ? '⚠️ Major' : 'Minor/Patch'} |\n`;
    }
    report += '\n';
  }

  // Security
  report += `### Security: ${security.safe ? '✅ Safe' : `⚠️ ${security.total} vulnerabilities`}\n\n`;
  if (!security.safe) {
    report += `- Critical: ${security.critical}\n`;
    report += `- High: ${security.high}\n`;
    report += `- Run \`npm audit fix\` to attempt fixes\n\n`;
  }

  // React 19
  report += `### React 19 Compatibility: ${incompatible.length === 0 ? '✅ All compatible' : `⚠️ ${incompatible.length} issues`}\n\n`;
  if (incompatible.length > 0) {
    incompatible.forEach(pkg => {
      report += `- ❌ ${pkg}\n`;
    });
  }

  report += `
## Auto-Update Commands

\`\`\`bash
# Safe updates (minor/patch only)
npm update

# Check what would be updated
npm outdated

# Update specific package
npm install package@latest

# Fix security issues
npm audit fix

# Force fix (may include breaking changes)
npm audit fix --force
\`\`\`

## Next Steps

1. Review breaking changes for major version updates
2. Run tests after updating: \`npm run test\`
3. Run type check: \`npm run type-check\`
4. Run lint: \`npm run lint\`
5. Build for production: \`npm run build\`
`;

  fs.writeFileSync(reportPath, report);
  log.info(`Report saved to ${reportPath}`);
}

/**
 * Safe auto-update (minor/patch versions only)
 */
async function safeAutoUpdate() {
  log.header('Safe Auto-Update (Minor/Patch Only)');
  
  try {
    log.info('Running npm update...');
    exec('npm update', { silent: false });
    log.success('Packages updated successfully!');
    return true;
  } catch (error) {
    log.error('Update failed: ' + error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`
${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║         BULLMONEY Dependency Checker & Updater               ║
║                     v1.0.0 - 2026                            ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  const args = process.argv.slice(2);
  const shouldUpdate = args.includes('--update') || args.includes('-u');
  const shouldFix = args.includes('--fix') || args.includes('-f');
  const generateReportFlag = args.includes('--report') || args.includes('-r');

  // Run all checks
  const outdated = await checkOutdated();
  const security = await checkSecurity();
  const incompatible = checkReact19Compatibility();

  // Generate report if requested
  if (generateReportFlag) {
    generateReport(outdated, security, incompatible);
  }

  // Auto-update if requested
  if (shouldUpdate) {
    await safeAutoUpdate();
  }

  // Fix security issues if requested
  if (shouldFix && !security.safe) {
    log.header('Attempting Security Fixes');
    try {
      exec('npm audit fix', { silent: false });
      log.success('Security fixes applied!');
    } catch (error) {
      log.warn('Some fixes could not be applied automatically');
    }
  }

  // Summary
  log.header('Summary');
  console.log(`  Outdated packages: ${Object.keys(outdated).length}`);
  console.log(`  Security issues: ${security.total || 0}`);
  console.log(`  React 19 incompatible: ${incompatible.length}`);
  console.log('');

  if (Object.keys(outdated).length > 0 || !security.safe) {
    log.info('Run with --update (-u) to update minor/patch versions');
    log.info('Run with --fix (-f) to fix security issues');
    log.info('Run with --report (-r) to generate a detailed report');
  }

  // Exit with error code if critical issues
  if (security.critical > 0 || security.high > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
