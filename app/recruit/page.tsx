"use client";

import dynamic from "next/dynamic";

const RecruitStandalone = dynamic(() => import("./RecruitStandalone"), {
  ssr: false,
});

export default function RecruitPageRoute() {
  return <RecruitStandalone variant="page" />;
}
