'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  ChevronRight,
  Clock,
  Instagram,
  ArrowLeft,
  Headphones,
  HelpCircle,
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  ExternalLink,
  Bot,
  Sparkles,
  Users,
  Globe,
} from 'lucide-react';
import { useSupportDrawerUI } from '@/contexts/UIStateContext';

// ============================================================================
// SUPPORT DRAWER — CartDrawer-style slide-out panel with React Portal
// Same size, width, scroll, animations, colors, text, layout as CartDrawer
// ============================================================================

const TelegramIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.373 6.373 0 0 0-5.394 10.637 6.354 6.354 0 0 0 5.212-1.936V23h3.445v-4.03a7.276 7.276 0 0 0 7.397-7.397v-4.887z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const DiscordIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const SOCIAL_CHANNELS = [
  { name: 'Telegram', description: 'Fastest response — DM us directly', icon: TelegramIcon, url: 'https://t.me/Bullmoneyshop', responseTime: '~15 min', isCustomIcon: true },
  { name: 'Instagram', description: 'DM us @bullmoney.shop', icon: Instagram, url: 'https://www.instagram.com/bullmoney.shop', responseTime: '~1-2 hrs' },
  { name: 'Discord', description: 'Join & open a support ticket', icon: DiscordIcon, url: 'https://discord.com/invite/9vVB44ZrNA', responseTime: '~1-6 hrs', isCustomIcon: true },
  { name: 'X (Twitter)', description: 'DM @BULLMONEYFX', icon: XIcon, url: 'https://x.com/BULLMONEYFX', responseTime: '~2-12 hrs', isCustomIcon: true },
  { name: 'TikTok', description: 'Message @bullmoney.shop', icon: TikTokIcon, url: 'https://www.tiktok.com/@bullmoney.shop', responseTime: '~6-24 hrs', isCustomIcon: true },
];

const FAQ_CATEGORIES = [
  {
    id: 'orders', label: 'Orders & Shipping', icon: Package,
    questions: [
      { q: 'How long does shipping take?', a: 'Standard shipping takes 7-14 business days worldwide. Express shipping (where available) takes 3-7 business days. You\u2019ll receive a tracking number via email once your order ships.' },
      { q: 'Where do you ship to?', a: 'We ship worldwide! Shipping costs and delivery times vary by location. Customs duties/taxes may apply for international orders and are the responsibility of the buyer.' },
      { q: 'How do I track my order?', a: 'Once your order ships, you\u2019ll receive an email with a tracking number and link. You can also check your order status in your account dashboard under "Orders".' },
      { q: 'Can I change or cancel my order?', a: 'We process orders quickly! Contact us within 2 hours of placing your order via Telegram (@Bullmoneyshop) for the fastest response. After that, changes may not be possible once production begins.' },
    ],
  },
  {
    id: 'payments', label: 'Payments', icon: CreditCard,
    questions: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and Shop Pay. Crypto payments may be available for select items.' },
      { q: 'Is my payment secure?', a: 'Absolutely. All transactions are encrypted with SSL/TLS and processed through secure payment gateways. We never store your full card details.' },
      { q: 'Do you offer payment plans?', a: 'Shop Pay installments may be available at checkout for qualifying orders. Split your purchase into 4 interest-free payments.' },
    ],
  },
  {
    id: 'returns', label: 'Returns & Refunds', icon: RotateCcw,
    questions: [
      { q: 'What\u2019s your return policy?', a: 'We offer returns within 30 days of delivery for unworn/unused items in original packaging. Contact us via Telegram or Instagram DM to start a return. Note: Limited edition items are final sale.' },
      { q: 'How long do refunds take?', a: 'Once we receive your return, refunds are processed within 5-10 business days. The refund will appear on your original payment method. You\u2019ll receive an email confirmation.' },
      { q: 'What if my item arrives damaged?', a: 'We\u2019re sorry! Send us a photo of the damage via Telegram (@Bullmoneyshop) or Instagram DM within 48 hours of delivery. We\u2019ll send a replacement or issue a full refund ASAP.' },
    ],
  },
  {
    id: 'delivery', label: 'Delivery Issues', icon: Truck,
    questions: [
      { q: 'My order hasn\u2019t arrived yet', a: 'Check your tracking number first. If it shows "delivered" but you haven\u2019t received it, check with neighbours or your building\u2019s package area. If still missing, contact us within 7 days and we\u2019ll investigate with the carrier.' },
      { q: 'Wrong item received', a: 'We apologise for the mix-up! DM us on Telegram (@Bullmoneyshop) with your order number and a photo. We\u2019ll ship the correct item immediately \u2014 no need to return the wrong one first.' },
    ],
  },
  {
    id: 'general', label: 'General', icon: HelpCircle,
    questions: [
      { q: 'Do you drop new products regularly?', a: 'Yes! We drop new collections and limited editions regularly. Follow us on Instagram and TikTok (@bullmoney.shop) to get notified first. Limited edition items sell out fast!' },
      { q: 'Do you offer wholesale or bulk orders?', a: 'Yes, we offer bulk pricing for teams, trading communities, and businesses. DM us on Telegram (@Bullmoneyshop) with your requirements for a custom quote.' },
      { q: 'How can I collaborate or partner with BullMoney?', a: 'We love collaborations! Reach out to us on Instagram or Telegram with your proposal. We work with traders, influencers, and trading communities.' },
    ],
  },
];

