"use client";

interface ProgressBarProps {
  isVisible: boolean;
  activePage: number;
  totalPages: number;
}

export function ProgressBar({ isVisible, activePage, totalPages }: ProgressBarProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 sm:h-1.5 md:h-2 bg-black/50 pointer-events-none overflow-hidden"
      style={{
        zIndex: 9994,
        top: 'env(safe-area-inset-top, 0px)',
        maxWidth: '100vw'
      }}
    >
      <div
        className="h-full bg-linear-to-r from-white to-white transition-all duration-300"
        style={{ width: `${totalPages > 1 ? ((activePage - 1) / (totalPages - 1)) * 100 : 0}%` }}
      />
    </div>
  );
}
