'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, Check, ExternalLink, ArrowLeft, RefreshCw, Wallet,
  ChevronDown, Clock, Shield, QrCode, CreditCard, Zap, AlertCircle,
} from 'lucide-react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { toast } from 'sonner';
import {
  AVAILABLE_COINS,
  getWalletsForCoin,
  ONRAMP_PROVIDERS,
  type WalletAddress,
} from '@/lib/crypto-wallets';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useCurrencyLocaleStore } from '@/stores/currency-locale-store';

// ============================================================================
// CRYPTO PAYMENT MODAL - Full crypto checkout flow
// Steps: Select Method → Select Coin → Select Network → Show Address → Confirm
// ============================================================================

type PaymentStep = 'method' | 'coin' | 'network' | 'payment' | 'confirm' | 'onramp';

interface CryptoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productImage?: string | null;
  priceUSD: number;
  productId: string;
  variantId?: string;
  quantity?: number;
  customerEmail?: string;  // Pre-fill if user is logged in
  onPaymentSubmitted?: (txHash: string, coin: string, network: string) => void;
}

export function CryptoPaymentModal({
  isOpen,
  onClose,
  productName,
  productImage,
  priceUSD,
  productId,
  variantId,
  quantity = 1,
  customerEmail: propEmail,
  onPaymentSubmitted,
}: CryptoPaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('method');
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletAddress | null>(null);
  const [txHash, setTxHash] = useState('');
  const [customerEmail, setCustomerEmail] = useState(propEmail || '');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 min payment window
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string; progress: number; confirmations?: number;
    requiredConfirmations?: number; message?: string; isTerminal?: boolean;
  } | null>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  
  const { getPrice, convertUsdToCrypto, loading: pricesLoading, refresh: refreshPrices, lastUpdated } = useCryptoPrices();
  const formatPrice = useCurrencyLocaleStore((s) => s.formatPrice);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('method');
      setSelectedCoin(null);
      setSelectedWallet(null);
      setTxHash('');
      setCopied(false);
      setCountdown(900);
      setPaymentId(null);
      setPaymentStatus(null);
      refreshPrices();
    }
  }, [isOpen, refreshPrices]);

  // Countdown timer for payment window
  useEffect(() => {
    if (step !== 'payment' || !isOpen) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Payment window expired. Please restart.');
          setStep('method');
          return 900;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, isOpen]);

  // Poll payment status when on confirm step
  useEffect(() => {
    if (step !== 'confirm' || !paymentId || !isOpen) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/crypto-payment/status?paymentId=${paymentId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setPaymentStatus(data);
          if (data.isTerminal) return; // stop polling
        }
      } catch { /* ignore */ }
      if (!cancelled) setTimeout(poll, 15000);
    };
    poll();
    return () => { cancelled = true; };
  }, [step, paymentId, isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleCopyAddress = useCallback(async () => {
    if (!selectedWallet) return;
    try {
      await navigator.clipboard.writeText(selectedWallet.address);
      setCopied(true);
      toast.success('Address copied!');
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = selectedWallet.address;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success('Address copied!');
    }
  }, [selectedWallet]);

  const handleSelectCoin = (coin: string) => {
    setSelectedCoin(coin);
    const wallets = getWalletsForCoin(coin);
    if (wallets.length === 1) {
      setSelectedWallet(wallets[0]);
      setStep('payment');
    } else {
      setStep('network');
    }
  };

  const handleSelectNetwork = (wallet: WalletAddress) => {
    setSelectedWallet(wallet);
    setStep('payment');
    setCountdown(900);
  };

  const handleSubmitPayment = async () => {
    if (!txHash.trim()) {
      toast.error('Please enter your transaction hash');
      return;
    }
    if (!customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      toast.error('Please enter a valid email address for your receipt');
      return;
    }
    if (!selectedCoin || !selectedWallet) return;

    setPaymentSubmitting(true);
    
    try {
      const res = await fetch('/api/crypto-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash: txHash.trim(),
          coin: selectedCoin,
          network: selectedWallet.network,
          walletAddress: selectedWallet.address,
          amountUSD: priceUSD * quantity,
          amountCrypto: convertUsdToCrypto(priceUSD * quantity, selectedCoin),
          lockedPrice: getPrice(selectedCoin),
          productId,
          variantId,
          quantity,
          productName,
          customerEmail: customerEmail.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPaymentId(data.paymentId || null);
        toast.success('Payment submitted! Check your email for confirmation.');
        setStep('confirm');
        onPaymentSubmitted?.(txHash.trim(), selectedCoin, selectedWallet.network);
      } else if (data.status === 'duplicate') {
        setPaymentId(data.paymentId || null);
        toast.success('Payment already recorded. Check your email for updates.');
        setStep('confirm');
        onPaymentSubmitted?.(txHash.trim(), selectedCoin, selectedWallet.network);
      } else {
        toast.error(data.error || 'Failed to record payment. Please contact support.');
      }
    } catch (err) {
      console.error('[CryptoPayment] Submit error:', err);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const goBack = () => {
    switch (step) {
      case 'coin': setStep('method'); break;
      case 'network': setStep('coin'); break;
      case 'payment': setStep(getWalletsForCoin(selectedCoin!).length > 1 ? 'network' : 'coin'); break;
      case 'onramp': setStep('method'); break;
      default: onClose();
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const cryptoAmount = selectedCoin ? convertUsdToCrypto(priceUSD * quantity, selectedCoin) : null;
  const coinInfo = AVAILABLE_COINS.find((c) => c.coin === selectedCoin);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-99999 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.90)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10"
          style={{ backgroundColor: 'rgb(10, 10, 10)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Shimmer top border */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent store-shimmer-border" />
          </div>

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/10" style={{ backgroundColor: 'rgb(10, 10, 10)' }}>
            <div className="flex items-center gap-3">
              {step !== 'method' && step !== 'confirm' && (
                <motion.button
                  onClick={goBack}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </motion.button>
              )}
              <div>
                <h2 className="text-lg font-bold text-white">
                  {step === 'method' && 'Pay with Crypto'}
                  {step === 'coin' && 'Select Cryptocurrency'}
                  {step === 'network' && 'Select Network'}
                  {step === 'payment' && 'Send Payment'}
                  {step === 'confirm' && 'Payment Submitted'}
                  {step === 'onramp' && 'Buy Crypto'}
                </h2>
                <p className="text-sm text-white/50">{productName}</p>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Price Summary Bar */}
          {step !== 'confirm' && (
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-white/60 text-sm">Total</span>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-lg">{formatPrice(priceUSD * quantity)}</span>
                {cryptoAmount !== null && coinInfo && (
                  <span className="text-sm font-medium px-2 py-1 rounded-lg" style={{ backgroundColor: `${coinInfo.color}20`, color: coinInfo.color }}>
                    ≈ {cryptoAmount < 0.001 ? cryptoAmount.toFixed(8) : cryptoAmount < 1 ? cryptoAmount.toFixed(6) : cryptoAmount.toFixed(4)} {selectedCoin}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Select Payment Method ─────────────────────── */}
              {step === 'method' && (
                <motion.div
                  key="method"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Direct Send */}
                  <button
                    onClick={() => setStep('coin')}
                    className="w-full p-5 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-base group-hover:text-blue-400 transition-colors">Send Crypto Directly</h3>
                        <p className="text-white/50 text-sm">Send from Exodus, Binance, MetaMask, or any wallet</p>
                      </div>
                      <ChevronDown className="w-5 h-5 text-white/30 -rotate-90 group-hover:text-white/60 transition-colors" />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 pl-16">
                      {AVAILABLE_COINS.map((c) => (
                        <span key={c.coin} className="px-2 py-0.5 text-xs rounded-full border border-white/10" style={{ color: c.color }}>
                          {c.symbol} {c.coin}
                        </span>
                      ))}
                    </div>
                  </button>

                  {/* Buy Crypto & Pay */}
                  <button
                    onClick={() => setStep('onramp')}
                    className="w-full p-5 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-base group-hover:text-green-400 transition-colors">Buy Crypto & Pay</h3>
                        <p className="text-white/50 text-sm">Purchase crypto via MoonPay or Paybis with card</p>
                      </div>
                      <ChevronDown className="w-5 h-5 text-white/30 -rotate-90 group-hover:text-white/60 transition-colors" />
                    </div>
                  </button>

                  {/* Info */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-blue-300 font-medium">Secure & Verified</p>
                      <p className="text-xs text-blue-300/60 mt-1">
                        All transactions are verified on-chain. Your payment will be confirmed within minutes after network confirmation.
                      </p>
                      <a href="/crypto-guide" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline mt-1 inline-block">
                        New to crypto? Read our beginner's guide →
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Select Cryptocurrency ───────────────────── */}
              {step === 'coin' && (
                <motion.div
                  key="coin"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  {AVAILABLE_COINS.map((coin) => {
                    const price = getPrice(coin.coin);
                    const cryptoAmt = convertUsdToCrypto(priceUSD * quantity, coin.coin);
                    
                    return (
                      <button
                        key={coin.coin}
                        onClick={() => handleSelectCoin(coin.coin)}
                        className="w-full p-4 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-4 group"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                          style={{ backgroundColor: `${coin.color}20`, color: coin.color }}
                        >
                          {coin.symbol}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">{coin.name}</span>
                            <span className="text-white/40 text-sm">{coin.coin}</span>
                          </div>
                          {price && (
                            <p className="text-white/50 text-xs">
                              1 {coin.coin} = ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {cryptoAmt !== null ? (
                            <p className="text-white font-medium text-sm">
                              {cryptoAmt < 0.001 ? cryptoAmt.toFixed(8) : cryptoAmt < 1 ? cryptoAmt.toFixed(6) : cryptoAmt.toFixed(4)} {coin.coin}
                            </p>
                          ) : (
                            <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {pricesLoading && (
                    <div className="flex items-center justify-center gap-2 py-4 text-white/40 text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading live prices...
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── STEP 3: Select Network ────────────────────────────── */}
              {step === 'network' && selectedCoin && (
                <motion.div
                  key="network"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <p className="text-white/60 text-sm mb-4">
                    Select which network to send <span className="text-white font-medium">{selectedCoin}</span> on:
                  </p>
                  {getWalletsForCoin(selectedCoin).map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleSelectNetwork(wallet)}
                      className="w-full p-4 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-4 group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                        style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
                      >
                        {wallet.exchange === 'exodus' ? 'EX' : wallet.exchange === 'binance' ? 'BN' : 'BS'}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-white font-semibold text-sm">{wallet.network}</span>
                        <p className="text-white/40 text-xs mt-0.5 truncate">{wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}</p>
                      </div>
                      <span className="text-xs text-white/30 capitalize px-2 py-1 rounded-lg bg-white/5">{wallet.exchange}</span>
                    </button>
                  ))}

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mt-4">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-300/80">
                      Make sure to send on the correct network. Sending on the wrong network may result in permanent loss of funds.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: Payment Details ────────────────────────────── */}
              {step === 'payment' && selectedWallet && selectedCoin && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  {/* Timer */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Clock className="w-4 h-4" />
                      <span>Price locked for</span>
                    </div>
                    <span className={`font-mono font-bold text-sm ${countdown < 60 ? 'text-red-400' : countdown < 300 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {formatCountdown(countdown)}
                    </span>
                  </div>

                  {/* Amount to send */}
                  <div className="text-center p-5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/50 text-sm mb-2">Send exactly</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-bold" style={{ color: coinInfo?.color }}>
                        {cryptoAmount !== null
                          ? (cryptoAmount < 0.001 ? cryptoAmount.toFixed(8) : cryptoAmount < 1 ? cryptoAmount.toFixed(6) : cryptoAmount.toFixed(4))
                          : '—'}
                      </span>
                      <span className="text-xl text-white/60">{selectedCoin}</span>
                    </div>
                    <p className="text-white/40 text-sm mt-1">≈ ${(priceUSD * quantity).toFixed(2)} USD</p>
                    <button
                      onClick={() => {
                        if (cryptoAmount !== null) {
                          const amt = cryptoAmount < 0.001 ? cryptoAmount.toFixed(8) : cryptoAmount < 1 ? cryptoAmount.toFixed(6) : cryptoAmount.toFixed(4);
                          navigator.clipboard.writeText(amt);
                          toast.success('Amount copied!');
                        }
                      }}
                      className="mt-2 text-xs text-white/40 hover:text-white/60 transition-colors flex items-center gap-1 mx-auto"
                    >
                      <Copy className="w-3 h-3" /> Copy amount
                    </button>
                  </div>

                  {/* QR Code + Address */}
                  <div className="flex flex-col items-center gap-4 p-5 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-white/50 text-sm">To this address ({selectedWallet.network})</p>
                    
                    {/* QR Code */}
                    <div className="bg-white p-3 rounded-xl">
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
                    <div className="w-full flex items-center gap-2 bg-black/50 rounded-xl border border-white/10 p-3">
                      <code className="flex-1 text-xs text-white/80 break-all font-mono leading-relaxed">
                        {selectedWallet.address}
                      </code>
                      <button
                        onClick={handleCopyAddress}
                        className="shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-white/60" />
                        )}
                      </button>
                    </div>

                    {/* View on Explorer */}
                    <a
                      href={selectedWallet.addressExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View on explorer
                    </a>
                  </div>

                  {/* Email for Receipt */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Email Address <span className="text-white/40">(for invoice & updates)</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
                    />
                    <p className="text-xs text-white/30">
                      You'll receive your invoice and payment status updates here.
                    </p>
                  </div>

                  {/* Transaction Hash Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white">
                      Transaction Hash <span className="text-white/40">(after sending)</span>
                    </label>
                    <input
                      type="text"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="Paste your transaction hash here..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 font-mono"
                    />
                    <p className="text-xs text-white/30">
                      Find this in your wallet's transaction history after sending.
                      {' '}<a href="/crypto-guide" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Need help? Read our full crypto guide →</a>
                    </p>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    onClick={handleSubmitPayment}
                    disabled={!txHash.trim() || paymentSubmitting}
                    className="w-full py-4 rounded-xl font-bold text-white text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: txHash.trim() ? 'rgb(25, 86, 180)' : 'rgb(50, 50, 50)' }}
                    whileHover={txHash.trim() ? { scale: 1.02 } : {}}
                    whileTap={txHash.trim() ? { scale: 0.98 } : {}}
                  >
                    {paymentSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Confirm Payment
                      </>
                    )}
                  </motion.button>

                  {/* Warning */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-300/80">
                      Send the <strong>exact amount</strong> shown above. Sending a different amount may delay order processing. Only send <strong>{selectedCoin}</strong> on the <strong>{selectedWallet.network}</strong> network.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 5: Confirmation ───────────────────────────────── */}
              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8 space-y-6"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white">Payment Submitted!</h3>
                    <p className="text-white/60 mt-2 text-sm max-w-sm mx-auto">
                      We're verifying your transaction on the {selectedWallet?.network || 'blockchain'}. 
                      You'll receive a confirmation email once verified.
                    </p>
                  </div>

                  {/* Live Status Tracker */}
                  {paymentStatus && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 max-w-sm mx-auto space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${
                          paymentStatus.status === 'confirmed' ? 'text-green-400' :
                          paymentStatus.status === 'failed' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {paymentStatus.message || paymentStatus.status}
                        </span>
                        {paymentStatus.confirmations != null && paymentStatus.requiredConfirmations && (
                          <span className="text-white/40">
                            {paymentStatus.confirmations}/{paymentStatus.requiredConfirmations}
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            paymentStatus.status === 'confirmed' ? 'bg-green-500' :
                            paymentStatus.status === 'failed' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${paymentStatus.progress}%` }}
                        />
                      </div>
                      {!paymentStatus.isTerminal && (
                        <p className="text-[10px] text-white/30 flex items-center gap-1 justify-center">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Auto-updating
                        </p>
                      )}
                    </div>
                  )}

                  {txHash && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 max-w-sm mx-auto">
                      <p className="text-xs text-white/40 mb-1">Transaction Hash</p>
                      <code className="text-xs text-white/70 break-all font-mono">{txHash}</code>
                    </div>
                  )}

                  <div className="space-y-3 pt-4">
                    {selectedWallet && txHash && (
                      <a
                        href={selectedWallet.explorerUrl(txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Track on Explorer
                      </a>
                    )}
                    
                    <div>
                      <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-xl text-white font-bold text-sm transition-colors"
                        style={{ backgroundColor: 'rgb(25, 86, 180)' }}
                      >
                        Done
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-white/30 max-w-xs mx-auto">
                    Typical verification time: 5-30 minutes depending on network congestion
                  </p>
                </motion.div>
              )}

              {/* ── STEP: On-Ramp (Buy Crypto) ────────────────────────── */}
              {step === 'onramp' && (
                <motion.div
                  key="onramp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <p className="text-white/60 text-sm mb-2">
                    Don't have crypto? Buy it instantly with your card, then send it to complete your purchase.
                  </p>

                  {ONRAMP_PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        // Default to USDT on Tron for lowest fees
                        const defaultCoin = 'ETH';
                        const defaultWallet = getWalletsForCoin(defaultCoin)[0];
                        if (defaultWallet) {
                          const url = provider.getUrl(defaultCoin, defaultWallet.address, priceUSD * quantity);
                          window.open(url, '_blank');
                          toast.success(`Opening ${provider.name}... After purchasing, come back and send crypto directly.`);
                        }
                      }}
                      className="w-full p-5 rounded-xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                          style={{ backgroundColor: provider.color }}
                        >
                          {provider.name[0]}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">{provider.name}</h3>
                          <p className="text-white/50 text-sm">{provider.description}</p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                      </div>
                    </button>
                  ))}

                  <div className="border-t border-white/10 pt-4 mt-4">
                    <p className="text-white/50 text-sm mb-3">After purchasing crypto:</p>
                    <ol className="space-y-2 text-sm text-white/40">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white shrink-0">1</span>
                        <span>Buy crypto on MoonPay or Paybis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white shrink-0">2</span>
                        <span>Send it to your personal wallet (Exodus, Binance, etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs text-white shrink-0">3</span>
                        <span>Come back here and use &quot;Send Crypto Directly&quot;</span>
                      </li>
                    </ol>
                  </div>

                  <button
                    onClick={() => setStep('coin')}
                    className="w-full py-3 rounded-xl border border-white/20 hover:border-white/40 text-white text-sm font-medium transition-colors"
                  >
                    I already have crypto → Send directly
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
