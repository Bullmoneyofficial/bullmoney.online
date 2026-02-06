import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmailWithAttachment, sendEmail } from '@/lib/email-service';
import { renderEmailTemplate, type EmailTemplateData } from '@/lib/email-template-renderer';
import path from 'path';
import fs from 'fs';

// ============================================================================
// GMAIL ADMIN HUB NEWSLETTER SUBSCRIBE API
// Enhanced with Recruits + Email Drip Campaigns + Email Templates integration
// Cross-references with recruits table and auto-enrolls in drip campaigns
// Uses dynamic email templates from database for personalized experiences
// Only accessible from store page for admin management
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Available PDF attachments for newsletter subscribers
const NEWSLETTER_ATTACHMENTS = [
  {
    filename: 'TRADING_BLUEPRINT_2026.pdf',
    path: 'store/TRADING_BLUEPRINT_2026.pdf',
    name: 'Trading Blueprint 2026 - Gmail Exclusive',
  },
  {
    filename: 'MARKET_PSYCHOLOGY_GUIDE.pdf', 
    path: 'store/MARKET_PSYCHOLOGY_GUIDE.pdf',
    name: 'Market Psychology Mastery Guide',
  }
];

// Pick a random attachment for Gmail subscribers
function getRandomNewsletterAttachment() {
  const randomIndex = Math.floor(Math.random() * NEWSLETTER_ATTACHMENTS.length);
  return NEWSLETTER_ATTACHMENTS[randomIndex];
}

// Cross-reference with recruits table to enhance subscriber data
 
