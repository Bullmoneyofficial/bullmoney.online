"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import RecruitPage from "./RecruitPage";
import { safeSetItem } from "@/lib/localStorage";

type Variant = "page" | "modal";

export default function RecruitStandalone({
  variant,
}: {
  variant: Variant;
}) {
  const router = useRouter();

  const handleUnlock = useCallback(() => {
    // Keep behavior consistent with other pages that gate on registration.
    safeSetItem("vip_user_registered", "true");

    if (variant === "modal") {
      router.back();
      return;
    }

    router.push("/");
  }, [router, variant]);

  return <RecruitPage onUnlock={handleUnlock} />;
}
