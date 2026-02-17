import { Suspense } from "react";
import dynamic from "next/dynamic";
import { headers } from "next/headers";
import HomePageShell from "./HomePageShell";
import HomePageMobileEntry from "./HomePageMobileEntry";

// Desktop SSR enabled (ssr:true)
const HomePageClientDesktop = dynamic(
  () => import("./HomePageClient").then(m => ({ default: m.HomePageClient })),
  {
    ssr: true,
    loading: () => <HomePageShell />,
  }
);

export default async function Page() {
  const hdrs = await headers();
  const ua = hdrs.get("user-agent") || "";
  const isMobile = /mobi|android|iphone|ipad/i.test(ua);

  return (
    <Suspense fallback={<HomePageShell />}>
      {isMobile ? <HomePageMobileEntry /> : <HomePageClientDesktop />}
    </Suspense>
  );
}
