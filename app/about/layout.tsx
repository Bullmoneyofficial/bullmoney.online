import type { Metadata } from "next";

// ============================================
// ABOUT PAGE SEO METADATA
// ============================================

export const metadata: Metadata = {
  title: "About BullMoney | Free Trading Community & Mentorship",
  description:
    "Learn about BullMoney - the #1 free trading community for crypto, gold, forex & stocks. Meet our team of experienced traders and mentors. Join 10,000+ traders today!",
  
  keywords: [
    // About-specific keywords
    "about BullMoney", "trading community about", "trading team",
    "trading mentors", "funded traders", "trading experience",
    
    // Community keywords
    "free trading community", "trading discord", "trading telegram",
    "crypto community", "forex community", "trading family",
    
    // Mentorship keywords
    "trading mentor", "free trading mentor", "trading education",
    "learn trading free", "trading coach", "trading guidance",
    
    // Trust keywords
    "trusted trading community", "real traders", "profitable traders",
    "trading results", "trading testimonials", "trading reviews"
  ],
  
  openGraph: {
    title: "About BullMoney | Free Trading Community & Mentorship",
    description:
      "Meet the team behind BullMoney - experienced traders and mentors helping 10,000+ members trade crypto, gold, forex & stocks profitably. Join free!",
    url: "https://www.bullmoney.shop/about",
    type: "website",
    images: [
      {
        url: "/BULL.svg",
        width: 1200,
        height: 630,
        alt: "About BullMoney Trading Community",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "About BullMoney | Free Trading Community",
    description:
      "Meet the team behind BullMoney - experienced traders helping 10,000+ members trade profitably. Join free!",
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
