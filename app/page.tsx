import { Suspense } from "react";
import HomePageShell from "./HomePageShell";
import HomePageMobileEntry from "./HomePageMobileEntry";

export default function Page() {
  return (
    <Suspense fallback={<HomePageShell />}>
      <HomePageMobileEntry />
    </Suspense>
  );
}
