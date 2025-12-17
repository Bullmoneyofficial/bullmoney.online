import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { Footer } from "@/components/Mainpage/footer";
import { ThemeProvider } from "@/context/providers";

// ✅ ADDED: Import the ShopProvider
import { ShopProvider } from "@/app/VIP/ShopContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BullMoney | Trading Community",
  description:
    "Join BullMoney  the all-in-one trading community for Crypto, Stocks, Forex, and Metals. Trade, learn, and track live markets together in real time. Money made easy.",
  icons: {
    icon: "/BULL.svg",
  },
  openGraph: {
    title: "BullMoney | Trading Community",
    description:
      "Join BullMoney  the all-in-one trading community for Crypto, Stocks, Forex, and Metals. Trade, learn, and track live markets together in real time. Money made easy.",
    url: "https://www.bullmoney.shop/",
    siteName: "BullMoney",
    images: [
      {
        url: "/BULL.svg",
        width: 1200,
        height: 630,
        alt: "BullMoney Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BullMoney | Trading Community",
    description:
      "Join BullMoney  the all-in-one trading community for Crypto, Stocks, Forex, and Metals. Trade, learn, and track live markets together in real time. Money made easy.",
    images: ["/BULL.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn("antialiased dark:bg-black bg-white", inter.className)}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* ✅ ADDED: ShopProvider starts here */}
          <ShopProvider>
            
            {children}
            
            {/* ✅ FIXED: Footer is now placed correctly inside the body/provider */}
            <Footer />

          </ShopProvider>
          {/* ✅ ADDED: ShopProvider ends here */}
        </ThemeProvider>
      </body>
    </html>
  );
}