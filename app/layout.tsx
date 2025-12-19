import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/performance-optimizations.css";
import { cn } from "@/lib/utils";

import { Footer } from "@/components/Mainpage/footer";
import { ThemeProvider } from "@/context/providers";

// ✅ ADDED: Import the ShopProvider
import { ShopProvider } from "@/app/VIP/ShopContext";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "BullMoney | Trading Community",
  description:
    "Join BullMoney  the all-in-one trading community for Crypto, Stocks, Forex, and Metals. Trade, learn, and track live markets together in real time. Money made easy.",
  icons: {
    icon: "/BULL.svg",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Mobile Optimization: DNS Prefetch */}
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icon-180x180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Service Worker & Performance Scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(e => console.log(e));
                });
              }
              function setVH() {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', vh + 'px');
              }
              setVH();
              window.addEventListener('resize', setVH);
              window.addEventListener('orientationchange', setVH);
            `,
          }}
        />
      </head>
      <body
        className={cn("antialiased dark:bg-black bg-white", inter.className)}
        suppressHydrationWarning
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

          </ShopProvider>
          {/* ✅ ADDED: ShopProvider ends here */}

        </ThemeProvider>
      </body>
    </html>
  );
}