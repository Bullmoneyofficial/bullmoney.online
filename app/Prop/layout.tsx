import type { Metadata } from "next";
import { makeAlternatesMetadata } from "@/lib/seo-languages";

// ============================================
// PROP FIRM PAGE SEO METADATA
// ============================================

export const metadata: Metadata = {
  title: "Prop Firm Trading & Funded Accounts | BullMoney",
  description:
    "Pass prop firm challenges with BullMoney! Get free setups for FTMO, MyForexFunds & funded accounts. Learn prop trading strategies and get funded faster with our community support.",
  
  keywords: [
    // Prop firm keywords
    "prop firm", "prop trading", "proprietary trading",
    "funded trader", "funded account", "prop firm challenge",
    "prop firm setups", "prop trading community",
    
    // Specific prop firms
    "FTMO", "FTMO challenge", "FTMO setups",
    "MyForexFunds", "The Funded Trader", "True Forex Funds",
    "prop firm comparison", "best prop firm",
    
    // Challenge keywords
    "prop firm challenge pass", "pass FTMO", "funded challenge",
    "prop firm rules", "prop firm strategies", "challenge account",
    
    // Trading related
    "prop trading education", "funded trading", "get funded",
    "prop firm mentor", "prop trading mentor",
    
    // Risk management
    "risk management", "trading discipline", "prop firm rules",
    "drawdown management", "profit targets"
  ],
  
  openGraph: {
    title: "Prop Firm Trading & Funded Accounts | BullMoney",
    description:
      "Pass prop firm challenges with BullMoney! Free setups for FTMO & funded accounts. Get funded faster with community support.",
    url: "https://www.bullmoney.shop/Prop",
    type: "website",
    images: [
      {
        url: "/ONcc2l601.svg",
        width: 1200,
        height: 630,
        alt: "BullMoney - Prop Firm Trading & Funded Accounts",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "Prop Firm Trading | BullMoney",
    description:
      "Pass prop firm challenges with BullMoney! Free setups for FTMO & funded accounts. Get funded faster!",
  },
  
  alternates: makeAlternatesMetadata('/Prop'),
};

// Layout wrapper for the prop page
export default function PropLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
