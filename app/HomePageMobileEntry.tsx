"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import HomePageShell from "./HomePageShell";

const HomePageClientMobile = dynamic(
  () => import("./HomePageController").then((m) => ({ default: m.HomePageController })),
  {
    ssr: false,
    loading: () => <HomePageShell />,
  }
);

export default function HomePageMobileEntry() {
  return (
    <Suspense fallback={<HomePageShell />}>
      <HomePageClientMobile />
    </Suspense>
  );
}
