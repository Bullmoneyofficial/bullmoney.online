"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const HomePageClientMobile = dynamic(
  () => import("./HomePageController").then((m) => ({ default: m.HomePageController })),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function HomePageMobileEntry() {
  return (
    <Suspense fallback={null}>
      <HomePageClientMobile />
    </Suspense>
  );
}
