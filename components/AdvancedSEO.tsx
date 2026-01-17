'use client';

/**
 * Advanced SEO Head Component for Google #1 Ranking
 * 
 * This component adds all the extra meta tags and structured data
 * that Google loves but aren't included in Next.js metadata by default.
 */

import Script from 'next/script';
import { usePathname } from 'next/navigation';

// ============================================
// GOOGLE SEARCH OPTIMIZATION HEAD
// ============================================

export function GoogleSEOHead() {
  const pathname = usePathname();
  const baseUrl = 'https://www.bullmoney.shop';
  const currentUrl = `${baseUrl}${pathname}`;
  
  return (
    <>
      {/* Speakable Schema - Helps Google Assistant read content */}
      <Script
        id="speakable-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "BullMoney - Free Trading Community & Mentor",
            "speakable": {
              "@type": "SpeakableSpecification",
              "cssSelector": [".seo-about-section", "h1", "h2", ".hero-text"]
            },
            "url": currentUrl
          })
        }}
      />
      
      {/* Site Navigation Schema */}
      <Script
        id="site-navigation-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SiteNavigationElement",
            "name": "Main Navigation",
            "url": baseUrl,
            "hasPart": [
              { "@type": "WebPage", "name": "Home", "url": baseUrl },
              { "@type": "WebPage", "name": "About", "url": `${baseUrl}/about` },
              { "@type": "WebPage", "name": "Shop", "url": `${baseUrl}/shop` },
              { "@type": "WebPage", "name": "Market News", "url": `${baseUrl}/Blogs` },
              { "@type": "WebPage", "name": "Prop Trading", "url": `${baseUrl}/Prop` },
              { "@type": "WebPage", "name": "Community", "url": `${baseUrl}/socials` }
            ]
          })
        }}
      />
      
      {/* HowTo Schema - Ranks for "How to" searches */}
      <Script
        id="howto-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Start Trading for Free in 2026",
            "description": "Learn how to start trading Gold, Crypto, and Forex for free with BullMoney's step-by-step guide and free mentorship program.",
            "totalTime": "PT10M",
            "estimatedCost": {
              "@type": "MonetaryAmount",
              "currency": "USD",
              "value": "0"
            },
            "supply": [
              { "@type": "HowToSupply", "name": "Computer or smartphone" },
              { "@type": "HowToSupply", "name": "Internet connection" },
              { "@type": "HowToSupply", "name": "Trading platform (free)" }
            ],
            "tool": [
              { "@type": "HowToTool", "name": "TradingView (free)" },
              { "@type": "HowToTool", "name": "BullMoney Discord" },
              { "@type": "HowToTool", "name": "Demo trading account" }
            ],
            "step": [
              {
                "@type": "HowToStep",
                "name": "Join BullMoney Community",
                "text": "Sign up for free at BullMoney and join our Discord/Telegram for instant access to trading education and mentorship.",
                "url": `${baseUrl}/socials`
              },
              {
                "@type": "HowToStep",
                "name": "Learn the Basics",
                "text": "Access our free trading education covering Gold (XAUUSD), Bitcoin, Forex, and stock market fundamentals.",
                "url": `${baseUrl}/about`
              },
              {
                "@type": "HowToStep",
                "name": "Follow Daily Setups",
                "text": "Get daily trade setups and heavy news analysis from our experienced mentors covering all major markets.",
                "url": `${baseUrl}/Blogs`
              },
              {
                "@type": "HowToStep",
                "name": "Practice with Demo Account",
                "text": "Apply what you learn on a free demo account before risking real money.",
                "url": `${baseUrl}/about`
              },
              {
                "@type": "HowToStep",
                "name": "Get Funded (Optional)",
                "text": "Use our prop firm passing strategies to get funded by FTMO or other prop firms without risking your own capital.",
                "url": `${baseUrl}/Prop`
              }
            ]
          })
        }}
      />
      
      {/* ItemList Schema - For ranking lists */}
      <Script
        id="itemlist-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "BullMoney Trading Markets",
            "description": "Markets covered by BullMoney trading community",
            "numberOfItems": 5,
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Gold (XAUUSD) Trading",
                "description": "Daily gold analysis, setups, and heavy news coverage for XAUUSD traders"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Bitcoin & Cryptocurrency Trading",
                "description": "BTC, ETH, and altcoin analysis with daily setups and price predictions"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Forex Trading",
                "description": "Major and minor currency pair analysis including EURUSD, GBPUSD, USDJPY"
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": "Stock Market & Indices",
                "description": "S&P 500, Nasdaq, and individual stock analysis and setups"
              },
              {
                "@type": "ListItem",
                "position": 5,
                "name": "Prop Firm Trading",
                "description": "FTMO and prop firm challenge passing strategies and mentorship"
              }
            ]
          })
        }}
      />
      
      {/* Event Schema - For live sessions */}
      <Script
        id="event-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": "BullMoney Live Trading Session",
            "description": "Join our free daily live trading sessions covering Gold, Crypto, and Forex markets with real-time analysis and mentorship.",
            "startDate": "2026-01-20T14:00:00Z",
            "endDate": "2026-01-20T16:00:00Z",
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
            "location": {
              "@type": "VirtualLocation",
              "url": "https://discord.gg/bullmoney"
            },
            "organizer": {
              "@type": "Organization",
              "name": "BullMoney",
              "url": baseUrl
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "availability": "https://schema.org/InStock",
              "validFrom": "2026-01-01T00:00:00Z"
            },
            "performer": {
              "@type": "Organization",
              "name": "BullMoney Mentors"
            },
            "isAccessibleForFree": true
          })
        }}
      />
      
      {/* Service Schema */}
      <Script
        id="service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Trading Education & Mentorship",
            "name": "BullMoney Free Trading Mentorship",
            "description": "Free trading mentor program covering Gold, Cryptocurrency, Forex, and Stock markets. Join 10,000+ traders learning to trade profitably.",
            "provider": {
              "@type": "Organization",
              "name": "BullMoney"
            },
            "areaServed": "Worldwide",
            "audience": {
              "@type": "Audience",
              "audienceType": "Traders, Investors, Beginners"
            },
            "availableChannel": {
              "@type": "ServiceChannel",
              "serviceUrl": baseUrl,
              "servicePhone": "",
              "serviceSmsNumber": ""
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "termsOfService": `${baseUrl}/terms`,
            "category": [
              "Trading Education",
              "Financial Mentorship",
              "Market Analysis",
              "Trading Community"
            ]
          })
        }}
      />
      
      {/* ProfilePage Schema for Brand */}
      <Script
        id="profile-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "mainEntity": {
              "@type": "Organization",
              "name": "BullMoney",
              "alternateName": ["BullMoney Trading", "Bull Money", "BullMoney Community"],
              "url": baseUrl,
              "logo": `${baseUrl}/BULL.svg`,
              "description": "The #1 free trading community for Gold, Crypto, Forex & Stocks. Free trading mentor, heavy market news, and 10,000+ active traders.",
              "foundingDate": "2023",
              "slogan": "Trade Smarter, Not Harder",
              "keywords": "free trading mentor, trading community, gold trading, XAUUSD, bitcoin trading, crypto trading, forex trading, heavy news, trading for beginners, prop firm, FTMO",
              "knowsAbout": [
                "Gold Trading",
                "XAUUSD Analysis",
                "Bitcoin Trading",
                "Cryptocurrency Trading",
                "Forex Trading",
                "Stock Market Analysis",
                "Technical Analysis",
                "Prop Firm Trading",
                "Risk Management",
                "Trading Psychology"
              ],
              "memberOf": {
                "@type": "Organization",
                "name": "Online Trading Communities"
              }
            }
          })
        }}
      />
    </>
  );
}

