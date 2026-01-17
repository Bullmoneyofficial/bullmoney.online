'use client';

/**
 * ============================================
 * INTERNAL LINKING SEO SYSTEM
 * ============================================
 * 
 * Builds topical authority through intelligent internal linking
 * Google uses internal links to understand site structure and topic expertise
 */

import Script from 'next/script';

// ============================================
// CONTENT HUB SCHEMA - Pillar Page Structure
// Shows Google your content is comprehensive
// ============================================

export const ContentHubSchema = () => {
  const hubSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "BullMoney Trading Hub",
    "url": "https://www.bullmoney.shop",
    "description": "Complete trading education hub covering Gold, Crypto, Forex, Stocks, and Prop Firm trading",
    "mainEntity": {
      "@type": "ItemList",
      "name": "BullMoney Content Pillars",
      "description": "Comprehensive trading education organized by topic",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "WebPage",
            "name": "Gold Trading Hub",
            "url": "https://www.bullmoney.shop/Blogs?category=gold",
            "description": "Complete XAUUSD trading education: setups, analysis, strategies"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "WebPage",
            "name": "Cryptocurrency Trading Hub",
            "url": "https://www.bullmoney.shop/Blogs?category=crypto",
            "description": "Bitcoin, Ethereum, and altcoin trading education and analysis"
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "WebPage",
            "name": "Forex Trading Hub",
            "url": "https://www.bullmoney.shop/Blogs?category=forex",
            "description": "Currency pair trading education and daily forex setups"
          }
        },
        {
          "@type": "ListItem",
          "position": 4,
          "item": {
            "@type": "WebPage",
            "name": "Prop Firm Trading Hub",
            "url": "https://www.bullmoney.shop/Prop",
            "description": "FTMO and prop firm challenge passing strategies"
          }
        },
        {
          "@type": "ListItem",
          "position": 5,
          "item": {
            "@type": "WebPage",
            "name": "Trading Education Hub",
            "url": "https://www.bullmoney.shop/about",
            "description": "Free trading education and mentorship program"
          }
        }
      ]
    },
    "hasPart": [
      {
        "@type": "WebPageElement",
        "name": "Daily Trading Setups",
        "url": "https://www.bullmoney.shop/Blogs"
      },
      {
        "@type": "WebPageElement",
        "name": "Free Mentorship",
        "url": "https://www.bullmoney.shop/about"
      },
      {
        "@type": "WebPageElement",
        "name": "Community",
        "url": "https://www.bullmoney.shop/socials"
      },
      {
        "@type": "WebPageElement",
        "name": "VIP Services",
        "url": "https://www.bullmoney.shop/shop"
      }
    ]
  };

  return (
    <Script
      id="content-hub-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(hubSchema) }}
    />
  );
};

// ============================================
// TOPIC CLUSTER SCHEMA
// Shows deep expertise in specific topics
// ============================================

export const TopicClusterSchema = () => {
  // Gold Trading Cluster
  const goldCluster = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    "name": "Gold Trading Mastery Series",
    "description": "Comprehensive series on gold (XAUUSD) trading from beginner to advanced",
    "publisher": {
      "@type": "Organization",
      "name": "BullMoney"
    },
    "hasPart": [
      {
        "@type": "Article",
        "name": "How to Trade Gold for Beginners",
        "description": "Complete beginner's guide to XAUUSD trading"
      },
      {
        "@type": "Article",
        "name": "Gold Technical Analysis Strategies",
        "description": "Advanced technical analysis for gold traders"
      },
      {
        "@type": "Article",
        "name": "Gold News Trading",
        "description": "Trading gold around heavy news events"
      },
      {
        "@type": "Article",
        "name": "Gold Risk Management",
        "description": "Position sizing and risk management for XAUUSD"
      }
    ]
  };

  // Crypto Trading Cluster
  const cryptoCluster = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    "name": "Cryptocurrency Trading Series",
    "description": "Complete crypto trading education from basics to advanced strategies",
    "publisher": {
      "@type": "Organization",
      "name": "BullMoney"
    },
    "hasPart": [
      {
        "@type": "Article",
        "name": "Bitcoin Trading for Beginners 2026",
        "description": "How to start trading Bitcoin"
      },
      {
        "@type": "Article",
        "name": "Altcoin Trading Strategies",
        "description": "Finding and trading profitable altcoins"
      },
      {
        "@type": "Article",
        "name": "Crypto Technical Analysis",
        "description": "Chart patterns and indicators for crypto"
      },
      {
        "@type": "Article",
        "name": "DeFi and Staking",
        "description": "Earning passive income with crypto"
      }
    ]
  };

  // Prop Firm Cluster
  const propFirmCluster = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    "name": "Prop Firm Success Series",
    "description": "Complete guide to passing prop firm challenges and getting funded",
    "publisher": {
      "@type": "Organization",
      "name": "BullMoney"
    },
    "hasPart": [
      {
        "@type": "Article",
        "name": "How to Pass FTMO Challenge",
        "description": "Step-by-step FTMO challenge strategy"
      },
      {
        "@type": "Article",
        "name": "Prop Firm Risk Management",
        "description": "Never blow a challenge account again"
      },
      {
        "@type": "Article",
        "name": "Best Prop Firms 2026",
        "description": "Comparison of top prop firms"
      },
      {
        "@type": "Article",
        "name": "Funded Trader Strategies",
        "description": "Maintaining funded accounts long-term"
      }
    ]
  };

  return (
    <>
      <Script
        id="gold-cluster-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(goldCluster) }}
      />
      <Script
        id="crypto-cluster-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cryptoCluster) }}
      />
      <Script
        id="prop-firm-cluster-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(propFirmCluster) }}
      />
    </>
  );
};

// ============================================
// SEMANTIC RELATIONSHIPS SCHEMA
// Shows Google how your content connects
// ============================================

export const SemanticRelationshipsSchema = () => {
  const relationshipsSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BullMoney",
    "url": "https://www.bullmoney.shop",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Trading Topics",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Thing",
            "name": "Gold Trading",
            "description": "XAUUSD trading education and setups",
            "isRelatedTo": [
              { "@type": "Thing", "name": "Technical Analysis" },
              { "@type": "Thing", "name": "Risk Management" },
              { "@type": "Thing", "name": "Heavy News Trading" }
            ]
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Thing",
            "name": "Cryptocurrency Trading",
            "description": "Bitcoin and altcoin trading",
            "isRelatedTo": [
              { "@type": "Thing", "name": "Technical Analysis" },
              { "@type": "Thing", "name": "Market Cycles" },
              { "@type": "Thing", "name": "Risk Management" }
            ]
          }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Thing",
            "name": "Prop Firm Trading",
            "description": "Getting funded by prop firms",
            "isRelatedTo": [
              { "@type": "Thing", "name": "Risk Management" },
              { "@type": "Thing", "name": "Trading Psychology" },
              { "@type": "Thing", "name": "Consistency" }
            ]
          }
        }
      ]
    }
  };

  return (
    <Script
      id="semantic-relationships-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(relationshipsSchema) }}
    />
  );
};

// ============================================
// MAIN EXPORT
// ============================================

export function InternalLinkingSEO() {
  return (
    <>
      <ContentHubSchema />
      <TopicClusterSchema />
      <SemanticRelationshipsSchema />
    </>
  );
}

export default InternalLinkingSEO;
