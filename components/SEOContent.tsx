'use client';

/**
 * SEO Content Components for BullMoney
 * 
 * These components contain keyword-rich content optimized for search engines.
 * Use these in appropriate sections to boost SEO rankings.
 * 
 * Targets:
 * - Free trading mentor
 * - Trading for beginners
 * - Heavy news
 * - Gold/XAUUSD trading
 * - Trading community
 * - 2026 keywords
 */

import React from 'react';

// ============================================
// ABOUT SECTION - Keyword Rich Content
// ============================================

interface AboutSectionProps {
  className?: string;
  showAll?: boolean;
}

export function SEOAboutSection({ className = '', showAll = true }: AboutSectionProps) {
  return (
    <section className={`seo-about-section ${className}`}>
      <h2 className="text-3xl font-bold mb-6 bg-linear-to-r from-white to-neutral-400 bg-clip-text text-transparent">
        Why BullMoney is the Home for Traders
      </h2>
      
      {/* Paragraph 1: Mentorship & Community */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-3 text-white/90">
          Free Mentorship & Supportive Community
        </h3>
        <p className="text-neutral-300 leading-relaxed">
          Are you looking for a <strong>free trading mentor</strong> or a supportive group to help you navigate the markets? 
          BullMoney is more than just a website; we are a massive <strong>online trading community</strong> dedicated to helping you succeed. 
          Whether you need a mentor to guide your first steps or a network of pro traders to share advanced strategies, 
          you get it all here without the expensive course fees. Join thousands of traders learning to trade for free in 2026.
        </p>
      </div>
      
      {showAll && (
        <>
          {/* Paragraph 2: Heavy News & Markets */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-white/90">
              Heavy News & Real-Time Market Coverage
            </h3>
            <p className="text-neutral-300 leading-relaxed">
              Stay ahead of the market with our <strong>Heavy News</strong> updates. We provide real-time breakdowns of major economic events, 
              ensuring you never miss a move in <strong>Gold (XAUUSD)</strong>, <strong>Bitcoin (BTC)</strong>, or the <strong>S&P 500</strong>. 
              From inflation data to sudden crypto market crashes, our feed keeps you informed so you can trade with confidence. 
              Get breaking news analysis that matters for your trades.
            </p>
          </div>
          
          {/* Paragraph 3: Specialized Assets */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-white/90">
              Specialized Asset Analysis
            </h3>
            <p className="text-neutral-300 leading-relaxed">
              We specialize in the assets that move. Get deep analysis on <strong>Gold</strong>, <strong>Forex pairs</strong>, 
              and the hottest <strong>Cryptocurrencies</strong>. Our community shares daily charts, trade setups, and price predictions, 
              giving you the edge you need to become a profitable trader in 2026. From <strong>XAUUSD</strong> to <strong>Bitcoin</strong>, 
              we cover it all with expert technical analysis.
            </p>
          </div>
        </>
      )}
    </section>
  );
}

// ============================================
// FOOTER SEO TEXT - Long-tail Keywords
// ============================================

interface FooterSEOProps {
  className?: string;
}

export function SEOFooterText({ className = '' }: FooterSEOProps) {
  return (
    <div className={`seo-footer-text text-xs text-neutral-500 leading-relaxed ${className}`}>
      <p>
        BullMoney is the premier destination for traders worldwide. Topics: Free Trading Mentor, 
        Online Trading Community, Gold XAUUSD Analysis, Crypto Trading Group, Forex News Live, 
        Best Trading Discord, Day Trading Strategies for Beginners, Heavy Market News, Bitcoin Analysis Today, 
        Free Stock Market Course, Automated Trading, Prop Firm Passing Help, Technical Analysis Guide, 
        Live Market Charts, Trading for Beginners 2026, How to Trade Gold, Cryptocurrency Setups, 
        Forex Mentorship, Stock Market Education, Trading Psychology, Risk Management, Price Action Trading, 
        Smart Money Concepts, Support and Resistance, Trend Following, Breakout Trading, Swing Trading Strategies, 
        Scalping Techniques, Market Structure, Supply and Demand Zones, Fibonacci Trading, Moving Averages, 
        RSI Trading, MACD Strategy, Bollinger Bands, Volume Analysis, Candlestick Patterns, Chart Patterns, 
        Economic Calendar, NFP Trading, FOMC Trading, CPI Trading, Interest Rate Decisions, Central Bank News, 
        Market Sentiment Analysis, Fear and Greed Index, Funded Trader Program, FTMO Challenge, Prop Firm Strategy, 
        TradingView Charts, MetaTrader 4 MT4, MetaTrader 5 MT5, Trading Journal, Performance Tracking, 
        Entry and Exit Strategies, Take Profit Levels, Stop Loss Placement, Risk Reward Ratio, Position Sizing, 
        Trading Bootcamp, Trading Academy, Live Trading Sessions, Market Analysis Videos, Daily Market Updates, 
        Weekly Forecasts, Bitcoin BTC Trading, Ethereum ETH Trading, Solana SOL Trading, XRP Ripple Trading, 
        Altcoin Season, S&P 500 SPX Trading, Nasdaq QQQ Trading, EURUSD Trading, GBPUSD Trading, USDJPY Trading, 
        Gold Futures, Silver XAGUSD Trading, Commodity Trading, Index Trading, Options Trading, Futures Trading. 
        Join us to: Learn to trade for free, find a trading partner, get daily news updates, and master the financial markets in 2026 and beyond.
      </p>
    </div>
  );
}

// ============================================
// NEWS TICKER - Breaking News Text
// ============================================

interface NewsTickerProps {
  className?: string;
}

export function SEONewsTicker({ className = '' }: NewsTickerProps) {
  const tickerText = "BREAKING: Heavy Market News & Live Analysis Available Now • Gold (XAUUSD) Targets Updated • Bitcoin Price Action Alert • Join the Free Mentor Program Today • Daily Setups Posted • Economic Calendar Events Live • Free Trading Community • Crypto & Forex Analysis";
  
  return (
    <div className={`seo-news-ticker overflow-hidden whitespace-nowrap ${className}`}>
      <div className="inline-block animate-marquee">
        <span className="text-sm font-medium">
          {tickerText} • {tickerText}
        </span>
      </div>
    </div>
  );
}

// ============================================
// BLOG HEADLINE SUGGESTIONS
// ============================================

export const SEO_BLOG_HEADLINES = [
  "Gold Price Analysis Today: XAUUSD Heavy News & Trade Levels",
  "Crypto Market Update: Bitcoin & Altcoin Setups for January 2026",
  "How to Find a Free Trading Mentor in 2026 (No Scams)",
  "Daily Market Watch: Breaking News for Forex & Crypto Traders",
  "Bitcoin Technical Analysis: BTC Price Prediction & Key Levels",
  "XAUUSD Weekly Forecast: Gold Trading Setups & Targets",
  "Forex Daily Brief: Major Currency Pair Analysis",
  "S&P 500 Market Update: Index Trading Opportunities",
  "Ethereum Analysis: ETH Price Action & Trade Ideas",
  "Prop Firm Challenge Guide: How to Pass FTMO in 2026",
  "Heavy News Alert: Fed Decision Impact on Gold & Crypto",
  "Trading for Beginners: Complete Guide to Start in 2026",
  "Free Trading Mentorship: Join BullMoney Community Today",
  "XAUUSD Setup: Gold Support & Resistance Levels This Week",
  "Crypto News Today: Bitcoin, Ethereum & Altcoin Updates",
];

// ============================================
// HIDDEN SEO TEXT (for screen readers & SEO)
// ============================================

export function HiddenSEOText() {
  return (
    <div className="sr-only" aria-hidden="false">
      <h1>BullMoney - Free Trading Community & Mentor for Beginners</h1>
      <p>
        Welcome to BullMoney, the number one free trading community for Gold XAUUSD, 
        Bitcoin cryptocurrency, Forex, and stock market traders. Find a free trading mentor, 
        get heavy market news updates, learn technical analysis, and join 10,000+ traders 
        in our Discord and Telegram community. Trading education for beginners in 2026.
        Daily setups for Gold, crypto, and forex. Prop firm challenge help for FTMO.
        Best online trading community with free mentorship and market analysis.
      </p>
    </div>
  );
}

// ============================================
// KEYWORDS META COMPONENT
// ============================================

export const PRIMARY_SEO_KEYWORDS = [
  "BullMoney",
  "free trading mentor",
  "trading community",
  "gold trading",
  "XAUUSD",
  "bitcoin trading",
  "crypto trading",
  "forex trading",
  "trading for beginners",
  "heavy news",
  "market news",
  "trading discord",
  "prop firm",
  "FTMO",
  "technical analysis",
  "trading 2026",
  "free trading education",
  "trading mentorship",
  "S&P 500",
  "day trading",
  "swing trading",
];

export default SEOAboutSection;
