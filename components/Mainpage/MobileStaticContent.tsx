"use client";

import React from "react";
import dynamic from "next/dynamic";

const SocialsFooter = dynamic(() => import("@/components/Mainpage/Socialsfooter"), { ssr: false });
const HeroMain = dynamic(() => import("@/app/VIP/heromain"), { ssr: false });
const ShopFunnel = dynamic(() => import("@/app/shop/ShopFunnel"), { ssr: false });
const ShopMain = dynamic(() => import("@/components/Mainpage/ShopMainpage"), { ssr: false });
const ChartNews = dynamic(() => import("@/app/Blogs/Chartnews"), { ssr: false });
const Pricing = dynamic(() => import("@/components/Mainpage/pricing").then((mod) => mod.Pricing), { ssr: false });
const Features = dynamic(() => import("@/components/Mainpage/features").then((mod) => mod.Features), { ssr: false });

export function MobileStaticContent() {
  return (
    <div className="w-full text-white">
      <div className="w-full" style={{ height: "calc(env(safe-area-inset-top, 0px) + 160px)" }} />

      <div className="flex flex-col gap-12">
        <section className="w-full">
          <SocialsFooter />
        </section>

        <section className="w-full">
          <HeroMain />
        </section>

        <section className="w-full">
          <ShopFunnel />
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

        <section className="w-full pb-24">
          <Features />
        </section>
      </div>
    </div>
  );
}

export default MobileStaticContent;
