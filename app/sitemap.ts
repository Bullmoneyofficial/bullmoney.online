import { MetadataRoute } from 'next';

/**
 * Dynamic Sitemap for BullMoney Trading Community
 * 
 * This sitemap helps search engines discover and index all important pages.
 * It's automatically generated and updated with each build.
 * 
 * SEO Keywords targeted:
 * - Trading community, free trading community
 * - Crypto trading, bitcoin trading, ethereum trading
 * - Gold trading, XAUUSD, forex trading
 * - Trading mentor, free mentor, trading education
 * - Prop firm, funded trader, FTMO
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.bullmoney.shop';
  const currentDate = new Date().toISOString();

  // Main pages with high priority
  const mainPages: MetadataRoute.Sitemap = [
    {
      // Homepage - Most important page for all trading keywords
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      // About - Trading community, mentors, team
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      // Shop - Trading products, VIP setups, courses
      url: `${baseUrl}/shop`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      // Blogs - Market news, crypto analysis, gold analysis
      url: `${baseUrl}/Blogs`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95, // High priority for news content
    },
    {
      // Prop - Prop firm trading, funded accounts, FTMO
      url: `${baseUrl}/Prop`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      // Socials - Discord, Telegram, community links
      url: `${baseUrl}/socials`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      // Recruit - Affiliate program, referrals
      url: `${baseUrl}/recruit`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // SEO landing pages for different trading topics
  // These help capture search traffic for specific keywords
  const seoPages: MetadataRoute.Sitemap = [
    // These would be actual pages if you create them
    // For now they point to main pages with relevant content
  ];

  return [...mainPages, ...seoPages];
}
