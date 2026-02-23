#!/usr/bin/env node
/**
 * Verify dead-file candidates by searching for string references across the repo.
 *
 * Inputs:
 * - reports/DEAD_FILES_WORKSPACE_TS.json (from feature-usage-scan-ts.mjs --all --workspace)
 *
 * Output:
 * - reports/DEAD_FILES_WORKSPACE_VERIFIED.md
 * - reports/DEAD_FILES_WORKSPACE_VERIFIED.json
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const ROOT = process.cwd();

const INPUT = path.join(ROOT, 'reports', 'DEAD_FILES_WORKSPACE_TS.json');
const OUT_MD = path.join(ROOT, 'reports', 'DEAD_FILES_WORKSPACE_VERIFIED.md');
const OUT_JSON = path.join(ROOT, 'reports', 'DEAD_FILES_WORKSPACE_VERIFIED.json');

const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'reports',
  '.venv',
  'Bullcasino',
  'casino-backend',
];

const SEARCH_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.json']);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function rel(p) {
  return toPosix(path.relative(ROOT, p));
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function walkFiles(dir) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (EXCLUDE_DIRS.includes(ent.name)) continue;
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile()) {
        const ext = path.extname(ent.name);
        if (SEARCH_EXTS.has(ext)) out.push(full);
      }
    }
  }
  return out;
}

function collectSearchFiles(usedFilesRel) {
  // Stronger signal: only consider references from files that are actually reachable/used
  // (plus selected config files that may inject URLs).
  const files = [];
  for (const relPath of usedFilesRel || []) {
    const full = path.join(ROOT, relPath);
    if (!isFile(full)) continue;
    const ext = path.extname(full);
    if (!SEARCH_EXTS.has(ext)) continue;
    files.push(full);
  }

  for (const p of ['next.config.mjs']) {
    const full = path.join(ROOT, p);
    if (isFile(full)) files.push(full);
  }

  return Array.from(new Set(files));
}

function grepFixed(patterns, files) {
  // Use a patterns file with `grep -F -f` for speed.
  const tmpDir = path.join(ROOT, 'reports');
  fs.mkdirSync(tmpDir, { recursive: true });

  const patFile = path.join(tmpDir, `__dead_verify_patterns_${Date.now()}.txt`);
  fs.writeFileSync(patFile, patterns.join('\n') + '\n', 'utf8');

  const args = ['-R', '-n', '-F', '-f', patFile, ...files];

  const res = spawnSync('grep', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 50,
  });

  try { fs.unlinkSync(patFile); } catch {}

  const out = res.stdout || '';
  // Output format: file:line:match
  const matches = out
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const idx1 = line.indexOf(':');
      const idx2 = idx1 >= 0 ? line.indexOf(':', idx1 + 1) : -1;
      const file = idx1 >= 0 ? line.slice(0, idx1) : null;
      const ln = idx2 >= 0 ? Number(line.slice(idx1 + 1, idx2)) : null;
      const text = idx2 >= 0 ? line.slice(idx2 + 1) : null;
      return { file, line: ln, text };
    })
    .filter((m) => m.file);

  return matches;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function classifyUnused(unused) {
  const toolchain = new Set([
    'next.config.mjs',
    'tailwind.config.ts',
    'Tailwind.Config.js',
    'postcss.config.mjs',
    'eslint.config.mjs',
    'next-env.d.ts',
    'global.d.ts',
    'declarations.d.ts',
    'proxy.ts',
    'turbopack.config.mjs',
  ]);

  const buckets = {
    toolchain: [],
    publicAsset: [],
    script: [],
    style: [],
    app: [],
    component: [],
    lib: [],
    hook: [],
    other: [],
  };

  for (const p of unused) {
    if (toolchain.has(p)) { buckets.toolchain.push(p); continue; }
    if (p.startsWith('public/')) { buckets.publicAsset.push(p); continue; }
    if (p.startsWith('scripts/')) { buckets.script.push(p); continue; }
    if (p.startsWith('styles/')) { buckets.style.push(p); continue; }
    if (p.startsWith('app/')) { buckets.app.push(p); continue; }
    if (p.startsWith('components/')) { buckets.component.push(p); continue; }
    if (p.startsWith('lib/')) { buckets.lib.push(p); continue; }
    if (p.startsWith('hooks/')) { buckets.hook.push(p); continue; }
    buckets.other.push(p);
  }

  return buckets;
}

function main() {
  if (!isFile(INPUT)) {
    console.error(`Missing input: ${rel(INPUT)}`);
    process.exit(1);
  }

  const json = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  const unused = (json.workspaceUnusedFiles || []).slice().sort();

  // Search corpus files once.
  const searchFiles = collectSearchFiles(json.usedFiles || []);

  // Build string patterns to detect non-import usages.
  // 1) public assets: search for URL path /<path-without-public>
  const publicUnused = unused.filter((p) => p.startsWith('public/'));
  const publicPatterns = publicUnused.map((p) => `/${p.slice('public/'.length)}`);

  // 2) styles/: search for exact path patterns plus filename (filename hits are weaker).
  const styleUnused = unused.filter((p) => p.startsWith('styles/'));
  const stylePathPatterns = styleUnused.flatMap((p) => [p, `@/${p}`]);
  const styleFileNames = Array.from(new Set(styleUnused.map((p) => path.basename(p))));

  const patterns = [
    ...publicPatterns,
    ...stylePathPatterns,
    ...styleFileNames,
  ].filter(Boolean);

  // Grep can handle a lot of patterns, but keep chunks to avoid OS arg limits.
  const patternChunks = chunk(patterns, 250);
  const matchMap = new Map(); // pattern -> [match]

  for (const pats of patternChunks) {
    const matches = grepFixed(pats, searchFiles);
    for (const m of matches) {
      // Ignore matches inside the verifier outputs/scripts themselves.
      const matchFileRel = toPosix(m.file);
      if (matchFileRel.includes('/reports/')) continue;
      if (matchFileRel.endsWith('/scripts/verify-dead-files.mjs')) continue;

      // Try to figure out which pattern matched by checking containment.
      for (const pat of pats) {
        if (m.text && m.text.includes(pat)) {
          const list = matchMap.get(pat) || [];
          list.push({ file: toPosix(m.file), line: m.line, text: m.text.slice(0, 240) });
          matchMap.set(pat, list);
        }
      }
    }
  }

  // Annotate each unused file with reference signals.
  const verified = [];
  for (const p of unused) {
    const info = { path: p, signals: [] };

    if (p.startsWith('public/')) {
      const url = `/${p.slice('public/'.length)}`;
      if (matchMap.has(url)) {
        const examples = (matchMap.get(url) || []).filter((ex) => !toPosix(ex.file).endsWith(`/${p}`)).slice(0, 3);
        if (examples.length) info.signals.push({ type: 'string-ref', pattern: url, examples });
      }
    }

    if (p.startsWith('styles/')) {
      const base = path.basename(p);
      const exact1 = p;
      const exact2 = `@/${p}`;
      if (matchMap.has(exact1)) {
        const examples = (matchMap.get(exact1) || []).filter((ex) => !toPosix(ex.file).endsWith(`/${p}`)).slice(0, 3);
        if (examples.length) info.signals.push({ type: 'path-ref', pattern: exact1, examples });
      }
      if (matchMap.has(exact2)) {
        const examples = (matchMap.get(exact2) || []).filter((ex) => !toPosix(ex.file).endsWith(`/${p}`)).slice(0, 3);
        if (examples.length) info.signals.push({ type: 'path-ref', pattern: exact2, examples });
      }
      if (matchMap.has(base)) {
        const examples = (matchMap.get(base) || []).filter((ex) => !toPosix(ex.file).endsWith(`/${p}`)).slice(0, 3);
        if (examples.length) info.signals.push({ type: 'basename-ref', pattern: base, examples });
      }
    }

    verified.push(info);
  }

  const buckets = classifyUnused(unused);

  const counts = {
    universe: (json.workspaceUniverseFiles || []).length,
    reachable: (json.usedFiles || []).length,
    unused: unused.length,
    unusedWithSignals: verified.filter((v) => v.signals.length > 0).length,
  };

  const md = [];
  md.push(`# Dead File Verification Report`);
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push('');
  md.push(`Universe(code/css): ${counts.universe}`);
  md.push(`Reachable(import graph): ${counts.reachable}`);
  md.push(`Unused candidates: ${counts.unused}`);
  md.push(`Unused candidates with string/URL signals: ${counts.unusedWithSignals}`);
  md.push('');

  md.push(`## Buckets (unused candidates)`);
  for (const [k, arr] of Object.entries(buckets)) {
    md.push(`- ${k}: ${arr.length}`);
  }
  md.push('');

  md.push(`## Unused candidates with signals (sample)`);
  const withSignals = verified.filter((v) => v.signals.length > 0).slice(0, 120);
  if (withSignals.length === 0) {
    md.push('_None_');
  } else {
    for (const v of withSignals) {
      md.push(`- ${v.path}`);
      for (const s of v.signals) {
        md.push(`  - ${s.type}: ${s.pattern}`);
        for (const ex of s.examples || []) {
          md.push(`    - ${ex.file}:${ex.line}`);
        }
      }
    }
  }

  fs.writeFileSync(OUT_MD, md.join('\n'), 'utf8');
  fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), counts, buckets, verified }, null, 2), 'utf8');

  console.log(`Wrote ${rel(OUT_MD)}`);
  console.log(`Wrote ${rel(OUT_JSON)}`);
}

main();
