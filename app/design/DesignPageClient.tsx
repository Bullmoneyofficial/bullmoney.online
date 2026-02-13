'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { forceEnableScrolling } from '@/lib/forceScrollEnabler';
import { useShowcaseScroll } from '@/hooks/useShowcaseScroll';

const DesignPrintSections = dynamic(() => import('./DesignPrintSections'), {
  ssr: false,
  loading: () => <div className="h-[70vh] w-full animate-pulse bg-[#fafafa]" />,
});

const DesignStudioPage = dynamic(
  () => import('@/components/studio/DesignStudioPage'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4" />
          <div className="text-white text-lg font-semibold">Loading Design Studio...</div>
        </div>
      </div>
    ),
  }
);

const DesignSections = dynamic(
  () => import('@/components/studio/DesignSections'),
  {
    ssr: false,
    loading: () => <div className="h-80 w-full animate-pulse bg-black/5" />,
  }
);

export default function DesignPageClient() {
  // Showcase scroll animation
  useShowcaseScroll({
    startDelay: 1000,
    enabled: true,
    pageId: 'design',
  });

  // Force enable scrolling for all devices
  useEffect(() => {
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
      <DesignPrintSections />
      <section id="design-studio" className="design-content-wrap" data-canvas-section="true">
        <div className="design-root min-h-screen">
          <div className="design-ambient" aria-hidden="true" />
          <DesignStudioPage />
        </div>
      </section>
      <section id="design-sections" className="design-content-wrap">
        <DesignSections scrollTargetId="design-studio" enableStudioEvents />
      </section>
    </>
  );
}
