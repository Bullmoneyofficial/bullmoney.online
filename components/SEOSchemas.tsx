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
    "logo": "https://www.bullmoney.shop/BULL.svg",
    "description": "BullMoney is the #1 free trading community for crypto, gold, forex, and stocks. Join 10,000+ traders for free setups, market analysis, and live mentorship.",
    "foundingDate": "2023",
    "sameAs": [
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
// FAQ SCHEMA - Rich FAQ Snippets
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
          "text": "Yes! BullMoney is completely free to join. We offer free trading setups, market analysis, and access to our trading community on Discord and Telegram. No credit card required."
        }
      },
      {
        "@type": "Question",
        "name": "What markets does BullMoney cover?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "BullMoney covers all major markets including Cryptocurrency (Bitcoin, Ethereum, altcoins), Gold/XAUUSD, Forex currency pairs, and Stock markets. Our analysts provide setups and analysis across all these markets daily."
        }
      },
      {
        "@type": "Question",
        "name": "Do you offer trading mentorship?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! BullMoney offers both free and premium mentorship programs. Our free community includes live trading sessions, while our premium VIP membership provides 1-on-1 mentorship with experienced traders."
        }
      },
      {
        "@type": "Question",
        "name": "How do I get free crypto setups?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Join the BullMoney community for free to receive daily crypto setups. Our analysts share Bitcoin, Ethereum, and altcoin trading setups with entry points, stop losses, and take profit targets in our Discord and Telegram channels."
        }
      },
      {
        "@type": "Question",
        "name": "What is a prop firm and does BullMoney help with funded accounts?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A prop firm (proprietary trading firm) provides traders with capital to trade. BullMoney helps members pass prop firm challenges like FTMO, MyForexFunds, and others through our trading setups, education, and mentorship programs."
        }
      },
      {
        "@type": "Question",
        "name": "How can I learn to trade for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "BullMoney offers free trading education including market analysis videos, live trading sessions, educational blog posts, and community discussions. Join our Discord for free access to all educational content."
        }
      },
      {
        "@type": "Question",
        "name": "What makes BullMoney different from other trading communities?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "BullMoney stands out with our completely free tier, experienced mentors who are funded traders, real-time market analysis, active community of 10,000+ traders, and proven track record of helping traders become profitable."
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
    "logo": "https://www.bullmoney.shop/BULL.svg",
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
    "image": imageUrl || "https://www.bullmoney.shop/BULL.svg",
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
        "url": "https://www.bullmoney.shop/BULL.svg"
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
    "image": imageUrl || "https://www.bullmoney.shop/BULL.svg",
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
