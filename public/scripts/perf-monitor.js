// Performance Monitoring Script - Loaded afterInteractive
// Separated from layout to reduce blocking time

(function() {
  'use strict';
  var w=window,d=document;
  var DEBUG=(w.location&&w.location.hostname==='localhost')||/[?&]bm_debug=1/.test(w.location.search||'');
  function log(){
    if(!DEBUG)return;
    try{console.log.apply(console,arguments);}catch(e){}
  }
  
  if (!('PerformanceObserver' in w)) {
    log('[Perf] PerformanceObserver not available');
    return;
  }
  var supported=PerformanceObserver.supportedEntryTypes||[];
  
  try {
    // First Contentful Paint
    if(supported.indexOf('paint')!==-1){
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            log('[Perf] FCP:', Math.round(entry.startTime) + 'ms');
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'], buffered:true });
    }

    // Largest Contentful Paint
    if(supported.indexOf('largest-contentful-paint')!==-1){
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if(!entries.length)return;
        const lastEntry = entries[entries.length - 1];
        log('[Perf] LCP:', Math.round(lastEntry.startTime) + 'ms');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'], buffered:true });
    }

    // First Input Delay
    if(supported.indexOf('first-input')!==-1){
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry.processingStart - entry.startTime;
          log('[Perf] FID:', Math.round(fid) + 'ms');
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'], buffered:true });
    }

    // Cumulative Layout Shift
    let clsScore = 0;
    if(supported.indexOf('layout-shift')!==-1){
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'], buffered:true });
    }

    // Log final CLS on page hide
    w.addEventListener('pagehide', () => {
      log('[Perf] CLS:', clsScore.toFixed(4));
    });
  } catch (e) {
    log('[Perf] Monitoring failed:', e);
  }
  
  // Install Prompt Handling
  let deferredPrompt;
  w.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    log('[PWA] Install prompt available');
    w.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  w.addEventListener('appinstalled', () => {
    log('[PWA] App installed');
    deferredPrompt = null;
  });

  w.showInstallPrompt = function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        log('[PWA] User choice:', choiceResult.outcome);
        deferredPrompt = null;
      });
    }
  };
})();
