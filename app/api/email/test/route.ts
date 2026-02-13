import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyEmailConfig, sendEmail } from '@/lib/email-service';
import { renderEmailTemplate, type EmailTemplateData } from '@/lib/email-template-renderer';

// ============================================================================
// EMAIL TEST API - Send test emails using database templates ONLY
// No hardcoded fallbacks - all templates must be in email_templates table
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Get template from database (no fallback)
async function getDbTemplate(slug: string, email: string): Promise<{ subject: string; html: string } | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (!error && template) {
      console.log(`[Email Test] Using database template: ${slug}`);
      const rendered = renderEmailTemplate(template as EmailTemplateData, email);
      return rendered;
    }
  } catch (err) {
    console.warn(`[Email Test] Database template fetch error:`, err);
  }
  return null;
}

// Fetch available database templates
async function getDbTemplates(): Promise<string[]> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('email_templates')
      .select('slug')
      .eq('is_active', true);
    
    if (!error && data) {
      return data.map(t => t.slug);
    }
  } catch (err) {
    console.warn('[Email Test] Error fetching database templates:', err);
  }
  return [];
}

export async function GET() {
  try {
    // Verify email configuration
    const config = await verifyEmailConfig();
    
    // Get database templates only
    const dbTemplates = await getDbTemplates();
    
    return NextResponse.json({
      configured: config.configured,
      providers: config.providers,
      error: config.error,
      smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}...` : null,
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      availableTemplates: dbTemplates,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, template, subject: customSubject, html: customHtml } = body;
    
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email (to) is required' },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = recipients.find((email) => !emailRegex.test(email));
    if (invalid) {
      return NextResponse.json(
        { error: `Invalid email format: ${invalid}` },
        { status: 400 }
      );
    }

    // If custom HTML is provided, use it directly (from admin panel preview)
    if (customSubject && customHtml) {
      console.log(`[Email Test] Using custom HTML directly`);
      const results = await Promise.all(
        recipients.map(async (recipient) => {
          const result = await sendEmail({
            to: recipient,
            subject: customSubject,
            html: customHtml,
          });
          return {
            to: recipient,
            success: result.success,
            provider: result.provider,
            messageId: result.messageId,
            error: result.error,
          };
        })
      );

      const failed = results.filter((r) => !r.success);
      return NextResponse.json({
        success: failed.length === 0,
        source: 'custom',
        results,
      }, { status: failed.length ? 500 : 200 });
    }
    
    // Otherwise, use database template (no hardcoded fallback)
    if (!template) {
      return NextResponse.json(
        { error: 'Either template slug or custom subject/html is required' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        const dbTemplate = await getDbTemplate(template, recipient);
        if (!dbTemplate) {
          return {
            to: recipient,
            success: false,
            error: `Template "${template}" not found in database. Create it in the admin panel first.`,
          };
        }

        const result = await sendEmail({
          to: recipient,
          subject: dbTemplate.subject,
          html: dbTemplate.html,
        });

        return {
          to: recipient,
          success: result.success,
          provider: result.provider,
          messageId: result.messageId,
          error: result.error,
        };
      })
    );

    const failed = results.filter((r) => !r.success);
    return NextResponse.json({
      success: failed.length === 0,
      template,
      source: 'database',
      results,
    }, { status: failed.length ? 500 : 200 });
  } catch (error) {
    console.error('[Email Test] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
