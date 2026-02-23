import { Suspense } from "react";
import dynamic from "next/dynamic";
import HomePageShell from "./HomePageShell";

// Client boundary, but loaded with SSR-friendly dynamic so Server Components can render the fallback
const HomePage = dynamic(() => import("./HomePageMobileEntry"), {
  loading: () => <HomePageShell />,
});

export default function Page() {
  return (
    <Suspense fallback={<HomePageShell />}>
      <HomePage />
    </Suspense>
  );
}
