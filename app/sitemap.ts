import { MetadataRoute } from 'next';

/**
 * Dynamic Sitemap for BullMoney Trading Community
 * OPTIMIZED FOR GOOGLE #1 RANKING
 * 
 * DOMAINS:
 * - Primary: https://www.bullmoney.shop
 * - Secondary: https://www.bullmoney.online
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
  // Support both domains
  const primaryDomain = 'https://www.bullmoney.shop';
  const secondaryDomain = 'https://www.bullmoney.online';
  const currentDate = new Date().toISOString();

  // Generate entries for primary domain (bullmoney.shop)
  const primaryEntries: MetadataRoute.Sitemap = [
    {
      // Homepage - Most important page for all trading keywords
      url: primaryDomain,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${primaryDomain}/about`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${primaryDomain}/shop`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${primaryDomain}/Blogs`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${primaryDomain}/Prop`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${primaryDomain}/socials`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${primaryDomain}/recruit`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      // Logo/Brand image
      url: `${primaryDomain}/ONcc2l601.svg`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Generate entries for secondary domain (bullmoney.online)
  const secondaryEntries: MetadataRoute.Sitemap = [
    {
      url: secondaryDomain,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${secondaryDomain}/about`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${secondaryDomain}/shop`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${secondaryDomain}/Blogs`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${secondaryDomain}/Prop`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${secondaryDomain}/socials`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${secondaryDomain}/recruit`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${secondaryDomain}/ONcc2l601.svg`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Return combined sitemap for both domains
  return [...primaryEntries, ...secondaryEntries];
}
