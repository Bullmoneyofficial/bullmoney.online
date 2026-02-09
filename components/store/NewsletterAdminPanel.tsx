'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Users from 'lucide-react/dist/esm/icons/users';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Download from 'lucide-react/dist/esm/icons/download';
import Search from 'lucide-react/dist/esm/icons/search';
import Filter from 'lucide-react/dist/esm/icons/filter';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Award from 'lucide-react/dist/esm/icons/award';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Send from 'lucide-react/dist/esm/icons/send';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Crown from 'lucide-react/dist/esm/icons/crown';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import { createSupabaseClient } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// NEWSLETTER ADMIN PANEL - GMAIL HUB WITH RECRUITS + DRIP CAMPAIGNS INTEGRATION
// Store-page only access for managing Gmail newsletter system
// Enhanced with recruits cross-referencing, drip campaign management, and email templates
// ============================================================================

interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed: boolean;
  first_name?: string;
  last_name?: string;
  is_vip: boolean;
  source: string;
  subscribed_at: string;
  unsubscribed_at?: string;
  total_emails_sent: number;
  total_emails_opened: number;
  admin_notes?: string;
  tags: string[];
  preferences: Record<string, any>;
  // Recruit integration fields
  recruit_id?: string;
  recruit_status?: string;
  recruit_is_vip?: boolean;
  recruit_full_name?: string;
}

interface DripCampaignStatus {
  email: string;
  campaign_name: string;
  email_sequence_number: number;
  total_emails_to_send: number;
  started_at: string;
  next_email_scheduled_at?: string;
  completed_at?: string;
  total_sent: number;
  total_opened: number;
}

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  is_active: boolean;
  created_at: string;
  usage_count?: number;
}

interface NewsletterStats {
  total_subscribers: number;
  active_subscribers: number;
  unsubscribed: number;
  vip_subscribers: number;
  this_week_signups: number;
  this_month_signups: number;
}

