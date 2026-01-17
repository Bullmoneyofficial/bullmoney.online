import type { Metadata } from "next";

// ============================================
// ABOUT PAGE SEO METADATA - OPTIMIZED FOR GOOGLE #1
// Targets: Free Trading Mentor, Trading Community, How to Find Mentor
// ============================================

export const metadata: Metadata = {
  title: "About BullMoney | Find Your FREE Trading Mentor 2026 | Best Trading Community",
  description:
    "Looking for a FREE trading mentor? BullMoney is the #1 trading community with FREE mentorship for Gold, Crypto, Forex & Stocks. Join 10,000+ traders learning from professional mentors. No paid courses - just real results! Find your free trading mentor today.",
  
  keywords: [
    // FREE MENTOR Keywords (HIGHEST PRIORITY)
    "free trading mentor", "find free trading mentor", "free mentor trading",
    "free trading mentorship", "free trading coach", "free trading teacher",
    "how to find free trading mentor", "best free trading mentor",
    "free trading mentor 2026", "free forex mentor", "free crypto mentor",
    "trading mentor free", "mentorship free trading",
    
    // Trading Mentorship Keywords
    "trading mentorship", "trading mentorship program", "mentorship for trading",
    "forex mentorship", "crypto mentorship", "gold trading mentorship",
    "online trading mentor", "trading mentor online", "become funded trader mentor",
    
    // Community Keywords  
    "best trading community", "free trading community", "trading community 2026",
    "trading discord free", "trading telegram free", "crypto community free",
    "forex community free", "trading family", "trader community",
    
    // About/Trust Keywords
    "about BullMoney", "BullMoney trading community", "BullMoney mentors",
    "real trading mentors", "professional traders", "funded trader mentors",
    "trusted trading community", "trading results", "trading testimonials",
    "10000 traders", "successful traders",
    
    // How-To Keywords
    "how to learn trading free", "how to start trading", "how to find mentor",
    "how to trade for free", "learn trading 2026", "trading for beginners",
    "beginner trading mentor", "new trader mentor",
    
    // Educational Keywords
    "trading education free", "free trading course", "free trading lessons",
    "learn trading no cost", "trading academy free", "trading school free"
  ],
  
  openGraph: {
    title: "Find Your FREE Trading Mentor | BullMoney Community 2026",
    description:
      "Looking for a FREE trading mentor? BullMoney has professional mentors for Gold, Crypto, Forex & Stocks. Join 10,000+ traders! No paid courses - just real results!",
    url: "https://www.bullmoney.shop/about",
    type: "website",
    images: [
      {
        url: "/BULL.svg",
        width: 1200,
        height: 630,
        alt: "BullMoney - Find Your Free Trading Mentor",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Find Your FREE Trading Mentor | BullMoney",
    description:
      "Looking for a FREE trading mentor? 10,000+ traders already learning from our pros. Join free!",
  },
  
  alternates: {
    canonical: "https://www.bullmoney.shop/about",
  },
};

// Layout wrapper for the about page
export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
