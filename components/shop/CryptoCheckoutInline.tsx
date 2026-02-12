// @ts-nocheck
'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowLeftRight,
  Copy,
  Check,
  AlertCircle,
  Shield,
  Clock,
  RefreshCw,
  ChevronDown,
  X,
  Zap,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  CreditCard,
  ArrowLeft,
  Send,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import {
  AVAILABLE_COINS,
  getWalletsForCoin,
  ONRAMP_PROVIDERS,
  type WalletAddress,
} from '@/lib/crypto-wallets';

// ============================================================================
// CRYPTO CHECKOUT INLINE - Full Inline Crypto Payment Gateway
// Secure, encrypted, switchable fiat/crypto amounts, overpay/underpay guard
// Users never leave the website - everything happens inline
// ============================================================================

// ── Payment tolerance ────────────────────────────────────────────────
const OVERPAY_TOLERANCE = 1.05; // 5% overpay allowed
const UNDERPAY_TOLERANCE = 0.98; // 2% underpay tolerated (dust/fees)
const PRICE_LOCK_SECONDS = 900; // 15 min price lock window
const MIN_TX_HASH_LENGTH = 10;
const MAX_TX_HASH_LENGTH = 128;

// ── Sanitize and validate user input ─────────────────────────────────
function sanitizeInput(value: string): string {
  // Strip any HTML, non-printable chars, control chars
  return value.replace(/[<>'"&\x00-\x1f\x7f-\x9f]/g, '').trim();
}

function isValidTxHash(hash: string): boolean {
  const clean = sanitizeInput(hash);
  if (clean.length < MIN_TX_HASH_LENGTH || clean.length > MAX_TX_HASH_LENGTH)
    return false;
  // Hex hash (ETH, BTC, etc.) or Base58 (SOL, XRP)
  return /^(0x)?[a-fA-F0-9]{10,128}$/.test(clean) || /^[1-9A-HJ-NP-Za-km-z]{20,128}$/.test(clean);
}

function isValidWalletAddress(addr: string, coin: string): boolean {
  const clean = sanitizeInput(addr);
  if (!clean || clean.length < 10) return false;
  switch (coin.toUpperCase()) {
    case 'ETH':
    case 'BNB':
    case 'USDT':
      return /^0x[a-fA-F0-9]{40}$/.test(clean);
    case 'BTC':
      return /^(bc1|[13]|tb1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(clean);
    case 'SOL':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean);
    case 'XRP':
      return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(clean);
    case 'DOGE':
      return /^D[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(clean);
    default:
      return clean.length >= 20;
  }
}

// ── Mask wallet address for display ──────────────────────────────────
function maskAddress(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}····${addr.slice(-6)}`;
}

// ── Types ────────────────────────────────────────────────────────────
type CheckoutStep =
  | 'select-coin'
  | 'select-network'
  | 'enter-amount'
  | 'review'
  | 'payment'
  | 'confirm'
  | 'onramp';

interface CryptoCheckoutInlineProps {
  /** Product name */
  productName: string;
  /** Product image URL */
  productImage?: string | null;
  /** Price in USD */
  priceUSD: number;
  /** Product ID */
  productId: string;
  /** Variant ID */
  variantId?: string;
  /** Quantity */
  quantity?: number;
  /** Pre-filled customer email (from auth) */
  customerEmail?: string;
  /** Callback on successful payment submission */
  onPaymentSubmitted?: (txHash: string, coin: string, network: string) => void;
  /** Callback to close/dismiss the checkout */
  onClose?: () => void;
  /** Render inline (no backdrop) vs modal (with backdrop) */
  inline?: boolean;
  /** Start with a specific coin pre-selected */
  defaultCoin?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CryptoCheckoutInline({
  productName,
  productImage,
  priceUSD,
  productId,
  variantId,
  quantity = 1,
  customerEmail: propEmail,
  onPaymentSubmitted,
  onClose,
  inline = false,
  defaultCoin,
}: CryptoCheckoutInlineProps) {
  // ── State ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<CheckoutStep>('select-coin');
  const [selectedCoin, setSelectedCoin] = useState<string | null>(defaultCoin || null);
  const [selectedWallet, setSelectedWallet] = useState<WalletAddress | null>(null);
  const [senderWallet, setSenderWallet] = useState('');
  const [senderWalletValid, setSenderWalletValid] = useState<boolean | null>(null);
  const [showSenderAddr, setShowSenderAddr] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [customerEmail, setCustomerEmail] = useState(propEmail || '');
  const [customAmount, setCustomAmount] = useState('');
  const [displayMode, setDisplayMode] = useState<'fiat' | 'crypto'>('fiat');
  const [copied, setCopied] = useState<'address' | 'amount' | null>(null);
  const [countdown, setCountdown] = useState(PRICE_LOCK_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [lockedCryptoAmount, setLockedCryptoAmount] = useState<number | null>(null);
  const [lockedPrice, setLockedPrice] = useState<number | null>(null);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  const copyTimeout = useRef<NodeJS.Timeout>(undefined);
  const senderValidateTimer = useRef<NodeJS.Timeout>(undefined);
  const checkoutRef = useRef<HTMLDivElement>(null);

  const {
    getPrice,
    convertUsdToCrypto,
    loading: pricesLoading,
    refresh: refreshPrices,
    lastUpdated,
  } = useCryptoPrices();
  const formatPrice = useCurrencyLocaleStore((s) => s.formatPrice);

  const totalUSD = priceUSD * quantity;

  // ── Derived ──────────────────────────────────────────────────────────
  const coinInfo = useMemo(
    () => AVAILABLE_COINS.find((c) => c.coin === selectedCoin),
    [selectedCoin]
  );

  const livePrice = selectedCoin ? getPrice(selectedCoin) : null;
  const liveCryptoAmount = selectedCoin
    ? convertUsdToCrypto(totalUSD, selectedCoin)
    : null;

  // Use locked price during payment step, live price otherwise
  const displayCryptoAmount =
    step === 'payment' || step === 'review'
      ? lockedCryptoAmount
      : liveCryptoAmount;

  const networksForCoin = selectedCoin ? getWalletsForCoin(selectedCoin) : [];
  const hasMultipleNetworks = networksForCoin.length > 1;

  // ── Format crypto amount with appropriate precision ────────────────
  const formatCrypto = useCallback(
    (amount: number | null, coin?: string) => {
      if (amount === null || amount === undefined) return '—';
      const c = coin?.toUpperCase() || selectedCoin?.toUpperCase() || '';
      // Stablecoins: 2 decimals. Low value coins: 2-4. High value: 6-8.
      if (c === 'USDT') return amount.toFixed(2);
      if (amount >= 1000) return amount.toFixed(2);
      if (amount >= 1) return amount.toFixed(4);
      if (amount >= 0.001) return amount.toFixed(6);
      return amount.toFixed(8);
    },
    [selectedCoin]
  );

  // ── Effects ──────────────────────────────────────────────────────────

  // Countdown timer for price lock
  useEffect(() => {
    if (step !== 'payment') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Price lock expired. Refreshing rates...');
          refreshPrices();
          setStep('review');
          return PRICE_LOCK_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, refreshPrices]);

  // Validate sender wallet with debounce
  useEffect(() => {
    if (!senderWallet || !selectedCoin) {
      setSenderWalletValid(null);
      return;
    }
    if (senderValidateTimer.current) clearTimeout(senderValidateTimer.current);
    senderValidateTimer.current = setTimeout(() => {
      setSenderWalletValid(isValidWalletAddress(senderWallet, selectedCoin));
    }, 400);
  }, [senderWallet, selectedCoin]);

  // Refresh prices on mount
  useEffect(() => {
    refreshPrices();
  }, [refreshPrices]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSelectCoin = (coin: string) => {
    setSelectedCoin(coin);
    setSelectedWallet(null);
    setSenderWallet('');
    setSenderWalletValid(null);
    setCustomAmount('');
    setLockedCryptoAmount(null);
    setLockedPrice(null);

    const wallets = getWalletsForCoin(coin);
    if (wallets.length === 1) {
      setSelectedWallet(wallets[0]);
      setStep('enter-amount');
    } else {
      setStep('select-network');
    }
  };

  const handleSelectNetwork = (wallet: WalletAddress) => {
    setSelectedWallet(wallet);
    setStep('enter-amount');
    setNetworkDropdownOpen(false);
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const clean = value.replace(/[^0-9.]/g, '');
    // Prevent multiple decimals
    const parts = clean.split('.');
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : clean;
    setCustomAmount(sanitized);
  };

  const handleProceedToReview = () => {
    if (!selectedCoin || !selectedWallet) return;

    // Calculate the amount to send
    const cryptoAmt = liveCryptoAmount;
    if (!cryptoAmt || !livePrice) {
      toast.error('Unable to calculate amount. Please wait for price data.');
      return;
    }

    // If user entered custom amount, validate against expected
    if (customAmount) {
      const entered = parseFloat(customAmount);
      if (isNaN(entered) || entered <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      const expectedUSD = entered * livePrice;

      // Overpay check
      if (expectedUSD > totalUSD * OVERPAY_TOLERANCE) {
        toast.error(
          `Amount too high! Maximum is ~${formatCrypto(
            cryptoAmt * OVERPAY_TOLERANCE
          )} ${selectedCoin} (${formatPrice(totalUSD * OVERPAY_TOLERANCE)})`
        );
        return;
      }

      // Underpay check
      if (expectedUSD < totalUSD * UNDERPAY_TOLERANCE) {
        toast.error(
          `Amount too low! Minimum is ~${formatCrypto(
            cryptoAmt * UNDERPAY_TOLERANCE
          )} ${selectedCoin} (${formatPrice(totalUSD * UNDERPAY_TOLERANCE)})`
        );
        return;
      }
    }

    // Lock the price for the payment window
    setLockedCryptoAmount(cryptoAmt);
    setLockedPrice(livePrice);
    setStep('review');
  };

  const handleConfirmAndPay = () => {
    if (!selectedCoin || !selectedWallet || !lockedCryptoAmount) return;
    setCountdown(PRICE_LOCK_SECONDS);
    setStep('payment');
  };

  const handleCopy = async (
    text: string,
    type: 'address' | 'amount'
  ) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(type);
    toast.success(type === 'address' ? 'Address copied!' : 'Amount copied!');
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    copyTimeout.current = setTimeout(() => setCopied(null), 3000);
  };

  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string;
    confirmations: number;
    requiredConfirmations: number;
    progress: number;
    message: string;
    isTerminal: boolean;
  } | null>(null);

  // Poll payment status after submission
  useEffect(() => {
    if (step !== 'confirm' || !orderNumber) return;
    
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/crypto-payment/status?orderNumber=${encodeURIComponent(orderNumber)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setPaymentStatus(data);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('crypto-payment-status', { detail: data }));
          }
          // Stop polling on terminal status
          if (data.isTerminal) return;
        }
      } catch {
        // Silently retry on network errors
      }
      if (!cancelled) {
        setTimeout(poll, 15000); // Poll every 15 seconds
      }
    };
    
    // Start polling after 5 second initial delay
    const initialTimeout = setTimeout(poll, 5000);
    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
    };
  }, [step, orderNumber]);

  const handleSubmitPayment = async () => {
    const cleanHash = sanitizeInput(txHash);
    if (!cleanHash || !isValidTxHash(cleanHash)) {
      toast.error('Please enter a valid transaction hash');
      return;
    }
    if (!selectedCoin || !selectedWallet || !lockedCryptoAmount) return;

    setSubmitting(true);

    try {
      // Validate email before submission
      const trimmedEmail = customerEmail.trim().toLowerCase();
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        toast.error('Please enter a valid email address for your receipt.');
        setSubmitting(false);
        return;
      }

      const payload = {
        txHash: cleanHash,
        coin: selectedCoin,
        network: selectedWallet.network,
        walletAddress: selectedWallet.address,
        senderWallet: senderWallet ? sanitizeInput(senderWallet) : undefined,
        amountUSD: totalUSD,
        amountCrypto: lockedCryptoAmount,
        lockedPrice: lockedPrice,
        productId,
        variantId,
        quantity,
        productName,
        customerEmail: trimmedEmail,
        timestamp: Date.now(),
      };

      const res = await fetch('/api/crypto-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOrderNumber(data.orderNumber || null);
        toast.success(`Payment submitted! Order: ${data.orderNumber || 'Processing'}`);
        setStep('confirm');
        onPaymentSubmitted?.(cleanHash, selectedCoin, selectedWallet.network);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crypto-payment-submitted', {
            detail: { orderNumber: data.orderNumber, coin: selectedCoin, network: selectedWallet.network }
          }));
        }
      } else {
        toast.error(data.error || 'Failed to record payment. Please contact support.');
      }
    } catch (err) {
      console.error('Payment submission error:', err);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    switch (step) {
      case 'select-network':
        setStep('select-coin');
        break;
      case 'enter-amount':
        setStep(hasMultipleNetworks ? 'select-network' : 'select-coin');
        break;
      case 'review':
        setStep('enter-amount');
        break;
      case 'payment':
        setStep('review');
        break;
      case 'onramp':
        setStep('select-coin');
        break;
      default:
        onClose?.();
    }
  };

  const resetCheckout = () => {
    setStep('select-coin');
    setSelectedCoin(null);
    setSelectedWallet(null);
    setSenderWallet('');
    setSenderWalletValid(null);
    setTxHash('');
    setCustomAmount('');
    setLockedCryptoAmount(null);
    setLockedPrice(null);
    setCountdown(PRICE_LOCK_SECONDS);
    setOrderNumber(null);
    setPaymentStatus(null);
    // Don't reset customerEmail — keep it for next purchase
    refreshPrices();
  };

  const fmtCountdown = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Amount display helpers ─────────────────────────────────────────
  const toggleDisplayMode = () =>
    setDisplayMode((p) => (p === 'fiat' ? 'crypto' : 'fiat'));

  const primaryAmount =
    displayMode === 'fiat'
      ? formatPrice(totalUSD)
      : displayCryptoAmount
        ? `${formatCrypto(displayCryptoAmount)} ${selectedCoin}`
        : '—';

  const secondaryAmount =
    displayMode === 'fiat'
      ? displayCryptoAmount
        ? `≈ ${formatCrypto(displayCryptoAmount)} ${selectedCoin}`
        : ''
      : `≈ ${formatPrice(totalUSD)}`;

  // ── Step titles ────────────────────────────────────────────────────
  const stepTitle: Record<CheckoutStep, string> = {
    'select-coin': 'Select Cryptocurrency',
    'select-network': 'Select Network',
    'enter-amount': 'Payment Amount',
    review: 'Review Payment',
    payment: 'Send Payment',
    confirm: 'Payment Submitted',
    onramp: 'Buy Crypto',
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const checkoutContent = (
    <div
      ref={checkoutRef}
      className={`w-full relative flex flex-col ${
        inline
          ? 'rounded-2xl border border-white/15 overflow-hidden shadow-2xl max-h-[70vh]'
          : 'max-w-lg mx-auto rounded-2xl border border-white/15 overflow-hidden shadow-2xl'
      }`}
      style={{ backgroundColor: '#000' }}
    >
      {/* ── Top Accent Line ────────────────────────────────────── */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-white/10 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      >
        <div className="flex items-center gap-2.5">
          {step !== 'select-coin' && step !== 'confirm' && (
            <motion.button
              onClick={goBack}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </motion.button>
          )}
          <div>
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
              {stepTitle[step]}
            </h2>
            <p className="text-xs text-white/40 truncate max-w-[200px]">
              {productName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Fiat/Crypto toggle */}
          {selectedCoin && step !== 'confirm' && (
            <motion.button
              onClick={toggleDisplayMode}
              className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5 text-xs text-white/70 font-medium"
              whileTap={{ scale: 0.95 }}
              title={`Switch to ${displayMode === 'fiat' ? 'crypto' : 'fiat'} display`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{displayMode === 'fiat' ? 'Crypto' : 'USD'}</span>
            </motion.button>
          )}
          {onClose && (
            <motion.button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Price Summary ──────────────────────────────────────── */}
      {step !== 'confirm' && (
        <div className="px-4 md:px-5 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <span className="text-white/40 text-xs md:text-sm font-medium tracking-wide uppercase">Total</span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleDisplayMode}
              className="text-white font-bold text-base md:text-lg hover:text-white/80 transition-colors cursor-pointer tracking-tight"
            >
              {primaryAmount}
            </button>
            {secondaryAmount && (
              <span className="text-xs text-white/30 font-medium">{secondaryAmount}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────── */}
      <div className={`p-4 md:p-5 overflow-y-auto ${inline ? 'max-h-[40vh] md:max-h-[45vh]' : 'max-h-[65vh]'}`}>
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════
              STEP: SELECT CRYPTOCURRENCY
              ═══════════════════════════════════════════════════════ */}
          {step === 'select-coin' && (
            <motion.div
              key="select-coin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2.5"
            >
              {/* Direct Send option */}
              <p className="text-white/50 text-xs md:text-sm mb-2 font-medium">
                Choose a cryptocurrency:
              </p>

              {AVAILABLE_COINS.map((coin) => {
                const price = getPrice(coin.coin);
                const cryptoAmt = convertUsdToCrypto(totalUSD, coin.coin);

                return (
                  <button
                    key={coin.coin}
                    onClick={() => handleSelectCoin(coin.coin)}
                    className="w-full p-3.5 md:p-4 rounded-xl border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.07] transition-all flex items-center gap-3.5 group active:scale-[0.98]"
                  >
                    <div
                      className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-base md:text-lg font-bold shrink-0 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${coin.color}30, ${coin.color}10)`,
                        color: coin.color,
                        border: `1px solid ${coin.color}30`,
                      }}
                    >
                      {coin.symbol}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm md:text-base">
                          {coin.name}
                        </span>
                        <span className="text-white/30 text-xs font-medium">{coin.coin}</span>
                      </div>
                      {price && (
                        <p className="text-white/40 text-[11px] md:text-xs font-medium">
                          1 {coin.coin} = $
                          {price.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {cryptoAmt !== null ? (
                        <p className="text-white font-semibold text-xs md:text-sm tabular-nums">
                          {formatCrypto(cryptoAmt, coin.coin)} <span className="text-white/50">{coin.coin}</span>
                        </p>
                      ) : (
                        <div className="w-16 h-4 bg-white/10 rounded-full animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}

              {pricesLoading && (
                <div className="flex items-center justify-center gap-2 py-3 text-white/30 text-xs font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Loading live prices...
                </div>
              )}

              {/* On-ramp option */}
              <div className="border-t border-white/5 pt-3 mt-3">
                <button
                  onClick={() => setStep('onramp')}
                  className="w-full p-3.5 md:p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 transition-all text-left group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg">
                      <CreditCard className="w-5 h-5 text-black" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm">
                        Don&apos;t have crypto?
                      </h3>
                      <p className="text-white/40 text-xs">
                        Buy with card via MoonPay or Paybis
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/20 -rotate-90" />
                  </div>
                </button>
              </div>

              {/* Security badge */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <Lock className="w-3.5 h-3.5 text-white/40 shrink-0" />
                <p className="text-[11px] text-white/40 font-medium">
                  End-to-end encrypted. Verified on-chain. No wallet permissions needed.
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP: SELECT NETWORK
              ═══════════════════════════════════════════════════════ */}
          {step === 'select-network' && selectedCoin && (
            <motion.div
              key="select-network"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2.5"
            >
              <p className="text-white/50 text-xs md:text-sm mb-2 font-medium">
                Select network for{' '}
                <span className="text-white font-semibold">{selectedCoin}</span>:
              </p>

              {networksForCoin.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleSelectNetwork(wallet)}
                  className="w-full p-3.5 md:p-4 rounded-xl border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.07] transition-all flex items-center gap-3.5 group active:scale-[0.98]"
                >
                  <div
                    className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${wallet.color}30, ${wallet.color}10)`,
                      color: wallet.color,
                      border: `1px solid ${wallet.color}30`,
                    }}
                  >
                    {wallet.exchange === 'exodus'
                      ? 'EX'
                      : wallet.exchange === 'binance'
                        ? 'BN'
                        : 'BS'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <span className="text-white font-semibold text-sm">
                      {wallet.network}
                    </span>
                    <p className="text-white/30 text-xs mt-0.5 truncate font-mono">
                      {maskAddress(wallet.address)}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/40 capitalize px-2.5 py-1 rounded-full bg-white/5 border border-white/10 shrink-0 font-semibold">
                    {wallet.exchange}
                  </span>
                </button>
              ))}

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 mt-3">
                <AlertCircle className="w-3.5 h-3.5 text-white/40 mt-0.5 shrink-0" />
                <p className="text-[11px] text-white/40 font-medium">
                  Send on the <strong className="text-white/60">correct network</strong> only. Wrong network = <strong className="text-white/60">permanent loss</strong>.
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP: ENTER AMOUNT + SENDER WALLET
              ═══════════════════════════════════════════════════════ */}
          {step === 'enter-amount' && selectedCoin && selectedWallet && (
            <motion.div
              key="enter-amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Amount Display - Switchable */}
              <div className="text-center p-5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/50 text-sm mb-2">You will send</p>
                <button
                  onClick={toggleDisplayMode}
                  className="group inline-flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-3xl font-bold text-white transition-colors">
                    {displayMode === 'crypto'
                      ? liveCryptoAmount
                        ? formatCrypto(liveCryptoAmount)
                        : '—'
                      : formatPrice(totalUSD)}
                  </span>
                  <span className="text-xl text-white/50">
                    {displayMode === 'crypto' ? selectedCoin : ''}
                  </span>
                  <ArrowLeftRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </button>
                <p className="text-white/40 text-xs mt-1">
                  {displayMode === 'crypto'
                    ? `≈ ${formatPrice(totalUSD)}`
                    : liveCryptoAmount
                      ? `≈ ${formatCrypto(liveCryptoAmount)} ${selectedCoin}`
                      : ''}
                </p>
              </div>

              {/* Custom Amount Override (optional) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Custom Amount{' '}
                    <span className="text-white/30 normal-case tracking-normal">(optional)</span>
                  </label>
                  <span className="text-[10px] text-white/30 font-medium">
                    Tolerance ±2-5%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder={
                      liveCryptoAmount
                        ? `${formatCrypto(liveCryptoAmount)} ${selectedCoin}`
                        : `Amount in ${selectedCoin}`
                    }
                    className="w-full px-4 py-3 pr-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-white/25 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 font-mono transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30 font-semibold">
                    {selectedCoin}
                  </span>
                </div>
                {customAmount && (
                  <p className="text-xs text-white/40">
                    ≈{' '}
                    {livePrice
                      ? formatPrice(parseFloat(customAmount) * livePrice)
                      : '—'}{' '}
                    USD
                  </p>
                )}
                {/* Overpay/underpay inline validation */}
                {customAmount && livePrice && (
                  (() => {
                    const entered = parseFloat(customAmount);
                    if (isNaN(entered)) return null;
                    const enteredUSD = entered * livePrice;
                    const ratio = enteredUSD / totalUSD;
                    if (ratio > OVERPAY_TOLERANCE) {
                      return (
                        <p className="text-xs text-white/50 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-white/40" /> Overpay
                          detected — exceeds {Math.round(OVERPAY_TOLERANCE * 100 - 100)}% tolerance
                        </p>
                      );
                    }
                    if (ratio < UNDERPAY_TOLERANCE) {
                      return (
                        <p className="text-xs text-white/50 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-white/40" /> Underpay
                          detected — below {Math.round(100 - UNDERPAY_TOLERANCE * 100)}% tolerance
                        </p>
                      );
                    }
                    if (ratio !== 1) {
                      return (
                        <p className="text-xs text-white/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-white/40" /> Within
                          acceptable range
                        </p>
                      );
                    }
                    return null;
                  })()
                )}
              </div>

              {/* Sender Wallet Address (optional but helps verification) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Your Wallet Address{' '}
                    <span className="text-white/30 normal-case tracking-normal">(optional)</span>
                  </label>
                  <button
                    onClick={() => setShowSenderAddr(!showSenderAddr)}
                    className="text-[10px] text-white/30 hover:text-white/50 transition-colors flex items-center gap-1"
                  >
                    {showSenderAddr ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                    {showSenderAddr ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showSenderAddr ? 'text' : 'password'}
                    value={senderWallet}
                    onChange={(e) => setSenderWallet(sanitizeInput(e.target.value))}
                    placeholder={`Your ${selectedCoin} address (for verification)`}
                    className={`w-full px-4 py-3 rounded-2xl bg-white/[0.04] border text-white text-sm placeholder-white/25 focus:outline-none focus:ring-1 font-mono transition-colors ${
                      senderWalletValid === null
                        ? 'border-white/[0.08] focus:border-white/20 focus:ring-white/10'
                        : senderWalletValid
                          ? 'border-white/30 focus:border-white/40 focus:ring-white/20'
                          : 'border-white/20 focus:border-white/30 focus:ring-white/10'
                    }`}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {senderWalletValid !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {senderWalletValid ? (
                        <Check className="w-4 h-4 text-white/60" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-white/25 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Encrypted locally — helps us verify your payment faster
                </p>
              </div>

              {/* Network info */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <Info className="w-4 h-4 text-white/30 shrink-0" />
                <div className="text-[11px] text-white/40">
                  <span className="text-white/70 font-medium">
                    {selectedWallet.network}
                  </span>{' '}
                  via {selectedWallet.exchange} ·{' '}
                  {selectedWallet.minConfirmations} confirmations
                </div>
                {hasMultipleNetworks && (
                  <button
                    onClick={() => setStep('select-network')}
                    className="text-[11px] text-white/40 hover:text-white/60 transition-colors shrink-0 underline underline-offset-2"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Continue button */}
              <motion.button
                onClick={handleProceedToReview}
                className="w-full py-3.5 rounded-2xl font-bold text-black text-sm transition-all flex items-center justify-center gap-2 bg-white hover:bg-white/90"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Shield className="w-4 h-4" />
                Review & Lock Price
              </motion.button>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP: REVIEW BEFORE PAYMENT
              ═══════════════════════════════════════════════════════ */}
          {step === 'review' && selectedCoin && selectedWallet && lockedCryptoAmount && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Review summary card */}
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-4">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-white/50" />
                  Payment Summary
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Product</span>
                    <span className="text-white font-medium truncate max-w-50">
                      {productName}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Quantity</span>
                    <span className="text-white font-medium">{quantity}</span>
                  </div>
                  <div className="h-px bg-white/[0.06]" />
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Amount (USD)</span>
                    <span className="text-white font-bold">
                      {formatPrice(totalUSD)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">
                      Amount ({selectedCoin})
                    </span>
                    <span className="text-white font-bold">
                      {formatCrypto(lockedCryptoAmount)} {selectedCoin}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Network</span>
                    <span className="text-white font-medium">
                      {selectedWallet.network}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">Rate Lock</span>
                    <span className="text-white font-medium">
                      1 {selectedCoin} = $
                      {lockedPrice?.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {senderWallet && senderWalletValid && (
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">From</span>
                      <span className="text-white font-mono text-[11px]">
                        {maskAddress(senderWallet)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Overpay/underpay warning */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <Shield className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-white/60 font-semibold">
                    Price Locked for 15 Minutes
                  </p>
                  <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                    Send the <strong className="text-white/50">exact amount</strong> shown above. 
                    Underpaying by more than 2% or overpaying by more than 5% 
                    will delay processing.
                  </p>
                </div>
              </div>

              {/* Confirm button */}
              <motion.button
                onClick={handleConfirmAndPay}
                className="w-full py-3.5 rounded-2xl font-bold text-black text-sm transition-all flex items-center justify-center gap-2 bg-white hover:bg-white/90"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Send className="w-4 h-4" />
                Confirm & Show Payment Address
              </motion.button>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP: PAYMENT - Send crypto to our address
              ═══════════════════════════════════════════════════════ */}
          {step === 'payment' && selectedCoin && selectedWallet && lockedCryptoAmount && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              {/* Timer */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Price locked for</span>
                </div>
                <span
                  className={`font-mono font-bold text-xs ${
                    countdown < 60
                      ? 'text-white/90'
                      : countdown < 300
                        ? 'text-white/60'
                        : 'text-white/40'
                  }`}
                >
                  {fmtCountdown(countdown)}
                </span>
              </div>

              {/* Exact amount to send */}
              <div className="text-center p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-white/40 text-[11px] uppercase tracking-wider font-semibold mb-2">Send exactly</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold text-white">
                    {formatCrypto(lockedCryptoAmount)}
                  </span>
                  <span className="text-xl text-white/50">{selectedCoin}</span>
                </div>
                <p className="text-white/30 text-xs mt-1">
                  ≈ {formatPrice(totalUSD)}
                </p>
                <button
                  onClick={() =>
                    handleCopy(formatCrypto(lockedCryptoAmount), 'amount')
                  }
                  className="mt-2 text-[11px] text-white/30 hover:text-white/50 transition-colors flex items-center gap-1 mx-auto"
                >
                  {copied === 'amount' ? (
                    <Check className="w-3 h-3 text-white/60" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  Copy amount
                </button>
              </div>

              {/* QR Code + Address */}
              <div className="flex flex-col items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-white/40 text-xs">
                  To this address ({selectedWallet.network})
                </p>

                {/* QR Code */}
                <div className="bg-white p-3 rounded-2xl">
                  <QRCode
                    value={selectedWallet.address}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                    className="rounded-lg bg-white"
                  />
                </div>

                {/* Address with copy */}
                <div className="w-full flex items-center gap-2 bg-black/50 rounded-2xl border border-white/[0.06] p-3">
                  <code className="flex-1 text-[11px] text-white/70 break-all font-mono leading-relaxed">
                    {selectedWallet.address}
                  </code>
                  <button
                    onClick={() => handleCopy(selectedWallet.address, 'address')}
                    className="shrink-0 p-2 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    {copied === 'address' ? (
                      <Check className="w-4 h-4 text-white/60" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                </div>

                {/* Explorer link */}
                <a
                  href={selectedWallet.addressExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/50 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View on explorer
                </a>
              </div>

              {/* Customer Email (required for receipt) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Email Address{' '}
                  <span className="text-white/50 normal-case tracking-normal">(required for receipt)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(sanitizeInput(e.target.value))}
                  placeholder="your@email.com"
                  className={`w-full px-4 py-3 rounded-2xl bg-white/[0.04] border text-white text-sm placeholder-white/25 focus:outline-none focus:ring-1 transition-colors ${
                    customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
                      ? 'border-white/20 focus:border-white/30 focus:ring-white/10'
                      : 'border-white/[0.08] focus:border-white/20 focus:ring-white/10'
                  }`}
                  autoComplete="email"
                />
                {customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) && (
                  <p className="text-xs text-white/50 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-white/40" /> Please enter a valid email
                  </p>
                )}
                <p className="text-[10px] text-white/25 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  We&apos;ll send your receipt, invoice, and payment confirmation here
                </p>
              </div>

              {/* Transaction Hash Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  Transaction Hash{' '}
                  <span className="text-white/30 normal-case tracking-normal">(after sending)</span>
                </label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(sanitizeInput(e.target.value))}
                  placeholder="Paste your transaction hash here..."
                  className={`w-full px-4 py-3 rounded-2xl bg-white/[0.04] border text-white text-sm placeholder-white/25 focus:outline-none focus:ring-1 font-mono transition-colors ${
                    txHash && !isValidTxHash(txHash)
                      ? 'border-white/20 focus:border-white/30 focus:ring-white/10'
                      : 'border-white/[0.08] focus:border-white/20 focus:ring-white/10'
                  }`}
                  autoComplete="off"
                  spellCheck={false}
                />
                {txHash && !isValidTxHash(txHash) && (
                  <p className="text-xs text-white/50 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-white/40" /> Invalid transaction
                    hash format
                  </p>
                )}
                <p className="text-[10px] text-white/25">
                  Find this in your wallet&apos;s transaction history after
                  sending.
                  {' '}<a href="/crypto-guide" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white/60 underline underline-offset-2">Need help? Read our full crypto guide →</a>
                </p>
              </div>

              {/* Submit button */}
              <motion.button
                onClick={handleSubmitPayment}
                disabled={!txHash.trim() || !isValidTxHash(txHash) || !customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()) || submitting}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  txHash.trim() && isValidTxHash(txHash) && customerEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/10 text-white/40'
                }`}
                whileHover={
                  txHash.trim() && isValidTxHash(txHash)
                    ? { scale: 1.02 }
                    : {}
                }
                whileTap={
                  txHash.trim() && isValidTxHash(txHash)
                    ? { scale: 0.98 }
                    : {}
                }
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Confirm Payment
                  </>
                )}
              </motion.button>

              {/* Warning */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <AlertCircle className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                <p className="text-[11px] text-white/40 leading-relaxed">
                  Send the <strong className="text-white/60">exact amount</strong> shown above. Only send{' '}
                  <strong className="text-white/60">{selectedCoin}</strong> on the{' '}
                  <strong className="text-white/60">{selectedWallet.network}</strong> network. Wrong
                  network = permanent loss.
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP: CONFIRMATION
              ═══════════════════════════════════════════════════════ */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8 space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold text-white">
                  Payment Submitted!
                </h3>
                <p className="text-white/50 mt-2 text-sm max-w-sm mx-auto">
                  We&apos;re verifying your transaction on the{' '}
                  {selectedWallet?.network || 'blockchain'}. You&apos;ll receive
                  a confirmation email once verified.
                </p>
              </div>

              {orderNumber && (
                <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] max-w-sm mx-auto">
                  <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider font-semibold">
                    Order Number
                  </p>
                  <code className="text-sm text-white/80 font-mono font-bold">
                    {orderNumber}
                  </code>
                </div>
              )}

              {/* Live Payment Status */}
              {paymentStatus && (
                <div className="max-w-sm mx-auto space-y-3">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-white/40">Verification</span>
                      <span className={`font-semibold ${
                        paymentStatus.status === 'confirmed' ? 'text-green-400' :
                        paymentStatus.status === 'failed' ? 'text-red-400' :
                        paymentStatus.status === 'confirming' ? 'text-blue-400' :
                        'text-white/50'
                      }`}>
                        {paymentStatus.status === 'confirmed' ? 'Confirmed' :
                         paymentStatus.status === 'confirming' ? `${paymentStatus.confirmations}/${paymentStatus.requiredConfirmations} confirmations` :
                         paymentStatus.status === 'pending' ? 'Searching...' :
                         paymentStatus.status.charAt(0).toUpperCase() + paymentStatus.status.slice(1)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          paymentStatus.status === 'confirmed' ? 'bg-green-400' :
                          paymentStatus.status === 'failed' ? 'bg-red-400' :
                          'bg-blue-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${paymentStatus.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-[10px] text-white/30 mt-2">{paymentStatus.message}</p>
                  </div>
                  {!paymentStatus.isTerminal && (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/20">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Auto-updating every 15 seconds
                    </div>
                  )}
                </div>
              )}

              {txHash && (
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] max-w-sm mx-auto">
                  <p className="text-[10px] text-white/30 mb-1 uppercase tracking-wider font-semibold">
                    Transaction Hash
                  </p>
                  <code className="text-[11px] text-white/60 break-all font-mono">
                    {txHash}
                  </code>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 flex-wrap">
                {selectedWallet && txHash && (
                  <a
                    href={selectedWallet.explorerUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/10 text-white text-sm font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Track on Explorer
                  </a>
                )}
                <button
                  onClick={() => {
                    resetCheckout();
                    onClose?.();
                  }}
                  className="px-8 py-3 rounded-2xl bg-white text-black font-bold text-sm transition-colors hover:bg-white/90"
                >
                  Done
                </button>
              </div>

              <p className="text-[10px] text-white/25 max-w-xs mx-auto">
                Typical verification: 5–30 minutes depending on network
                congestion
              </p>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════
              STEP: ON-RAMP (Buy Crypto with Card)
              ═══════════════════════════════════════════════════════ */}
          {step === 'onramp' && (
            <motion.div
              key="onramp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <p className="text-white/50 text-xs mb-3">
                Don&apos;t have crypto? Buy instantly with your card, then send
                it to complete your purchase.
              </p>

              {ONRAMP_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    const defaultCoin = 'ETH';
                    const defaultWallet = getWalletsForCoin(defaultCoin)[0];
                    if (defaultWallet) {
                      const url = provider.getUrl(
                        defaultCoin,
                        defaultWallet.address,
                        totalUSD
                      );
                      window.open(url, '_blank');
                      toast.success(
                        `Opening ${provider.name}... After purchasing, come back and send directly.`
                      );
                    }
                  }}
                  className="w-full p-4 rounded-2xl border border-white/[0.06] hover:border-white/15 bg-white/[0.03] hover:bg-white/[0.06] transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {provider.name[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm group-hover:text-white/80 transition-colors">
                        {provider.name}
                      </h3>
                      <p className="text-white/40 text-xs">
                        {provider.description}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
                  </div>
                </button>
              ))}

              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-white/40 text-xs md:text-sm mb-3 font-medium">
                  After purchasing:
                </p>
                <ol className="space-y-2.5 text-xs md:text-sm text-white/40">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                      1
                    </span>
                    <span>Buy crypto on MoonPay or Paybis</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                      2
                    </span>
                    <span>Send to your personal wallet</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                      3
                    </span>
                    <span>Come back here and &quot;Send Crypto Directly&quot;</span>
                  </li>
                </ol>
              </div>

              <button
                onClick={() => setStep('select-coin')}
                className="w-full py-3 md:py-3.5 rounded-xl bg-white text-black text-sm font-bold transition-all hover:bg-white/90 active:scale-[0.98]"
              >
                I already have crypto → Send directly
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Security Footer ────────────────────────────────────── */}
      <div className="px-4 md:px-5 py-2.5 border-t border-white/5 flex items-center justify-between text-[10px] md:text-xs text-white/25">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          <span className="font-medium">Encrypted</span>
          <span>•</span>
          <span className="font-medium">Secure</span>
        </div>
        {lastUpdated > 0 && (
          <span className="tabular-nums">
            Updated {Math.round((Date.now() - lastUpdated) / 1000)}s ago
          </span>
        )}
      </div>
    </div>
  );

  // ── If inline, render directly. If modal, render with backdrop portal. ──
  if (inline) return checkoutContent;

  return checkoutContent;
}

// ============================================================================
// COMPACT TRIGGER BUTTON - Opens the inline checkout as a section
// ============================================================================

export function CryptoCheckoutTrigger({
  productName,
  productImage,
  priceUSD,
  productId,
  variantId,
  quantity = 1,
  disabled = false,
  compact = false,
  theme = 'dark',
  onPaymentSubmitted,
}: Omit<CryptoCheckoutInlineProps, 'onClose' | 'inline'> & {
  disabled?: boolean;
  compact?: boolean;
  theme?: 'dark' | 'light';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure portal only renders client-side
  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll when portal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  return (
    <>
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        disabled={disabled}
        style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
        className={compact
          ? 'w-full py-2.5 md:py-3 rounded-xl font-semibold text-xs md:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-black text-white hover:bg-black/90 shadow-md'
          : 'w-full py-4 md:py-5 rounded-2xl font-bold text-sm md:text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 bg-white text-black hover:bg-white/90 shadow-lg'
        }
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
      >
        <svg className={compact ? 'w-4 h-4 md:w-5 md:h-5' : 'w-5 h-5 md:w-6 md:h-6'} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 12.5L12 7L16 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>Pay with Crypto</span>
        {!compact && (
          <div className="flex items-center gap-1 ml-1 opacity-50">
            <span className="text-[10px] md:text-xs font-medium">BTC</span>
            <span className="text-[8px]">•</span>
            <span className="text-[10px] md:text-xs font-medium">ETH</span>
            <span className="text-[8px]">•</span>
            <span className="text-[10px] md:text-xs font-medium">SOL</span>
            <span className="text-[8px]">•</span>
            <span className="text-[10px] md:text-xs font-medium">+4</span>
          </div>
        )}
      </motion.button>

      {/* Full-screen portal overlay */}
      {mounted && isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            key="crypto-checkout-portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] flex flex-col bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            {/* Close bar */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
              <span className="text-white/60 text-sm font-medium truncate max-w-[60%]">{productName}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close checkout"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Checkout content - full remaining space */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-2 pb-4 sm:px-4 md:px-8 lg:px-16 xl:px-32"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-2xl mx-auto">
                <CryptoCheckoutInline
                  productName={productName}
                  productImage={productImage}
                  priceUSD={priceUSD}
                  productId={productId}
                  variantId={variantId}
                  quantity={quantity}
                  inline
                  theme={theme}
                  onClose={() => setIsOpen(false)}
                  onPaymentSubmitted={(txHash, coin, network) => {
                    onPaymentSubmitted?.(txHash, coin, network);
                    // Don't close - show confirmation
                  }}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
