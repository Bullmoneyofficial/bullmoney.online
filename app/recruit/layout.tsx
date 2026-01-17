import type { Metadata } from "next";

// ============================================
// RECRUIT PAGE SEO METADATA
// ============================================

export const metadata: Metadata = {
  title: "Join BullMoney | Become an Affiliate & Earn",
  description:
    "Join the BullMoney affiliate program! Earn commissions by referring traders to our free trading community. Get exclusive perks, tracking dashboard & unlimited earning potential.",
  
  keywords: [
    // Affiliate keywords
    "trading affiliate", "trading referral", "affiliate program",
    "trading community affiliate", "earn trading", "trading commission",
    
    // Recruitment keywords
    "join trading community", "become affiliate", "trading partner",
    "crypto affiliate", "forex affiliate", "trading ambassador",
    
    // Earning keywords
    "earn from home", "passive income trading", "trading income",
    "affiliate earnings", "referral bonus", "commission program"
  ],
  
  openGraph: {
    title: "Join BullMoney | Become an Affiliate & Earn",
    description:
      "Earn commissions by referring traders! Join the BullMoney affiliate program and unlock unlimited earning potential.",
    url: "https://www.bullmoney.shop/recruit",
    type: "website",
    images: [
      {
        url: "/BULL.svg",
        width: 1200,
        height: 630,
        alt: "Join BullMoney Affiliate Program",
      },
    ],
  },
  
  alternates: {
    canonical: "https://www.bullmoney.shop/recruit",
  },
};

export default function RecruitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
