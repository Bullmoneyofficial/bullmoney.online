import { MetadataRoute } from 'next';

/**
 * Dynamic Sitemap for BullMoney Trading Community
 * OPTIMIZED FOR GOOGLE #1 RANKING
 * 
 * ALL DOMAINS:
 * - Primary: https://www.bullmoney.shop
 * - https://www.bullmoney.online
 * - https://www.bullmoney.live
 * - https://www.bullmoney.co.za
 * - https://www.bullmoney.site
 * 
 * This sitemap helps search engines discover and index all important pages.
 * It's automatically generated and updated with each build.
 * 
 * SEO Keywords targeted:
 * - Free trading mentor, trading mentorship
 * - Trading community, free trading community
 * - Heavy news, market news, breaking news
 * - Gold trading, XAUUSD, gold price
 * - Crypto trading, bitcoin trading, ethereum trading
 * - Forex trading, EURUSD, GBPUSD
 * - Trading for beginners, learn to trade
 * - Prop firm, funded trader, FTMO
 */

export default function sitemap(): MetadataRoute.Sitemap {
  // All 5 domains
  const domains = [
    'https://www.bullmoney.shop',
    'https://www.bullmoney.online',
    'https://www.bullmoney.live',
    'https://www.bullmoney.co.za',
    'https://www.bullmoney.site',
  ];
  
  const currentDate = new Date().toISOString();
  
  // Pages to index for each domain
  const pages = [
    { path: '', priority: 1.0, changeFrequency: 'hourly' as const },
    { path: '/about', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/shop', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/Blogs', priority: 1.0, changeFrequency: 'hourly' as const },
    { path: '/Prop', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/socials', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/recruit', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/BULL.svg', priority: 0.5, changeFrequency: 'yearly' as const },
  ];
  
  // Generate sitemap entries for all domains
  const allEntries: MetadataRoute.Sitemap = [];
  
  for (const domain of domains) {
    for (const page of pages) {
      allEntries.push({
        url: `${domain}${page.path}`,
        lastModified: currentDate,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }
  
  return allEntries;
}
