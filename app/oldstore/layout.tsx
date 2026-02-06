import type { Metadata } from "next";
import { makeAlternatesMetadata } from "@/lib/seo-languages";

// ============================================
// SHOP PAGE SEO METADATA
// ============================================

export const metadata: Metadata = {
  title: "Trading Products & VIP Setups | BullMoney Shop",
  description:
    "Get premium trading setups, VIP membership, trading courses & tools from BullMoney. Access exclusive crypto, gold & forex setups from professional traders. Upgrade your trading today!",
  
  keywords: [
    // Shop-specific keywords
    "trading setups", "premium setups", "VIP trading setups",
    "trading membership", "trading subscription", "trading products",
    
    // Crypto setups
    "crypto setups", "bitcoin setups", "ethereum setups",
    "altcoin setups", "crypto VIP", "premium crypto setups",
    
    // Gold setups
    "gold setups", "XAUUSD setups", "gold trading setups",
    "premium gold setups", "gold VIP membership",
    
    // Forex setups
    "forex setups", "forex VIP", "premium forex setups",
    "currency trading setups", "forex membership",
    
    // Products
    "trading course", "trading education", "trading tools",
    "trading indicators", "trading strategies"
  ],
  
  openGraph: {
    title: "Trading Products & VIP Setups | BullMoney Shop",
    description:
      "Premium trading setups & VIP membership for crypto, gold & forex. Get exclusive setups from professional traders. Upgrade your trading!",
    url: "https://www.bullmoney.shop/shop",
    type: "website",
    images: [
      {
        url: "/ONcc2l601.svg",
        width: 1200,
        height: 630,
        alt: "BullMoney Shop - Trading Products & VIP Setups",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Trading Products & VIP Setups | BullMoney",
    description:
      "Premium trading setups & VIP membership for crypto, gold & forex. Upgrade your trading today!",
  },
  
  alternates: makeAlternatesMetadata('/shop'),
};

// Layout wrapper for the shop page
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
