'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const CookieConsentDesktop = dynamic(() => import('./CookieConsentDesktop'), { ssr: false });
const CookieConsentMobile = dynamic(() => import('./CookieConsentMobile'), { ssr: false });

/**
 * Responsive cookie consent wrapper.
 * Renders the desktop or mobile variant based on viewport width.
 * Drop this component into any page that needs the cookie banner.
 */
export default function CookieConsent() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile === null) return null;

  return isMobile ? <CookieConsentMobile /> : <CookieConsentDesktop />;
}
