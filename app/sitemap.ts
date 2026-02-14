import { MetadataRoute } from 'next';
import { VALID_GAMES } from './games/[game]/games/valid-games';
import { SEO_DOMAINS, PRIMARY_DOMAIN } from '@/lib/seo-domains';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

/**
 * MAIN APP SITEMAP — BullMoney Trading Community (non-store pages)
 * 
 * Store pages have their own sitemap at /store/sitemap.xml
 * This sitemap covers the trading community, education, and content pages.
 * 
 * DOMAINS:
 * - Primary: https://www.bullmoney.shop
 * - Secondary: https://www.bullmoney.online
 * 
 * MULTILINGUAL SEO:
 * Every page includes hreflang alternates for all 36 supported languages.
 */

// All 36 supported languages
const ALL_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'pt', 'it', 'ja', 'ko', 'zh', 'ar',
  'hi', 'ru', 'tr', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'th',
  'vi', 'id', 'ms', 'tl', 'uk', 'cs', 'ro', 'el', 'he', 'hu',
  'bg', 'sw', 'af', 'zu', 'bn', 'ur',
];

// Helper: generate language alternates for a URL
function makeLanguages(baseUrl: string, path: string): Record<string, string> {
  const separator = path.includes('?') ? '&' : '?';
  const languages: Record<string, string> = {};
  ALL_LANGUAGES.forEach(lang => {
    languages[lang] = `${baseUrl}${path}${separator}lang=${lang}`;
  });
  return languages;
}

const EXCLUDED_ROUTE_PREFIXES = [
  '/api',
  '/admin',
  '/auth',
  '/login',
  '/register',
  '/unsubscribe',
  '/resubscribe',
  '/email',
  '/@',
  '/store', // store has its own sitemap at /store/sitemap.xml
] as const;

function shouldExcludeRoute(routePath: string) {
  if (!routePath.startsWith('/')) return true;
  for (const prefix of EXCLUDED_ROUTE_PREFIXES) {
    if (routePath === prefix || routePath.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

function normalizeRouteFromAppPath(appRelativePath: string) {
  // appRelativePath example: "about/page.tsx" => "/about"
  const withoutSuffix = appRelativePath.replace(/\/page\.(t|j)sx?$/, '');
  if (!withoutSuffix) return '/';

  const segments = withoutSuffix.split('/').filter(Boolean);
  const routeSegments: string[] = [];

  for (const seg of segments) {
    // Ignore route groups like (shop)
    if (seg.startsWith('(') && seg.endsWith(')')) continue;
    // Ignore parallel routes like @modal
    if (seg.startsWith('@')) continue;
    // Skip dynamic segments
    if (seg.includes('[') || seg.includes(']')) return null;
    routeSegments.push(seg);
  }

  const route = `/${routeSegments.join('/')}`;
  return route === '' ? '/' : route;
}

function walkDir(dirPath: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      // Skip heavy/irrelevant folders
      if (entry.name === 'api') continue;
      out.push(...walkDir(full));
    } else {
      if (/page\.(t|j)sx?$/.test(entry.name)) out.push(full);
    }
  }
  return out;
}

function discoverStaticPublicPages(): string[] {
  try {
    const appDir = path.join(process.cwd(), 'app');
    const files = walkDir(appDir);
    const routes = new Set<string>();

    for (const file of files) {
      const rel = path.relative(appDir, file).replaceAll(path.sep, '/');
      const route = normalizeRouteFromAppPath(rel);
      if (!route) continue;
      if (shouldExcludeRoute(route)) continue;
      routes.add(route);
    }

    // Ensure key marketing routes exist even if discovery misses them.
    routes.add('/');
    routes.add('/games');
    return Array.from(routes).sort((a, b) => a.localeCompare(b));
  } catch {
    // Fallback: minimal set
    return ['/', '/about', '/Blogs', '/community', '/course', '/recruit', '/Prop', '/journal', '/VIP', '/games'];
  }
}

// Sitemap change frequencies / priorities for top-level routes.
function pageSignals(routePath: string) {
  if (routePath === '/') return { changeFrequency: 'hourly' as const, priority: 1.0 };
  if (routePath === '/Blogs') return { changeFrequency: 'hourly' as const, priority: 1.0 };
  if (routePath === '/games') return { changeFrequency: 'daily' as const, priority: 0.92 };
  if (routePath.startsWith('/games/')) return { changeFrequency: 'daily' as const, priority: 0.86 };
  return { changeFrequency: 'weekly' as const, priority: 0.75 };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const domains = SEO_DOMAINS;
  const currentDate = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = [];

  const pages = discoverStaticPublicPages();

  // Generate entries for each discovered page across all configured domains.
  for (const routePath of pages) {
    const { changeFrequency, priority } = pageSignals(routePath);
    for (const domain of domains) {
      entries.push({
        url: `${domain}${routePath}`,
        lastModified: currentDate,
        changeFrequency,
        priority,
        alternates: {
          languages: makeLanguages(domain, routePath),
        },
      });
    }
  }

  // Static assets (no language alternates needed)
  entries.push({
    url: `${PRIMARY_DOMAIN}/IMG_2921.PNG`,
    lastModified: currentDate,
    changeFrequency: 'yearly',
    priority: 0.5,
  });

  // ── Games detail pages ──
  for (const game of VALID_GAMES) {
    const path = `/games/${game}`;
    const { changeFrequency, priority } = pageSignals(path);
    for (const domain of domains) {
      entries.push({
        url: `${domain}${path}`,
        lastModified: currentDate,
        changeFrequency,
        priority,
        alternates: {
          languages: makeLanguages(domain, path),
        },
      });
    }
  }

  return entries;
}
