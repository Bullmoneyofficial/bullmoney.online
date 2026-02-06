import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, listConfiguredProviders } from '@/lib/email-service';
import { renderEmailTemplate, type EmailTemplateData } from '@/lib/email-template-renderer';

// ============================================================================
// EMAIL SEND API - Send emails using database templates or custom HTML
// Database templates only - no hardcoded fallbacks
// Use custom subject/html to send exactly what admin panel shows
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Fetch template from database (no fallback)
async function getTemplateFromDb(slug: string): Promise<EmailTemplateData | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      console.warn(`[Email Send] Template "${slug}" not found in database`);
      return null;
    }
    
    return data as EmailTemplateData;
  } catch (err) {
    console.error('[Email Send] Database fetch error:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      to, 
      templateSlug, 
      subject: customSubject, 
      html: customHtml,
    } = body;

    // Validate recipient
    if (!to) {
      return NextResponse.json({ error: 'Recipient email (to) is required' }, { status: 400 });
    }

    const recipients = Array.isArray(to) ? to : [to];
    
    // Validate we have either template slug or custom content
    if (!templateSlug && (!customSubject || !customHtml)) {
      return NextResponse.json(
        { error: 'Either templateSlug or both subject and html are required' },
        { status: 400 }
      );
    }

    // Check providers
    const providers = listConfiguredProviders();
    if (providers.length === 0) {
      return NextResponse.json(
        { error: 'No email providers configured' },
        { status: 503 }
      );
    }

    let subject: string;
    let html: string;

    // Get email content from template or custom HTML
    if (templateSlug) {
      // Database templates only - no hardcoded fallback
      const dbTemplate = await getTemplateFromDb(templateSlug);
      if (!dbTemplate) {
        return NextResponse.json(
          { error: `Template "${templateSlug}" not found in database. Create it in the admin panel first.` },
          { status: 404 }
        );
      }
      
      const rendered = renderEmailTemplate(dbTemplate, recipients[0]);
      subject = rendered.subject;
      html = rendered.html;
      console.log(`[Email Send] Using database template: ${templateSlug}`);
    } else {
      // Use custom HTML directly (what admin panel shows is what gets sent)
      subject = customSubject;
      html = customHtml;
      console.log(`[Email Send] Using custom HTML provided directly`);
    }

    // Send email
    const result = await sendEmail({
      to: recipients,
      subject,
      html,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        provider: result.provider,
        messageId: result.messageId,
        recipients: recipients.length,
      });
    } else {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to send email',
          provider: result.provider,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Email Send] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List available templates (database only)
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('slug, name, subject, category, is_active')
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    
    return NextResponse.json({
      templates: data || [],
      providers: listConfiguredProviders(),
    });
  } catch (error: any) {
    console.error('[Email Send] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
