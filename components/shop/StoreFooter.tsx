'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useFaqModalUI, useDisclaimerModalUI } from '@/contexts/UIStateContext';

// Lazy load modals
const LazyFaqModal = dynamic(() => import('@/components/navbar/LazyModalSystem').then(mod => ({ default: mod.LazyFaqModal })), { ssr: false });
const LegalDisclaimerModal = dynamic(() => import('@/components/Mainpage/footer/LegalDisclaimerModal').then(mod => ({ default: mod.LegalDisclaimerModal })), { ssr: false });

// ============================================================================
// STORE FOOTER - Collapsible, Lightweight, Clean, Minimal Design
// Collapsed by default in modals, expandable on click
// ============================================================================

const FOOTER_GROUPS = [
  {
    title: 'Shop and Learn',
    links: [
      { label: 'Store', href: '/store' },
      { label: 'Apparel', href: '/store?category=apparel' },
      { label: 'Accessories', href: '/store?category=accessories' },
      { label: 'Tech and Gear', href: '/store?category=tech-gear' },
      { label: 'Drinkware', href: '/store?category=drinkware' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Manage Your Account', href: '/store/account' },
      { label: 'Order Status', href: '/store/account' },
      { label: 'Saved Items', href: '/store' },
    ],
  },
  {
    title: 'Store Services',
    links: [
      { label: 'Shipping and Delivery', href: '/store' },
      { label: 'Returns and Refunds', href: '/store' },
      { label: 'Gift Cards', href: '/store/gift-cards' },
      { label: 'FAQ', modal: 'faq', href: '#' },
    ],
  },
  {
    title: 'For Business',
    links: [
      { label: 'Affiliate Program', href: '/recruit' },
      { label: 'Partnerships', href: '/community' },
    ],
  },
  {
    title: 'About BullMoney',
    links: [
      { label: 'Community', href: '/community' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/community' },
      { label: 'Legal', modal: 'legal', href: '#' },
    ],
  },
] as const;

export function StoreFooter({ collapsed: initialCollapsed = true }: { collapsed?: boolean } = {}) {
  const currentYear = new Date().getFullYear();
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  
  const { setIsOpen: setFaqOpen } = useFaqModalUI();
  const { setIsOpen: setDisclaimerOpen } = useDisclaimerModalUI();

  const handleLinkClick = (link: { label: string; href?: string; modal?: string }) => {
    if (link.modal === 'faq') {
      setFaqModalOpen(true);
      setFaqOpen(true);
    } else if (link.modal === 'legal') {
      setLegalModalOpen(true);
      setDisclaimerOpen(true);
    }
  };

  return (
    <footer
      className="relative border-t border-white/10"
      style={{ background: '#000', color: '#fff' }}
      data-apple-section
    >
      {/* Collapsed Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 md:px-10 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <img src="/bullmoney-logo.png" alt="BullMoney" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-[12px] font-medium text-white/70">BullMoney Store</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <span className="hidden sm:inline">Shop · Account · Support</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 pb-10">
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Prices and availability are subject to change. Shipping times vary by region. Some items ship in limited quantities.
          </p>

        <div className="mt-8 md:hidden divide-y divide-white/10">
          {FOOTER_GROUPS.map((group) => (
            <details key={group.title} className="py-3">
              <summary className="text-[12px] font-semibold tracking-wide" style={{ color: '#fff' }}>
                {group.title}
              </summary>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.modal ? (
                      <button
                        onClick={() => handleLinkClick(link)}
                        className="text-[12px]"
                        style={{ color: 'rgba(255,255,255,0.55)' }}
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href || '#'}
                        className="text-[12px]"
                        style={{ color: 'rgba(255,255,255,0.55)' }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <div className="mt-8 hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h5 className="text-[12px] font-semibold" style={{ color: '#fff' }}>
                {group.title}
              </h5>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.modal ? (
                      <button
                        onClick={() => handleLinkClick(link)}
                        className="text-[12px] transition-colors"
                        style={{ color: 'rgba(255,255,255,0.55)' }}
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href || '#'}
                        className="text-[12px] transition-colors"
                        style={{ color: 'rgba(255,255,255,0.55)' }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            More ways to shop: visit the BullMoney Store or contact support.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <span>United States</span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>|</span>
            <button onClick={() => handleLinkClick({ label: 'Terms', modal: 'legal' })}>Terms</button>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>|</span>
            <button onClick={() => handleLinkClick({ label: 'Privacy', modal: 'legal' })}>Privacy</button>
          </div>
        </div>

        </div>
      </div>

      {/* Modals */}
      {faqModalOpen && (
        <LazyFaqModal
          isOpen={faqModalOpen}
          onClose={() => {
            setFaqModalOpen(false);
            setFaqOpen(false);
          }}
        />
      )}
      {legalModalOpen && (
        <LegalDisclaimerModal
          isOpen={legalModalOpen}
          onClose={() => {
            setLegalModalOpen(false);
            setDisclaimerOpen(false);
          }}
        />
      )}
    </footer>
  );
}

export default StoreFooter;
