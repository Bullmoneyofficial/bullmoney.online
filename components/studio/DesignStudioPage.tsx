"use client";

import dynamic from "next/dynamic";

const DesignStudio = dynamic(() => import("@/components/studio/DesignStudio"), {
  ssr: false,
});

export default function DesignStudioPage() {
  return <DesignStudio />;
}
