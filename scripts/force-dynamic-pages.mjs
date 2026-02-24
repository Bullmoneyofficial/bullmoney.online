#!/usr/bin/env node

/**
 * 🚀 FORCE DYNAMIC RENDERING SCRIPT
 * Adds export const dynamic = 'force-dynamic'; to pages to reduce Vercel build time
 */

import fs from 'fs';
import path from 'path';

const pagesToUpdate = [
  'app/portfolio/page.tsx',
  'app/design/page.tsx',
  'app/designs/page.tsx',
  'app/desktop/page.tsx',
  'app/login/page.tsx',
  'app/oldstore/page.tsx',
  'app/Prop/page.tsx',
  'app/quotes/page.tsx',
  'app/recruit/page.tsx',
  'app/resubscribe/page.tsx',
  'app/robots.txt/route.ts',
  'app/sitemap.xml/route.ts',
  'app/socials/page.tsx',
  'app/unsubscribe/page.tsx',
  'app/store/account/page.tsx',
  'app/store/admin/page.tsx',
  'app/store/admin/emails/page.tsx',
  'app/store/admin/newsletter/page.tsx',
  'app/store/admin/orders/page.tsx',
  'app/store/admin/products/page.tsx',
  'app/store/admin/products/new/page.tsx',
  'app/store/checkout/page.tsx',
  'app/store/gift-cards/page.tsx',
  'app/store/success/page.tsx',
];

const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('🚀 Adding dynamic rendering to pages for faster Vercel builds...\n');

let updatedCount = 0;

for (const pagePath of pagesToUpdate) {
  const fullPath = path.join(__dirname, '..', pagePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${pagePath} - file not found`);
    continue;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Skip if already has dynamic export
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`⏭️  Skipping ${pagePath} - already dynamic`);
      continue;
    }

    // Skip client components
    if (content.includes('"use client"') || content.includes("'use client'")) {
      console.log(`⏭️  Skipping ${pagePath} - client component`);
      continue;
    }

    // Add dynamic export after imports
    const importMatch = content.match(/^import.*$/gm);
    if (importMatch && importMatch.length > 0) {
      const lastImportIndex = content.lastIndexOf(importMatch[importMatch.length - 1]);
      const insertPosition = lastImportIndex + importMatch[importMatch.length - 1].length;

      const before = content.substring(0, insertPosition);
      const after = content.substring(insertPosition);

      content = before + '\n\n// Force dynamic rendering to reduce Vercel build time\nexport const dynamic = \'force-dynamic\';\n' + after;

      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated ${pagePath}`);
      updatedCount++;
    } else {
      console.log(`⚠️  Skipping ${pagePath} - no imports found`);
    }
  } catch (error) {
    console.log(`❌ Error updating ${pagePath}: ${error.message}`);
  }
}

console.log(`\n🎯 Updated ${updatedCount} pages with dynamic rendering`);
console.log('💡 This should significantly reduce Vercel build time by skipping static generation');