import type { Metadata } from "next";

// ============================================
// BLOGS PAGE SEO METADATA
// ============================================

export const metadata: Metadata = {
  title: "Trading News & Market Analysis | BullMoney Blog",
  description:
    "Stay updated with the latest trading news, crypto market analysis, gold price movements, forex insights & stock market updates. Free market analysis from professional traders!",
  
  keywords: [
    // News keywords
    "trading news", "market news", "financial news",
    "crypto news", "bitcoin news", "ethereum news",
    "gold news", "forex news", "stock news",
    
    // Analysis keywords
    "market analysis", "crypto analysis", "technical analysis",
    "gold analysis", "XAUUSD analysis", "forex analysis",
    "stock analysis", "chart analysis", "price prediction",
    
    // Content types
    "trading blog", "crypto blog", "market updates",
    "trading insights", "market commentary", "trading tips",
    
    // Educational content
    "trading education", "learn trading", "trading strategies",
    "trading tutorials", "chart patterns", "candlestick patterns",
    
    // Trending topics
    "bitcoin price", "ethereum price", "gold price today",
    "forex today", "market today", "crypto today"
  ],
  
  openGraph: {
    title: "Trading News & Market Analysis | BullMoney Blog",
    description:
      "Latest trading news & expert market analysis for crypto, gold, forex & stocks. Free insights from professional traders!",
    url: "https://www.bullmoney.shop/Blogs",
    type: "website",
    images: [
      {
        url: "/BULL.svg",
        width: 1200,
        height: 630,
        alt: "BullMoney Blog - Trading News & Market Analysis",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Trading News & Market Analysis | BullMoney",
    description:
      "Latest trading news & expert analysis for crypto, gold, forex & stocks. Free insights daily!",
  },
  
  alternates: {
    canonical: "https://www.bullmoney.shop/Blogs",
  },
};

// Layout wrapper for the blogs page
export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
