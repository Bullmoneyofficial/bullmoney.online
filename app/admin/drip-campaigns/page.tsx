'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface DripCampaign {
  id: string;
  email: string;
  source: 'recruits' | 'newsletter';
  recruit_id: number | null;
  newsletter_subscriber_id: string | null;
  campaign_name: string;
  email_sequence_number: number;
  total_emails_to_send: number;
  subscribed: boolean;
  started_at: string;
  last_email_sent_at: string | null;
  next_email_scheduled_at: string | null;
  completed_at: string | null;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  created_at: string;
}

interface CampaignTemplate {
  id: string;
  campaign_name: string;
  sequence_number: number;
  subject: string;
  delay_hours: number;
  conditions: string[];
  content_preview: string;
  active: boolean;
}

interface CampaignStats {
  total_subscribers: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_emails_sent: number;
  open_rate: number;
  click_rate: number;
}

export default function DripCampaignAdminPage() {
  const [campaigns, setCampaigns] = useState<DripCampaign[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    total_subscribers: 0,
    active_campaigns: 0,
    completed_campaigns: 0,
    total_emails_sent: 0,
    open_rate: 0,
    click_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'templates' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'recruits' | 'newsletter'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'unsubscribed'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<DripCampaign | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CampaignTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Campaign settings
  const [campaignSettings, setCampaignSettings] = useState({
    defaultDelayHours: 48,
    maxEmailsPerCampaign: 15,
    campaignDurationDays: 30,
    autoEnrollRecruits: true,
    autoEnrollNewsletter: true,
    sendOnWeekends: true,
    preferredSendHour: 10,
    timezone: 'America/New_York',
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * 15;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('email_drip_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      const typedCampaigns = (campaignsData || []) as DripCampaign[];
      setCampaigns(typedCampaigns);

      // Calculate stats
      const activeCampaigns = typedCampaigns.filter((c: DripCampaign) => c.subscribed && !c.completed_at);
      const completedCampaigns = typedCampaigns.filter((c: DripCampaign) => c.completed_at);
      const totalSent = typedCampaigns.reduce((sum: number, c: DripCampaign) => sum + (c.total_sent || 0), 0);
      const totalOpened = typedCampaigns.reduce((sum: number, c: DripCampaign) => sum + (c.total_opened || 0), 0);
      const totalClicked = typedCampaigns.reduce((sum: number, c: DripCampaign) => sum + (c.total_clicked || 0), 0);

      setStats({
        total_subscribers: typedCampaigns.length,
        active_campaigns: activeCampaigns.length,
        completed_campaigns: completedCampaigns.length,
        total_emails_sent: totalSent,
        open_rate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        click_rate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      });

      // Set default templates if none exist
      setTemplates([
        {
          id: '1',
          campaign_name: 'store_reminder_30day',
          sequence_number: 1,
          subject: 'Welcome to BullMoney! 🎯',
          delay_hours: 24,
          conditions: ['new_signup'],
          content_preview: 'Welcome email with store highlights',
          active: true,
        },
        {
          id: '2',
          campaign_name: 'store_reminder_30day',
          sequence_number: 2,
          subject: "Check out what's trending 📈",
          delay_hours: 48,
          conditions: ['after_email_1'],
          content_preview: 'Trending products showcase',
          active: true,
        },
        {
          id: '3',
          campaign_name: 'store_reminder_30day',
          sequence_number: 3,
          subject: 'Exclusive deals for you 💰',
          delay_hours: 48,
          conditions: ['after_email_2', 'no_purchase'],
          content_preview: 'Special discount offer',
          active: true,
        },
        {
          id: '4',
          campaign_name: 'store_reminder_30day',
          sequence_number: 4,
          subject: 'Trading tips from the pros 🎓',
          delay_hours: 48,
          conditions: ['after_email_3'],
          content_preview: 'Educational content preview',
          active: true,
        },
        {
          id: '5',
          campaign_name: 'store_reminder_30day',
          sequence_number: 5,
          subject: 'Last chance: Limited time offer ⏰',
          delay_hours: 48,
          conditions: ['after_email_4', 'no_purchase'],
          content_preview: 'Urgency-based promotion',
          active: true,
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

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = filterSource === 'all' || campaign.source === filterSource;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && campaign.subscribed && !campaign.completed_at) ||
      (filterStatus === 'completed' && campaign.completed_at) ||
      (filterStatus === 'unsubscribed' && !campaign.subscribed);
    return matchesSearch && matchesSource && matchesStatus;
  });

  const handleUpdateCampaign = async (campaignId: string, updates: Partial<DripCampaign>) => {
    try {
      const { error } = await supabase
        .from('email_drip_campaigns')
        .update(updates)
        .eq('id', campaignId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    await handleUpdateCampaign(campaignId, { subscribed: false });
  };

  const handleResumeCampaign = async (campaignId: string) => {
    await handleUpdateCampaign(campaignId, { subscribed: true });
  };

  const handleRescheduleEmail = async (campaignId: string, newDate: Date) => {
    await handleUpdateCampaign(campaignId, { next_email_scheduled_at: newDate.toISOString() });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (campaign: DripCampaign) => {
    if (!campaign.subscribed) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (campaign.completed_at) return 'text-green-400 bg-green-500/10 border-green-500/20';
    return 'text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/20';
  };

  const getStatusText = (campaign: DripCampaign) => {
    if (!campaign.subscribed) return 'Unsubscribed';
    if (campaign.completed_at) return 'Completed';
    return 'Active';
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-150 h-150 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-125 h-125 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(220,20,60,0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              className="relative w-16 h-16"
              style={{ perspective: '800px' }}
            >
              <motion.div
                animate={{
                  rotateY: mousePosition.x * 0.5,
                  rotateX: -mousePosition.y * 0.5,
                }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="w-full h-full rounded-xl overflow-hidden border border-[#FFD700]/30 bg-linear-to-br from-[#1a1a2e] to-[#0a0a0a] flex items-center justify-center"
                style={{
                  boxShadow: '0 0 30px rgba(255,215,0,0.2)',
                }}
              >
                <Image
                  src="/ONcc2l601.svg"
                  alt="BullMoney"
                  width={40}
                  height={40}
                />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-white via-[#FFD700] to-white bg-clip-text text-transparent">
                Drip Campaign Manager
              </h1>
              <p className="text-gray-400">Automated email sequences with timing & conditions</p>
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
          {['overview', 'campaigns', 'templates', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#FFD700] text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Content based on active tab */}
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Subscribers', value: stats.total_subscribers, icon: '👥' },
                  { label: 'Active Campaigns', value: stats.active_campaigns, icon: '🚀' },
                  { label: 'Completed', value: stats.completed_campaigns, icon: '✅' },
                  { label: 'Emails Sent', value: stats.total_emails_sent, icon: '📧' },
                  { label: 'Open Rate', value: `${stats.open_rate.toFixed(1)}%`, icon: '👀' },
                  { label: 'Click Rate', value: `${stats.click_rate.toFixed(1)}%`, icon: '🖱️' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                  >
                    <div className="text-2xl mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4 text-white">Recent Activity</h3>
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          campaign.subscribed && !campaign.completed_at ? 'bg-green-400' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium text-white">{campaign.email}</span>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                          {campaign.source}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Email {campaign.email_sequence_number}/{campaign.total_emails_to_send}
                      </div>
                    </div>
                  ))}
                </div>
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
              className="space-y-6"
            >
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-50">
                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]/50"
                  />
                </div>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value as typeof filterSource)}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]/50"
                >
                  <option value="all">All Sources</option>
                  <option value="recruits">Recruits</option>
                  <option value="newsletter">Newsletter</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]/50"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>

              {/* Campaigns Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Email</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Source</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Progress</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Next Email</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          Loading campaigns...
                        </td>
                      </tr>
                    ) : filteredCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No campaigns found
                        </td>
                      </tr>
                    ) : (
                      filteredCampaigns.map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <span className="font-medium text-white">{campaign.email}</span>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-2 py-1 rounded ${
                              campaign.source === 'recruits'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {campaign.source}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#FFD700] rounded-full"
                                  style={{
                                    width: `${(campaign.email_sequence_number / campaign.total_emails_to_send) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-400">
                                {campaign.email_sequence_number}/{campaign.total_emails_to_send}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-400">
                            {formatDate(campaign.next_email_scheduled_at)}
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(campaign)}`}>
                              {getStatusText(campaign)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedCampaign(campaign)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                title="View Details"
                              >
                                👁️
                              </button>
                              {campaign.subscribed && !campaign.completed_at ? (
                                <button
                                  onClick={() => handlePauseCampaign(campaign.id)}
                                  className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors text-yellow-400"
                                  title="Pause"
                                >
                                  ⏸️
                                </button>
                              ) : !campaign.completed_at ? (
                                <button
                                  onClick={() => handleResumeCampaign(campaign.id)}
                                  className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors text-green-400"
                                  title="Resume"
                                >
                                  ▶️
                                </button>
                              ) : null}
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
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Email Sequence Templates</h3>
                <button
                  onClick={() => {
                    setEditingTemplate({
                      id: '',
                      campaign_name: 'store_reminder_30day',
                      sequence_number: templates.length + 1,
                      subject: '',
                      delay_hours: 48,
                      conditions: [],
                      content_preview: '',
                      active: true,
                    });
                    setShowTemplateModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#FFD700] text-black font-medium hover:bg-[#FFA500] transition-colors"
                >
                  + Add Template
                </button>
              </div>

              <div className="space-y-4">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center text-[#FFD700] font-bold">
                          {template.sequence_number}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white mb-1">{template.subject}</h4>
                          <p className="text-sm text-gray-400 mb-3">{template.content_preview}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              ⏱️ {template.delay_hours}h delay
                            </span>
                            {template.conditions.map((condition) => (
                              <span
                                key={condition}
                                className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              >
                                📋 {condition.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTemplate(template);
                            setShowTemplateModal(true);
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setTemplates(templates.map(t =>
                              t.id === template.id ? { ...t, active: !t.active } : t
                            ));
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            template.active
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          {template.active ? '✓' : '○'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-6 text-white">Campaign Settings</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Timing Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-300 mb-4">⏱️ Timing Configuration</h4>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Default Delay Between Emails (hours)</label>
                      <input
                        type="number"
                        value={campaignSettings.defaultDelayHours}
                        onChange={(e) => setCampaignSettings({ ...campaignSettings, defaultDelayHours: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Max Emails Per Campaign</label>
                      <input
                        type="number"
                        value={campaignSettings.maxEmailsPerCampaign}
                        onChange={(e) => setCampaignSettings({ ...campaignSettings, maxEmailsPerCampaign: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Campaign Duration (days)</label>
                      <input
                        type="number"
                        value={campaignSettings.campaignDurationDays}
                        onChange={(e) => setCampaignSettings({ ...campaignSettings, campaignDurationDays: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Preferred Send Hour (24h)</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={campaignSettings.preferredSendHour}
                        onChange={(e) => setCampaignSettings({ ...campaignSettings, preferredSendHour: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]/50"
                      />
                    </div>
                  </div>

                  {/* Enrollment Settings */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-300 mb-4">📥 Auto-Enrollment</h4>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div>
                        <p className="font-medium text-white">Auto-enroll new recruits</p>
                        <p className="text-sm text-gray-400">Automatically add new recruits to campaigns</p>
                      </div>
                      <button
                        onClick={() => setCampaignSettings({ ...campaignSettings, autoEnrollRecruits: !campaignSettings.autoEnrollRecruits })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          campaignSettings.autoEnrollRecruits ? 'bg-[#FFD700]' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                          campaignSettings.autoEnrollRecruits ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div>
                        <p className="font-medium text-white">Auto-enroll newsletter subscribers</p>
                        <p className="text-sm text-gray-400">Automatically add newsletter subs to campaigns</p>
                      </div>
                      <button
                        onClick={() => setCampaignSettings({ ...campaignSettings, autoEnrollNewsletter: !campaignSettings.autoEnrollNewsletter })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          campaignSettings.autoEnrollNewsletter ? 'bg-[#FFD700]' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                          campaignSettings.autoEnrollNewsletter ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div>
                        <p className="font-medium text-white">Send on weekends</p>
                        <p className="text-sm text-gray-400">Allow emails to be sent on Sat/Sun</p>
                      </div>
                      <button
                        onClick={() => setCampaignSettings({ ...campaignSettings, sendOnWeekends: !campaignSettings.sendOnWeekends })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          campaignSettings.sendOnWeekends ? 'bg-[#FFD700]' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                          campaignSettings.sendOnWeekends ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Timezone</label>
                      <select
                        value={campaignSettings.timezone}
                        onChange={(e) => setCampaignSettings({ ...campaignSettings, timezone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]/50"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => alert('Settings saved!')}
                  className="mt-6 px-6 py-3 rounded-xl bg-[#FFD700] text-black font-medium hover:bg-[#FFA500] transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campaign Detail Modal */}
        <AnimatePresence>
          {selectedCampaign && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedCampaign(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1a1a2e] rounded-3xl p-6 max-w-lg w-full border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white">Campaign Details</h3>
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-gray-400 mb-1">Email</p>
                    <p className="font-medium text-white">{selectedCampaign.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-gray-400 mb-1">Source</p>
                      <p className="font-medium text-white capitalize">{selectedCampaign.source}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-gray-400 mb-1">Status</p>
                      <p className={`font-medium ${getStatusColor(selectedCampaign).split(' ')[0]}`}>
                        {getStatusText(selectedCampaign)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-gray-400 mb-2">Progress</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FFD700] rounded-full"
                          style={{
                            width: `${(selectedCampaign.email_sequence_number / selectedCampaign.total_emails_to_send) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-medium">
                        {selectedCampaign.email_sequence_number}/{selectedCampaign.total_emails_to_send}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 text-center">
                      <p className="text-2xl font-bold text-white">{selectedCampaign.total_sent}</p>
                      <p className="text-xs text-gray-400">Sent</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 text-center">
                      <p className="text-2xl font-bold text-green-400">{selectedCampaign.total_opened}</p>
                      <p className="text-xs text-gray-400">Opened</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 text-center">
                      <p className="text-2xl font-bold text-blue-400">{selectedCampaign.total_clicked}</p>
                      <p className="text-xs text-gray-400">Clicked</p>
                    </div>
                  </div>

                  {selectedCampaign.next_email_scheduled_at && !selectedCampaign.completed_at && (
                    <div className="p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-gray-400 mb-2">Reschedule Next Email</p>
                      <input
                        type="datetime-local"
                        defaultValue={selectedCampaign.next_email_scheduled_at.slice(0, 16)}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleRescheduleEmail(selectedCampaign.id, new Date(e.target.value));
                          }
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]/50"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    {selectedCampaign.subscribed && !selectedCampaign.completed_at ? (
                      <button
                        onClick={() => {
                          handlePauseCampaign(selectedCampaign.id);
                          setSelectedCampaign(null);
                        }}
                        className="flex-1 py-3 rounded-xl bg-yellow-500/20 text-yellow-400 font-medium hover:bg-yellow-500/30 transition-colors"
                      >
                        Pause Campaign
                      </button>
                    ) : !selectedCampaign.completed_at ? (
                      <button
                        onClick={() => {
                          handleResumeCampaign(selectedCampaign.id);
                          setSelectedCampaign(null);
                        }}
                        className="flex-1 py-3 rounded-xl bg-green-500/20 text-green-400 font-medium hover:bg-green-500/30 transition-colors"
                      >
                        Resume Campaign
                      </button>
                    ) : null}
                    <button
                      onClick={() => setSelectedCampaign(null)}
                      className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                    >
                      Close
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
                className="bg-[#1a1a2e] rounded-3xl p-6 max-w-lg w-full border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white">
                    {editingTemplate.id ? 'Edit Template' : 'New Template'}
                  </h3>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email Subject</label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      placeholder="Enter email subject..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Sequence #</label>
                      <input
                        type="number"
                        value={editingTemplate.sequence_number}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, sequence_number: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Delay (hours)</label>
                      <input
                        type="number"
                        value={editingTemplate.delay_hours}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, delay_hours: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FFD700]/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Content Preview</label>
                    <textarea
                      value={editingTemplate.content_preview}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, content_preview: e.target.value })}
                      placeholder="Brief description of email content..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Conditions (comma-separated)</label>
                    <input
                      type="text"
                      value={editingTemplate.conditions.join(', ')}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        conditions: e.target.value.split(',').map(c => c.trim()).filter(Boolean),
                      })}
                      placeholder="e.g., after_email_1, no_purchase"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]/50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available: new_signup, after_email_N, no_purchase, has_purchase, vip_member
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        if (editingTemplate.id) {
                          setTemplates(templates.map(t =>
                            t.id === editingTemplate.id ? editingTemplate : t
                          ));
                        } else {
                          setTemplates([...templates, { ...editingTemplate, id: Date.now().toString() }]);
                        }
                        setShowTemplateModal(false);
                      }}
                      className="flex-1 py-3 rounded-xl bg-[#FFD700] text-black font-medium hover:bg-[#FFA500] transition-colors"
                    >
                      Save Template
                    </button>
                    <button
                      onClick={() => setShowTemplateModal(false)}
                      className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
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
