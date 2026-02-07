'use client';

import { useEffect, useState } from 'react';
import CryptoGuideMobile from './CryptoGuideMobile';
import CryptoGuideDesktop from './CryptoGuideDesktop';

export default function CryptoGuidePage() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {isDesktop ? <CryptoGuideDesktop /> : <CryptoGuideMobile />}
    </>
  );
}
