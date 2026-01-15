"use client";

import dynamic from "next/dynamic";

const RecruitModal = dynamic(() => import("@/components/RecruitModal"), {
  ssr: false,
});

export default function RecruitModalRoute() {
  // This route intercept is no longer needed since Affiliates opens as a modal from navbar
  // But keeping it for backwards compatibility if someone navigates directly to /recruit
  return <RecruitModal isOpen={true} onClose={() => {}} />;
}
