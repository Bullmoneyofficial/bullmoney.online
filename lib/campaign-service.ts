// ============================================================================
// EMAIL CAMPAIGN SERVICE
// Core engine for managing automated email campaigns
// Supports: blast, drip, triggered, recurring campaigns
// Uses Supabase for storage, Render SMTP + Gmail for delivery
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email-service';
import { renderEmailTemplate, type EmailTemplateData } from '@/lib/email-template-renderer';
import {
  grandLaunchEmail,
  storePromoEmail,
  vipPromoEmail,
  affiliatePromoEmail,
  welcomeEmail,
  EmailTemplates,
} from '@/lib/email-templates';
import type {
  Campaign,
  CampaignCreateRequest,
  CampaignResult,
  CampaignStatus,
  CampaignAudience,
} from '@/lib/campaign-types';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================================================
// HELPERS
// ============================================================================
function getFirstName(email: string): string {
  const localPart = email.split('@')[0];
  return localPart.charAt(0).toUpperCase() + localPart.slice(1).replace(/[0-9_.-]/g, '');
}

// Get rendered email for a template name (hardcoded templates)
function getHardcodedTemplate(
  templateName: string,
  firstName: string,
  email: string
): { subject: string; html: string } | null {
  switch (templateName) {
    case 'welcome':
      return welcomeEmail(email);
    case 'grand_launch':
      return grandLaunchEmail(firstName, email);
    case 'store_promo':
      return storePromoEmail(firstName, email);
    case 'vip_promo':
      return vipPromoEmail(firstName, email);
    case 'affiliate_promo':
      return affiliatePromoEmail(firstName, email);
    default: {
      // Try dynamic lookup from EmailTemplates export
      const templateFn = (EmailTemplates as any)[templateName];
      if (typeof templateFn === 'function') {
        try {
          // Some templates take (firstName, email), others just (email)
          const result = templateFn.length >= 2 ? templateFn(firstName, email) : templateFn(email);
          return result;
        } catch { return null; }
      }
      return null;
    }
  }
}

// ============================================================================
// AUDIENCE FETCHING
// ============================================================================
async function getAudienceEmails(
  supabase: SupabaseClient,
  audience: CampaignAudience,
  filter?: Record<string, any>,
  limit: number = 5000
): Promise<string[]> {
  const emails: string[] = [];

  if (audience === 'recruits' || audience === 'all') {
    let query = supabase.from('recruits').select('email').limit(limit);
    if (filter?.is_vip !== undefined) query = query.eq('is_vip', filter.is_vip);
    const { data } = await query;
    if (data) emails.push(...data.map((r: any) => r.email).filter(Boolean));
  }

  if (audience === 'vip' || audience === 'all') {
    const { data } = await supabase
      .from('recruits')
      .select('email')
      .eq('is_vip', true)
      .limit(limit);
    if (data) emails.push(...data.map((r: any) => r.email).filter(Boolean));
  }

  if (audience === 'newsletter' || audience === 'all') {
    const { data } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('subscribed', true)
      .limit(limit);
    if (data) emails.push(...data.map((s: any) => s.email).filter(Boolean));
  }

  if (audience === 'custom' && filter?.emails) {
    emails.push(...filter.emails);
  }

  // Deduplicate + lowercase
  return Array.from(new Set(emails.map((e) => e.toLowerCase())));
}

// ============================================================================
// CAMPAIGN CRUD
// ============================================================================

/** Create a new campaign */
export async function createCampaign(req: CampaignCreateRequest): Promise<Campaign> {
  const supabase = getSupabase();

  const campaign: Campaign = {
    name: req.name,
    description: req.description,
    type: req.type,
    status: req.send_now ? 'sending' : (req.scheduled_at ? 'scheduled' : 'draft'),
    template_slug: req.template_slug,
    template_name: req.template_name,
    custom_subject: req.custom_subject,
    custom_html: req.custom_html,
    audience: req.audience,
    audience_filter: req.audience_filter,
    scheduled_at: req.scheduled_at,
    recurring_cron: req.recurring_cron,
    recurring_end_at: req.recurring_end_at,
    drip_sequence: req.drip_sequence,
    drip_interval_days: req.drip_interval_days,
    total_recipients: 0,
    total_sent: 0,
    total_failed: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert(campaign)
    .select()
    .single();

  if (error) {
    console.error('[Campaign] Create error:', error);
    throw new Error(`Failed to create campaign: ${error.message}`);
  }

  const created = data as Campaign;

  // If send_now, execute immediately
  if (req.send_now) {
    // Fire async — don't block the response
    executeCampaign(created.id!).catch((e) =>
      console.error('[Campaign] Immediate send error:', e)
    );
  }

  return created;
}

/** List campaigns with optional status filter */
export async function listCampaigns(status?: CampaignStatus): Promise<Campaign[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as Campaign[];
}

/** Get a single campaign by ID */
export async function getCampaign(id: string): Promise<Campaign | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Campaign;
}

