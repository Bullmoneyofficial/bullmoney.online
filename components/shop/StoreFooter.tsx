'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Instagram, Youtube, MessageCircle, Send, XSquareIcon, Check, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useFaqModalUI, useDisclaimerModalUI } from '@/contexts/UIStateContext';

// Custom icons for TikTok and X (Twitter)
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="white" style={{ color: 'white' }} className={className} xmlns="http://www.w3.org/2000/svg"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.373 6.373 0 0 0-5.394 10.637 6.354 6.354 0 0 0 5.212-1.936V23h3.445v-4.03a7.276 7.276 0 0 0 7.397-7.397v-4.887z" /></svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="white" style={{ color: 'white' }} className={className} xmlns="http://www.w3.org/2000/svg"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
);

// Lazy load modals
const LazyFaqModal = dynamic(() => import('@/components/navbar/LazyModalSystem').then(mod => ({ default: mod.LazyFaqModal })), { ssr: false });
const LegalDisclaimerModal = dynamic(() => import('@/components/Mainpage/footer/LegalDisclaimerModal').then(mod => ({ default: mod.LegalDisclaimerModal })), { ssr: false });

// ============================================================================
// STORE FOOTER - Lightweight, Clean, Minimal Design
// No heavy animations, simple CSS transitions for performance
// ============================================================================

const FOOTER_LINKS = {
  legal: [
    { label: 'Terms & Privacy', modal: 'legal', href: '#' },
    { label: 'Refund Policy', modal: 'legal', href: '#' },
    { label: 'Legal Notice', modal: 'legal', href: '#' },
  ],
};

const SOCIAL_LINKS = [
  { icon: TikTokIcon, href: 'https://www.tiktok.com/@bullmoney.shop?_r=1&_t=ZP-91yqeZbNosA', label: 'TikTok', isCustom: true },
  { icon: Instagram, href: 'https://www.instagram.com/bullmoney.shop', label: 'Instagram', isCustom: false },
  { icon: XIcon, href: 'https://x.com/BULLMONEYFX', label: 'Twitter', isCustom: true },
  { icon: XSquareIcon, href: 'https://affs.click/t5wni', label: 'XM', isCustom: false },
  { icon: Youtube, href: 'https://www.youtube.com/@bullmoney.online', label: 'YouTube', isCustom: false },
  { icon: MessageCircle, href: 'https://discord.com/invite/9vVB44ZrNA', label: 'Discord', isCustom: false },
  { icon: Send, href: 'https://t.me/Bullmoneyshop', label: 'Telegram', isCustom: false },
];

export function StoreFooter() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  
  const { setIsOpen: setFaqOpen } = useFaqModalUI();
  const { setIsOpen: setDisclaimerOpen } = useDisclaimerModalUI();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/store/newsletter/subscribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Newsletter-Source': 'store_footer'
        },
        body: JSON.stringify({ 
          email, 
          source: 'store_footer_gmail_hub',
          useGmailHub: true,
          preferences: {
            marketing: true,
            updates: true
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Welcome! Check your Gmail for exclusive trading insights.');
        setEmail('');
        
        // Track newsletter signup
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'newsletter_signup', {
            event_category: 'engagement',
            event_label: 'store_footer_gmail_hub'
          });
        }
        
        // Reset after 5 seconds
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong with Gmail subscription');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Gmail newsletter unavailable. Please try again.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

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
    <footer className="relative bg-black border-t border-white/10">
      {/* Main Footer Content */}
      <div className="max-w-450 mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Top Section - Logo & Newsletter */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-12 pb-12 border-b border-white/5">
          {/* Logo & Tagline */}
          <div className="flex flex-col gap-4">
            <Link href="/store" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <span className="text-black font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-light tracking-tight">
                Bullmoney Store
              </span>
            </Link>
            <p className="text-white/50 text-sm max-w-xs leading-relaxed">
              Premium trading lifestyle apparel and accessories. Designed for traders who move markets.
            </p>
          </div>

          {/* Newsletter Signup - Gmail Admin Hub Integration */}
          <div className="flex flex-col gap-3 max-w-sm">
            <h4 className="text-white font-medium text-sm">Daily Trading Intel</h4>
            <p className="text-white/40 text-xs">
              Get exclusive market alerts, trading setups, and insights delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading' || status === 'success'}
                className="flex-1 h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm
                         text-white! placeholder:text-white/30 focus:outline-none focus:border-white/20
                         transition-colors disabled:opacity-50"
                aria-label="Enter your email address for newsletter"
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success' || !email}
                className="h-10 px-4 bg-white text-black text-sm font-medium rounded-xl
                         hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50
                         disabled:cursor-not-allowed flex items-center gap-2 min-w-25 justify-center"
                aria-label="Subscribe to newsletter"
              >
                {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                {status === 'success' && <Check className="w-4 h-4" />}
                {status === 'loading' ? 'Sending...' : status === 'success' ? 'Subscribed!' : 'Get Intel'}
              </button>
            </form>
            {message && (
              <p className={`text-xs ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}
            <p className="text-white/20 text-[10px]">
              Unsubscribe anytime • Admin Hub Powered
            </p>
          </div>
        </div>

        {/* Legal Links - Centered */}
        <div className="flex justify-center mb-12">
          <div>
            <h5 className="text-white font-medium text-sm mb-4 uppercase tracking-wider text-center">Legal</h5>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {FOOTER_LINKS.legal.map((link, index) => (
                <li key={link.label}>
                  {link.modal ? (
                    <button
                      onClick={() => handleLinkClick(link)}
                      className="text-white/50 text-sm hover:text-white transition-colors duration-200 text-left"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      href={link.href || '#'}
                      className="text-white/50 text-sm hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  )}
                  {index < FOOTER_LINKS.legal.length - 1 && (
                    <span className="ml-6 text-white/20">•</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section - Social, Currency & Copyright */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pt-8 border-t border-white/5">
          {/* Social Links */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10
                         text-white! hover:bg-white/10 hover:border-white/20
                         transition-all duration-200"
                style={{ color: 'white' }}
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4 text-white!" style={{ color: 'white' }} />
              </a>
            ))}
          </div>

          {/* Copyright & Payment Methods */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            {/* Payment Methods - Simple text for lightweight */}
            <div className="flex items-center gap-2 text-white/30 text-xs">
              <span>Secure payments via</span>
              <span className="text-white/50 font-medium">Stripe</span>
              <span className="text-white/20">•</span>
              <span className="text-white/50 font-medium">Apple Pay</span>
              <span className="text-white/20">•</span>
              <span className="text-white/50 font-medium">Google Pay</span>
            </div>

            {/* Copyright */}
            <p className="text-white/30 text-xs">
              © {currentYear} Bullmoney. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Subtle gradient fade at top */}
      <div 
        className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />

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
