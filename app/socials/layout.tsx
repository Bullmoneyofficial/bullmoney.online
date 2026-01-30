import type { Metadata } from "next";

// ============================================
// SOCIALS PAGE SEO METADATA
// ============================================

export const metadata: Metadata = {
  title: "Join Our Trading Community | BullMoney Discord & Telegram",
  description:
    "Connect with 10,000+ traders on Discord & Telegram! Get free crypto setups, gold alerts, forex setups & live trading discussions. Join BullMoney's social channels today!",
  
  keywords: [
    // Social platforms
    "trading discord", "trading telegram", "crypto discord",
    "forex discord", "trading community discord", "trading chat",
    
    // Community keywords
    "trading community", "crypto community", "forex community",
    "trading group", "trading network", "trader chat",
    
    // Free access
    "free trading discord", "free trading telegram",
    "free crypto setups discord", "free forex setups telegram"
  ],
  
  openGraph: {
    title: "Join Our Trading Community | BullMoney Socials",
    description:
      "Connect with 10,000+ traders! Free setups & live discussions on Discord & Telegram. Join now!",
    url: "https://www.bullmoney.shop/socials",
    type: "website",
    images: [
      {
        url: "/ONcc2l601.svg",
        width: 1200,
        height: 630,
        alt: "BullMoney Social Channels",
      },
    ],
  },
  
  alternates: {
    canonical: "https://www.bullmoney.shop/socials",
  },
};

export default function SocialsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