async function findOrCreateRecruitIntegration(email: string, supabase: any) {
  try {
    // Check if email exists in recruits table
    const { data: recruit, error: recruitError } = await supabase
      .from('recruits')
      .select('id, full_name, is_vip, created_at, status, store_newsletter_subscribed, phone, country')
      .eq('email', email)
      .single();
    
    if (!recruitError && recruit) {
      console.log(`[Recruit Integration] Found existing recruit: ${email} (ID: ${recruit.id})`);
      
      // Update recruit to mark newsletter subscription
      await supabase
        .from('recruits')
        .update({ 
          store_newsletter_subscribed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', recruit.id);

      return {
        isExistingRecruit: true,
        recruitId: recruit.id,
        fullName: recruit.full_name,
        isVip: recruit.is_vip,
        status: recruit.status,
        phone: recruit.phone,
        country: recruit.country,
        recruitedAt: recruit.created_at
      };
    }
  } catch (err) {
    console.warn(`[Recruit Integration] Error checking recruit: ${err}`);
  }

  return {
    isExistingRecruit: false,
    recruitId: null,
    fullName: null,
    isVip: false,
    status: null,
    phone: null,
    country: null,
    recruitedAt: null
  };
}

// Auto-enroll subscriber in email drip campaigns
 
async function enrollInDripCampaigns(subscriberId: string, email: string, recruitId: string | null, supabase: any) {
  try {
    const campaignsToEnroll = [
      {
        name: 'newsletter_welcome_sequence',
        totalEmails: 7,
        description: 'Welcome email sequence for newsletter subscribers'
      },
      {
        name: 'store_reminder_30day', 
        totalEmails: 15,
        description: 'Monthly store promotional sequence'
      }
    ];

    for (const campaign of campaignsToEnroll) {
      // Check if already enrolled in this campaign
      const { data: existing } = await supabase
        .from('email_drip_campaigns')
        .select('id')
        .eq('email', email)
        .eq('campaign_name', campaign.name)
        .single();

      if (!existing) {
        const { error: campaignError } = await supabase
          .from('email_drip_campaigns')
          .insert({
            email,
            source: recruitId ? 'recruits' : 'newsletter',
            recruit_id: recruitId,
            newsletter_subscriber_id: subscriberId,
            campaign_name: campaign.name,
            email_sequence_number: 0,
            total_emails_to_send: campaign.totalEmails,
            subscribed: true,
            started_at: new Date().toISOString(),
            next_email_scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
            total_sent: 0,
            total_opened: 0,
            total_clicked: 0
          });

        if (campaignError) {
          console.error(`[Drip Campaign] Failed to enroll in ${campaign.name}:`, campaignError);
        } else {
          console.log(`[Drip Campaign] Enrolled ${email} in ${campaign.name}`);
        }
      } else {
        console.log(`[Drip Campaign] Already enrolled in ${campaign.name}: ${email}`);
      }
    }
  } catch (err) {
    console.error('[Drip Campaign] Enrollment error:', err);
  }
}

// Enhanced email template selection with recruit personalization
 
async function getPersonalizedEmailContent(email: string, recruitData: any, supabase: any): Promise<{ subject: string; html: string }> {
  const templateSlug = recruitData.isExistingRecruit ? 'newsletter_welcome_recruit' : 'newsletter_welcome_gmail';
  
  try {
    // Try to get personalized template from database
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('slug', templateSlug)
      .eq('is_active', true)
      .single();
    
    if (!error && template) {
      console.log(`[Email Template] Using database template: ${templateSlug}`);
      
      // Enhance template data with recruit information
      const enhancedTemplate = {
        ...template,
        variables: {
          ...template.variables,
          email,
          firstName: recruitData.fullName?.split(' ')[0] || email.split('@')[0],
          fullName: recruitData.fullName || '',
          isVip: recruitData.isVip || false,
          isExistingRecruit: recruitData.isExistingRecruit,
          recruitStatus: recruitData.status,
          country: recruitData.country,
          recruitedAt: recruitData.recruitedAt
        }
      };
      
      const rendered = renderEmailTemplate(enhancedTemplate as EmailTemplateData, email);
      return rendered;
    }
  } catch (err) {
    console.warn(`[Email Template] Database template fetch error for ${templateSlug}, using fallback:`, err);
  }

  // Enhanced fallback templates based on recruit status
  const firstName = recruitData.fullName?.split(' ')[0] || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  
  if (recruitData.isExistingRecruit) {
    return {
      subject: `${firstName}, your newsletter + recruit benefits activated! 🎯`,
      html: generateRecruitWelcomeHTML(firstName, recruitData)
    };
  }
  
  return {
    subject: `${firstName}, you're in! Daily market intel starts now 📈`,
    html: generateStandardWelcomeHTML(firstName)
  };
}

// Generate welcome HTML for existing recruits with enhanced benefits
function generateRecruitWelcomeHTML(firstName: string, recruitData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recruit + Newsletter Benefits Activated</title>
    </head>
    <body style="margin: 0; padding: 0; background: #0a0a0a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00D4AA, #3B82F6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="color: #ffffff; font-weight: bold; font-size: 24px;">★</span>
          </div>
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Welcome Back, ${firstName}! ${recruitData.isVip ? '👑' : '🎯'}</h1>
          <p style="margin: 16px 0 0 0; color: #00D4AA; font-size: 16px; font-weight: 600;">Recruit + Newsletter Benefits Now Active</p>
        </div>

        <!-- Recruit Status -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #00D4AA;">
          <h3 style="margin: 0 0 12px 0; color: #00D4AA;">Your Recruit Status</h3>
          <p style="margin: 0; color: #ffffff;">Status: <strong>${recruitData.status}</strong> ${recruitData.isVip ? '| VIP Member 👑' : ''}</p>
          ${recruitData.country ? `<p style="margin: 8px 0 0 0; color: #888888;">Location: ${recruitData.country}</p>` : ''}
        </div>

        <!-- Combined Benefits -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; padding: 32px; margin-bottom: 32px; border: 1px solid #333333;">
          <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px;">Your Combined Benefits</h2>
          
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="width: 8px; height: 8px; background: #00D4AA; border-radius: 50%; margin-right: 12px;"></div>
              <span style="color: #ffffff; font-weight: 600;">Recruit Trading Alerts</span>
            </div>
            <p style="margin: 0 0 0 20px; color: #888888; font-size: 14px; line-height: 1.5;">Your existing recruit alerts + newsletter market intel</p>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="width: 8px; height: 8px; background: #3B82F6; border-radius: 50%; margin-right: 12px;"></div>
              <span style="color: #ffffff; font-weight: 600;">Store Exclusive Access</span>
            </div>
            <p style="margin: 0 0 0 20px; color: #888888; font-size: 14px; line-height: 1.5;">Early access to new products and recruit-only discounts</p>
          </div>

          <div style="margin-bottom: 0;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="width: 8px; height: 8px; background: #F59E0B; border-radius: 50%; margin-right: 12px;"></div>
              <span style="color: #ffffff; font-weight: 600;">Premium Market Reports</span>
            </div>
            <p style="margin: 0 0 0 20px; color: #888888; font-size: 14px; line-height: 1.5;">Weekly deep-dive analysis available only to recruits with newsletter subscription</p>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="https://bullmoney.shop/store" style="display: inline-block; background: linear-gradient(135deg, #00D4AA, #3B82F6); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 600; font-size: 16px;">Access Your Benefits</a>
        </div>

      </div>
    </body>
    </html>
  `;
}

// Generate standard welcome HTML for non-recruit subscribers
function generateStandardWelcomeHTML(firstName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Bullmoney Gmail Intel</title>
    </head>
    <body style="margin: 0; padding: 0; background: #0a0a0a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="width: 60px; height: 60px; background: #ffffff; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="color: #000000; font-weight: bold; font-size: 24px;">B</span>
          </div>
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Welcome to Gmail Intel, ${firstName}!</h1>
          <p style="margin: 16px 0 0 0; color: #888888; font-size: 16px;">Your daily trading edge delivered straight to Gmail</p>
        </div>

        <!-- Main Content -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; padding: 32px; margin-bottom: 32px; border: 1px solid #333333;">
          <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px;">What You'll Receive</h2>
          
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="width: 8px; height: 8px; background: #00D4AA; border-radius: 50%; margin-right: 12px;"></div>
              <span style="color: #ffffff; font-weight: 600;">Daily Market Alerts</span>
            </div>
            <p style="margin: 0 0 0 20px; color: #888888; font-size: 14px; line-height: 1.5;">Pre-market analysis and key levels delivered to your Gmail at 7 AM EST</p>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="width: 8px; height: 8px; background: #3B82F6; border-radius: 50%; margin-right: 12px;"></div>
              <span style="color: #ffffff; font-weight: 600;">Exclusive Trade Setups</span>
            </div>
            <p style="margin: 0 0 0 20px; color: #888888; font-size: 14px; line-height: 1.5;">High-probability setups with entry, stop-loss, and target levels</p>
          </div>

          <div style="margin-bottom: 0;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <div style="width: 8px; height: 8px; background: #F59E0B; border-radius: 50%; margin-right: 12px;"></div>
              <span style="color: #ffffff; font-weight: 600;">Store Updates</span>
            </div>
            <p style="margin: 0 0 0 20px; color: #888888; font-size: 14px; line-height: 1.5;">First access to new trading tools and educational resources</p>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
}

// Fetch Gmail newsletter template from database
 
async function getGmailNewsletterContent(email: string, supabase: any): Promise<{ subject: string; html: string }> {
  try {
    // Try to get Gmail newsletter template from database
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('slug', 'newsletter_welcome_gmail')
      .eq('is_active', true)
      .single();
    
    if (!error && template) {
      console.log('[Gmail Newsletter] Using database Gmail template');
      const rendered = renderEmailTemplate(template as EmailTemplateData, email);
      return rendered;
    }
  } catch (err) {
    console.warn('[Gmail Newsletter] Database template fetch error, using fallback:', err);
  }

  // Fallback to hardcoded Gmail newsletter template
  const firstName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
  
  return {
    subject: `${firstName}, you're in! Daily market intel starts now 📈`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Bullmoney Gmail Intel</title>
      </head>
      <body style="margin: 0; padding: 0; background: #0a0a0a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 60px; height: 60px; background: #ffffff; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: #000000; font-weight: bold; font-size: 24px;">B</span>
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Welcome to Gmail Intel, ${firstName}!</h1>
            <p style="margin: 16px 0 0 0; color: #888888; font-size: 16px;">Your daily trading edge delivered straight to Gmail</p>
          </div>

          <!-- Main Content -->
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; padding: 32px; margin-bottom: 32px; border: 1px solid #333333;">
            <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px;">What You'll Receive</h2>
            
            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 8px; height: 8px; background: #00D4AA; border-radius: 50%; margin-right: 12px;"></div>
                <span style="color: #ffffff; font-weight: 600;">Daily Market Alerts</span>
              </div>
              <p style="margin: 0 0 0 20px; color: #888888; font-size: 14px; line-height: 1.5;">Pre-market analysis and key levels delivered to your Gmail at 7 AM EST</p>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 8px; height: 8px; background: #3B82F6; border-radius: 50%; margin-right: 12px;"></div>
                <span style="color: #ffffff; font-weight: 600;">Exclusive Trade Setups</span>
              </div>
              <p style="margin: 0 0 0 20px; color: #888888; font-size: 14px; line-height: 1.5;">High-probability setups with entry, stop-loss, and target levels</p>
            </div>

            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <div style="width: 8px; height: 8px; background: #F59E0B; border-radius: 50%; margin-right: 12px;"></div>
                <span style="color: #ffffff; font-weight: 600;">Store Access</span>
              </div>
              <p style="margin: 0 0 0 20px; color: #888888; font-size: 14px; line-height: 1.5;">Early access to limited drops and subscriber-only discounts</p>
            </div>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://bulllmoney.shop'}/store" 
               style="display: inline-block; background: #ffffff; color: #000000; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin-right: 16px;">
              Shop Store
            </a>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://bullmoney.shop'}/VIP" 
               style="display: inline-block; background: transparent; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; border: 2px solid #333333;">
              Join VIP
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 32px; border-top: 1px solid #333333;">
            <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.5;">
              You're receiving this because you subscribed to Bullmoney Gmail Intel from our store.
              <br><br>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://bullmoney.shop'}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}" style="color: #888888; text-decoration: underline;">Unsubscribe</a> •
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://bullmoney.shop'}/store" style="color: #888888; text-decoration: underline;">Manage Preferences</a>
            </p>
            <p style="margin: 16px 0 0 0; color: #444444; font-size: 10px;">
              Gmail Admin Hub Powered • Bullmoney Store © ${new Date().getFullYear()}
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// Validate referrer to ensure only store page can access
function validateStoreOnlyAccess(request: NextRequest): boolean {
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');
  const newsletterSource = request.headers.get('X-Newsletter-Source');
  
  // Allow if called from store page or with proper source header
  if (newsletterSource === 'store_footer') return true;
  if (referer && referer.includes('/store')) return true;
  if (origin && process.env.NODE_ENV === 'development') return true; // Dev mode
  
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Validate store-only access
    if (!validateStoreOnlyAccess(request)) {
      return NextResponse.json(
        { error: 'Newsletter signup only available from store page' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, source = 'store_footer_gmail_hub', preferences = {}, useGmailHub = true } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Cross-reference with recruits table
    console.log(`[Integration] Checking recruit status for ${normalizedEmail}`);
    const recruitData = await findOrCreateRecruitIntegration(normalizedEmail, supabase);

    // STEP 2: Check if newsletter subscriber already exists
    const { data: existingSubscriber, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, subscribed, is_vip, created_at, admin_notes, total_emails_sent')
      .eq('email', normalizedEmail)
      .single();

    let isNewSubscriber = false;
    let subscriberId: string | null = null;

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Gmail Newsletter] Database error:', checkError);
      throw new Error('Gmail newsletter database error');
    }

    if (existingSubscriber) {
      // Existing newsletter subscriber - update with recruit data
      subscriberId = existingSubscriber.id;
      
      const updateData = {
        subscribed: true,
        resubscribed_at: new Date().toISOString(),
        source: source,
        preferences: { 
          ...preferences, 
          gmail_hub: true, 
          admin_managed: true,
          recruit_integration: recruitData.isExistingRecruit
        },
        is_vip: recruitData.isVip || existingSubscriber.is_vip,
        admin_notes: `${existingSubscriber.admin_notes || ''}\n[${new Date().toISOString()}] Re-subscribed via Gmail Hub${recruitData.isExistingRecruit ? ' (Linked to Recruit ID: ' + recruitData.recruitId + ')' : ''}`
      };

      await supabase
        .from('newsletter_subscribers')
        .update(updateData)
        .eq('id', existingSubscriber.id);
      
      console.log(`[Gmail Newsletter] Updated existing subscriber: ${normalizedEmail} ${recruitData.isExistingRecruit ? '(Recruit linked)' : ''}`);

    } else {
      // New newsletter subscriber - create with recruit integration
      isNewSubscriber = true;
      
      const firstName = recruitData.fullName?.split(' ')[0] || normalizedEmail.split('@')[0];
      
      const { data: newSubscriber, error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: normalizedEmail,
          source: source,
          subscribed: true,
          first_name: firstName,
          last_name: recruitData.fullName?.split(' ').slice(1).join(' ') || '',
          preferences: { 
            ...preferences, 
            gmail_hub: true, 
            admin_managed: true,
            recruit_integration: recruitData.isExistingRecruit,
            marketing: true,
            updates: true 
          },
          tags: [
            'gmail_hub', 
            'store_subscriber',
            ...(recruitData.isExistingRecruit ? ['recruit_linked'] : []),
            ...(recruitData.isVip ? ['vip_recruit'] : [])
          ],
          is_vip: recruitData.isVip,
          admin_notes: `Subscribed via Gmail Admin Hub at ${new Date().toISOString()}${recruitData.isExistingRecruit ? `\nLinked to Recruit ID: ${recruitData.recruitId} (${recruitData.status})` : ''}${recruitData.country ? `\nLocation: ${recruitData.country}` : ''}`
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[Gmail Newsletter] Insert error:', insertError);
        throw new Error('Failed to subscribe to Gmail newsletter');
      }

      subscriberId = newSubscriber.id;
      console.log(`[Gmail Newsletter] New subscriber: ${normalizedEmail} ${recruitData.isExistingRecruit ? '(Recruit integrated)' : ''}`);
    }

    // STEP 3: Enroll in email drip campaigns
    if (subscriberId) {
      console.log(`[Drip Campaigns] Enrolling subscriber ${normalizedEmail} in automated sequences`);
      await enrollInDripCampaigns(subscriberId, normalizedEmail, recruitData.recruitId, supabase);
    }

    // STEP 4: Send personalized welcome email using enhanced templates
    const attachment = getRandomNewsletterAttachment();
    const publicDir = path.join(process.cwd(), 'public');
    const attachmentPath = path.join(publicDir, attachment.path);
    
    // Get personalized email content based on recruit status
    const emailContent = await getPersonalizedEmailContent(normalizedEmail, recruitData, supabase);
    
    // Send via Gmail SMTP with attachment
    if (fs.existsSync(attachmentPath)) {
      const result = await sendEmailWithAttachment({
        to: normalizedEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        from: `"Bullmoney Gmail Hub" <${process.env.SMTP_USER}>`,
        pdfAttachment: {
          filename: attachment.filename,
          path: attachmentPath,
          name: attachment.name,
        },
      });
      
      console.log(`[Gmail Newsletter] Sent personalized welcome email with "${attachment.name}" to ${normalizedEmail}`);
      
      // Update email tracking
      if (subscriberId) {
        await supabase
          .from('newsletter_subscribers')
          .update({ 
            last_email_sent_at: new Date().toISOString(),
            total_emails_sent: (existingSubscriber?.total_emails_sent || 0) + 1
          })
          .eq('id', subscriberId);
      }
    } else {
      // Fallback: send without attachment
      console.warn(`[Gmail Newsletter] Attachment not found: ${attachmentPath}`);
      const result = await sendEmail({
        to: normalizedEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        from: `"Bullmoney Gmail Hub" <${process.env.SMTP_USER}>`,
      });
    }

    // STEP 5: Return response based on integration status
    const welcomeMessage = recruitData.isExistingRecruit 
      ? `Welcome back, ${recruitData.fullName?.split(' ')[0] || 'trader'}! Your recruit + newsletter benefits are now active. Check your Gmail for exclusive insights.`
      : isNewSubscriber 
        ? "Welcome to Bullmoney Gmail Intel! Check your Gmail for exclusive trading insights and your bonus guide."
        : "You're already getting our Gmail intel! Check your inbox for a bonus guide.";

    return NextResponse.json({
      success: true,
      message: welcomeMessage,
      isNew: isNewSubscriber,
      gmailHub: true,
      recruitIntegration: {
        isExistingRecruit: recruitData.isExistingRecruit,
        isVip: recruitData.isVip,
        status: recruitData.status,
        dripCampaignsEnrolled: ['newsletter_welcome_sequence', 'store_reminder_30day']
      }
    });

  } catch (error: any) {
    console.error('[Gmail Newsletter Integration] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe to Gmail newsletter system' },
      { status: 500 }
    );
  }
}

// GET - Newsletter stats (admin only, store page only)
export async function GET(request: NextRequest) {
  try {
    // Validate store-only access for stats
    if (!validateStoreOnlyAccess(request)) {
      return NextResponse.json(
        { error: 'Newsletter stats only available from store admin panel' },
        { status: 403 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get newsletter stats
    const { data: stats, error } = await supabase
      .rpc('get_newsletter_stats');
      
    if (error) {
      throw new Error('Failed to fetch Gmail newsletter stats');
    }
    
    return NextResponse.json({
      success: true,
      stats: stats[0] || {},
      provider: 'gmail_admin_hub'
    });
    
  } catch (error: any) {
    console.error('[Gmail Newsletter Stats] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch newsletter stats' },
      { status: 500 }
    );
  }
}