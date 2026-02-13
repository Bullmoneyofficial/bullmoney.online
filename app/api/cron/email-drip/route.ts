import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email-service';
import { renderEmailTemplate, type EmailTemplateData } from '@/lib/email-template-renderer';
import { 
  grandLaunchEmail, 
  storePromoEmail, 
  vipPromoEmail, 
  affiliatePromoEmail,
  welcomeEmail 
} from '@/lib/email-templates';
import { getDripEmailBySequence, getDripNextDelayDays } from '@/lib/drip-email-sequences';

// ============================================================================
// EMAIL DRIP CAMPAIGN CRON JOB
// Uses database templates first, falls back to hardcoded templates
// Runs on a schedule to send automated emails from email_drip_campaigns table
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Get first name from email
function getFirstName(email: string): string {
  const localPart = email.split('@')[0];
  // Capitalize first letter
  return localPart.charAt(0).toUpperCase() + localPart.slice(1).replace(/[0-9_.-]/g, '');
}

// Try to get template from database first
async function getDbTemplate(supabase: SupabaseClient, slug: string, email: string): Promise<{ subject: string; html: string } | null> {
  try {
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (!error && template) {
      console.log(`[Drip] Using database template: ${slug}`);
      const rendered = renderEmailTemplate(template as EmailTemplateData, email);
      return rendered;
    }
  } catch (err) {
    console.warn(`[Drip] Database template fetch error for ${slug}:`, err);
  }
  return null;
}

// Get email template based on campaign and sequence number
async function getEmailTemplate(
  supabase: SupabaseClient, 
  campaignName: string, 
  sequenceNumber: number, 
  email: string
): Promise<{ subject: string; html: string } | null> {
  const firstName = getFirstName(email);
  
  // Try database template first (using campaign name as slug)
  const dbTemplate = await getDbTemplate(supabase, campaignName, email);
  if (dbTemplate) return dbTemplate;
  
  // Also try with sequence suffix
  const seqDbTemplate = await getDbTemplate(supabase, `${campaignName}_${sequenceNumber}`, email);
  if (seqDbTemplate) return seqDbTemplate;
  
  // Use drip sequence templates from hardcoded sequences
  const dripEmail = getDripEmailBySequence(campaignName, sequenceNumber, firstName, email);
  if (dripEmail) {
    console.log(`[Drip] Using hardcoded drip template: ${campaignName} #${sequenceNumber}`);
    return dripEmail;
  }
  
  // Fallback to standard hardcoded templates
  console.log(`[Drip] Using hardcoded standard template: ${campaignName}`);
  switch (campaignName) {
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
    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional, for security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow without auth in development
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();
    
    // Get campaigns that are due to send
    const { data: campaigns, error } = await supabase
      .from('email_drip_campaigns')
      .select('*')
      .eq('subscribed', true)
      .is('completed_at', null)
      .lte('next_email_scheduled_at', now)
      .limit(50); // Process in batches
    
    if (error) {
      console.error('[Drip] Error fetching campaigns:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No campaigns due',
        processed: 0 
      });
    }
    
    console.log(`[Drip] Processing ${campaigns.length} campaigns...`);
    
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const campaign of campaigns) {
      try {
        // Get email template (tries database first, then falls back to hardcoded)
        const template = await getEmailTemplate(
          supabase,
          campaign.campaign_name,
          campaign.email_sequence_number,
          campaign.email
        );
        
        if (!template) {
          console.warn(`[Drip] No template for ${campaign.campaign_name} #${campaign.email_sequence_number}`);
          continue;
        }
        
        // Send the email
        const result = await sendEmail({
          to: campaign.email,
          subject: template.subject,
          html: template.html,
          attachments: true,
        });
        
        if (result.success) {
          sent++;
          
          // Update campaign record
          const nextSequence = campaign.email_sequence_number + 1;
          const isCompleted = nextSequence >= campaign.total_emails_to_send;
          
          // Schedule next email based on campaign-specific delay
          const delayDays = getDripNextDelayDays(campaign.campaign_name, campaign.email_sequence_number);
          const nextScheduled = new Date();
          nextScheduled.setDate(nextScheduled.getDate() + (delayDays || 0));
          
          await supabase
            .from('email_drip_campaigns')
            .update({
              email_sequence_number: nextSequence,
              last_email_sent_at: now,
              next_email_scheduled_at: isCompleted ? null : nextScheduled.toISOString(),
              completed_at: isCompleted ? now : null,
              total_sent: campaign.total_sent + 1,
              updated_at: now,
            })
            .eq('id', campaign.id);
          
          console.log(`[Drip] Sent email #${campaign.email_sequence_number} to ${campaign.email}`);
        } else {
          failed++;
          errors.push(`${campaign.email}: ${result.error}`);
        }
      } catch (err) {
        failed++;
        errors.push(`${campaign.email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${campaigns.length} campaigns`,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
    
  } catch (error) {
    console.error('[Drip] Cron error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Allow POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}
