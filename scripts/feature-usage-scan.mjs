#!/usr/bin/env node
/**
 * Feature usage scanner (Home + Store + Games + Design)
 *
 * Builds a conservative reachability graph by following:
 * - static imports/exports (import ... from, export ... from)
 * - dynamic imports (import('...'))
 * - require('...')
 *
 * Notes:
 * - “Unused” in the report means: not reachable from the selected entrypoints.
 *   It may still be used by other routes/features.
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const CODE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css'];
const ROUTE_ENTRY_BASENAMES = new Set(['page', 'layout', 'loading', 'error', 'route', 'template', 'not-found', 'default']);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function walkDir(dirPath, { excludeDirNames = new Set(), includeExtensions = null } = {}) {
  const out = [];
  const stack = [dirPath];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        if (excludeDirNames.has(ent.name)) continue;
        stack.push(full);
      } else if (ent.isFile()) {
        if (includeExtensions) {
          const ext = path.extname(ent.name);
          if (!includeExtensions.has(ext)) continue;
        }
        out.push(full);
      }
    }
  }
  return out;
}

function tryResolveAsFile(basePathNoExt) {
  // If basePathNoExt already points to a file with ext, allow.
  if (isFile(basePathNoExt)) return basePathNoExt;

  for (const ext of CODE_EXTS) {
    const candidate = basePathNoExt + ext;
    if (isFile(candidate)) return candidate;
  }

  // Directory index resolution
  if (isDir(basePathNoExt)) {
    for (const ext of CODE_EXTS) {
      const idx = path.join(basePathNoExt, 'index' + ext);
      if (isFile(idx)) return idx;
    }
  }

  return null;
}

function resolveSpecifier(fromFile, spec) {
  if (!spec) return null;

  // Ignore URLs and node builtins
  if (spec.startsWith('http://') || spec.startsWith('https://')) return null;
  if (spec.startsWith('node:')) return null;

  // Only follow local-ish imports
  const isRelative = spec.startsWith('./') || spec.startsWith('../');
  const isAliased = spec.startsWith('@/');
  const isRooted = spec.startsWith('/');

  if (!isRelative && !isAliased && !isRooted) return null;

  let target;
  if (isAliased) {
    target = path.join(ROOT, spec.slice(2));
  } else if (isRelative) {
    target = path.resolve(path.dirname(fromFile), spec);
  } else if (isRooted) {
    // Next.js absolute imports like "/..." are usually public assets; don’t resolve as code.
    return null;
  }

  // Strip trailing query/hash if any (rare in code imports)
  target = target.split('?')[0].split('#')[0];

  return tryResolveAsFile(target);
}

function extractSpecifiers(sourceText) {
  const specs = new Set();

  const patterns = [
    /\bimport\s+[^;]*?\sfrom\s*["']([^"']+)["']/g,
    /\bexport\s+[^;]*?\sfrom\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
    // CSS side-effect imports: import "./x.css";
    /\bimport\s*["']([^"']+)["']\s*;?/g,
  ];

  for (const re of patterns) {
    let m;
    while ((m = re.exec(sourceText))) {
      const s = m[1];
      if (s) specs.add(s);
    }
  }

  return Array.from(specs);
}

function isParseableFile(p) {
  const ext = path.extname(p);
  return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext);
}

function buildGraph(entryFiles) {
  const visited = new Set();
  const queue = [...entryFiles];

  while (queue.length) {
    const file = queue.pop();
    if (!file) continue;
    const normalized = path.resolve(file);
    if (visited.has(normalized)) continue;
    if (!isFile(normalized)) continue;

    visited.add(normalized);

    if (!isParseableFile(normalized)) continue;

    let text;
    try {
      text = readText(normalized);
    } catch {
      continue;
    }

    const specs = extractSpecifiers(text);
    for (const spec of specs) {
      const resolved = resolveSpecifier(normalized, spec);
      if (!resolved) continue;
      const abs = path.resolve(resolved);
      if (!visited.has(abs)) queue.push(abs);
    }
  }

  return visited;
}

function collectRouteEntrypoints(dir) {
  const ex = new Set(['node_modules', '.next', '.git']);
  const files = walkDir(dir, { excludeDirNames: ex, includeExtensions: new Set(['.ts', '.tsx', '.js', '.jsx']) });
  return files.filter((p) => ROUTE_ENTRY_BASENAMES.has(path.basename(p, path.extname(p))));
}

function uniqSorted(arr) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

function formatList(items, { limit = 400 } = {}) {
  if (items.length === 0) return '_None_';
  const shown = items.slice(0, limit);
  const more = items.length - shown.length;
  const lines = shown.map((p) => `- ${toPosix(path.relative(ROOT, p))}`);
  if (more > 0) lines.push(`- …and ${more} more`);
  return lines.join('\n');
}

function main() {
  const appDir = path.join(ROOT, 'app');

  const explicitHome = [
    path.join(appDir, 'layout.tsx'),
    path.join(appDir, 'page.tsx'),
    path.join(appDir, 'HomePageMobileEntry.tsx'),
    path.join(appDir, 'HomePageController.tsx'),
    path.join(appDir, 'HomePageClient.tsx'),
    path.join(appDir, 'HomePageShell.tsx'),
  ].filter(isFile);

  const storeEntrypoints = collectRouteEntrypoints(path.join(appDir, 'store'));
  const gamesEntrypoints = collectRouteEntrypoints(path.join(appDir, 'games'));
  const designEntrypoints = collectRouteEntrypoints(path.join(appDir, 'design'));
  const designsEntrypoints = collectRouteEntrypoints(path.join(appDir, 'designs'));

  const entryFiles = uniqSorted([
    ...explicitHome,
    ...storeEntrypoints,
    ...gamesEntrypoints,
    ...designEntrypoints,
    ...designsEntrypoints,
  ]);

  const used = buildGraph(entryFiles);

  const scopes = [
    { name: 'Home (app root)', dir: appDir, filter: (p) => /\/app\/(HomePage|PageSections|SplinePage|Testimonial|page\.|layout\.)/.test(toPosix(p)) },
    { name: 'Store (app/store)', dir: path.join(appDir, 'store') },
    { name: 'Games (app/games)', dir: path.join(appDir, 'games') },
    { name: 'Design (app/design + app/designs)', dir: path.join(appDir, 'design'), extraDirs: [path.join(appDir, 'designs')] },
    { name: 'Hooks (app/hooks)', dir: path.join(appDir, 'hooks') },
    { name: 'Hooks (root /hooks)', dir: path.join(ROOT, 'hooks') },
    { name: 'Components (components/home)', dir: path.join(ROOT, 'components', 'home') },
    { name: 'Components (components/shop)', dir: path.join(ROOT, 'components', 'shop') },
    { name: 'Components (components/store)', dir: path.join(ROOT, 'components', 'store') },
    { name: 'Components (components/games)', dir: path.join(ROOT, 'components', 'games') },
    { name: 'Lib (lib)', dir: path.join(ROOT, 'lib') },
    { name: 'Contexts (contexts + context)', dir: path.join(ROOT, 'contexts'), extraDirs: [path.join(ROOT, 'context')] },
    { name: 'Stores (stores)', dir: path.join(ROOT, 'stores') },
    { name: 'Types (types)', dir: path.join(ROOT, 'types') },
  ];

  const exclude = new Set(['node_modules', '.next', '.git', 'static-app', 'my-app', 'portfolio-overlay', 'Bullcasino', 'casino-backend']);
  const includeExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css']);

  const reportParts = [];
  reportParts.push(`# Feature Usage Report — Home + Store + Games + Design\n`);
  reportParts.push(`Generated: ${new Date().toISOString()}\n`);
  reportParts.push(`Entrypoints scanned: ${entryFiles.length}`);
  reportParts.push(`Reachable files found: ${used.size}\n`);

  reportParts.push(`## Entrypoints\n`);
  reportParts.push(formatList(entryFiles, { limit: 9999 }));

  for (const scope of scopes) {
    const dirs = [scope.dir, ...(scope.extraDirs || [])].filter(isDir);
    if (dirs.length === 0) continue;

    let allFiles = [];
    for (const d of dirs) {
      allFiles.push(...walkDir(d, { excludeDirNames: exclude, includeExtensions: includeExts }));
    }

    if (scope.filter) {
      allFiles = allFiles.filter(scope.filter);
    }

    const allAbs = allFiles.map((p) => path.resolve(p));
    const usedInScope = allAbs.filter((p) => used.has(p));
    const unusedInScope = allAbs.filter((p) => !used.has(p));

    reportParts.push(`\n## ${scope.name}\n`);
    reportParts.push(`Total files: ${allAbs.length}`);
    reportParts.push(`Used (reachable): ${usedInScope.length}`);
    reportParts.push(`Not referenced from entrypoints: ${unusedInScope.length}\n`);

    reportParts.push(`### Used\n`);
    reportParts.push(formatList(usedInScope));

    reportParts.push(`\n### Not referenced (candidates)\n`);
    reportParts.push(formatList(unusedInScope));
  }

  const outDir = path.join(ROOT, 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'FEATURE_USAGE_HOME_STORE_GAMES_DESIGN.md');
  fs.writeFileSync(outPath, reportParts.join('\n'), 'utf8');

  const jsonPath = path.join(outDir, 'FEATURE_USAGE_HOME_STORE_GAMES_DESIGN.json');
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        entryFiles: entryFiles.map((p) => toPosix(path.relative(ROOT, p))),
        usedFiles: Array.from(used).map((p) => toPosix(path.relative(ROOT, p))),
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`Wrote ${toPosix(path.relative(ROOT, outPath))}`);
  console.log(`Wrote ${toPosix(path.relative(ROOT, jsonPath))}`);
}

main();
