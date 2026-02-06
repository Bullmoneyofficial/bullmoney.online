"use client";

/**
 * ============================================
 * GOOGLE SEO BOOST - MAXIMUM RANKING POWER
 * ============================================
 * Additional Google-specific optimizations for #1 ranking
 * - Breadcrumb Schema
 * - CollectionPage Schema  
 * - NewsArticle Schema patterns
 * - WebSite SearchAction
 * - Product/Service schemas
 * - LocalBusiness enhancements
 * - SpeakableSpecification for voice search
 */

import Script from "next/script";

// ============================================
// BREADCRUMB SCHEMA - Helps Google understand site structure
// ============================================
const BreadcrumbSchema = () => {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.bullmoney.shop" // Also: https://www.bullmoney.online
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Heavy News & Market Analysis",
        "item": "https://www.bullmoney.shop/Blogs"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Trading Products & VIP",
        "item": "https://www.bullmoney.shop/shop"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "About BullMoney & Free Mentorship",
        "item": "https://www.bullmoney.shop/about"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Prop Firm Trading",
        "item": "https://www.bullmoney.shop/Prop"
      }
    ]
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
    />
  );
};

// ============================================
// COLLECTION PAGE SCHEMA - For blogs/news section
// ============================================
const CollectionPageSchema = () => {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Heavy News & Market Analysis | BullMoney",
    "description": "Collection of heavy market news, gold analysis, crypto updates, forex insights, and trading setups from professional traders.",
    "url": "https://www.bullmoney.shop/Blogs",
    "isPartOf": {
      "@type": "WebSite",
      "name": "BullMoney",
      "url": "https://www.bullmoney.shop"
    },
    "about": [
      {
        "@type": "Thing",
        "name": "Gold Trading",
        "sameAs": "https://en.wikipedia.org/wiki/Gold_as_an_investment"
      },
      {
        "@type": "Thing",
        "name": "Cryptocurrency",
        "sameAs": "https://en.wikipedia.org/wiki/Cryptocurrency"
      },
      {
        "@type": "Thing",
        "name": "Forex Trading",
        "sameAs": "https://en.wikipedia.org/wiki/Foreign_exchange_market"
      },
      {
        "@type": "Thing",
        "name": "Stock Market",
        "sameAs": "https://en.wikipedia.org/wiki/Stock_market"
      }
    ],
    "mainEntity": {
      "@type": "ItemList",
      "name": "Trading News Categories",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Gold & XAUUSD News",
          "description": "Daily gold price analysis, XAUUSD forecasts, and gold trading setups"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Bitcoin & Crypto News",
          "description": "Cryptocurrency market updates, Bitcoin analysis, and altcoin news"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Forex News",
          "description": "Currency pair analysis, forex market news, and trading opportunities"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Stock Market News",
          "description": "Stock market updates, indices analysis, and investment insights"
        }
      ]
    }
  };

  return (
    <Script
      id="collection-page-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
    />
  );
};

// ============================================
// FINANCIAL SERVICE SCHEMA - For mentorship/trading services
// ============================================
const FinancialServiceSchema = () => {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "BullMoney Free Trading Mentorship",
    "description": "Free trading mentorship and education for Gold, Crypto, Forex & Stocks. Professional traders helping beginners learn to trade in 2026.",
    "url": "https://www.bullmoney.shop",
    "logo": "https://www.bullmoney.shop/ONcc2l601.svg",
    "image": "https://www.bullmoney.shop/ONcc2l601.svg",
    "priceRange": "Free - Premium",
    "telephone": "",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "40.7128",
      "longitude": "-74.0060"
    },
    "areaServed": {
      "@type": "Place",
      "name": "Worldwide"
    },
    "serviceType": [
      "Free Trading Mentorship",
      "Trading Education",
      "Market Analysis",
      "Trading Setups",
      "Trading Community"
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Trading Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Free Trading Mentorship",
            "description": "Learn trading from professional mentors at no cost"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "VIP Trading Room",
            "description": "Premium access to trade setups, live sessions, and exclusive analysis"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Prop Firm Coaching",
            "description": "Learn to pass prop firm challenges like FTMO"
          }
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "2847",
      "bestRating": "5",
      "worstRating": "1"
    },
    "sameAs": [
      "https://www.bullmoney.online",
      "https://www.bullmoney.live",
      "https://www.bullmoney.co.za",
      "https://www.bullmoney.site",
      "https://discord.gg/bullmoney",
      "https://t.me/bullmoney",
      "https://twitter.com/bullmoney",
      "https://www.instagram.com/bullmoney",
      "https://www.youtube.com/@bullmoney"
    ]
  };

  return (
    <Script
      id="financial-service-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
    />
  );
};