/** Update campaign status */
export async function updateCampaignStatus(id: string, status: CampaignStatus): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('email_campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
}

/** Delete a campaign (only drafts) */
export async function deleteCampaign(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('email_campaigns')
    .delete()
    .eq('id', id)
    .in('status', ['draft', 'cancelled']);
  return !error;
}

// ============================================================================
// CAMPAIGN EXECUTION — The core send engine
// ============================================================================

/** Execute a campaign: resolve audience, render templates, send via Render SMTP + Gmail */
export async function executeCampaign(campaignId: string): Promise<CampaignResult> {
  const supabase = getSupabase();
  const campaign = await getCampaign(campaignId);

  if (!campaign) throw new Error('Campaign not found');
  if (campaign.status === 'sent' || campaign.status === 'cancelled') {
    throw new Error(`Campaign already ${campaign.status}`);
  }

  // Mark as sending
  await updateCampaignStatus(campaignId, 'sending');

  try {
    // 1. Get audience
    const emails = await getAudienceEmails(
      supabase,
      campaign.audience,
      campaign.audience_filter
    );

    if (emails.length === 0) {
      await supabase.from('email_campaigns').update({
        status: 'sent',
        total_recipients: 0,
        total_sent: 0,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', campaignId);

      return { campaign_id: campaignId, status: 'sent', total_recipients: 0, sent: 0, failed: 0 };
    }

    // 2. Resolve template
    let dbTemplate: EmailTemplateData | null = null;
    if (campaign.template_slug) {
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .eq('slug', campaign.template_slug)
        .eq('is_active', true)
        .single();
      if (data) dbTemplate = data as EmailTemplateData;
    }

    // 3. Send in batches
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    const batchSize = 10;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (email) => {
          try {
            let html: string;
            let subject: string;

            if (campaign.custom_html && campaign.custom_subject) {
              // Direct custom HTML
              const firstName = getFirstName(email);
              html = campaign.custom_html
                .replace(/{{email}}/g, email)
                .replace(/{{firstName}}/g, firstName);
              subject = campaign.custom_subject
                .replace(/{{email}}/g, email)
                .replace(/{{firstName}}/g, firstName);
            } else if (dbTemplate) {
              // Database template
              const rendered = renderEmailTemplate(dbTemplate, email);
              html = rendered.html;
              subject = rendered.subject;
            } else if (campaign.template_name) {
              // Hardcoded template
              const firstName = getFirstName(email);
              const rendered = getHardcodedTemplate(campaign.template_name, firstName, email);
              if (!rendered) throw new Error(`Template "${campaign.template_name}" not found`);
              html = rendered.html;
              subject = campaign.custom_subject || rendered.subject;
            } else {
              throw new Error('No template configured for this campaign');
            }

            const result = await sendEmail({ to: email, subject, html, attachments: true });
            if (result.success) {
              sent++;
            } else {
              failed++;
              errors.push(`${email}: ${result.error}`);
            }
          } catch (err) {
            failed++;
            errors.push(`${email}: ${err instanceof Error ? err.message : 'Unknown'}`);
          }
        })
      );

      // Batch delay to avoid rate limits
      if (i + batchSize < emails.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // 4. Update campaign stats
    const now = new Date().toISOString();
    await supabase.from('email_campaigns').update({
      status: 'sent',
      total_recipients: emails.length,
      total_sent: sent,
      total_failed: failed,
      sent_at: now,
      updated_at: now,
    }).eq('id', campaignId);

    // 5. Log to campaign_sends for history
    try {
      await supabase.from('campaign_sends').insert({
        campaign_id: campaignId,
        total_recipients: emails.length,
        sent,
        failed,
        errors: errors.slice(0, 20),
        sent_at: now,
      });
    } catch { /* Non-critical */ }

    console.log(`[Campaign] "${campaign.name}" complete: ${sent} sent, ${failed} failed`);

    return {
      campaign_id: campaignId,
      status: 'sent',
      total_recipients: emails.length,
      sent,
      failed,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    };
  } catch (err) {
    await updateCampaignStatus(campaignId, 'failed');
    throw err;
  }
}

// ============================================================================
// SCHEDULED CAMPAIGN PROCESSOR
// Called by Vercel cron to process scheduled & recurring campaigns
// ============================================================================

/** Process all campaigns that are due to send */
export async function processScheduledCampaigns(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  results: CampaignResult[];
}> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  // 1. Find scheduled campaigns that are due
  const { data: dueCampaigns, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(10);

  if (error) {
    console.error('[Campaign Cron] Fetch error:', error);
    throw new Error(error.message);
  }

  const campaigns = (dueCampaigns || []) as Campaign[];
  const results: CampaignResult[] = [];
  let totalSent = 0;
  let totalFailed = 0;

  for (const campaign of campaigns) {
    try {
      console.log(`[Campaign Cron] Executing: "${campaign.name}" (${campaign.id})`);
      const result = await executeCampaign(campaign.id!);
      results.push(result);
      totalSent += result.sent;
      totalFailed += result.failed;

      // If recurring, schedule next run
      if (campaign.type === 'recurring' && campaign.recurring_cron) {
        const nextRun = getNextCronDate(campaign.recurring_cron);
        
        // Check if recurring should end
        if (campaign.recurring_end_at && new Date(nextRun) > new Date(campaign.recurring_end_at)) {
          console.log(`[Campaign Cron] Recurring campaign "${campaign.name}" reached end date`);
          continue;
        }

        // Create next occurrence
        await supabase.from('email_campaigns').insert({
          ...campaign,
          id: undefined,
          status: 'scheduled',
          scheduled_at: nextRun,
          total_recipients: 0,
          total_sent: 0,
          total_failed: 0,
          sent_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        console.log(`[Campaign Cron] Next recurring run scheduled: ${nextRun}`);
      }
    } catch (err) {
      console.error(`[Campaign Cron] Failed: "${campaign.name}":`, err);
      results.push({
        campaign_id: campaign.id!,
        status: 'failed',
        total_recipients: 0,
        sent: 0,
        failed: 0,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
      });
    }
  }

  return {
    processed: campaigns.length,
    sent: totalSent,
    failed: totalFailed,
    results,
  };
}

// ============================================================================
// CRON EXPRESSION HELPER
// Simple next-run calculator for common cron patterns
// ============================================================================
function getNextCronDate(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length !== 5) return new Date(Date.now() + 7 * 86400000).toISOString(); // Default 7 days

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const now = new Date();
  const next = new Date(now);

  // Set time
  if (hour !== '*') next.setUTCHours(parseInt(hour), parseInt(minute) || 0, 0, 0);
  else next.setUTCMinutes(parseInt(minute) || 0, 0, 0);

  // Handle day of week
  if (dayOfWeek !== '*') {
    const targetDay = parseInt(dayOfWeek);
    let daysToAdd = targetDay - next.getUTCDay();
    if (daysToAdd <= 0) daysToAdd += 7;
    next.setUTCDate(next.getUTCDate() + daysToAdd);
  }
  // Handle day of month
  else if (dayOfMonth !== '*') {
    const targetDate = parseInt(dayOfMonth);
    next.setUTCDate(targetDate);
    if (next <= now) next.setUTCMonth(next.getUTCMonth() + 1);
  }
  // Default: next day
  else if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  // Ensure it's in the future
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next.toISOString();
}

// ============================================================================
// QUICK SEND — Send a one-off email to all or specific audience
// ============================================================================

/** Quick send without creating a full campaign record */
export async function quickSend(opts: {
  template_name: string;
  audience: CampaignAudience;
  subject?: string;
}): Promise<CampaignResult> {
  const campaign = await createCampaign({
    name: `Quick: ${opts.template_name} → ${opts.audience}`,
    type: 'blast',
    template_name: opts.template_name,
    custom_subject: opts.subject,
    audience: opts.audience,
    send_now: true,
  });

  // Return immediately — execution happens async
  return {
    campaign_id: campaign.id!,
    status: 'sending',
    total_recipients: 0,
    sent: 0,
    failed: 0,
  };
}

// ============================================================================
// DAILY SEO AFFILIATE CAMPAIGN - Auto seed once
// ============================================================================

export async function ensureDailySeoCampaign(): Promise<void> {
  const supabase = getSupabase();
  const campaignName = 'Daily SEO Affiliate (Short)';
  const variant = (process.env.DAILY_SEO_VARIANT || 'short').toLowerCase();
  const templateName = variant === 'long' ? 'dailySeoAffiliateLong' : 'dailySeoAffiliateShort';
  const name = variant === 'long' ? 'Daily SEO Affiliate (Long)' : campaignName;

  const { data: existing } = await supabase
    .from('email_campaigns')
    .select('id')
    .eq('name', name)
    .limit(1);

  if (existing && existing.length > 0) return;

  const now = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    9, 0, 0, 0
  ));
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  await supabase.from('email_campaigns').insert({
    name,
    description: 'Daily SEO affiliate update (auto-seeded)',
    type: 'recurring',
    status: 'scheduled',
    template_name: templateName,
    audience: 'all',
    recurring_cron: '0 9 * * *',
    scheduled_at: next.toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
