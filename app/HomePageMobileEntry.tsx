"use client";

import dynamic from "next/dynamic";
import HomePageShell from "./HomePageShell";

const HomePageClientMobile = dynamic(
  () => import("./HomePageController").then((m) => ({ default: m.HomePageController })),
  {
    ssr: false,
    // Keep users on the shell instead of a blank screen while the client bundle hydrates
    loading: () => <HomePageShell />,
  }
);

export default function HomePageMobileEntry() {
  return <HomePageClientMobile />;
}
