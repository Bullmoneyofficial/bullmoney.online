import { MetadataRoute } from 'next';

/**
 * Dynamic Sitemap for BullMoney Trading Community
 * OPTIMIZED FOR GOOGLE #1 RANKING
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bullmoney.shop';
  const currentDate = new Date().toISOString();

  // Main pages with high priority - Core SEO pages
  const mainPages: MetadataRoute.Sitemap = [
    {
      // Homepage - Most important page for all trading keywords
      // Targets: free trading community, trading mentor, gold crypto forex
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'hourly', // Changed to hourly for fresh content signal
      priority: 1.0,
    },
    {
      // About - Trading community, mentors, team, education
      // Targets: free trading mentor, trading mentorship, trading education
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      // Shop - Trading products, VIP setups, courses
      // Targets: trading course, trading education, VIP membership
      url: `${baseUrl}/shop`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      // Blogs - Market news, crypto analysis, gold analysis, heavy news
      // Targets: heavy news, market news, gold analysis, bitcoin news
      url: `${baseUrl}/Blogs`,
      lastModified: currentDate,
      changeFrequency: 'hourly', // News updates frequently
      priority: 1.0, // Highest priority for news/blog content
    },
    {
      // Prop - Prop firm trading, funded accounts, FTMO
      // Targets: prop firm, FTMO, funded trader, pass prop firm challenge
      url: `${baseUrl}/Prop`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      // Socials - Discord, Telegram, community links
      // Targets: trading discord, trading telegram, trading community
      url: `${baseUrl}/socials`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      // Recruit - Affiliate program, referrals
      // Targets: trading affiliate, referral program
      url: `${baseUrl}/recruit`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Image sitemap entries - Help images rank in Google Images
  const imageSitemapHints: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/BULL.svg`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  return [...mainPages, ...imageSitemapHints];
}
