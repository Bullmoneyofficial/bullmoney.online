'use client';

import type { ReactNode } from 'react';
import { useHubStore } from '@/stores/hub-store';
import { HubDrawer } from './HubDrawer';
import { Layers } from 'lucide-react';

const ASSET_BASE = '/assets';


const navGames = [
  { slug: 'dice', icon: 'bx-dice-5' },
  { slug: 'mines', icon: 'bx-bomb' },
  { slug: 'wheel', icon: 'bx-color' },
  { slug: 'jackpot', icon: 'bx-crown' },
  { slug: 'crash', icon: 'bx-line-chart' },
  { slug: 'slots', icon: 'bx-grid-alt' },
];

export default function BullcasinoShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="bullcasino-page"
      style={{
        background: 'radial-gradient(circle at top, rgba(15, 23, 42, 0.7), rgba(2, 6, 23, 0.95)), #0b1120',
        minHeight: '100vh',
        overflow: 'visible',
      }}
    >
      <link rel="stylesheet" href={`${ASSET_BASE}/css/style.css`} />
      <link rel="stylesheet" href={`${ASSET_BASE}/css/notifyme.css`} />
      <link rel="stylesheet" href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" />
      <style>{`
        /* Fix scrolling issues - override external CSS */
        html, body {
          height: auto !important;
          min-height: 100% !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }
        .bullcasino-page {
          overflow: visible !important;
        }
        .main__content {
          overflow: visible !important;
        }
      `}</style>

      <div style={{ background: '#111827', color: '#f9fafb', padding: '10px 16px', textAlign: 'center', fontSize: 14, lineHeight: 1.5, borderBottom: '1px solid #1f2937' }}>
        Demo mode only. We do not process deposits or withdrawals, and all balances are virtual for entertainment only.
      </div>

      <div className="navbar">
        <div className="logotype">
          <a href="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={`${ASSET_BASE}/images/IMG_2921.PNG`} alt="BullMoney" style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 6 }} />
            <span className="bull-logo">Bull<span className="accent">Money</span></span>
          </a>
        </div>
        <div className="navmenu">
          <ul className="navmenu__list">
            <li className="navmenu__item">
              <a href="/games" className="navmenu__item_link active">Home</a>
            </li>
            <li className="navmenu__item">
              <a href="/games/terms" className="navmenu__item_link">Terms</a>
            </li>
            <li className="navmenu__item">
              <a href="/community" className="navmenu__item_link">Community</a>
            </li>
            <li className="navmenu__item">
              <a href="/contact" className="navmenu__item_link">Support</a>
            </li>
          </ul>
        </div>
        <div className="user__wallet">
          <div className="user__balance">
            <span id="balance">0.00 <span className="ruble">RUB</span></span>
          </div>
          <button className="wallet_up_btn" aria-disabled="true" title="Wallet actions are disabled; demo balance only." style={{ cursor: 'not-allowed' }}>
            Wallet Disabled
          </button>
        </div>
      </div>

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

      <div className="fix__left_nav">
        <div className="leftside__games">
          {navGames.map((game) => (
            <div className="leftside__game" key={game.slug}>
              <a href={`/games/${game.slug}`}>
                <i className={`bx ${game.icon}`}></i>
              </a>
            </div>
          ))}
        </div>
        <div className="leftside__social">
          <div className="social social_tg">
            <a href="https://t.me/BullMoney" target="_blank" rel="noreferrer">
              <i className='bx bxl-telegram'></i>
            </a>
          </div>
        </div>
      </div>

      <div className="main__content">
        {children}

        <footer className="footer">
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
