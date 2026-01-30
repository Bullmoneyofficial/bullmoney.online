'use client';

/**
 * SEO Structured Data Components (JSON-LD)
 * 
 * These components add structured data that helps Google understand your content
 * and can result in rich snippets in search results (stars, FAQs, breadcrumbs, etc.)
 * 
 * Types included:
 * - Organization: Brand information
 * - WebSite: Site-wide search
 * - FAQPage: FAQ rich snippets
 * - Course: Trading education
 * - Product: Shop items
 * - Article: Blog posts
 * - BreadcrumbList: Navigation breadcrumbs
 */

import Script from 'next/script';

// ============================================
// ORGANIZATION SCHEMA - Brand Info
// ============================================

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BullMoney",
    "alternateName": ["BullMoney Trading", "BullMoney Community", "Bull Money"],
    "url": "https://www.bullmoney.shop",
    "logo": "https://www.bullmoney.shop/ONcc2l601.svg",
    "description": "BullMoney is the #1 free trading community for crypto, gold, forex, and stocks. Join 10,000+ traders for free setups, market analysis, and live mentorship.",
    "foundingDate": "2023",
    "sameAs": [
      "https://www.bullmoney.online",
      "https://www.bullmoney.live",
      "https://www.bullmoney.co.za",
      "https://www.bullmoney.site",
      "https://discord.gg/bullmoney",
      "https://t.me/bullmoney",
      "https://twitter.com/bullmoney",
      "https://instagram.com/bullmoney",
      "https://youtube.com/@bullmoney"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": ["English"]
    },
    "offers": {
      "@type": "Offer",
      "description": "Free trading community membership with setups and education",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// WEBSITE SCHEMA - Site Search
// ============================================

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BullMoney Trading Community",
    "alternateName": "BullMoney",
    "url": "https://www.bullmoney.shop",
    "description": "Free trading community for crypto, gold, forex & stocks. Get free setups, market analysis, and trading education.",
    "inLanguage": "en-US",
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
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// FAQ SCHEMA - Rich FAQ Snippets (SEO Optimized)
// ============================================

export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is BullMoney free to join?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! BullMoney is completely free to join. We offer free trading setups, market analysis, heavy news updates, and access to our trading community on Discord and Telegram. No credit card required. Get a free trading mentor and start learning today."
        }
      },
      {
        "@type": "Question",
        "name": "What markets does BullMoney cover?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "BullMoney covers all major markets including Gold (XAUUSD), Cryptocurrency (Bitcoin, Ethereum, altcoins), Forex currency pairs (EURUSD, GBPUSD), Stock indices (S&P 500, Nasdaq), and more. Our analysts provide daily setups and heavy news analysis across all these markets."
        }
      },
      {
        "@type": "Question",
        "name": "How do I find a free trading mentor?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "BullMoney provides free trading mentorship to all members. Join our Discord or Telegram community to connect with experienced traders who offer guidance, share strategies, and help beginners learn to trade without expensive course fees."
        }
      },
      {
        "@type": "Question",
        "name": "Do you provide heavy news and market updates?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We provide real-time heavy news breakdowns of major economic events including Fed decisions, inflation data, NFP reports, and breaking market news. Stay informed on Gold, Bitcoin, Forex, and stock market movements."
        }
      },
      {
        "@type": "Question",
        "name": "How can I learn gold (XAUUSD) trading?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "BullMoney specializes in Gold/XAUUSD trading education. Get daily gold analysis, trade setups, support/resistance levels, and heavy news impact analysis. Our mentors teach gold trading strategies for beginners and advanced traders."
        }
      },
      {
        "@type": "Question",
        "name": "What is a prop firm and does BullMoney help with funded accounts?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A prop firm (proprietary trading firm) provides traders with capital to trade. BullMoney helps members pass prop firm challenges like FTMO through our trading setups, education, risk management training, and mentorship programs."
        }
      },
      {
        "@type": "Question",
        "name": "How can I learn to trade for free in 2026?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "BullMoney offers completely free trading education including market analysis videos, live trading sessions, educational blog posts, community discussions, and free mentorship. Join our Discord for access to all educational content at no cost."
        }
      },
      {
        "@type": "Question",
        "name": "What makes BullMoney different from other trading communities?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "BullMoney stands out with: completely free membership, experienced funded trader mentors, real-time heavy news analysis, active community of 10,000+ traders, daily setups for Gold/Crypto/Forex, prop firm passing help, and beginner-friendly education."
        }
      },
      {
        "@type": "Question",
        "name": "Do you cover Bitcoin and cryptocurrency trading?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We provide comprehensive crypto coverage including Bitcoin (BTC), Ethereum (ETH), and altcoin analysis. Get daily crypto setups, price predictions, technical analysis, and heavy news impact on the crypto market."
        }
      },
      {
        "@type": "Question",
        "name": "Is BullMoney good for trading beginners?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! BullMoney is the perfect home for trading beginners. We offer free mentorship, step-by-step education, beginner-friendly setups, risk management training, and a supportive community to help you start your trading journey in 2026."
        }
      }
    ]
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// COURSE SCHEMA - Trading Education
// ============================================

