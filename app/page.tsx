import { Suspense } from "react";
import HomePageMobileEntry from "./HomePageMobileEntry";
import HomePageShell from "./HomePageShell";

// The server-rendered shell is always identical (HomePageMobileEntry uses ssr:false).
// force-static lets Vercel serve this from CDN edge — TTFB drops from ~2s to ~50ms.
export const dynamic = "force-static";

// HomePageMobileEntry is already a client component with dynamic imports configured
// No need for additional dynamic() wrapper in Server Component
export default function Page() {
  return (
    <Suspense fallback={<HomePageShell />}>
      <HomePageMobileEntry />
    </Suspense>
  );
}
