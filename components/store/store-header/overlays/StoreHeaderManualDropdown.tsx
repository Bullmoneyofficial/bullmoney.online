'use client';

import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

export type StoreHeaderManualDropdownProps = {
  isMounted: boolean;
  isCasinoPage: boolean;
  manualDropdownOpen: boolean;
  setManualDropdownOpen: (next: boolean) => void;
};

export const StoreHeaderManualDropdown = memo(function StoreHeaderManualDropdown({
  isMounted,
  isCasinoPage,
  manualDropdownOpen,
  setManualDropdownOpen,
}: StoreHeaderManualDropdownProps) {
  if (!isMounted || typeof document === 'undefined' || !isCasinoPage) return null;

  return (
    <>
      {manualDropdownOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 hidden lg:block z-899" onClick={() => setManualDropdownOpen(false)} />
            <div
              className="fixed left-0 right-0 bottom-0 hidden lg:block pointer-events-none z-900"
              style={{
                top: '48px',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            />
          </>,
          document.documentElement
        )}

      {createPortal(
        <>
          <div
            className={`fixed left-0 right-0 z-950 hidden lg:block transition-opacity ${
              manualDropdownOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              top: '48px',
              transform: manualDropdownOpen ? 'translateY(0)' : 'translateY(-4px)',
              transition: 'opacity 150ms ease-in-out, transform 180ms ease-in-out',
              willChange: 'opacity, transform',
              backgroundColor: '#ffffff',
              colorScheme: 'light' as const,
            }}
          >
            <div style={{ background: '#ffffff', borderBottom: '1px solid #000000' }}>
              <div className="max-w-300 mx-auto px-10 py-10 grid grid-cols-3 gap-10">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>
                    How to Play
                  </p>
                  <div className="mt-5 space-y-2 text-sm" style={{ color: '#000000' }}>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Browse available demo games</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Click any game to launch</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Start with virtual play money</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>No account required to play</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Use browser back to exit</span>
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>
                    Important Notice
                  </p>
                  <div className="mt-5 space-y-3">
                    <div className="p-3 border border-black rounded-lg">
                      <p className="font-bold text-sm mb-1" style={{ color: '#000000' }}>
                        Demo Only
                      </p>
                      <p className="text-xs" style={{ color: '#666666' }}>
                        Virtual play money with no real value. This is NOT real gambling.
                      </p>
                    </div>
                    <div className="p-3 border border-black rounded-lg">
                      <p className="font-bold text-sm mb-1" style={{ color: '#000000' }}>
                        18+ Only
                      </p>
                      <p className="text-xs" style={{ color: '#666666' }}>
                        Must be 18+ years old to access these entertainment games.
                      </p>
                    </div>
                    <div className="p-3 border border-black rounded-lg">
                      <p className="font-bold text-sm mb-1" style={{ color: '#000000' }}>
                        Play Responsibly
                      </p>
                      <p className="text-xs" style={{ color: '#666666' }}>
                        Take breaks and remember this is just entertainment.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#666666' }}>
                    Support & Links
                  </p>
                  <div className="mt-5 space-y-3">
                    <p className="text-sm" style={{ color: '#000000' }}>
                      Your donations help us obtain gaming licenses and keep games free.
                    </p>
                    {!isCasinoPage && (
                      <Link
                        href="/community"
                        onClick={() => setManualDropdownOpen(false)}
                        className="block text-lg font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-2 py-1 rounded"
                        style={{ color: '#000000' }}
                      >
                        → Community Page
                      </Link>
                    )}
                    <Link
                      href="/"
                      onClick={() => setManualDropdownOpen(false)}
                      className="block text-lg font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-2 py-1 rounded"
                      style={{ color: '#000000' }}
                    >
                      → Back to Main Site
                    </Link>
                    <button
                      onClick={() => setManualDropdownOpen(false)}
                      className="block text-left text-lg font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-2 py-1 rounded w-full"
                      style={{ color: '#000000' }}
                    >
                      Close Manual
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`fixed left-0 right-0 z-950 lg:hidden transition-all ${
              manualDropdownOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              top: '48px',
              transform: manualDropdownOpen ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'opacity 150ms ease-in-out, transform 180ms ease-in-out',
              willChange: 'opacity, transform',
              backgroundColor: '#ffffff',
              colorScheme: 'light' as const,
            }}
          >
            <div style={{ background: '#ffffff', borderBottom: '1px solid #000000' }}>
              <div className="px-6 py-6 space-y-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: '#666666' }}>
                    How to Play
                  </p>
                  <div className="space-y-2 text-sm" style={{ color: '#000000' }}>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Browse available demo games</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Click any game to launch</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>Start with virtual play money</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>No account required</span>
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] mb-3" style={{ color: '#666666' }}>
                    Important
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 border border-black rounded-lg">
                      <p className="font-bold text-sm mb-1" style={{ color: '#000000' }}>
                        Demo Only
                      </p>
                      <p className="text-xs" style={{ color: '#666666' }}>
                        Virtual play money with no real value.
                      </p>
                    </div>
                    <div className="p-3 border border-black rounded-lg">
                      <p className="font-bold text-sm mb-1" style={{ color: '#000000' }}>
                        18+ Only
                      </p>
                      <p className="text-xs" style={{ color: '#666666' }}>
                        Must be 18+ to access.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  {!isCasinoPage && (
                    <Link
                      href="/community"
                      onClick={() => setManualDropdownOpen(false)}
                      className="block text-base font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-3 py-2 rounded mb-2"
                      style={{ color: '#000000' }}
                    >
                      → Community Page
                    </Link>
                  )}
                  <Link
                    href="/"
                    onClick={() => setManualDropdownOpen(false)}
                    className="block text-base font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-3 py-2 rounded mb-2"
                    style={{ color: '#000000' }}
                  >
                    → Back to Main Site
                  </Link>
                  <button
                    onClick={() => setManualDropdownOpen(false)}
                    className="block text-left w-full text-base font-medium tracking-tight transition-colors hover:text-white hover:bg-black px-3 py-2 rounded"
                    style={{ color: '#000000' }}
                  >
                    Close Manual
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.documentElement
      )}
    </>
  );
});
