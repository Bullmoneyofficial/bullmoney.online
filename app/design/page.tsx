'use client';

import { useEffect } from 'react';
import DesignStudioPage from "@/components/studio/DesignStudioPage";
import DesignSections from "@/components/studio/DesignSections";
import DesignPrintSections from "./DesignPrintSections";
import DesignShowcaseCards from "./DesignShowcaseCards";
import { forceEnableScrolling } from '@/lib/forceScrollEnabler';
import { useShowcaseScroll } from '@/hooks/useShowcaseScroll';
import "./design.css";

export default function DesignPage() {
  // Showcase scroll animation — uses hook defaults for lightweight perf
  useShowcaseScroll({
    startDelay: 1000,
    enabled: true,
    pageId: 'design',
  });

  // Force enable scrolling for all devices
  useEffect(() => {
    // Mark as design page
    document.documentElement.setAttribute('data-design-page', 'true');
    document.body.setAttribute('data-design-page', 'true');
    
    const cleanup = forceEnableScrolling();
    
    return () => {
      cleanup?.();
      document.documentElement.removeAttribute('data-design-page');
      document.body.removeAttribute('data-design-page');
    };
  }, []);

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