// ============================================
// LEARNING RESOURCE SCHEMA - Educational content
// ============================================
const LearningResourceSchema = () => {
  const learningSchema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": "Free Trading Education 2026 | BullMoney Academy",
    "description": "Complete free trading education for beginners. Learn Gold, Crypto, Forex & Stock trading from professional mentors. No paid courses required!",
    "url": "https://www.bullmoney.shop",
    "provider": {
      "@type": "Organization",
      "name": "BullMoney",
      "url": "https://www.bullmoney.shop"
    },
    "educationalLevel": "Beginner to Advanced",
    "learningResourceType": [
      "Course",
      "Tutorial",
      "Lesson",
      "Video",
      "Live Session"
    ],
    "teaches": [
      "Technical Analysis",
      "Chart Patterns",
      "Risk Management",
      "Gold Trading (XAUUSD)",
      "Cryptocurrency Trading",
      "Forex Trading",
      "Stock Trading",
      "Prop Firm Challenges"
    ],
    "assesses": [
      "Trading Knowledge",
      "Chart Reading Skills",
      "Risk Management"
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": "Traders",
      "geographicArea": {
        "@type": "Place",
        "name": "Worldwide"
      }
    },
    "isAccessibleForFree": true,
    "inLanguage": ["en", "es", "fr", "de", "pt", "it", "ja", "ko", "zh", "ar", "hi", "ru", "tr", "nl", "pl", "sv", "no", "da", "fi", "th", "vi", "id", "ms", "tl", "uk", "cs", "ro", "el", "he", "hu", "bg", "sw", "af", "zu", "bn", "ur"]
  };

  return (
    <Script
      id="learning-resource-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(learningSchema) }}
    />
  );
};

// ============================================
// SPEAKABLE SCHEMA - Voice Search Optimization
// ============================================
const SpeakableSchema = () => {
  const speakableSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "BullMoney - Free Trading Mentor & Heavy News",
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [
        ".seo-headline",
        ".seo-description",
        "h1",
        "h2"
      ]
    },
    "url": "https://www.bullmoney.shop"
  };

  return (
    <Script
      id="speakable-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableSchema) }}
    />
  );
};

// ============================================
// WEBSITE SEARCH ACTION - Site Search Schema
// ============================================
const WebsiteSearchSchema = () => {
  const searchSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://www.bullmoney.shop",
    "name": "BullMoney",
    "description": "Free Trading Mentor, Heavy News, Gold, Crypto & Forex Analysis",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.bullmoney.shop/Blogs?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Script
      id="website-search-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(searchSchema) }}
    />
  );
};

// ============================================
// SOFTWARE APPLICATION SCHEMA - For trading tools
// ============================================
const SoftwareAppSchema = () => {
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "BullMoney Trading Platform",
    "description": "Free trading analysis platform with heavy news, market setups, and professional mentorship for Gold, Crypto, Forex & Stocks.",
    "url": "https://www.bullmoney.shop",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free trading community and mentorship"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2847",
      "bestRating": "5"
    },
    "author": {
      "@type": "Organization",
      "name": "BullMoney"
    }
  };

  return (
    <Script
      id="software-app-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
    />
  );
};

// ============================================
// NEWS ARTICLE LIST SCHEMA - For news section
// ============================================
const NewsArticleListSchema = () => {
  const today = new Date().toISOString().split('T')[0];
  
  const newsListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Heavy Market News & Trading Analysis",
    "description": "Daily heavy news updates on Gold, Bitcoin, Crypto, Forex and Stock markets",
    "url": "https://www.bullmoney.shop/Blogs",
    "numberOfItems": 10,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "NewsArticle",
          "headline": `Gold (XAUUSD) Heavy News Update - ${today}`,
          "description": "Latest gold price analysis, XAUUSD technical levels, and trading setup for today",
          "datePublished": today
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "NewsArticle",
          "headline": `Bitcoin $100K Target Analysis - ${today}`,
          "description": "Bitcoin price prediction, BTC $100K analysis, institutional adoption news",
          "datePublished": today
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "NewsArticle",
          "headline": `Ethereum ETH $15000 Price Target - ${today}`,
          "description": "Ethereum supercycle analysis, ETH staking news, price prediction 2026",
          "datePublished": today
        }
      },
      {
        "@type": "ListItem",
        "position": 4,
        "item": {
          "@type": "NewsArticle",
          "headline": `Fed Rate Cut News & FOMC Update - ${today}`,
          "description": "Federal Reserve rate decision, inflation news, monetary policy 2026",
          "datePublished": today
        }
      },
      {
        "@type": "ListItem",
        "position": 5,
        "item": {
          "@type": "NewsArticle",
          "headline": `Silver Rally 25% - Precious Metals Analysis - ${today}`,
          "description": "Silver price surge, XAGUSD analysis, precious metals trading 2026",
          "datePublished": today
        }
      },
      {
        "@type": "ListItem",
        "position": 6,
        "item": {
          "@type": "NewsArticle",
          "headline": `Tokenized Assets & RWA Crypto News - ${today}`,
          "description": "Tokenization trends 2026, real world assets crypto, tokenized stocks and gold",
          "datePublished": today
        }
      },
      {
        "@type": "ListItem",
        "position": 7,
        "item": {
          "@type": "NewsArticle",
          "headline": `S&P 500 & Nasdaq Stock Market Update - ${today}`,
          "description": "Stock market news, tech stocks, AI stocks analysis, market outlook 2026",
          "datePublished": today
        }
      },
      {
        "@type": "ListItem",
        "position": 8,
        "item": {
          "@type": "NewsArticle",
          "headline": `Crypto Regulation & SEC News - ${today}`,
          "description": "Crypto bill updates, SEC regulation, stablecoin news, crypto policy 2026",
          "datePublished": today
        }
      }
    ]
  };

  return (
    <Script
      id="news-article-list-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(newsListSchema) }}
    />
  );
};

