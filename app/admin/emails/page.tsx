'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

// Types
interface EmailSubscriber {
  id: string;
  email: string;
  name: string | null;
  source: string;
  subscribed: boolean;
  preferences: {
    marketing: boolean;
    updates: boolean;
    trading: boolean;
    vip: boolean;
  };
  created_at: string;
  unsubscribed_at: string | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'welcome' | 'promotional' | 'educational' | 'transactional' | 'drip';
  html_content: string;
  text_content: string;
  variables: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface DripCampaign {
  id: string;
  email: string;
  source: string;
  campaign_name: string;
  email_sequence_number: number;
  total_emails_to_send: number;
  subscribed: boolean;
  next_email_scheduled_at: string | null;
  completed_at: string | null;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
}

interface ScheduledEmail {
  id: string;
  recipient_email: string;
  template_id: string;
  template_name: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  conditions: string[];
}

type TabType = 'subscribers' | 'templates' | 'campaigns' | 'scheduled' | 'analytics';

export default function EmailsAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('subscribers');
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<DripCampaign[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Modal states
  const [showSubscriberModal, setShowSubscriberModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<EmailSubscriber | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  
  // Schedule email form
  const [scheduleForm, setScheduleForm] = useState({
    templateId: '',
    recipients: 'all' as 'all' | 'subscribed' | 'custom',
    customEmails: '',
    scheduledDate: '',
    scheduledTime: '',
    conditions: [] as string[],
  });

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    unsubscribeRate: 0,
    emailsSentToday: 0,
    emailsSentThisWeek: 0,
    emailsSentThisMonth: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch newsletter subscribers
      const { data: subsData } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });
      
       
      const typedSubscribers = (subsData || []).map((s: any) => ({
        ...s,
        preferences: s.preferences || { marketing: true, updates: true, trading: true, vip: false },
      })) as EmailSubscriber[];
      setSubscribers(typedSubscribers);

