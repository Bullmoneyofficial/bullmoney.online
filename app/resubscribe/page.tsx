'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Heart,
  Bell,
  Gift,
  Crown,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { createSupabaseClient } from '@/lib/supabase';

// ============================================================================
// RE-SUBSCRIBE TO EMAILS PAGE - APPLE AESTHETIC BLACK & WHITE
// Welcome back interface with enhanced benefits and preferences
// ============================================================================

interface ResubscribePreferences {
  marketing: boolean;
  updates: boolean;
  trading_alerts: boolean;
  store_notifications: boolean;
  drip_campaigns: boolean;
  vip_exclusive: boolean;
}

export default function ResubscribeEmailsPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'initial' | 'success' | 'error' | 'not_found'>('initial');
  const [subscriberData, setSubscriberData] = useState<any>(null);
  const [preferences, setPreferences] = useState<ResubscribePreferences>({
    marketing: true,
    updates: true,
    trading_alerts: true,
    store_notifications: true,
    drip_campaigns: true,
    vip_exclusive: false
  });

  const supabase = createSupabaseClient();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const loadSubscriberData = async () => {
    if (!email) return;
    
    try {
      const { data: subscriber, error } = await supabase
        .from('newsletter_subscribers')
        .select(`
          *,
          recruits:recruits!left (
            id,
            full_name,
            is_vip,
            status
          )
        `)
        .eq('email', email)
        .single();

      if (error || !subscriber) {
        setStatus('not_found');
        return;
      }

      setSubscriberData(subscriber);
      
      const isVip = subscriber.is_vip || subscriber.recruits?.[0]?.is_vip;
      setPreferences(prev => ({
        ...prev,
        vip_exclusive: isVip
      }));

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

  const handleResubscribe = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .upsert({
          email,
          subscribed: true,
          resubscribed_at: new Date().toISOString(),
          preferences: {
            ...preferences,
            resubscribed_via_page: true,
            resubscribe_timestamp: new Date().toISOString()
          },
          source: 'resubscribe_page',
          admin_notes: `${subscriberData?.admin_notes || ''}\n[${new Date().toISOString()}] Re-subscribed via re-subscribe page with enhanced preferences`
        });

      if (error) throw error;

      if (preferences.drip_campaigns) {
        await supabase
          .from('email_drip_campaigns')
          .update({ 
            subscribed: true,
            reactivated_at: new Date().toISOString()
          })
          .eq('email', email);
      }

      try {
        const response = await fetch('/api/store/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Newsletter-Source': 'resubscribe_page'
          },
          body: JSON.stringify({
            email,
            source: 'resubscribe_welcome_back',
            preferences,
            isResubscribe: true
          })
        });

        if (!response.ok) {
          console.warn('Failed to send welcome back email');
        }
      } catch (emailError) {
        console.warn('Error sending welcome back email:', emailError);
      }

      setStatus('success');
    } catch (error) {
      console.error('Error re-subscribing:', error);
      setStatus('error');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/3 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-lg"
      >
        {/* Glass morphism card with enhanced 3D effects */}
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl transform-gpu relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent rounded-3xl" />
          
          <div className="relative z-10">
            {/* 3D embossed header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ rotateY: -20, scale: 0.8 }}
                animate={{ rotateY: 0, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-24 h-24 mx-auto mb-6 relative"
              >
                {/* Multiple 3D layers for depth */}
                <div className="absolute inset-0 bg-linear-to-br from-white/30 to-white/10 rounded-3xl rotate-6 blur-sm" />
                <div className="absolute inset-0 bg-linear-to-br from-white/20 to-white/5 rounded-3xl rotate-3 blur-xs" />
                <div className="relative w-full h-full bg-linear-to-br from-white via-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
                  <img
                    src="/BULL-ABOUT-SVG-NAV-BAR.svg"
                    alt="Bullmoney"
                    className="w-14 h-14"
                  />
                </div>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-3xl font-bold text-white mb-3 tracking-tight"
              >
                Welcome Back!
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-gray-400"
              >
                We missed you! Re-join our Bullmoney community
              </motion.p>
            </div>

            {status === 'initial' || status === 'error' ? (
              <>
                {/* Email input section */}
                {!email && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="space-y-6"
                  >
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
                          className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all backdrop-blur-sm"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={loadSubscriberData}
                      disabled={!email || loading}
                      className="w-full py-4 bg-white text-black rounded-xl font-medium transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Finding your account...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Heart className="w-4 h-4" />
                          Find My Account
                        </div>
                      )}
                    </motion.button>
                  </motion.div>
                )}

                {/* Re-subscription options when email is found */}
                {email && subscriberData && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-6"
                  >
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                          <Heart className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{email}</p>
                          <p className="text-gray-400 text-sm flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Account found - Ready to welcome you back
                            {subscriberData.recruits?.[0]?.is_vip && (
                              <Crown className="w-4 h-4 text-white ml-1" />
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced benefits showcase */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <Gift className="w-5 h-5" />
                        What You&apos;ll Get Back
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { title: 'Welcome Back Bonus', desc: 'Exclusive PDF guide as our apology gift' },
                          { title: 'Premium Trading Signals', desc: 'Daily market analysis and setups' },
                          { title: 'Store VIP Access', desc: 'Early access to new products & discounts' },
                          { title: 'Educational Series', desc: 'Advanced trading courses and tutorials' }
                        ].map((benefit, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{benefit.title}</p>
                              <p className="text-gray-500 text-xs">{benefit.desc}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Preference selection */}
                    <div className="space-y-4">
                      <h4 className="text-white font-semibold flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Choose What You Want to Receive:
                      </h4>
                      
                      <div className="space-y-3">
                        {[
                          { key: 'marketing', label: 'Marketing & Special Offers', desc: 'Exclusive deals, product launches, limited-time promotions' },
                          { key: 'updates', label: 'Platform Updates', desc: 'New features, improvements, important announcements' },
                          { key: 'trading_alerts', label: 'Trading Signals & Analysis', desc: 'Daily market insights, trade setups, expert analysis' },
                          { key: 'store_notifications', label: 'Store & Order Updates', desc: 'Purchase confirmations, shipping updates, order status' },
                          { key: 'drip_campaigns', label: 'Educational Email Series', desc: 'Trading courses, step-by-step guides, skill building' }
                        ].map((option, index) => (
                          <motion.label 
                            key={option.key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + index * 0.05 }}
                            className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all duration-200"
                          >
                            <input
                              type="checkbox"
                              checked={preferences[option.key as keyof ResubscribePreferences]}
                              onChange={(e) => setPreferences(prev => ({
                                ...prev,
                                [option.key]: e.target.checked
                              }))}
                              className="mt-1 rounded"
                            />
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">{option.label}</p>
                              <p className="text-gray-500 text-xs">{option.desc}</p>
                            </div>
                          </motion.label>
                        ))}
                        
                        {/* VIP exclusive option */}
                        {(subscriberData.is_vip || subscriberData.recruits?.[0]?.is_vip) && (
                          <motion.label 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.1 }}
                            className="flex items-start gap-3 p-4 bg-white/10 rounded-xl border border-white/20 cursor-pointer hover:bg-white/15 transition-all duration-200"
                          >
                            <input
                              type="checkbox"
                              checked={preferences.vip_exclusive}
                              onChange={(e) => setPreferences(prev => ({
                                ...prev,
                                vip_exclusive: e.target.checked
                              }))}
                              className="mt-1 rounded"
                            />
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm flex items-center gap-2">
                                <Crown className="w-4 h-4" />
                                VIP Exclusive Content
                              </p>
                              <p className="text-gray-400 text-xs">Private trading strategies, VIP-only webinars, premium content</p>
                            </div>
                          </motion.label>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <Link href="/store" className="flex-1">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-4 bg-white/10 text-white rounded-xl font-medium transition-all duration-200 hover:bg-white/20 border border-white/10"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Maybe Later
                          </div>
                        </motion.button>
                      </Link>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleResubscribe}
                        disabled={loading}
                        className="flex-1 py-4 bg-white text-black rounded-xl font-medium transition-all duration-200 hover:bg-gray-100 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Subscribing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Heart className="w-4 h-4" />
                            Welcome Me Back!
                          </div>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-6"
                  >
                    <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-white text-lg font-medium mb-2">Something went wrong</h3>
                    <p className="text-gray-400 mb-4">Please try again or contact support.</p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStatus('initial')}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </motion.button>
                  </motion.div>
                )}
              </>
            ) : status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 1, delay: 0.2 }}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative"
                >
                  <CheckCircle className="w-10 h-10 text-black" />
                </motion.div>
                
                <h3 className="text-white text-2xl font-bold mb-3">
                  Welcome Back to Bullmoney!
                </h3>
                <p className="text-gray-300 mb-2">
                  You&apos;re all set! We&apos;ve sent you a special welcome back email.
                </p>
                <p className="text-gray-500 text-sm mb-6 flex items-center justify-center gap-1">
                  <Gift className="w-4 h-4" />
                  Check your inbox for your bonus guide
                </p>
                
                <div className="flex gap-3">
                  <Link href="/store" className="flex-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-white text-black rounded-xl font-medium transition-all duration-200 hover:bg-gray-100"
                    >
                      Explore Store
                    </motion.button>
                  </Link>
                  
                  <Link href="/VIP" className="flex-1">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-white/10 text-white rounded-xl font-medium transition-all duration-200 hover:bg-white/20 border border-white/10"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Crown className="w-4 h-4" />
                        Go VIP
                      </div>
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ) : status === 'not_found' ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">Email Not Found</h3>
                <p className="text-gray-400 mb-4">This email wasn&apos;t in our system. Want to join fresh?</p>
                <Link href="/store">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-white text-black rounded-lg transition-colors hover:bg-gray-100"
                  >
                    Join Newsletter
                  </motion.button>
                </Link>
              </motion.div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
