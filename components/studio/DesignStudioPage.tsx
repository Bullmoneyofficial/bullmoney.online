"use client";

import dynamic from "next/dynamic";

const DesignStudio = dynamic(() => import("@/components/studio/DesignStudio"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-white text-lg font-semibold">Loading Design Studio...</div>
        <div className="text-gray-400 text-sm mt-2">Initializing canvas editor</div>
      </div>
    </div>
  ),
});

export default function DesignStudioPage() {
  return <DesignStudio />;
}
