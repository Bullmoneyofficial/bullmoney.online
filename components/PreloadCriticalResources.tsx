"use client";

import { useEffect } from 'react';

// Preload critical resources for better performance
export function PreloadCriticalResources() {
  useEffect(() => {
    // Preload critical fonts
    const fontLinks = [
      { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', rel: 'stylesheet' },
    ];

    fontLinks.forEach(({ href, rel }) => {
      const link = document.createElement('link');
      link.href = href;
      link.rel = rel;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Preload critical images
    const imageUrls = [
      '/bullmoney-logo.png',
      '/bm-logo-hd.webp',
      '/newhero.mp4',
    ];

    imageUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'image';
      document.head.appendChild(link);
    });

    // Preload critical scripts
    const scriptUrls: string[] = [
      // Add any critical third-party scripts here
    ];

    scriptUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'script';
      document.head.appendChild(link);
    });

  }, []);

  return null;
}