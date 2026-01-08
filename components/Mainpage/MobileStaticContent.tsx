"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useDeviceProfile } from "@/lib/deviceProfile";
import { SmartSplineLoader } from "@/components/Mainpage/SmartSplineLoader";

const SocialsFooter = dynamic(() => import("@/components/Mainpage/Socialsfooter"), { ssr: false });
const ShopScrollFunnel = dynamic(() => import("@/app/shop/ShopScrollFunnel"), { ssr: false });
const ShopMain = dynamic(() => import("@/components/Mainpage/ShopMainpage"), { ssr: false });
const ChartNews = dynamic(() => import("@/app/Blogs/Chartnews"), { ssr: false });
const Pricing = dynamic(() => import("@/components/Mainpage/pricing").then((mod) => mod.Pricing), { ssr: false });
const Features = dynamic(() => import("@/components/Mainpage/features").then((mod) => mod.Features), { ssr: false });

const MobileSplineSection = ({
  scene,
  priority,
  deviceProfile,
}: {
  scene: string;
  priority: "critical" | "high" | "normal" | "low";
  deviceProfile: ReturnType<typeof useDeviceProfile>;
}) => (
  <div
    className="relative w-full h-[100dvh] overflow-hidden bg-black"
    style={{ touchAction: "none" }}
  >
    <SmartSplineLoader
      scene={scene}
      priority={priority}
      enableInteraction={true}
      deviceProfile={deviceProfile}
      className="absolute inset-0 w-full h-full"
    />
  </div>
);

export function MobileStaticContent() {
  const deviceProfile = useDeviceProfile();

  return (
    <div className="w-full text-white">
      <div className="w-full" style={{ height: "calc(env(safe-area-inset-top, 0px) + 120px)" }} />

      <div className="flex flex-col gap-12">
        <section className="w-full">
          <SocialsFooter />
        </section>

        <section className="w-full">
          <MobileSplineSection
            scene="/scene1.splinecode"
            priority="critical"
            deviceProfile={deviceProfile}
          />
        </section>

        <section className="w-full">
          <ShopMain />
        </section>

        <section className="w-full">
          <ChartNews />
        </section>

        <section className="w-full">
          <Pricing />
        </section>

        <section className="w-full">
          <Features />
        </section>

        <section className="w-full">
          <ShopScrollFunnel />
        </section>

        <section className="w-full">
          <MobileSplineSection
            scene="/scene2.splinecode"
            priority="high"
            deviceProfile={deviceProfile}
          />
        </section>

        <section className="w-full">
          <MobileSplineSection
            scene="/scene6.splinecode"
            priority="high"
            deviceProfile={deviceProfile}
          />
        </section>

      </div>
    </div>
  );
}

export default MobileStaticContent;
