'use client';

import type { Metadata } from "next";
import DesignStudioPage from "@/components/studio/DesignStudioPage";
import DesignSections from "@/components/studio/DesignSections";
import DesignPrintSections from "./DesignPrintSections";
import DesignShowcaseCards from "./DesignShowcaseCards";
import "./design.css";

export default function DesignPage() {
  return (
    <>
      <main className="design-page-root">
        <DesignPrintSections />
        <DesignShowcaseCards />
        <section id="design-studio" className="design-content-wrap" data-canvas-section="true">
          <div className="design-root min-h-screen">
            <div className="design-ambient" aria-hidden="true" />
            <DesignStudioPage />
          </div>
        </section>
        <section id="design-sections" className="design-content-wrap">
          <DesignSections scrollTargetId="design-studio" enableStudioEvents />
        </section>
      </main>
    </>
  );
}
