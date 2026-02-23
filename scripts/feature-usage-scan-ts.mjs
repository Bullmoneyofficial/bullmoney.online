#!/usr/bin/env node
/**
 * More comprehensive feature usage scan using TypeScript module resolution.
 *
 * - Uses tsconfig paths/baseUrl resolution.
 * - Follows: import/export-from, dynamic import("..."), require("...")
 * - Produces a report scoped to Home + Store + Games + Design.
 */

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT = process.cwd();

const ENTRY_BASENAMES = new Set([
  'page',
  'layout',
  'loading',
  'error',
  'route',
  'template',
  'not-found',
  'default',
]);

const CODE_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.css',
]);

const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'static-app',
  'my-app',
  'portfolio-overlay',
  'Bullcasino',
  'casino-backend',
]);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function safeRel(p) {
  try {
    return toPosix(path.relative(ROOT, p));
  } catch {
    return toPosix(p);
  }
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

function walkDir(dirPath, { includeExtensions = null } = {}) {
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
      if (EXCLUDE_DIRS.has(ent.name)) continue;
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!ent.isFile()) continue;
      if (includeExtensions) {
        const ext = path.extname(ent.name);
        if (!includeExtensions.has(ext)) continue;
      }
      out.push(full);
    }
  }
  return out;
}

function groupByTopFolder(absPaths) {
  const counts = new Map();
  for (const p of absPaths) {
    const rel = safeRel(p);
    const top = rel.split('/')[0] || '.';
    counts.set(top, (counts.get(top) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

function collectRouteEntrypoints(dir) {
  if (!isDir(dir)) return [];
  const files = walkDir(dir, { includeExtensions: new Set(['.ts', '.tsx', '.js', '.jsx']) });
  return files.filter((p) => ENTRY_BASENAMES.has(path.basename(p, path.extname(p))));
}

function uniqSorted(arr) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

function readTsConfig() {
  const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) {
    return { options: {}, host: ts.sys, configFilePath: undefined };
  }

  const readResult = ts.readConfigFile(configPath, ts.sys.readFile);
  if (readResult.error) {
    const msg = ts.flattenDiagnosticMessageText(readResult.error.messageText, '\n');
    throw new Error(`Failed to read tsconfig: ${msg}`);
  }

  const configJson = readResult.config;
  const parsed = ts.parseJsonConfigFileContent(configJson, ts.sys, ROOT);

  // Next.js projects commonly rely on these; keep resolution predictable.
  const options = {
    ...parsed.options,
    allowJs: true,
    resolveJsonModule: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  };

  return { options, host: ts.sys, configFilePath: configPath };
}

function tryResolveCssLike(fromFile, spec) {
  if (!spec) return null;
  if (!spec.startsWith('./') && !spec.startsWith('../') && !spec.startsWith('@/')) return null;

  if (!/\.(css|scss|sass|less)$/.test(spec)) return null;

  let target;
  if (spec.startsWith('@/')) target = path.join(ROOT, spec.slice(2));
  else target = path.resolve(path.dirname(fromFile), spec);

  target = target.split('?')[0].split('#')[0];
  return isFile(target) ? target : null;
}

function isProjectFile(p) {
  const rel = toPosix(path.relative(ROOT, p));
  if (rel.startsWith('..')) return false;
  if (rel.startsWith('node_modules/')) return false;
  if (rel.startsWith('.next/')) return false;
  return true;
}

function resolveModule(fromFile, spec, compilerOptions) {
  const cssResolved = tryResolveCssLike(fromFile, spec);
  if (cssResolved) return cssResolved;

  // Ignore public/asset rooted imports
  if (spec.startsWith('http://') || spec.startsWith('https://') || spec.startsWith('node:') || spec.startsWith('/')) {
    return null;
  }

  // Only follow relative/aliased. Let TS resolve aliased via paths.
  const isRelative = spec.startsWith('./') || spec.startsWith('../');
  const isAliased = spec.startsWith('@/');
  if (!isRelative && !isAliased) return null;

  const resolved = ts.resolveModuleName(spec, fromFile, compilerOptions, ts.sys);
  const filename = resolved?.resolvedModule?.resolvedFileName;
  if (!filename) return null;

  // Strip TS virtual extensions
  const normalized = filename.replace(/\?.*$/, '');
  if (!isProjectFile(normalized)) return null;

  // TS can resolve to .d.ts; we still count it, but for “file cleanup” it’s less useful.
  return path.resolve(normalized);
}

function collectImportSpecifiers(sourceFile) {
  const specs = [];

  const add = (text, kind) => {
    if (typeof text === 'string' && text.length > 0) specs.push({ spec: text, kind });
  };

  const visit = (node) => {
    // import ... from 'x'
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text, 'import');
    }

    // export ... from 'x'
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text, 'export-from');
    }

    // require('x')
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      add(node.arguments[0].text, 'require');
    }

    // import('x')
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg0 = node.arguments[0];
      if (arg0 && ts.isStringLiteral(arg0)) {
        add(arg0.text, 'dynamic-import');
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return specs;
}

