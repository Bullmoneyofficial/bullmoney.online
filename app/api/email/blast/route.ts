import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email-service';
import { renderEmailTemplate, type EmailTemplateData } from '@/lib/email-template-renderer';

// ============================================================================
// EMAIL BLAST API - Send emails to all users in a target audience
// Supports: recruits, vip, newsletter, all
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Get first name from email
function getFirstName(email: string): string {
  const localPart = email.split('@')[0];
  return localPart.charAt(0).toUpperCase() + localPart.slice(1).replace(/[0-9_.-]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      templateSlug, 
      target = 'recruits', // recruits, vip, newsletter, all, selected
      limit = 500, // Safety limit
      // Direct send mode - bypasses database lookup, sends exactly what's provided
      customHtml,
      customSubject,
      templateData, // Full template object for rendering per-recipient
      selectedEmails, // Array of specific emails to send to (target="selected")
    } = body;

    // Must have either templateSlug or custom content
    if (!templateSlug && !customHtml && !templateData) {
      return NextResponse.json({ error: 'templateSlug, customHtml, or templateData is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let template: EmailTemplateData | null = null;
    let useDirectHtml = false;
    let directHtml = '';
    let directSubject = '';

    // If customHtml is provided, use it directly (what you see in preview is what gets sent)
    if (customHtml && customSubject) {
      useDirectHtml = true;
      directHtml = customHtml;
      directSubject = customSubject;
      console.log(`[Email Blast] Using direct HTML from admin panel`);
    }
    // If templateData is provided, use it for per-recipient rendering
    else if (templateData) {
      template = templateData as EmailTemplateData;
      console.log(`[Email Blast] Using provided template data for rendering`);
    }
    // Otherwise, fetch from database (no fallback to hardcoded)
    else if (templateSlug) {
      const { data: dbTemplate, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('slug', templateSlug)
        .eq('is_active', true)
        .single();
      
      if (templateError || !dbTemplate) {
        return NextResponse.json(
          { error: `Template "${templateSlug}" not found in database. Create it in the admin panel first.` },
          { status: 404 }
        );
      }
      template = dbTemplate as EmailTemplateData;
      console.log(`[Email Blast] Using database template: ${templateSlug}`);
    }

    // Fetch target audience emails
    let emails: string[] = [];

    // Selected mode: use the provided email list directly
    if (target === 'selected' && Array.isArray(selectedEmails) && selectedEmails.length > 0) {
      emails = selectedEmails.filter((e: string) => typeof e === 'string' && e.includes('@'));
    }
    
    if (target === 'recruits' || target === 'all') {
      // Get all recruits emails
      const { data: recruits, error: recruitsError } = await supabase
        .from('recruits')
        .select('email')
        .limit(limit);
      
      if (!recruitsError && recruits) {
        emails.push(...recruits.map(r => r.email).filter(Boolean));
      }
    }
    
    if (target === 'vip' || target === 'all') {
      // Get VIP members
      const { data: vips, error: vipError } = await supabase
        .from('recruits')
        .select('email')
        .eq('is_vip', true)
        .limit(limit);
      
      if (!vipError && vips) {
        emails.push(...vips.map(r => r.email).filter(Boolean));
      }
    }
    
    if (target === 'newsletter' || target === 'all') {
      // Get newsletter subscribers
      const { data: subscribers, error: subError } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('subscribed', true)
        .limit(limit);
      
      if (!subError && subscribers) {
        emails.push(...subscribers.map(s => s.email).filter(Boolean));
      }
    }

    // Deduplicate emails
    const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))];
    
    if (uniqueEmails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No recipients found',
        sent: 0,
        failed: 0 
      });
    }

    console.log(`[Email Blast] Sending to ${uniqueEmails.length} recipients (target: ${target})`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails in batches
    const batchSize = 10;
    for (let i = 0; i < uniqueEmails.length; i += batchSize) {
      const batch = uniqueEmails.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (email) => {
        try {
          let html: string;
          let subject: string;

          if (useDirectHtml) {
            // Use the exact HTML from preview (with personalization replacement)
            html = directHtml.replace(/{{email}}/g, email).replace(/{{firstName}}/g, getFirstName(email));
            subject = directSubject.replace(/{{email}}/g, email).replace(/{{firstName}}/g, getFirstName(email));
          } else if (template) {
            // Render template for this recipient
            const rendered = renderEmailTemplate(template, email);
            html = rendered.html;
            subject = rendered.subject;
          } else {
            throw new Error('No template or HTML content available');
          }
          
          // Send email
          const result = await sendEmail({
            to: email,
            subject,
            html,
            attachments: true,
          });
          
          if (result.success) {
            sent++;
          } else {
            failed++;
            errors.push(`${email}: ${result.error}`);
          }
        } catch (err) {
          failed++;
          errors.push(`${email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }));
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < uniqueEmails.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update template stats (only if using a database template with ID)
    if (template && 'id' in template && template.id) {
      await supabase
        .from('email_templates')
        .update({
          last_sent_at: new Date().toISOString(),
          total_sent: ((template as any).total_sent || 0) + sent,
        })
        .eq('id', template.id);
    }

    console.log(`[Email Blast] Complete: ${sent} sent, ${failed} failed`);

    return NextResponse.json({
      success: true,
      template: templateSlug,
      target,
      sent,
      failed,
      total: uniqueEmails.length,
      errors: errors.slice(0, 10), // Only return first 10 errors
    });
  } catch (error) {
    console.error('[Email Blast] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - Check blast status/stats
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get counts for each audience
    const [recruitsResult, vipResult, newsletterResult] = await Promise.all([
      supabase.from('recruits').select('*', { count: 'exact', head: true }),
      supabase.from('recruits').select('*', { count: 'exact', head: true }).eq('is_vip', true),
      supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('subscribed', true),
    ]);

    return NextResponse.json({
      audiences: {
        recruits: recruitsResult.count || 0,
        vip: vipResult.count || 0,
        newsletter: newsletterResult.count || 0,
      },
    });
  } catch (error) {
    console.error('[Email Blast] GET Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
