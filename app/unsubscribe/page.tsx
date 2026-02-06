'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Settings,
  Bell,
  BellOff,
  Shield,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase';

// ============================================================================
// UNSUBSCRIBE FROM EMAILS PAGE - APPLE AESTHETIC BLACK & WHITE
// Smart unsubscribe with selective options and re-subscribe capabilities
// ============================================================================

interface UnsubscribeOptions {
  marketing: boolean;
  updates: boolean;
  trading_alerts: boolean;
  store_notifications: boolean;
  drip_campaigns: boolean;
}

export default function UnsubscribeEmailsPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'initial' | 'success' | 'error' | 'not_found'>('initial');
  const [subscriberData, setSubscriberData] = useState<any>(null);
  const [unsubscribeOptions, setUnsubscribeOptions] = useState<UnsubscribeOptions>({
    marketing: true,
    updates: true,
    trading_alerts: true,
    store_notifications: true,
    drip_campaigns: true
  });
  const [selectedAction, setSelectedAction] = useState<'partial' | 'complete'>('partial');

  const supabase = createSupabaseClient();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    if (emailParam) setEmail(decodeURIComponent(emailParam));
    if (tokenParam) setToken(tokenParam);
  }, [searchParams]);

  const loadSubscriberData = async () => {
    if (!email) return;
    
    try {
      const { data: subscriber, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !subscriber) {
        setStatus('not_found');
        return;
      }

      setSubscriberData(subscriber);
      
      const prefs = subscriber.preferences || {};
      setUnsubscribeOptions({
        marketing: prefs.marketing !== false,
        updates: prefs.updates !== false,
        trading_alerts: prefs.trading_alerts !== false,
        store_notifications: prefs.store_notifications !== false,
        drip_campaigns: prefs.drip_campaigns !== false
      });

    } catch (error) {
      console.error('Error loading subscriber:', error);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (email) {
      loadSubscriberData();
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    setLoading(true);
    
    try {
      if (selectedAction === 'complete') {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({
            subscribed: false,
            unsubscribed_at: new Date().toISOString(),
            preferences: { ...subscriberData.preferences, unsubscribed_completely: true }
          })
          .eq('email', email);

        if (error) throw error;

        await supabase
          .from('email_drip_campaigns')
          .update({ subscribed: false })
          .eq('email', email);

      } else {
        const newPreferences = {
          ...subscriberData.preferences,
          ...unsubscribeOptions
        };

        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({
            preferences: newPreferences,
            subscribed: Object.values(unsubscribeOptions).some(Boolean)
          })
          .eq('email', email);

        if (error) throw error;

        if (!unsubscribeOptions.drip_campaigns) {
          await supabase
            .from('email_drip_campaigns')
            .update({ subscribed: false })
            .eq('email', email);
        }
      }

      setStatus('success');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setStatus('error');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-lg"
      >
        {/* Glass morphism card with 3D effects */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl transform-gpu">
          {/* 3D embossed header */}
          <div className="text-center mb-8">
            <div className="relative mb-6">
              {/* Logo with 3D effect */}
              <motion.div
                initial={{ rotateY: -15 }}
                animate={{ rotateY: 0 }}
                transition={{ duration: 0.8 }}
                className="w-20 h-20 mx-auto mb-4 relative"
              >
ktop                 <div className="absolute inset-0 bg-linear-to-br from-white/20 to-white/5 rounded-2xl rotate-3 blur-sm" />
                <div className="relative w-full h-full bg-linear-to-br from-white to-gray-300 rounded-2xl flex items-center justify-center shadow-xl">
                  <img
                    src="/BULL-ABOUT-SVG-NAV-BAR.svg"
                    alt="Bullmoney"
                    className="w-12 h-12"
                  />
                </div>
              </motion.div>
              
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Email Preferences
              </h1>
              <p className="text-gray-400">
                Manage your Bullmoney email subscriptions
              </p>
            </div>
          </div>

          {status === 'initial' || status === 'error' ? (
            <>
              {/* Email input section */}
              {!email && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-gray-300 text-sm font-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={loadSubscriberData}
                    disabled={!email || loading}
                    className="w-full py-3 bg-white text-black rounded-xl font-medium transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      'Find My Subscription'
                    )}
                  </motion.button>
                </div>
              )}

              {/* Subscription options when email is found */}
              {email && subscriberData && (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{email}</p>
                        <p className="text-gray-400 text-sm">Subscription found</p>
                      </div>
                    </div>
                  </div>

                  {/* Action selection */}
                  <div className="space-y-4">
                    <h3 className="text-white font-medium">Choose your action:</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="radio"
                          name="action"
                          value="partial"
                          checked={selectedAction === 'partial'}
                          onChange={(e) => setSelectedAction(e.target.value as any)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-white font-medium">Customize Email Types</p>
                          <p className="text-gray-400 text-sm">Choose which emails you want to receive</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <input
                          type="radio"
                          name="action"
                          value="complete"
                          checked={selectedAction === 'complete'}
                          onChange={(e) => setSelectedAction(e.target.value as any)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-white font-medium">Unsubscribe Completely</p>
                          <p className="text-gray-400 text-sm">Stop all emails from Bullmoney</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Email type options for partial unsubscribe */}
                  {selectedAction === 'partial' && (
                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Email Types:</h4>
                      
                      <div className="space-y-3">
                        {[
                          { key: 'marketing', label: 'Marketing & Promotions', desc: 'Store deals, product launches, special offers' },
                          { key: 'updates', label: 'Product Updates', desc: 'New features, platform updates, announcements' },
                          { key: 'trading_alerts', label: 'Trading Alerts', desc: 'Market analysis, trading setups, signals' },
                          { key: 'store_notifications', label: 'Store Notifications', desc: 'Order updates, shipping notifications' },
                          { key: 'drip_campaigns', label: 'Educational Series', desc: 'Trading courses, tips, educational content' }
                        ].map(option => (
                          <label key={option.key} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={unsubscribeOptions[option.key as keyof UnsubscribeOptions]}
                              onChange={(e) => setUnsubscribeOptions(prev => ({
                                ...prev,
                                [option.key]: e.target.checked
                              }))}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <p className="text-white font-medium">{option.label}</p>
                              <p className="text-gray-400 text-sm">{option.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Link href="/store" className="flex-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 bg-white/10 text-white rounded-xl font-medium transition-all duration-200 hover:bg-white/20"
                      >
                        Cancel
                      </motion.button>
                    </Link>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUnsubscribe}
                      disabled={loading}
                      className="flex-1 py-3 bg-white text-black rounded-xl font-medium transition-all duration-200 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Updating...
                        </div>
                      ) : (
                        selectedAction === 'complete' ? 'Unsubscribe All' : 'Update Preferences'
                      )}
                    </motion.button>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center py-6">
                  <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">Something went wrong</h3>
                  <p className="text-gray-400 mb-4">Please try again or contact support.</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStatus('initial')}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </motion.button>
                </div>
              )}
            </>
          ) : status === 'success' ? (
            <div className="text-center py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-8 h-8 text-black" />
              </motion.div>
              
              <h3 className="text-white text-xl font-bold mb-3">
                {selectedAction === 'complete' ? 'Unsubscribed Successfully' : 'Preferences Updated'}
              </h3>
              <p className="text-gray-400 mb-6">
                {selectedAction === 'complete' 
                  ? 'You have been removed from all Bullmoney email lists.'
                  : 'Your email preferences have been updated successfully.'
                }
              </p>
              
              <div className="flex gap-3">
                <Link href="/store" className="flex-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-white text-black rounded-xl font-medium transition-all duration-200 hover:bg-gray-100"
                  >
                    Back to Store
                  </motion.button>
                </Link>
                
                <Link href="/resubscribe" className="flex-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-white/10 text-white rounded-xl font-medium transition-all duration-200 hover:bg-white/20"
                  >
                    Re-subscribe
                  </motion.button>
                </Link>
              </div>
            </div>
          ) : status === 'not_found' ? (
            <div className="text-center py-6">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">Email Not Found</h3>
              <p className="text-gray-400 mb-4">We couldn&apos;t find a subscription for this email address.</p>
              <Link href="/store">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 bg-white text-black rounded-lg transition-colors hover:bg-gray-100"
                >
                  Back to Store
                </motion.button>
              </Link>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
