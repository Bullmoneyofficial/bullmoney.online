'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const ASSET_BASE = '/assets';

export default function BullcasinoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isGameDetailPage = /^\/games\/[^/]+$/.test(pathname || '');

  return (
    <main
      className="bullcasino-page"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={(e) => e.stopPropagation()}
      style={{
        background: 'radial-gradient(circle at top, rgba(15, 23, 42, 0.7), rgba(2, 6, 23, 0.95)), #0b1120',
        minHeight: 'auto',
        overflow: 'visible',
        position: 'relative',
        zIndex: 10,
        isolation: 'isolate',
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Only load boxicons for icons - removed style.css and notifyme.css as they have global selectors that break the landing page */}
      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <style>{`
        /* Shell-specific styles - no external CSS that can leak to parent page */
        .bullcasino-page {
          overflow: visible !important;
          min-height: auto !important;
        }
        
        /* Hide left navigation */
        .bullcasino-page .fix__left_nav,
        .bullcasino-page .leftside__games,
        .bullcasino-page .leftside__social {
          display: none !important;
        }
        
        /* Shell layout */
        .bullcasino-page .main__content {
          display: flex !important;
          flex-direction: column !important;
          position: static !important;
          padding: 0 !important;
          min-height: auto !important;
          overflow: visible !important;
          flex: 1 1 auto !important;
        }
        
        /* Games container — full width */
        .bullcasino-page .games__container {
          position: relative !important;
          margin: 0 auto !important;
          max-width: 100% !important;
          width: 100% !important;
          background: transparent !important;
          border-radius: 0 !important;
          border: none !important;
          overflow: visible !important;
          box-sizing: border-box !important;
          padding-left: clamp(12px, 3vw, 32px) !important;
          padding-right: clamp(12px, 3vw, 32px) !important;
        }
        
        /* Shell games grid — full-width responsive */
        .bullcasino-page .shell-games-grid {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: clamp(10px, 2vw, 20px) !important;
          height: auto !important;
          width: 100% !important;
        }
        @media (max-width: 900px) {
          .bullcasino-page .shell-games-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 400px) {
          .bullcasino-page .shell-games-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .bullcasino-page .shell-game-card {
          display: flex !important;
          flex-direction: column !important;
          height: auto !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        .bullcasino-page .shell-game-image {
          width: 100% !important;
          height: auto !important;
          aspect-ratio: 16 / 10 !important;
        }
        
        /* Shell navbar styles (inline replacement for style.css) */
        .bullcasino-page .navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: rgba(15, 23, 42, 0.95);
          border-bottom: 1px solid #1f2937;
        }
        .bullcasino-page .logotype {
          display: flex;
          align-items: center;
        }
        .bullcasino-page .bull-logo {
          font-weight: 700;
          font-size: 18px;
          color: #f8fafc;
        }
        .bullcasino-page .bull-logo .accent {
          background: linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .bullcasino-page .navmenu__list {
          display: flex;
          gap: 24px;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .bullcasino-page .navmenu__item_link {
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .bullcasino-page .navmenu__item_link:hover,
        .bullcasino-page .navmenu__item_link.active {
          color: #f8fafc;
        }
        .bullcasino-page .user__wallet {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bullcasino-page .user__balance {
          padding: 8px 16px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid #1f2937;
          border-radius: 8px;
          color: #f8fafc;
          font-size: 14px;
        }
        .bullcasino-page .wallet_up_btn {
          padding: 8px 16px;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 8px;
          color: #6b7280;
          font-size: 13px;
          cursor: not-allowed;
        }
        
        /* Mobile menu */
        .bullcasino-page .mobile_menu {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(15, 23, 42, 0.98);
          border-top: 1px solid #1f2937;
          padding: 8px 0;
          z-index: 100;
        }
        .bullcasino-page .mobile_menu__content {
          display: flex;
          justify-content: space-around;
        }
        .bullcasino-page .mobile_menu__link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 11px;
        }
        .bullcasino-page .mobile_menu__link i {
          font-size: 20px;
        }
        
        /* Footer */
        .bullcasino-page .footer {
          padding: 24px clamp(16px, 3vw, 32px) 16px;
          background: #000000;
          border-top: 1px solid #1f2937;
          margin-top: 0;
        }
        .bullcasino-page .footer__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 12px;
        }
        .bullcasino-page .footer_security {
          display: block;
          margin-top: 8px;
          color: #6b7280;
          font-size: 12px;
          font-weight: 400;
        }
        .bullcasino-page .footer__warn {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bullcasino-page .warn_mark {
          padding: 8px 12px;
          background: #dc2626;
          border-radius: 6px;
          color: white;
          font-weight: 700;
          font-size: 14px;
        }
        .bullcasino-page .warn_text {
          max-width: 400px;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.5;
        }
        .bullcasino-page .footer__bottom {
          display: flex;
          gap: 24px;
        }
        .bullcasino-page .footer__rules,
        .bullcasino-page .footer__privacy {
          color: #64748b;
          text-decoration: none;
          font-size: 13px;
        }
        .bullcasino-page .footer__rules:hover,
        .bullcasino-page .footer__privacy:hover {
          color: #94a3b8;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .bullcasino-page .navbar {
            padding: 12px 16px;
          }
          .bullcasino-page .navmenu {
            display: none;
          }
          .bullcasino-page .user__wallet {
            display: none;
          }
          .bullcasino-page .mobile_menu {
            display: block;
          }
          .bullcasino-page .footer {
            padding: 20px 16px 12px;
          }
          .bullcasino-page .footer__header {
            flex-direction: column;
            gap: 12px;
          }
          .bullcasino-page .footer__bottom {
            gap: 16px;
          }
        }
      `}</style>

      <div style={{ background: '#111827', color: '#f9fafb', padding: '10px 16px', textAlign: 'center', fontSize: 14, lineHeight: 1.5, borderBottom: '1px solid #1f2937' }}>
        Demo mode only. We do not process deposits or withdrawals, and all balances are virtual for entertainment only.
      </div>

      {!isGameDetailPage && (
        <div className="mobile_menu">
          <div className="mobile_menu__content">
            <a href="/games" className="mobile_menu__link">
              <i className='bx bxs-home'></i>
              Home
            </a>
            <a href="/games/terms" className="mobile_menu__link">
              <i className='bx bxs-file'></i>
              Terms
            </a>
            <a href="/community" className="mobile_menu__link">
              <i className='bx bxs-user-plus'></i>
              Community
            </a>
            <a href="/contact" className="mobile_menu__link">
              <i className='bx bxs-user-circle'></i>
              Support
            </a>
          </div>
        </div>
      )}

      <div className="main__content" style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
        {children}

        <footer className="footer" style={{ marginTop: 'auto' }}>
          <div className="footer__header">
            <div className="footer__logo">
              <a href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <img src={`${ASSET_BASE}/images/IMG_2921.PNG`} alt="BullMoney" style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 6 }} />
                <span className="bull-logo">Bull<span className="accent">Money</span></span>
              </a>
              <strong className="footer_security">© 2026 BullMoney. Demo environment only.</strong>
            </div>
            <div className="footer__warn">
              <div className="warn_mark">18+</div>
              <div className="warn_text">
                Entertainment only. No real-money gambling, deposits, or withdrawals. Play for fun.
              </div>
            </div>
          </div>
          <div className="footer__bottom">
            <a href="/games/terms" className="footer__rules">Terms of Use</a>
            <a href="/privacy" className="footer__privacy">Privacy Policy</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
