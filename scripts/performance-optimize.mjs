#!/usr/bin/env node

/**
 * ═════════════════════════════════════════════════════════════════
 * PERFORMANCE OPTIMIZATION SCRIPT
 * Optimizes app loading, compilation, and runtime performance
 * ═════════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('\n╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮');
console.log('┃  ⚡ Performance Optimization Script               ┃');
console.log('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n');

// 1. Clear Next.js cache for fresh optimization
console.log('🧹 Clearing Next.js cache...');
try {
  execSync('rm -rf .next', { stdio: 'inherit' });
  console.log('✅ Cache cleared\n');
} catch (error) {
  console.log('⚠️  Could not clear cache\n');
}

// 2. Optimize package.json scripts for faster dev
console.log('📦 Optimizing package.json scripts...');
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add performance-focused scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'dev:perf': 'NODE_OPTIONS="--max-old-space-size=16384 --enable-source-maps=false" next dev --turbo',
  'build:perf': 'NODE_OPTIONS="--max-old-space-size=16384" next build',
  'analyze': 'npx @next/bundle-analyzer',
  'perf:check': 'npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json',
};

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('✅ Scripts optimized\n');

// 3. Create optimized _document.tsx for better loading
console.log('📄 Creating optimized _document.tsx...');
const documentPath = path.join(__dirname, '..', 'app', '_document.tsx');
const optimizedDocument = `import { Html, Head, Main, NextScript } from 'next/document';
import { memo } from 'react';

const OptimizedDocument = memo(() => {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Optimize resource hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />

        {/* Disable automatic detection of phone numbers */}
        <meta name="format-detection" content="telephone=no" />

        {/* Optimize for performance */}
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark light" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
});

OptimizedDocument.displayName = 'OptimizedDocument';

export default OptimizedDocument;
`;

if (!fs.existsSync(documentPath)) {
  fs.writeFileSync(documentPath, optimizedDocument);
  console.log('✅ _document.tsx created\n');
} else {
  console.log('⚠️  _document.tsx already exists\n');
}

// 4. Create performance monitoring middleware
console.log('🔍 Creating performance monitoring middleware...');
const middlewarePath = path.join(__dirname, '..', 'middleware.ts');
const performanceMiddleware = `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Performance headers
  const response = NextResponse.next();

  // Security headers that also help performance
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Cache control for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
`;

if (!fs.existsSync(middlewarePath)) {
  fs.writeFileSync(middlewarePath, performanceMiddleware);
  console.log('✅ Middleware created\n');
} else {
  console.log('⚠️  Middleware already exists\n');
}

// 5. Create optimized loading components
console.log('⚡ Creating optimized loading components...');
const loadingPath = path.join(__dirname, '..', 'app', 'loading.tsx');
const optimizedLoading = `export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin animation-delay-150" />
        </div>
        <div className="text-white/80 text-sm font-medium tracking-wide">
          Loading...
        </div>
      </div>
    </div>
  );
}
`;

if (!fs.existsSync(loadingPath)) {
  fs.writeFileSync(loadingPath, optimizedLoading);
  console.log('✅ Loading component created\n');
} else {
  console.log('⚠️  Loading component already exists\n');
}

// 6. Update .gitignore for performance
console.log('📝 Updating .gitignore for performance...');
const gitignorePath = path.join(__dirname, '..', '.gitignore');
let gitignore = '';

if (fs.existsSync(gitignorePath)) {
  gitignore = fs.readFileSync(gitignorePath, 'utf8');
}

// Add performance-related ignores
const perfIgnores = [
  '# Performance monitoring',
  'lighthouse-report.json',
  'performance-report.json',
  '*.performance.json',
  '',
  '# Build cache (keep for faster rebuilds)',
  '# .next/cache/',
  '',
  '# Bundle analyzer',
  'bundle-analyzer-report.html',
];

const newIgnores = perfIgnores.filter(ignore =>
  !gitignore.includes(ignore.replace('#', '').trim())
);

if (newIgnores.length > 0) {
  fs.appendFileSync(gitignorePath, '\n' + newIgnores.join('\n'));
  console.log('✅ .gitignore updated\n');
}

console.log('🎉 Performance optimizations complete!');
console.log('\nNext steps:');
console.log('1. Run: npm run dev:perf');
console.log('2. Run: npm run build:perf');
console.log('3. Run: npm run analyze (after build)');
console.log('4. Run: npm run perf:check (with dev server running)\n');