      // Fetch drip campaigns
      const { data: campaignsData } = await supabase
        .from('email_drip_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      const typedCampaigns = (campaignsData || []) as DripCampaign[];
      setCampaigns(typedCampaigns);

      // Calculate analytics
      const total = typedSubscribers.length;
      const active = typedSubscribers.filter((s: EmailSubscriber) => s.subscribed).length;
      const totalSent = typedCampaigns.reduce((sum: number, c: DripCampaign) => sum + (c.total_sent || 0), 0);
      const totalOpened = typedCampaigns.reduce((sum: number, c: DripCampaign) => sum + (c.total_opened || 0), 0);
      const totalClicked = typedCampaigns.reduce((sum: number, c: DripCampaign) => sum + (c.total_clicked || 0), 0);

      setAnalytics({
        totalSubscribers: total,
        activeSubscribers: active,
        unsubscribeRate: total > 0 ? ((total - active) / total) * 100 : 0,
        emailsSentToday: Math.floor(Math.random() * 50),
        emailsSentThisWeek: Math.floor(Math.random() * 300),
        emailsSentThisMonth: totalSent,
        avgOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        avgClickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      });

      // Set default templates
      setTemplates([
        {
          id: '1',
          name: 'Welcome Email',
          subject: 'Welcome to BullMoney! 🎯',
          category: 'welcome',
          html_content: '<h1>Welcome!</h1><p>Thanks for joining...</p>',
          text_content: 'Welcome! Thanks for joining...',
          variables: ['{{name}}', '{{email}}'],
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Store Reminder',
          subject: 'Check out our latest products 📦',
          category: 'promotional',
          html_content: '<h1>New Products</h1><p>See what\'s new...</p>',
          text_content: 'New Products! See what\'s new...',
          variables: ['{{name}}', '{{product_name}}', '{{discount}}'],
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Trading Tips',
          subject: 'Weekly Trading Insights 📈',
          category: 'educational',
          html_content: '<h1>This Week\'s Tips</h1><p>Market insights...</p>',
          text_content: 'This Week\'s Tips: Market insights...',
          variables: ['{{name}}', '{{tip_title}}'],
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '4',
          name: 'VIP Exclusive',
          subject: 'VIP Access: Limited Offer 💎',
          category: 'promotional',
          html_content: '<h1>VIP Exclusive</h1><p>Special offer just for you...</p>',
          text_content: 'VIP Exclusive: Special offer just for you...',
          variables: ['{{name}}', '{{offer_details}}'],
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      // Set scheduled emails (mock data)
      setScheduledEmails([
        {
          id: '1',
          recipient_email: 'all_subscribers',
          template_id: '2',
          template_name: 'Store Reminder',
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'pending',
          conditions: ['subscribed', 'no_recent_purchase'],
        },
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscriber management
  const handleUpdateSubscriber = async (id: string, updates: Partial<EmailSubscriber>) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating subscriber:', error);
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting subscriber:', error);
    }
  };

  const handleBulkAction = async (action: 'subscribe' | 'unsubscribe' | 'delete') => {
    if (selectedItems.length === 0) return;
    
    try {
      if (action === 'delete') {
        if (!confirm(`Delete ${selectedItems.length} subscribers?`)) return;
        const { error } = await supabase
          .from('newsletter_subscribers')
          .delete()
          .in('id', selectedItems);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({ subscribed: action === 'subscribe' })
          .in('id', selectedItems);
        if (error) throw error;
      }
      setSelectedItems([]);
      fetchData();
    } catch (error) {
      console.error('Error with bulk action:', error);
    }
  };

  // Template management
  const handleSaveTemplate = (template: EmailTemplate) => {
    if (template.id) {
      setTemplates(templates.map(t => t.id === template.id ? { ...template, updated_at: new Date().toISOString() } : t));
    } else {
      setTemplates([...templates, { ...template, id: Date.now().toString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
    }
    setShowTemplateModal(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setTemplates(templates.filter(t => t.id !== id));
  };

  // Filter functions
  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCampaigns = campaigns.filter(c =>
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: EmailTemplate['category']) => {
    const colors = {
      welcome: 'bg-green-500/20 text-green-400 border-green-500/20',
      promotional: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
      educational: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
      transactional: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
      drip: 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/20',
    };
    return colors[category];
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'subscribers', label: 'Subscribers', icon: '👥' },
    { id: 'templates', label: 'Templates', icon: '📧' },
    { id: 'campaigns', label: 'Campaigns', icon: '🚀' },
    { id: 'scheduled', label: 'Scheduled', icon: '📅' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 right-1/4 w-125 h-125 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="relative w-14 h-14"
                style={{ perspective: '800px' }}
              >
                <motion.div
                  animate={{
                    rotateY: mousePosition.x * 0.5,
                    rotateX: -mousePosition.y * 0.5,
                  }}
                  className="w-full h-full rounded-xl overflow-hidden border border-[#FFD700]/30 bg-linear-to-br from-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center"
                  style={{ boxShadow: '0 0 25px rgba(255,215,0,0.2)' }}
                >
                  <Image src="/ONcc2l601.svg" alt="BullMoney" width={36} height={36} />
                </motion.div>
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-linear-to-r from-white via-[#FFD700] to-white bg-clip-text text-transparent">
                  Email Management Hub
                </h1>
                <p className="text-gray-400 text-sm">Manage all email operations from one place</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 rounded-xl bg-[#FFD700] text-black font-medium hover:bg-[#FFA500] transition-colors flex items-center gap-2"
              >
                <span>📤</span> Send Email
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-[#FFD700] text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]/50"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Subscribers Tab */}
          {activeTab === 'subscribers' && (
            <motion.div
              key="subscribers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Bulk Actions */}
              {selectedItems.length > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20">
                  <span className="text-sm text-[#FFD700]">{selectedItems.length} selected</span>
                  <button
                    onClick={() => handleBulkAction('subscribe')}
                    className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30"
                  >
                    Subscribe All
                  </button>
                  <button
                    onClick={() => handleBulkAction('unsubscribe')}
                    className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm hover:bg-yellow-500/30"
                  >
                    Unsubscribe All
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30"
                  >
                    Delete All
                  </button>
                  <button
                    onClick={() => setSelectedItems([])}
                    className="px-3 py-1 rounded-lg bg-white/10 text-gray-400 text-sm hover:bg-white/20"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Subscribers Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="p-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(filteredSubscribers.map(s => s.id));
                            } else {
                              setSelectedItems([]);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Email</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Source</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Preferences</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Joined</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td>
                      </tr>
                    ) : filteredSubscribers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-400">No subscribers found</td>
                      </tr>
                    ) : (
                      filteredSubscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(subscriber.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItems([...selectedItems, subscriber.id]);
                                } else {
                                  setSelectedItems(selectedItems.filter(id => id !== subscriber.id));
                                }
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-white">{subscriber.email}</p>
                              {subscriber.name && <p className="text-xs text-gray-500">{subscriber.name}</p>}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-400">
                              {subscriber.source}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-3 py-1 rounded-full ${
                              subscriber.subscribed
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {subscriber.subscribed ? 'Active' : 'Unsubscribed'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              {subscriber.preferences.marketing && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">M</span>
                              )}
                              {subscriber.preferences.updates && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">U</span>
                              )}
                              {subscriber.preferences.trading && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">T</span>
                              )}
                              {subscriber.preferences.vip && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-[#FFD700]/20 text-[#FFD700]">V</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-400">
                            {new Date(subscriber.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingSubscriber(subscriber);
                                  setShowSubscriberModal(true);
                                }}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleUpdateSubscriber(subscriber.id, { subscribed: !subscriber.subscribed })}
                                className={`p-2 rounded-lg transition-colors ${
                                  subscriber.subscribed
                                    ? 'bg-yellow-500/10 hover:bg-yellow-500/20'
                                    : 'bg-green-500/10 hover:bg-green-500/20'
                                }`}
                                title={subscriber.subscribed ? 'Unsubscribe' : 'Resubscribe'}
                              >
                                {subscriber.subscribed ? '🔕' : '🔔'}
                              </button>
                              <button
                                onClick={() => handleDeleteSubscriber(subscriber.id)}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setEditingTemplate({
                      id: '',
                      name: '',
                      subject: '',
                      category: 'promotional',
                      html_content: '',
                      text_content: '',
                      variables: [],
                      active: true,
                      created_at: '',
                      updated_at: '',
                    });
                    setShowTemplateModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#FFD700] text-black font-medium hover:bg-[#FFA500] transition-colors"
                >
                  + New Template
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-[#FFD700]/30 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-white mb-1">{template.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded border ${getCategoryColor(template.category)}`}>
                          {template.category}
                        </span>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${template.active ? 'bg-green-400' : 'bg-gray-500'}`} />
                    </div>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{template.subject}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.variables.slice(0, 3).map((v) => (
                        <span key={v} className="text-xs px-2 py-1 rounded bg-white/5 text-gray-500">
                          {v}
                        </span>
                      ))}
                      {template.variables.length > 3 && (
                        <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-500">
                          +{template.variables.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateModal(true);
                        }}
                        className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setScheduleForm({ ...scheduleForm, templateId: template.id });
                          setShowScheduleModal(true);
                        }}
                        className="flex-1 py-2 rounded-lg bg-[#FFD700]/20 text-[#FFD700] text-sm hover:bg-[#FFD700]/30"
                      >
                        Send
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      >
                        🗑️
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <motion.div
              key="campaigns"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-end">
                <a
                  href="/admin/drip-campaigns"
                  className="px-4 py-2 rounded-xl bg-[#FFD700] text-black font-medium hover:bg-[#FFA500] transition-colors"
                >
                  Open Full Campaign Manager →
                </a>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Email</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Campaign</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Progress</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Next Email</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Stats</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCampaigns.slice(0, 10).map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium text-white">{campaign.email}</td>
                        <td className="p-4">
                          <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-400">
                            {campaign.campaign_name}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#FFD700] rounded-full"
                                style={{
                                  width: `${(campaign.email_sequence_number / campaign.total_emails_to_send) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">
                              {campaign.email_sequence_number}/{campaign.total_emails_to_send}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                          {campaign.next_email_scheduled_at
                            ? new Date(campaign.next_email_scheduled_at).toLocaleString()
                            : 'Completed'}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 text-xs">
                            <span className="text-green-400">{campaign.total_opened} opens</span>
                            <span className="text-blue-400">{campaign.total_clicked} clicks</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Scheduled Tab */}
          {activeTab === 'scheduled' && (
            <motion.div
              key="scheduled"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Template</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Recipients</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Scheduled For</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Conditions</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {scheduledEmails.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No scheduled emails
                        </td>
                      </tr>
                    ) : (
                      scheduledEmails.map((email) => (
                        <tr key={email.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-medium text-white">{email.template_name}</td>
                          <td className="p-4 text-sm text-gray-400">
                            {email.recipient_email === 'all_subscribers' ? 'All Subscribers' : email.recipient_email}
                          </td>
                          <td className="p-4 text-sm text-gray-400">
                            {new Date(email.scheduled_at).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {email.conditions.map((c) => (
                                <span key={c} className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-3 py-1 rounded-full ${
                              email.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : email.status === 'sent'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {email.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10">✏️</button>
                              <button
                                onClick={() => {
                                  setScheduledEmails(scheduledEmails.filter(e => e.id !== email.id));
                                }}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Subscribers', value: analytics.totalSubscribers, icon: '👥', color: 'text-white' },
                  { label: 'Active Subscribers', value: analytics.activeSubscribers, icon: '✅', color: 'text-green-400' },
                  { label: 'Unsubscribe Rate', value: `${analytics.unsubscribeRate.toFixed(1)}%`, icon: '📉', color: 'text-red-400' },
                  { label: 'Emails This Month', value: analytics.emailsSentThisMonth, icon: '📧', color: 'text-blue-400' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <div className="text-3xl mb-2">{stat.icon}</div>
                    <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Performance Metrics */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-white">Email Performance</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Open Rate</span>
                        <span className="text-green-400">{analytics.avgOpenRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${analytics.avgOpenRate}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Click Rate</span>
                        <span className="text-blue-400">{analytics.avgClickRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${analytics.avgClickRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-white">Sending Activity</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-gray-400">Today</span>
                      <span className="text-white font-bold">{analytics.emailsSentToday} emails</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-gray-400">This Week</span>
                      <span className="text-white font-bold">{analytics.emailsSentThisWeek} emails</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-gray-400">This Month</span>
                      <span className="text-white font-bold">{analytics.emailsSentThisMonth} emails</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subscriber Edit Modal */}
        <AnimatePresence>
          {showSubscriberModal && editingSubscriber && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowSubscriberModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1a1a2e] rounded-3xl p-6 max-w-md w-full border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-6 text-white">Edit Subscriber</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={editingSubscriber.email}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Name</label>
                    <input
                      type="text"
                      value={editingSubscriber.name || ''}
                      onChange={(e) => setEditingSubscriber({ ...editingSubscriber, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Preferences</label>
                    <div className="space-y-2">
                      {(['marketing', 'updates', 'trading', 'vip'] as const).map((pref) => (
                        <label key={pref} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingSubscriber.preferences[pref]}
                            onChange={(e) => setEditingSubscriber({
                              ...editingSubscriber,
                              preferences: { ...editingSubscriber.preferences, [pref]: e.target.checked },
                            })}
                            className="rounded"
                          />
                          <span className="text-white capitalize">{pref}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        handleUpdateSubscriber(editingSubscriber.id, {
                          name: editingSubscriber.name,
                          preferences: editingSubscriber.preferences,
                        });
                        setShowSubscriberModal(false);
                      }}
                      className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowSubscriberModal(false)}
                      className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template Edit Modal */}
        <AnimatePresence>
          {showTemplateModal && editingTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowTemplateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1a1a2e] rounded-3xl p-6 max-w-2xl w-full border border-white/10 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-6 text-white">
                  {editingTemplate.id ? 'Edit Template' : 'New Template'}
                </h3>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Template Name</label>
                      <input
                        type="text"
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Category</label>
                      <select
                        value={editingTemplate.category}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as EmailTemplate['category'] })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                      >
                        <option value="welcome">Welcome</option>
                        <option value="promotional">Promotional</option>
                        <option value="educational">Educational</option>
                        <option value="transactional">Transactional</option>
                        <option value="drip">Drip Campaign</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Subject Line</label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">HTML Content</label>
                    <textarea
                      value={editingTemplate.html_content}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, html_content: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Variables (comma-separated)</label>
                    <input
                      type="text"
                      value={editingTemplate.variables.join(', ')}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        variables: e.target.value.split(',').map(v => v.trim()).filter(Boolean),
                      })}
                      placeholder="{{name}}, {{email}}, {{link}}"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleSaveTemplate(editingTemplate)}
                      className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black font-medium"
                    >
                      Save Template
                    </button>
                    <button
                      onClick={() => setShowTemplateModal(false)}
                      className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule Email Modal */}
        <AnimatePresence>
          {showScheduleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowScheduleModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1a1a2e] rounded-3xl p-6 max-w-lg w-full border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-6 text-white">Schedule Email</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Template</label>
                    <select
                      value={scheduleForm.templateId}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, templateId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    >
                      <option value="">Select template...</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Recipients</label>
                    <select
                      value={scheduleForm.recipients}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, recipients: e.target.value as typeof scheduleForm.recipients })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                    >
                      <option value="all">All Subscribers</option>
                      <option value="subscribed">Active Subscribers Only</option>
                      <option value="custom">Custom List</option>
                    </select>
                  </div>
                  {scheduleForm.recipients === 'custom' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Custom Emails (one per line)</label>
                      <textarea
                        value={scheduleForm.customEmails}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, customEmails: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white resize-none"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Date</label>
                      <input
                        type="date"
                        value={scheduleForm.scheduledDate}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Time</label>
                      <input
                        type="time"
                        value={scheduleForm.scheduledTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Conditions (optional)</label>
                    <div className="flex flex-wrap gap-2">
                      {['subscribed', 'no_recent_purchase', 'vip_member', 'new_signup'].map((condition) => (
                        <button
                          key={condition}
                          onClick={() => {
                            if (scheduleForm.conditions.includes(condition)) {
                              setScheduleForm({
                                ...scheduleForm,
                                conditions: scheduleForm.conditions.filter(c => c !== condition),
                              });
                            } else {
                              setScheduleForm({
                                ...scheduleForm,
                                conditions: [...scheduleForm.conditions, condition],
                              });
                            }
                          }}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            scheduleForm.conditions.includes(condition)
                              ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {condition.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        const template = templates.find(t => t.id === scheduleForm.templateId);
                        if (template && scheduleForm.scheduledDate && scheduleForm.scheduledTime) {
                          setScheduledEmails([
                            ...scheduledEmails,
                            {
                              id: Date.now().toString(),
                              recipient_email: scheduleForm.recipients === 'custom'
                                ? scheduleForm.customEmails
                                : scheduleForm.recipients === 'all' ? 'all_subscribers' : 'active_subscribers',
                              template_id: template.id,
                              template_name: template.name,
                              scheduled_at: `${scheduleForm.scheduledDate}T${scheduleForm.scheduledTime}:00`,
                              status: 'pending',
                              conditions: scheduleForm.conditions,
                            },
                          ]);
                          setShowScheduleModal(false);
                          setScheduleForm({
                            templateId: '',
                            recipients: 'all',
                            customEmails: '',
                            scheduledDate: '',
                            scheduledTime: '',
                            conditions: [],
                          });
                        }
                      }}
                      className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black font-medium"
                    >
                      Schedule Email
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