export function CourseSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "BullMoney Trading Education",
    "description": "Learn to trade crypto, gold, forex, and stocks with BullMoney's free and premium trading courses. From beginner basics to advanced strategies.",
    "provider": {
      "@type": "Organization",
      "name": "BullMoney",
      "url": "https://www.bullmoney.shop"
    },
    "offers": [
      {
        "@type": "Offer",
        "category": "Free",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free trading education including setups, analysis, and community access"
      }
    ],
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "instructor": {
        "@type": "Person",
        "name": "BullMoney Mentors"
      }
    },
    "about": [
      "Cryptocurrency Trading",
      "Gold Trading",
      "Forex Trading",
      "Stock Trading",
      "Technical Analysis",
      "Risk Management"
    ]
  };

  return (
    <Script
      id="course-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// LOCAL BUSINESS SCHEMA (Online Business)
// ============================================

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "name": "BullMoney Trading Community",
    "description": "Free online trading community providing crypto setups, gold analysis, forex setups, and trading education.",
    "url": "https://www.bullmoney.shop",
    "logo": "https://www.bullmoney.shop/ONcc2l601.svg",
    "priceRange": "Free - $$$",
    "servesCuisine": "Trading Education",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": 0,
        "longitude": 0
      },
      "geoRadius": "40075000"  // Worldwide
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "500",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <Script
      id="local-business-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// BREADCRUMB SCHEMA
// ============================================

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// ARTICLE SCHEMA - For Blog Posts
// ============================================

interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
}

export function ArticleSchema({
  title,
  description,
  url,
  imageUrl,
  datePublished,
  dateModified,
  authorName = "BullMoney"
}: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "url": url,
    "image": imageUrl || "https://www.bullmoney.shop/ONcc2l601.svg",
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "author": {
      "@type": "Organization",
      "name": authorName,
      "url": "https://www.bullmoney.shop"
    },
    "publisher": {
      "@type": "Organization",
      "name": "BullMoney",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.bullmoney.shop/ONcc2l601.svg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  };

  return (
    <Script
      id="article-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// PRODUCT SCHEMA - For Shop Items
// ============================================

interface ProductSchemaProps {
  name: string;
  description: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  url: string;
}

export function ProductSchema({
  name,
  description,
  price,
  currency = "USD",
  imageUrl,
  url
}: ProductSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "image": imageUrl || "https://www.bullmoney.shop/ONcc2l601.svg",
    "url": url,
    "brand": {
      "@type": "Brand",
      "name": "BullMoney"
    },
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": currency,
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "BullMoney"
      }
    }
  };

  return (
    <Script
      id="product-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// SOFTWARE APPLICATION SCHEMA
// ============================================

export function SoftwareSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "BullMoney Trading Platform",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1000"
    }
  };

  return (
    <Script
      id="software-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// COMBINED SEO SCHEMAS - Use in layout
// ============================================

export function AllSEOSchemas() {
  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />
      <FAQSchema />
      <CourseSchema />
      <LocalBusinessSchema />
      <SoftwareSchema />
    </>
  );
}

export default AllSEOSchemas;