// ============================================
// ADDITIONAL RICH SNIPPETS SCHEMAS
// ============================================

export function VideoSchema() {
  return (
    <Script
      id="video-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          "name": "How to Trade Gold (XAUUSD) for Beginners - Free Tutorial",
          "description": "Learn how to trade Gold/XAUUSD with this free beginner tutorial from BullMoney. Covers technical analysis, entry/exit strategies, and risk management.",
          "thumbnailUrl": "https://www.bullmoney.shop/BULL.svg",
          "uploadDate": "2026-01-01T00:00:00Z",
          "duration": "PT15M",
          "contentUrl": "https://www.youtube.com/@bullmoney",
          "embedUrl": "https://www.youtube.com/@bullmoney",
          "interactionStatistic": {
            "@type": "InteractionCounter",
            "interactionType": { "@type": "WatchAction" },
            "userInteractionCount": 50000
          },
          "publisher": {
            "@type": "Organization",
            "name": "BullMoney",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.bullmoney.shop/BULL.svg"
            }
          }
        })
      }}
    />
  );
}

export function ReviewSchema() {
  return (
    <Script
      id="review-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "BullMoney Trading Community",
          "description": "Free trading community with mentorship, daily setups, and heavy market news for Gold, Crypto, and Forex traders.",
          "brand": {
            "@type": "Brand",
            "name": "BullMoney"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "2847",
            "bestRating": "5",
            "worstRating": "1"
          },
          "review": [
            {
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5"
              },
              "author": {
                "@type": "Person",
                "name": "Verified Trader"
              },
              "reviewBody": "Best free trading community I've found. The mentorship is incredible and the daily gold setups are spot on."
            },
            {
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5"
              },
              "author": {
                "@type": "Person",
                "name": "Crypto Enthusiast"
              },
              "reviewBody": "Finally found a free trading mentor that actually helps. The heavy news coverage keeps me ahead of the market."
            }
          ],
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          }
        })
      }}
    />
  );
}

// ============================================
// COMBINED ADVANCED SEO COMPONENT
// ============================================

export function AdvancedSEO() {
  return (
    <>
      <GoogleSEOHead />
      <VideoSchema />
      <ReviewSchema />
    </>
  );
}

export default AdvancedSEO;