// ============================================
// 2026 TRENDING TOPICS SCHEMA
// ============================================
const Trending2026Schema = () => {
  const trendingSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "2026 Trending Trading Topics",
    "description": "Hottest trading searches and trends for 2026",
    "url": "https://www.bullmoney.shop",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Bitcoin $100K Price Target",
        "description": "Bitcoin approaching $100,000 - analysis and predictions"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Ethereum $15,000 Supercycle",
        "description": "ETH price target $15,000 by 2027 - staking and analysis"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Tokenized Assets Breakout 2026",
        "description": "Tokenized stocks, gold, and real world assets trending"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Fed Rate Cuts 2026",
        "description": "Federal Reserve interest rate decisions and economic impact"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Silver Rally 25%",
        "description": "Silver prices surging in 2026 - trading opportunities"
      },
      {
        "@type": "ListItem",
        "position": 6,
        "name": "AI + Crypto Integration",
        "description": "Artificial intelligence meets cryptocurrency trading"
      },
      {
        "@type": "ListItem",
        "position": 7,
        "name": "Stablecoin Payments Growth",
        "description": "Crypto payments hitting $18 billion in 2026"
      },
      {
        "@type": "ListItem",
        "position": 8,
        "name": "Prop Firm Trading 2026",
        "description": "Best prop firms and funded trading opportunities"
      }
    ]
  };

  return (
    <Script
      id="trending-2026-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(trendingSchema) }}
    />
  );
};

// ============================================
// VIRAL WEALTH & SUCCESS SCHEMA (2020-2027)
// ============================================
const ViralWealthSchema = () => {
  const wealthSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Trading Success Stories & Wealth Building",
    "description": "How traders become millionaires - success stories, strategies, and lifestyle",
    "url": "https://www.bullmoney.shop",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Crypto Millionaire Stories 2020-2026",
        "description": "Bitcoin, Ethereum, Dogecoin millionaires - how they did it"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Small Account to Big Gains",
        "description": "Turn $100 into $10,000 - small account trading strategies"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Quit Your Job Trading",
        "description": "Financial freedom through trading - escape the 9 to 5"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "ICT & Smart Money Concepts",
        "description": "Inner Circle Trader strategies, order blocks, liquidity"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Meme Stock Era - GME & AMC",
        "description": "WallStreetBets, diamond hands, meme stock millionaires"
      },
      {
        "@type": "ListItem",
        "position": 6,
        "name": "Funded Trader Success",
        "description": "Pass prop firm challenges, FTMO success stories"
      },
      {
        "@type": "ListItem",
        "position": 7,
        "name": "Trading Lifestyle 2026",
        "description": "Laptop lifestyle, trade from anywhere, digital nomad trader"
      },
      {
        "@type": "ListItem",
        "position": 8,
        "name": "100x Crypto Gains",
        "description": "Find the next 100x altcoin - altcoin season strategies"
      }
    ]
  };

  return (
    <Script
      id="viral-wealth-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(wealthSchema) }}
    />
  );
};

// ============================================
// FAMOUS TRADERS & STRATEGIES SCHEMA
// ============================================
const FamousTradersSchema = () => {
  const tradersSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Famous Trader Strategies & Methods",
    "description": "Learn from the world's most successful traders - strategies that made millions",
    "url": "https://www.bullmoney.shop",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "ICT Inner Circle Trader Method",
        "description": "Smart money concepts, order blocks, liquidity pools, institutional trading"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "SMC Smart Money Concepts",
        "description": "Bank trading strategies, market structure, supply and demand"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Price Action Trading",
        "description": "Clean charts, candlestick patterns, support resistance trading"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Scalping Strategies",
        "description": "Quick profits, 1 minute charts, fast execution trading"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Swing Trading Methods",
        "description": "Hold trades for days, bigger moves, less screen time"
      },
      {
        "@type": "ListItem",
        "position": 6,
        "name": "Crypto Trading Strategies",
        "description": "Bitcoin trading, altcoin rotation, DeFi strategies"
      }
    ]
  };

  return (
    <Script
      id="famous-traders-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(tradersSchema) }}
    />
  );
};

// ============================================
// COMBINED GOOGLE SEO BOOST COMPONENT
// ============================================
export const GoogleSEOBoost = () => {
  return (
    <>
      <BreadcrumbSchema />
      <CollectionPageSchema />
      <FinancialServiceSchema />
      <LearningResourceSchema />
      <SpeakableSchema />
      <WebsiteSearchSchema />
      <SoftwareAppSchema />
      <NewsArticleListSchema />
      <Trending2026Schema />
      <ViralWealthSchema />
      <FamousTradersSchema />
    </>
  );
};

export default GoogleSEOBoost;
