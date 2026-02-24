import { Suspense } from "react";
import HomePageMobileEntry from "./HomePageMobileEntry";
import HomePageShell from "./HomePageShell";

// HomePageMobileEntry is already a client component with dynamic imports configured
// No need for additional dynamic() wrapper in Server Component
export default function Page() {
  return (
    <Suspense fallback={<HomePageShell />}>
      <HomePageMobileEntry />
    </Suspense>
  );
}