function buildUsageGraph(entryFiles, compilerOptions) {
  const used = new Set();
  const queue = entryFiles.map((f) => path.resolve(f));

  const entrySet = new Set(queue);
  const unresolvedDynamicImports = new Map(); // file -> count
  const parentOf = new Map(); // child -> { from, spec, kind }

  while (queue.length) {
    const file = queue.pop();
    if (!file || used.has(file)) continue;
    if (!isFile(file)) continue;
    if (!isProjectFile(file)) continue;

    used.add(file);

    const ext = path.extname(file);
    const isCode = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext);
    if (!isCode) continue;

    let sourceText;
    try {
      sourceText = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const sf = ts.createSourceFile(file, sourceText, ts.ScriptTarget.ES2022, true);

    // Track dynamic imports we can’t resolve (template literals etc.)
    const visitForUnresolved = (node) => {
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const arg0 = node.arguments[0];
        if (arg0 && !ts.isStringLiteral(arg0)) {
          unresolvedDynamicImports.set(file, (unresolvedDynamicImports.get(file) || 0) + 1);
        }
      }
      ts.forEachChild(node, visitForUnresolved);
    };
    visitForUnresolved(sf);

    const specs = collectImportSpecifiers(sf);
    for (const { spec, kind } of specs) {
      const resolved = resolveModule(file, spec, compilerOptions);
      if (!resolved) continue;

      // Record provenance the first time we discover a child.
      if (!parentOf.has(resolved)) {
        parentOf.set(resolved, { from: file, spec, kind });
      }
      if (!used.has(resolved)) queue.push(resolved);
    }
  }

  // Mark entrypoints as such.
  for (const entry of entrySet) {
    if (!parentOf.has(entry)) parentOf.set(entry, { from: null, spec: null, kind: 'entrypoint' });
  }

  return { used, unresolvedDynamicImports, parentOf };
}

function formatList(items, { limit = 400 } = {}) {
  if (items.length === 0) return '_None_';
  const shown = items.slice(0, limit);
  const more = items.length - shown.length;
  const lines = shown.map((p) => `- ${toPosix(path.relative(ROOT, p))}`);
  if (more > 0) lines.push(`- …and ${more} more`);
  return lines.join('\n');
}

function scopeFiles(scopeDirs, extraFilter = null) {
  const files = [];
  for (const dir of scopeDirs) {
    if (!isDir(dir)) continue;
    files.push(...walkDir(dir, { includeExtensions: CODE_EXTS }));
  }
  const filtered = extraFilter ? files.filter(extraFilter) : files;
  return filtered.map((p) => path.resolve(p));
}