export function NewsletterAdminPanel({ isStoreAdmin }: { isStoreAdmin: boolean }) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [dripCampaigns, setDripCampaigns] = useState<DripCampaignStatus[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'unsubscribed' | 'vip' | 'recruits'>('all');
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaigns' | 'templates' | 'analytics'>('subscribers');

  const supabase = createSupabaseClient();

  // Check if user can access newsletter admin (store page only)
  const canAccessNewsletterAdmin = () => {
    if (!isStoreAdmin) return false;
    
    // Check if we're on store page
    if (typeof window !== 'undefined') {
      return window.location.pathname.includes('/store');
    }
    
    return false;
  };

  // Fetch newsletter stats
  const fetchNewsletterStats = useCallback(async () => {
    try {
      const response = await fetch('/api/store/newsletter/subscribe', {
        method: 'GET',
        headers: {
          'X-Newsletter-Source': 'store_admin'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching newsletter stats:', error);
    }
  }, []);

  // Fetch subscribers with recruit integration
  const fetchSubscribers = useCallback(async () => {
    try {
      // Enhanced query to include recruit data
      const { data: subscribersData, error } = await supabase
        .from('newsletter_subscribers')
        .select(`
          *,
          recruits:recruits!left (
            id,
            full_name,
            status,
            is_vip,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && subscribersData) {
        // Flatten recruit data into subscriber objects
        const enhancedSubscribers = subscribersData.map((sub: any) => ({
          ...sub,
          recruit_id: sub.recruits?.[0]?.id || null,
          recruit_status: sub.recruits?.[0]?.status || null,
          recruit_is_vip: sub.recruits?.[0]?.is_vip || false,
          recruit_full_name: sub.recruits?.[0]?.full_name || null,
          recruit_created_at: sub.recruits?.[0]?.created_at || null
        }));
        
        setSubscribers(enhancedSubscribers);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }
  }, [supabase]);

  // Fetch drip campaign status for all subscribers
  const fetchDripCampaigns = useCallback(async () => {
    try {
      const { data: campaignsData, error } = await supabase
        .from('email_drip_campaigns')
        .select('*')
        .order('started_at', { ascending: false });

      if (!error && campaignsData) {
        setDripCampaigns(campaignsData);
      }
    } catch (error) {
      console.error('Error fetching drip campaigns:', error);
    }
  }, [supabase]);

  // Fetch email templates
  const fetchEmailTemplates = useCallback(async () => {
    try {
      const { data: templatesData, error } = await supabase
        .from('email_templates')
        .select('id, slug, name, subject, is_active, created_at')
        .order('created_at', { ascending: false });

      if (!error && templatesData) {
        setEmailTemplates(templatesData);
      }
    } catch (error) {
      console.error('Error fetching email templates:', error);
    }
  }, [supabase]);

  // Load data
  useEffect(() => {
    if (!canAccessNewsletterAdmin()) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchNewsletterStats(),
        fetchSubscribers(),
        fetchDripCampaigns(),
        fetchEmailTemplates()
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchNewsletterStats, fetchSubscribers, fetchDripCampaigns, fetchEmailTemplates]);

  // Filter subscribers with recruit integration
  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (subscriber.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (subscriber.recruit_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesFilter = (() => {
      switch (filterStatus) {
        case 'active': return subscriber.subscribed;
        case 'unsubscribed': return !subscriber.subscribed;
        case 'vip': return subscriber.is_vip || subscriber.recruit_is_vip;
        case 'recruits': return !!subscriber.recruit_id;
        default: return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  // Get drip campaigns for a specific subscriber
  const getSubscriberCampaigns = (email: string) => {
    return dripCampaigns.filter(campaign => campaign.email === email);
  };

  // Toggle subscriber selection
  const toggleSubscriberSelection = (subscriberId: string) => {
    setSelectedSubscribers(prev =>
      prev.includes(subscriberId)
        ? prev.filter(id => id !== subscriberId)
        : [...prev, subscriberId]
    );
  };

  // Bulk actions
  const handleBulkUnsubscribe = async () => {
    if (selectedSubscribers.length === 0) return;
    
    try {
      await supabase
        .from('newsletter_subscribers')
        .update({ 
          subscribed: false, 
          unsubscribed_at: new Date().toISOString()
        })
        .in('id', selectedSubscribers);
      
      setSelectedSubscribers([]);
      await fetchSubscribers();
      await fetchNewsletterStats();
    } catch (error) {
      console.error('Error bulk unsubscribing:', error);
    }
  };

  // Export subscribers
  const handleExport = () => {
    const csv = [
      ['Email', 'Status', 'VIP', 'Source', 'Subscribed Date', 'Emails Sent', 'Emails Opened'].join(','),
      ...filteredSubscribers.map(sub => [
        sub.email,
        sub.subscribed ? 'Active' : 'Unsubscribed',
        sub.is_vip ? 'Yes' : 'No',
        sub.source,
        new Date(sub.subscribed_at).toLocaleDateString(),
        sub.total_emails_sent,
        sub.total_emails_opened
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Don't render if not authorized
  if (!canAccessNewsletterAdmin()) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Store Admin Access Required</h3>
        <p className="text-gray-400 text-sm">
          Newsletter management is only available to store administrators on the store page.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Loading Gmail Newsletter Admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Mail className="w-7 h-7 text-blue-400" />
            Gmail Newsletter Hub
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Store-only admin panel for managing Gmail newsletter subscribers
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSubscribers}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-gray-400">Total</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.total_subscribers}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-xs text-gray-400">Active</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.active_subscribers}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-xs text-gray-400">VIP</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.vip_subscribers}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-xs text-gray-400">This Week</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.this_week_signups}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-gray-400">This Month</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.this_month_signups}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-xs text-gray-400">Unsubscribed</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.unsubscribed}</div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <UserPlus className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-gray-400">Recruits</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {subscribers.filter(s => s.recruit_id).length}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, name, or recruit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Subscribers</option>
            <option value="active">Active Only</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="vip">VIP Members</option>
            <option value="recruits">Linked Recruits</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedSubscribers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {selectedSubscribers.length} subscriber{selectedSubscribers.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkUnsubscribe}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
                >
                  Unsubscribe Selected
                </button>
                <button
                  onClick={() => setSelectedSubscribers([])}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscribers Table */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/80">
              <tr>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSubscribers.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubscribers(filteredSubscribers.map(s => s.id));
                      } else {
                        setSelectedSubscribers([]);
                      }
                    }}
                    className="rounded bg-gray-700 border-gray-600"
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Subscriber</th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Source</th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Recruit Link</th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Drip Campaigns</th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Engagement</th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Joined</th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-t border-gray-700 hover:bg-gray-800/30">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedSubscribers.includes(subscriber.id)}
                      onChange={() => toggleSubscriberSelection(subscriber.id)}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        subscriber.is_vip || subscriber.recruit_is_vip ? 'bg-yellow-500/20' : 'bg-gray-700'
                      }`}>
                        {subscriber.is_vip || subscriber.recruit_is_vip ? (
                          <Crown className="w-4 h-4 text-yellow-400" />
                        ) : subscriber.recruit_id ? (
                          <UserPlus className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Mail className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">{subscriber.email}</div>
                        {(subscriber.first_name || subscriber.recruit_full_name) && (
                          <div className="text-gray-400 text-sm">
                            {subscriber.recruit_full_name || subscriber.first_name}
                            {subscriber.recruit_id && (
                              <span className="ml-2 text-purple-400 text-xs">
                                • Recruit #{subscriber.recruit_id}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${
                        subscriber.subscribed 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {subscriber.subscribed ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Unsubscribed
                          </>
                        )}
                      </span>
                      {(subscriber.is_vip || subscriber.recruit_is_vip) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 w-fit">
                          <Crown className="w-3 h-3" />
                          VIP
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className="text-gray-300 text-sm">{subscriber.source}</span>
                  </td>
                  
                  <td className="p-4">
                    {subscriber.recruit_id ? (
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-purple-400">
                          <UserPlus className="w-4 h-4" />
                          <span>Recruit #{subscriber.recruit_id}</span>
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          Status: {subscriber.recruit_status || 'Active'}
                        </div>
                        {subscriber.recruit_full_name && (
                          <div className="text-gray-500 text-xs">
                            {subscriber.recruit_full_name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">No recruit link</span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    {(() => {
                      const campaigns = getSubscriberCampaigns(subscriber.email);
                      return campaigns.length > 0 ? (
                        <div className="space-y-1">
                          {campaigns.slice(0, 2).map((campaign, idx) => (
                            <div key={idx} className="text-xs">
                              <div className="flex items-center gap-2">
                                <Send className="w-3 h-3 text-blue-400" />
                                <span className="text-blue-400 font-medium">
                                  {campaign.campaign_name.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="text-gray-500 ml-5">
                                {campaign.email_sequence_number}/{campaign.total_emails_to_send} 
                                {campaign.completed_at ? ' ✓' : ' 📧'}
                              </div>
                            </div>
                          ))}
                          {campaigns.length > 2 && (
                            <div className="text-xs text-gray-500 ml-5">
                              +{campaigns.length - 2} more...
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">No campaigns</span>
                      );
                    })()}
                  </td>
                  
                  <td className="p-4">
                    <div className="text-gray-300 text-sm">
                      <div>📧 {subscriber.total_emails_sent} sent</div>
                      <div>📖 {subscriber.total_emails_opened} opened</div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className="text-gray-400 text-sm">
                      {new Date(subscriber.subscribed_at).toLocaleDateString()}
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSubscribers.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>No subscribers found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-gray-500 text-sm">
        Gmail Admin Hub • Store-Only Access • Newsletter Management System
        <br />
        Subscribers are managed via Gmail SMTP integration
      </div>
    </div>
  );
}