const TELEGRAM_BOT_NAME = 'Bullmoneyshop';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
}

type View = 'home' | 'faq' | 'faq-category' | 'social' | 'chat' | 'telegram' | 'discord';

// ============================================================================
// SUPPORT DRAWER - Matches CartDrawer styling exactly
// ============================================================================

export function SupportDrawer() {
  const { isOpen, setIsOpen } = useSupportDrawerUI();
  const SUPPORT_DRAWER_BACKDROP_Z_INDEX = 2147483602;
  const SUPPORT_DRAWER_PANEL_Z_INDEX = 2147483603;
  const [isDesktop, setIsDesktop] = useState(false);
  const [view, setView] = useState<View>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Desktop detection (same as CartDrawer)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatch);
    } else {
      mediaQuery.addListener(updateMatch);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateMatch);
      } else {
        mediaQuery.removeListener(updateMatch);
      }
    };
  }, []);

  // Reset view when drawer closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay so the exit animation plays with current content
      const t = setTimeout(() => setView('home'), 200);
      return () => clearTimeout(t);
    }
    // Initialize bot message when opening for the first time
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'bot',
        timestamp: new Date(),
        content: 'Hey! \ud83d\udc4b Welcome to BullMoney Support.\n\nI\u2019m an AI assistant that can help with orders, shipping, returns, and more. Ask me anything!\n\nOr chat live with our team on Telegram or Discord.',
      }]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll chat
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  // Auto-focus chat input
  useEffect(() => { if (view === 'chat') setTimeout(() => inputRef.current?.focus(), 300); }, [view]);

  const closeDrawer = () => setIsOpen(false);

  const navigateTo = (v: View, catId?: string) => {
    setView(v);
    if (catId) setSelectedCategory(catId);
  };

  const goBack = () => {
    if (view === 'faq-category') setView('faq');
    else if (view === 'telegram' || view === 'discord') setView('social');
    else setView('home');
  };

  // AI chat
  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    const userMsg: Message = { id: Date.now().toString(), type: 'user', content: text, timestamp: new Date() };
    setMessages(p => [...p, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setAiThinking(true);

    const thinkingId = (Date.now() + 1).toString();
    setMessages(p => [...p, { id: thinkingId, type: 'bot', content: '', timestamp: new Date(), isThinking: true }]);

    const newHistory = [...chatHistory, { role: 'user', content: text }];
    setChatHistory(newHistory);

    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory.slice(-8) }),
      });
      const data = await res.json();
      const reply = data.reply || 'Sorry, I couldn\u2019t process that. Try rephrasing or DM us on Telegram @Bullmoneyshop!';

      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);
      setMessages(p => p.map(m =>
        m.id === thinkingId ? { ...m, content: reply, isThinking: false } : m
      ));
    } catch {
      setMessages(p => p.map(m =>
        m.id === thinkingId
          ? { ...m, content: 'Hmm, something went wrong. Please try again or DM us on Telegram @Bullmoneyshop for instant help!', isThinking: false }
          : m
      ));
    } finally {
      setIsTyping(false);
      setAiThinking(false);
    }
  }, [inputValue, chatHistory]);

  const handleFaqClick = (q: string, a: string) => {
    setMessages(p => [...p, { id: Date.now().toString(), type: 'user', content: q, timestamp: new Date() }]);
    setChatHistory(prev => [...prev, { role: 'user', content: q }, { role: 'assistant', content: a }]);
    setIsTyping(true);
    setView('chat');
    setTimeout(() => {
      setMessages(p => [...p, { id: (Date.now() + 1).toString(), type: 'bot', content: a, timestamp: new Date() }]);
      setIsTyping(false);
    }, 600);
  };

  const catData = FAQ_CATEGORIES.find(c => c.id === selectedCategory);

  const viewTitle =
    view === 'chat' ? 'AI Assistant' :
    view === 'telegram' ? 'Live Telegram Chat' :
    view === 'discord' ? 'Discord Community' :
    view === 'faq' || view === 'faq-category' ? 'FAQs' :
    view === 'social' ? 'Contact Us' :
    'Support';

  const viewIcon =
    view === 'chat' ? <Bot className="w-4 h-4 md:w-5 md:h-5" /> :
    view === 'telegram' ? <TelegramIcon className="w-4 h-4 md:w-5 md:h-5" /> :
    view === 'discord' ? <DiscordIcon className="w-4 h-4 md:w-5 md:h-5" /> :
    <Headphones className="w-4 h-4 md:w-5 md:h-5" />;

  // Reusable row component - Apple white style (matching CartDrawer)
  const Row = ({ children, onClick, href, className = '' }: { children: React.ReactNode; onClick?: () => void; href?: string; className?: string }) => {
    const base = `flex items-center gap-3 p-3 rounded-xl bg-black/[0.03] border border-black/[0.05] transition-all hover:bg-black/[0.06] hover:border-black/10 active:scale-[0.98] ${className}`;
    if (href) return <a className={base} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
    if (onClick) return <button className={base} onClick={onClick}>{children}</button>;
    return <div className={base}>{children}</div>;
  };

  const ThinkingIndicator = () => (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Sparkles className="w-3 h-3 animate-pulse" style={{ color: 'rgba(0,0,0,0.25)' }} />
        <span className="text-[11px] font-medium" style={{ color: 'rgba(0,0,0,0.25)' }}>Thinking</span>
      </div>
      <div className="flex gap-0.5">
        {[0, 200, 400].map(d => (
          <span key={d} className="w-1 h-1 bg-black/20 rounded-full animate-bounce" style={{ animationDelay: `${d}ms`, animationDuration: '0.8s' }} />
        ))}
      </div>
    </div>
  );

  // Portal content — same structure as CartDrawer
  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — same as CartDrawer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={closeDrawer}
            className="fixed inset-0"
            style={{ zIndex: SUPPORT_DRAWER_BACKDROP_Z_INDEX, background: 'rgba(0,0,0,0.2)' }}
          />

          {/* Drawer Panel — same dimensions/animation as CartDrawer */}
          <motion.div
            initial={isDesktop ? { y: '-100%' } : { x: '100%' }}
            animate={isDesktop ? { y: 0 } : { x: 0 }}
            exit={isDesktop ? { y: '-100%' } : { x: '100%' }}
            transition={{ type: 'tween', duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className={
              isDesktop
                ? 'fixed top-0 left-0 right-0 w-full bg-white border-b border-black/10 flex flex-col safe-area-inset-bottom max-h-[90vh]'
                : 'fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-black/10 flex flex-col safe-area-inset-bottom'
            }
            style={{ zIndex: SUPPORT_DRAWER_PANEL_Z_INDEX, color: '#1d1d1f' }}
            data-apple-section
          >
            {/* Header — same as CartDrawer */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-black/10">
              <button
                onClick={view !== 'home' ? goBack : closeDrawer}
                className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 md:gap-3">
                {viewIcon}
                <h2 className="text-lg md:text-xl font-light">{viewTitle}</h2>
                {view === 'chat' && (
                  <span className="px-2 py-0.5 bg-black/5 rounded-full text-[10px] font-medium" style={{ color: 'rgba(0,0,0,0.4)' }}>AI</span>
                )}
              </div>

              <button
                onClick={closeDrawer}
                className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Body — same scroll setup as CartDrawer */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
              <AnimatePresence mode="wait">

                {/* HOME */}
                {view === 'home' && (
                  <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {/* Welcome card */}
                    <div className="rounded-xl p-4 bg-black/[0.03] border border-black/[0.05]">
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(0,0,0,0.6)' }}>
                        Ask our AI anything, chat live on Telegram & Discord, or browse FAQs for instant answers.
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Sparkles className="w-3 h-3" style={{ color: 'rgba(0,0,0,0.2)' }} />
                        <span className="text-[10px] font-medium" style={{ color: 'rgba(0,0,0,0.3)' }}>AI-powered &middot; Live chat &middot; Personal support</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {([
                        { label: 'AI Assistant', desc: 'Ask anything — instant smart answers', icon: Bot, v: 'chat' as View, badge: 'AI' },
                        { label: 'Live Telegram Chat', desc: 'Chat with our team in real-time', icon: TelegramIcon, v: 'telegram' as View, badge: 'LIVE' },
                        { label: 'Discord Community', desc: 'Join the server & open a ticket', icon: DiscordIcon, v: 'discord' as View, badge: 'LIVE' },
                        { label: 'Browse FAQs', desc: 'Orders, shipping, returns & more', icon: HelpCircle, v: 'faq' as View },
                        { label: 'All Socials', desc: 'Telegram, Instagram, X & more', icon: Globe, v: 'social' as View },
                      ]).map(item => (
                        <Row key={item.label} onClick={() => navigateTo(item.v)} className="w-full">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-black/[0.04]">
                            <item.icon className="w-4 h-4" style={{ color: 'rgba(0,0,0,0.45)' }} />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-medium" style={{ color: '#1d1d1f' }}>{item.label}</p>
                              {item.badge && (
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{
                                  background: item.badge === 'AI' ? 'rgba(88,86,214,0.1)' : 'rgba(52,199,89,0.1)',
                                  color: item.badge === 'AI' ? 'rgba(88,86,214,0.7)' : 'rgba(52,199,89,0.7)',
                                  border: `1px solid ${item.badge === 'AI' ? 'rgba(88,86,214,0.15)' : 'rgba(52,199,89,0.15)'}`,
                                }}>{item.badge}</span>
                              )}
                            </div>
                            <p className="text-[11px]" style={{ color: 'rgba(0,0,0,0.35)' }}>{item.desc}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(0,0,0,0.15)' }} />
                        </Row>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* FAQ LIST */}
                {view === 'faq' && (
                  <motion.div key="faq" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(0,0,0,0.3)' }}>Topics</p>
                    {FAQ_CATEGORIES.map(cat => (
                      <Row key={cat.id} onClick={() => navigateTo('faq-category', cat.id)} className="w-full">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-black/[0.04]">
                          <cat.icon className="w-3.5 h-3.5" style={{ color: 'rgba(0,0,0,0.4)' }} />
                        </div>
                        <span className="text-[13px] font-medium flex-1 text-left" style={{ color: '#1d1d1f' }}>{cat.label}</span>
                        <span className="text-[10px] mr-0.5 font-medium" style={{ color: 'rgba(0,0,0,0.2)' }}>{cat.questions.length}</span>
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(0,0,0,0.12)' }} />
                      </Row>
                    ))}
                  </motion.div>
                )}

                {/* FAQ DETAIL */}
                {view === 'faq-category' && catData && (
                  <motion.div key="faq-d" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <catData.icon className="w-3.5 h-3.5" style={{ color: 'rgba(0,0,0,0.35)' }} />
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,0,0,0.3)' }}>{catData.label}</p>
                    </div>
                    {catData.questions.map((faq, i) => (
                      <Row key={i} onClick={() => handleFaqClick(faq.q, faq.a)} className="w-full">
                        <p className="text-[13px] text-left" style={{ color: 'rgba(0,0,0,0.7)' }}>{faq.q}</p>
                      </Row>
                    ))}
                    <button onClick={() => navigateTo('chat')} className="w-full text-center p-2.5 rounded-xl text-[11px] transition-colors mt-2" style={{ color: 'rgba(0,0,0,0.35)' }}>
                      Still need help? Ask our AI &rarr;
                    </button>
                  </motion.div>
                )}

                {/* SOCIAL */}
                {view === 'social' && (
                  <motion.div key="soc" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(0,0,0,0.3)' }}>DM us for support</p>
                    {SOCIAL_CHANNELS.map(ch => (
                      <Row key={ch.name} href={ch.url}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-black/[0.04]">
                          <ch.icon className="w-4 h-4" style={{ color: 'rgba(0,0,0,0.5)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium" style={{ color: '#1d1d1f' }}>{ch.name}</p>
                          <p className="text-[10px] truncate" style={{ color: 'rgba(0,0,0,0.3)' }}>{ch.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] shrink-0 font-medium" style={{ color: 'rgba(0,0,0,0.2)' }}>
                          <Clock className="w-2.5 h-2.5" /><span>{ch.responseTime}</span>
                        </div>
                      </Row>
                    ))}
                    <div className="pt-3 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(0,0,0,0.3)' }}>Chat inline</p>
                      <Row onClick={() => navigateTo('telegram')} className="w-full">
                        <TelegramIcon className="w-4 h-4" style={{ color: 'rgba(0,0,0,0.5)' }} />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[13px] font-medium" style={{ color: '#1d1d1f' }}>Open Telegram Chat</p>
                          <p className="text-[10px]" style={{ color: 'rgba(0,0,0,0.3)' }}>Chat without leaving this page</p>
                        </div>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(52,199,89,0.1)', color: 'rgba(52,199,89,0.7)', border: '1px solid rgba(52,199,89,0.15)' }}>LIVE</span>
                      </Row>
                      <Row onClick={() => navigateTo('discord')} className="w-full">
                        <DiscordIcon className="w-4 h-4" style={{ color: 'rgba(0,0,0,0.5)' }} />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[13px] font-medium" style={{ color: '#1d1d1f' }}>Open Discord Widget</p>
                          <p className="text-[10px]" style={{ color: 'rgba(0,0,0,0.3)' }}>See who&apos;s online & join</p>
                        </div>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(52,199,89,0.1)', color: 'rgba(52,199,89,0.7)', border: '1px solid rgba(52,199,89,0.15)' }}>LIVE</span>
                      </Row>
                    </div>
                  </motion.div>
                )}

                {/* INLINE TELEGRAM */}
                {view === 'telegram' && (
                  <motion.div key="tg" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col space-y-4">
                    <div className="w-full rounded-xl overflow-hidden bg-black/[0.02] border border-black/[0.06]">
                      <iframe
                        src={`https://t.me/${TELEGRAM_BOT_NAME}`}
                        className="w-full border-0"
                        style={{ height: '320px' }}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
                        title="Telegram Chat"
                      />
                    </div>
                    <div className="space-y-2">
                      <a href={`https://t.me/${TELEGRAM_BOT_NAME}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: '#111111', color: '#ffffff' }}>
                        <TelegramIcon className="w-4 h-4" />Open in Telegram App<ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                      <div className="flex gap-2">
                        <a href={`https://t.me/${TELEGRAM_BOT_NAME}`} target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.06]"
                          style={{ color: 'rgba(0,0,0,0.5)' }}>
                          <MessageCircle className="w-3 h-3" />DM @{TELEGRAM_BOT_NAME}
                        </a>
                        <button onClick={() => navigateTo('chat')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.06]"
                          style={{ color: 'rgba(0,0,0,0.5)' }}>
                          <Bot className="w-3 h-3" />Ask AI Instead
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-center leading-relaxed" style={{ color: 'rgba(0,0,0,0.25)' }}>
                      Tap &ldquo;Open in Telegram&rdquo; to start a live chat.<br />Average reply: ~15 minutes.
                    </p>
                  </motion.div>
                )}

                {/* INLINE DISCORD */}
                {view === 'discord' && (
                  <motion.div key="dc" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col space-y-3">
                    <div className="w-full rounded-xl overflow-hidden bg-black/[0.02] border border-black/[0.06]">
                      <iframe
                        src="https://discord.com/widget?id=1255567399289577544&theme=light"
                        className="w-full border-0"
                        style={{ height: '300px' }}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
                        title="Discord Widget"
                      />
                    </div>
                    <div className="space-y-2">
                      <a href="https://discord.com/invite/9vVB44ZrNA" target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: 'rgb(88, 101, 242)', color: '#ffffff' }}>
                        <DiscordIcon className="w-4 h-4" />Join Discord Server<ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                      <div className="flex gap-2">
                        <a href="https://discord.com/invite/9vVB44ZrNA" target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.06]"
                          style={{ color: 'rgba(0,0,0,0.5)' }}>
                          <Users className="w-3 h-3" />Open Support Ticket
                        </a>
                        <button onClick={() => navigateTo('chat')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.06]"
                          style={{ color: 'rgba(0,0,0,0.5)' }}>
                          <Bot className="w-3 h-3" />Ask AI Instead
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-center leading-relaxed" style={{ color: 'rgba(0,0,0,0.25)' }}>
                      See who&apos;s online &middot; Join to open a support ticket<br />Average reply: ~1-6 hours
                    </p>
                  </motion.div>
                )}

                {/* AI CHAT */}
                {view === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full -m-4 md:-m-6">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className="max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed"
                            style={msg.type === 'user'
                              ? { background: '#111111', color: '#ffffff', borderRadius: '18px 18px 4px 18px' }
                              : { background: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '18px 18px 18px 4px' }
                            }
                          >
                            {msg.isThinking ? (
                              <ThinkingIndicator />
                            ) : (
                              <>
                                <p className="whitespace-pre-line">{msg.content}</p>
                                <p className="mt-1 flex items-center gap-1" style={{ fontSize: '9px', color: msg.type === 'user' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)' }}>
                                  {msg.type === 'bot' && <Sparkles className="w-2 h-2" />}
                                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {isTyping && !messages.some(m => m.isThinking) && (
                        <div className="flex justify-start">
                          <div className="rounded-2xl px-4 py-3 bg-black/[0.04] border border-black/[0.06]">
                            <div className="flex gap-1">
                              {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 bg-black/15 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    {messages.length <= 1 && (
                      <div className="px-4 md:px-6 pb-2 space-y-2">
                        <p className="text-[10px] font-medium" style={{ color: 'rgba(0,0,0,0.25)' }}>Quick questions</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['Where is my order?', 'Return policy?', 'Shipping times?', 'Damaged item help', 'Payment methods?', 'Size guide'].map(q => (
                            <button key={q} onClick={() => setInputValue(q)}
                              className="text-[10px] px-2.5 py-1.5 rounded-full font-medium transition-all bg-black/[0.03] border border-black/[0.06] hover:bg-black/[0.08]"
                              style={{ color: 'rgba(0,0,0,0.4)' }}
                            >{q}</button>
                          ))}
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <button onClick={() => navigateTo('telegram')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-all bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.06]"
                            style={{ color: 'rgba(0,0,0,0.4)' }}>
                            <TelegramIcon className="w-3 h-3" />Live Telegram
                          </button>
                          <button onClick={() => navigateTo('discord')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-all bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.06]"
                            style={{ color: 'rgba(0,0,0,0.4)' }}>
                            <DiscordIcon className="w-3 h-3" />Discord
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Chat Input — in footer area, same border style as CartDrawer footer */}
            {view === 'chat' && (
              <div className="border-t border-black/10 px-4 md:px-6 py-3 flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={aiThinking ? 'AI is thinking...' : 'Ask me anything...'}
                  disabled={aiThinking}
                  className="flex-1 rounded-xl px-3 py-2.5 text-[13px] outline-none transition-all disabled:opacity-50 bg-black/[0.04] border border-black/10 focus:border-black/20 placeholder:text-black/30"
                  style={{ color: '#1d1d1f', caretColor: '#1d1d1f' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || aiThinking}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 disabled:opacity-30"
                  style={{
                    background: inputValue.trim() && !aiThinking ? '#111111' : 'rgba(0,0,0,0.05)',
                  }}
                >
                  <Send className="w-3.5 h-3.5" style={{ color: inputValue.trim() && !aiThinking ? '#ffffff' : 'rgba(0,0,0,0.25)' }} />
                </button>
              </div>
            )}

            {/* Footer — same as CartDrawer footer style */}
            <div className="border-t border-black/10 px-4 md:px-6 py-2 text-center">
              <p style={{ fontSize: '9px', color: 'rgba(0,0,0,0.2)' }}>
                {view === 'chat'
                  ? <>AI-powered &middot; <a href="https://t.me/Bullmoneyshop" target="_blank" rel="noopener noreferrer" className="hover:text-black/40 transition-colors" style={{ color: 'rgba(0,0,0,0.35)' }}>Telegram</a> for human support</>
                  : <>BullMoney &middot; <a href="https://t.me/Bullmoneyshop" target="_blank" rel="noopener noreferrer" className="hover:text-black/40 transition-colors" style={{ color: 'rgba(0,0,0,0.35)' }}>Telegram</a> for fastest replies</>
                }
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(drawerContent, document.body);
}

export default SupportDrawer;
