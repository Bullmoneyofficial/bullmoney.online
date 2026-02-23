import { Suspense } from "react";
import HomePageMobileEntry from "./HomePageMobileEntry";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomePageMobileEntry />
    </Suspense>
  );
}
