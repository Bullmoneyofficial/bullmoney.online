// ============================================================================
// EMAIL CAMPAIGN TYPES
// Type definitions for the automated email campaign system
// ============================================================================

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled' | 'failed';
export type CampaignAudience = 'all' | 'recruits' | 'vip' | 'newsletter' | 'custom';
export type CampaignType = 'blast' | 'drip' | 'triggered' | 'recurring';

export interface Campaign {
  id?: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  
  // Template
  template_slug?: string;            // Database template slug
  template_name?: string;            // Hardcoded template name from email-templates.ts
  custom_subject?: string;           // Override subject
  custom_html?: string;              // Full custom HTML
  
  // Audience
  audience: CampaignAudience;
  audience_filter?: Record<string, any>; // Custom filter criteria
  
  // Scheduling
  scheduled_at?: string;             // ISO date for when to send
  recurring_cron?: string;           // Cron expression for recurring (e.g., "0 9 * * 1" = every Monday 9am)
  recurring_end_at?: string;         // When to stop recurring
  timezone?: string;                 // Default UTC
  
  // Drip config
  drip_sequence?: DripStep[];        // Sequence of emails
  drip_interval_days?: number;       // Default days between emails
  
  // Stats
  total_recipients?: number;
  total_sent?: number;
  total_failed?: number;
  total_opened?: number;
  total_clicked?: number;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  sent_at?: string;
  created_by?: string;
}

export interface DripStep {
  sequence: number;
  template_slug?: string;
  template_name?: string;
  subject?: string;
  delay_days: number;                // Days after previous email
  sent?: boolean;
}

export interface CampaignRecipient {
  email: string;
  first_name?: string;
  source: 'recruits' | 'newsletter' | 'vip' | 'custom';
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'unsubscribed';
  sent_at?: string;
  error?: string;
}

export interface CampaignCreateRequest {
  name: string;
  description?: string;
  type: CampaignType;
  template_slug?: string;
  template_name?: string;
  custom_subject?: string;
  custom_html?: string;
  audience: CampaignAudience;
  audience_filter?: Record<string, any>;
  scheduled_at?: string;
  recurring_cron?: string;
  recurring_end_at?: string;
  drip_sequence?: DripStep[];
  drip_interval_days?: number;
  send_now?: boolean;
}

export interface CampaignResult {
  campaign_id: string;
  status: CampaignStatus;
  total_recipients: number;
  sent: number;
  failed: number;
  errors?: string[];
}

// Pre-built campaign templates (quick-start presets)
export const CAMPAIGN_PRESETS: Record<string, Partial<CampaignCreateRequest>> = {
  welcome_series: {
    name: 'Welcome Series',
    description: 'Automated 5-email welcome series for new sign-ups',
    type: 'drip',
    audience: 'recruits',
    drip_interval_days: 2,
    drip_sequence: [
      { sequence: 0, template_name: 'welcome', delay_days: 0 },
      { sequence: 1, template_name: 'grand_launch', delay_days: 2 },
      { sequence: 2, template_name: 'store_promo', delay_days: 2 },
      { sequence: 3, template_name: 'vip_promo', delay_days: 3 },
      { sequence: 4, template_name: 'affiliate_promo', delay_days: 3 },
    ],
  },
  store_blast: {
    name: 'Store Promotion',
    description: 'One-time store promo to all subscribers',
    type: 'blast',
    template_name: 'store_promo',
    audience: 'all',
  },
  vip_upgrade: {
    name: 'VIP Upgrade Push',
    description: 'Promote VIP membership to non-VIP users',
    type: 'blast',
    template_name: 'vip_promo',
    audience: 'recruits',
  },
  affiliate_recruitment: {
    name: 'Affiliate Recruitment',
    description: 'Recruit affiliates from existing user base',
    type: 'blast',
    template_name: 'affiliate_promo',
    audience: 'all',
  },
  weekly_digest: {
    name: 'Weekly Market Digest',
    description: 'Weekly trading digest every Monday at 9am',
    type: 'recurring',
    template_name: 'weekly_digest',
    audience: 'all',
    recurring_cron: '0 9 * * 1', // Monday 9am UTC
  },
  flash_sale: {
    name: 'Flash Sale Alert',
    description: 'Time-sensitive sale notification',
    type: 'blast',
    template_name: 'flash_sale',
    audience: 'all',
  },
  daily_seo_affiliate_short: {
    name: 'Daily SEO Affiliate (Short)',
    description: 'Daily short update focused on affiliate dashboard + site highlights',
    type: 'recurring',
    template_name: 'dailySeoAffiliateShort',
    audience: 'all',
    recurring_cron: '0 9 * * *',
  },
  daily_seo_affiliate_long: {
    name: 'Daily SEO Affiliate (Long)',
    description: 'Daily long update focused on affiliate dashboard + site highlights',
    type: 'recurring',
    template_name: 'dailySeoAffiliateLong',
    audience: 'all',
    recurring_cron: '0 9 * * *',
  },
};
