"use client";

import { useEffect, useState, Suspense } from "react";
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
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <HomePageShell />;
  }

  return (
    <Suspense fallback={<HomePageShell />}>
      <HomePageClientMobile />
    </Suspense>
  );
}
