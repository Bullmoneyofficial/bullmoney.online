"use client";

import React from "react";

export const FooterStyles = () => (
  <style jsx global>{`
    /* Scrollbar styles only - shimmer animations come from UnifiedShimmer.tsx */
    .footer-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .footer-scrollbar::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.3);
      border-radius: 3px;
    }
    .footer-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(59, 130, 246, 0.4);
      border-radius: 3px;
    }
    .footer-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(59, 130, 246, 0.6);
    }
  `}</style>
);

export default FooterStyles;