function main() {
  const { options: compilerOptions, configFilePath } = readTsConfig();

  const scanAllRoutes = process.argv.includes('--all');
  const scanWorkspaceUniverse = process.argv.includes('--workspace');

  const appDir = path.join(ROOT, 'app');

  const explicitHome = [
    path.join(appDir, 'layout.tsx'),
    path.join(appDir, 'page.tsx'),
    path.join(appDir, 'HomePageMobileEntry.tsx'),
    path.join(appDir, 'HomePageController.tsx'),
    path.join(appDir, 'HomePageClient.tsx'),
    path.join(appDir, 'HomePageShell.tsx'),
  ].filter(isFile);

  const entryFiles = uniqSorted(
    scanAllRoutes
      ? collectRouteEntrypoints(appDir)
      : [
          ...explicitHome,
          ...collectRouteEntrypoints(path.join(appDir, 'store')),
          ...collectRouteEntrypoints(path.join(appDir, 'games')),
          ...collectRouteEntrypoints(path.join(appDir, 'design')),
          ...collectRouteEntrypoints(path.join(appDir, 'designs')),
        ]
  );

  const { used, unresolvedDynamicImports, parentOf } = buildUsageGraph(entryFiles, compilerOptions);

  // Universe: all code-ish files in workspace (for dead-file counts)
  const workspaceUniverse = scanWorkspaceUniverse
    ? walkDir(ROOT, { includeExtensions: CODE_EXTS }).map((p) => path.resolve(p))
    : null;

  const scopes = [
    { name: 'Home (app root)', dirs: [appDir], filter: (p) => /\/app\/(HomePage|PageSections|SplinePage|Testimonial|page\.|layout\.)/.test(toPosix(p)) },
    { name: 'Store (app/store)', dirs: [path.join(appDir, 'store')] },
    { name: 'Games (app/games)', dirs: [path.join(appDir, 'games')] },
    { name: 'Design (app/design + app/designs)', dirs: [path.join(appDir, 'design'), path.join(appDir, 'designs')] },
    { name: 'Hooks (app/hooks)', dirs: [path.join(appDir, 'hooks')] },
    { name: 'Hooks (root /hooks)', dirs: [path.join(ROOT, 'hooks')] },
    { name: 'Components (components/home)', dirs: [path.join(ROOT, 'components', 'home')] },
    { name: 'Components (components/shop)', dirs: [path.join(ROOT, 'components', 'shop')] },
    { name: 'Components (components/store)', dirs: [path.join(ROOT, 'components', 'store')] },
    { name: 'Components (components/games)', dirs: [path.join(ROOT, 'components', 'games')] },
    { name: 'Lib (lib)', dirs: [path.join(ROOT, 'lib')] },
    { name: 'Contexts (contexts + context)', dirs: [path.join(ROOT, 'contexts'), path.join(ROOT, 'context')] },
    { name: 'Stores (stores)', dirs: [path.join(ROOT, 'stores')] },
    { name: 'Types (types)', dirs: [path.join(ROOT, 'types')] },
  ];

  const report = [];
  report.push(
    scanWorkspaceUniverse
      ? `# Dead File Report (TypeScript-resolved) — Workspace universe\n`
      : scanAllRoutes
        ? `# Usage Report (TypeScript-resolved) — All app routes\n`
        : `# Feature Usage Report (TypeScript-resolved) — Home + Store + Games + Design\n`
  );
  report.push(`Generated: ${new Date().toISOString()}\n`);
  report.push(`tsconfig: ${configFilePath ? toPosix(path.relative(ROOT, configFilePath)) : 'none'}\n`);
  report.push(`Entrypoints scanned: ${entryFiles.length}`);
  report.push(`Reachable files found: ${used.size}\n`);

  if (scanWorkspaceUniverse && workspaceUniverse) {
    const unused = workspaceUniverse.filter((p) => !used.has(p));
    report.push(`## Workspace totals\n`);
    report.push(`Universe files (code/css): ${workspaceUniverse.length}`);
    report.push(`Reachable from entrypoints: ${used.size}`);
    report.push(`Not referenced (dead-file candidates): ${unused.length}\n`);

    const usedTop = groupByTopFolder(workspaceUniverse.filter((p) => used.has(p)));
    const unusedTop = groupByTopFolder(unused);

    report.push(`### Top folders (used)\n`);
    report.push(
      usedTop.length
        ? usedTop.slice(0, 30).map((r) => `- ${r.name}: ${r.count}`).join('\n')
        : '_None_'
    );

    report.push(`\n### Top folders (not referenced)\n`);
    report.push(
      unusedTop.length
        ? unusedTop.slice(0, 30).map((r) => `- ${r.name}: ${r.count}`).join('\n')
        : '_None_'
    );

    report.push(`\n### Not referenced (workspace universe)\n`);
    report.push(formatList(unused, { limit: 2000 }));
  }

  report.push(`## Entrypoints\n`);
  report.push(formatList(entryFiles, { limit: 9999 }));

  const unresolved = Array.from(unresolvedDynamicImports.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([file, count]) => ({ file, count }));

  report.push(`\n## Unresolved dynamic imports\n`);
  report.push(
    unresolved.length
      ? unresolved.map(({ file, count }) => `- ${toPosix(path.relative(ROOT, file))} (count: ${count})`).join('\n')
      : '_None_'
  );

  for (const scope of scopes) {
    const all = scopeFiles(scope.dirs, scope.filter);
    if (all.length === 0) continue;

    const usedInScope = all.filter((p) => used.has(p));
    const unusedInScope = all.filter((p) => !used.has(p));

    report.push(`\n## ${scope.name}\n`);
    report.push(`Total files: ${all.length}`);
    report.push(`Used (reachable): ${usedInScope.length}`);
    report.push(`Not referenced from entrypoints: ${unusedInScope.length}\n`);

    report.push(`### Used\n`);
    report.push(formatList(usedInScope));

    report.push(`\n### Not referenced (candidates)\n`);
    report.push(formatList(unusedInScope));
  }

  const outDir = path.join(ROOT, 'reports');
  fs.mkdirSync(outDir, { recursive: true });

  const outMd = path.join(
    outDir,
    scanWorkspaceUniverse
      ? 'DEAD_FILES_WORKSPACE_TS.md'
      : scanAllRoutes
        ? 'USAGE_ALL_APP_ROUTES_TS.md'
        : 'FEATURE_USAGE_HOME_STORE_GAMES_DESIGN_TS.md'
  );
  fs.writeFileSync(outMd, report.join('\n'), 'utf8');

  const outJson = path.join(
    outDir,
    scanWorkspaceUniverse
      ? 'DEAD_FILES_WORKSPACE_TS.json'
      : scanAllRoutes
        ? 'USAGE_ALL_APP_ROUTES_TS.json'
        : 'FEATURE_USAGE_HOME_STORE_GAMES_DESIGN_TS.json'
  );
  fs.writeFileSync(
    outJson,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        scanAllRoutes,
        scanWorkspaceUniverse,
        entryFiles: entryFiles.map((p) => toPosix(path.relative(ROOT, p))),
        usedFiles: Array.from(used).map((p) => toPosix(path.relative(ROOT, p))),
        usedProvenance: Object.fromEntries(
          Array.from(parentOf.entries()).map(([child, meta]) => [
            toPosix(path.relative(ROOT, child)),
            meta && meta.from
              ? { from: toPosix(path.relative(ROOT, meta.from)), spec: meta.spec, kind: meta.kind }
              : { from: null, spec: meta?.spec ?? null, kind: meta?.kind ?? null },
          ])
        ),
        workspaceUniverseFiles: workspaceUniverse
          ? workspaceUniverse.map((p) => toPosix(path.relative(ROOT, p)))
          : undefined,
        workspaceUnusedFiles: workspaceUniverse
          ? workspaceUniverse.filter((p) => !used.has(p)).map((p) => toPosix(path.relative(ROOT, p)))
          : undefined,
        unresolvedDynamicImports: Object.fromEntries(
          Array.from(unresolvedDynamicImports.entries()).map(([k, v]) => [toPosix(path.relative(ROOT, k)), v])
        ),
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`Wrote ${toPosix(path.relative(ROOT, outMd))}`);
  console.log(`Wrote ${toPosix(path.relative(ROOT, outJson))}`);
}

main();
