import type { Metadata } from "next";
import { makeAlternatesMetadata, ALL_OG_LOCALES } from "@/lib/seo-languages";

// ============================================
// BLOGS PAGE SEO METADATA - OPTIMIZED FOR GOOGLE #1
// Targets: Heavy News, Market News, Gold Analysis, Crypto News
// ============================================

export const metadata: Metadata = {
  title: "Heavy News & Market Analysis | Gold, Crypto & Forex Updates | BullMoney",
  description:
    "Get HEAVY NEWS updates on Gold (XAUUSD), Bitcoin, Crypto, Forex & Stocks. Real-time market analysis, breaking financial news, Fed decisions, and daily trade setups. Free market analysis from professional traders in 2026!",
  
  keywords: [
    // HEAVY NEWS Keywords (HIGH PRIORITY)
    "heavy news", "heavy market news", "breaking news trading",
    "market breaking news", "financial breaking news", "trading news alerts",
    "real time market news", "live market news", "market news today",
    
    // Gold/XAUUSD News (HIGH PRIORITY)
    "gold news", "gold news today", "XAUUSD news", "gold price news",
    "gold analysis today", "gold market news", "gold breaking news",
    "gold price today", "gold forecast", "gold prediction",
    "XAUUSD analysis", "XAUUSD forecast", "XAUUSD today",
    
    // Crypto News (HIGH PRIORITY)
    "crypto news", "crypto news today", "bitcoin news", "bitcoin news today",
    "ethereum news", "altcoin news", "cryptocurrency news",
    "crypto market news", "BTC news", "ETH news", "crypto breaking news",
    "bitcoin price", "bitcoin analysis", "crypto analysis today",
    
    // Forex News
    "forex news", "forex news today", "forex analysis",
    "EURUSD news", "GBPUSD news", "currency news", "forex market news",
    
    // Economic News
    "fed news", "fomc news", "interest rate news", "inflation news",
    "CPI news", "NFP news", "economic calendar", "central bank news",
    
    // Stock Market News
    "stock news", "stock market news", "S&P 500 news", "Nasdaq news",
    "stock market today", "market update", "stock analysis",
    
    // Market Analysis
    "market analysis", "technical analysis", "daily analysis",
    "weekly forecast", "price prediction", "chart analysis",
    "support resistance", "trade setup", "trading setup",
    
    // Trading Blog
    "trading blog", "trading news blog", "market commentary",
    "trading insights", "market insights", "trading updates",
    
    // 2026 Keywords
    "market news 2026", "trading news 2026", "gold price 2026",
    "bitcoin 2026", "crypto 2026", "forex 2026"
  ],
  
  openGraph: {
    title: "Heavy News & Market Analysis | Gold, Crypto & Forex | BullMoney",
    description:
      "Real-time HEAVY NEWS on Gold, Bitcoin, Crypto & Forex. Breaking market updates, Fed decisions, and daily trade setups. Free analysis from pro traders!",
    url: "https://www.bullmoney.shop/Blogs",
    type: "website",
    locale: "en_US",
    alternateLocale: ALL_OG_LOCALES.filter(l => l !== 'en_US'),
    images: [
      {
        url: "/ONcc2l601.svg",
        width: 1200,
        height: 630,
        alt: "BullMoney Heavy News - Gold, Crypto & Forex Market Analysis",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Heavy News & Market Analysis | BullMoney",
    description:
      "Real-time HEAVY NEWS on Gold, Bitcoin, Crypto & Forex. Breaking updates & free analysis!",
  },
  
  alternates: makeAlternatesMetadata('/Blogs'),
};

// Layout wrapper for the blogs page
export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
