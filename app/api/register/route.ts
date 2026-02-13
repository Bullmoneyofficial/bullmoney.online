// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { getDripInitialDelayDays } from '@/lib/drip-email-sequences';
import { strictRateLimit } from '@/lib/rateLimit';
import { formatValidationError } from '@/lib/validation';
import { logger } from '@/lib/logger';

// Define validation schema for registration
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  mt5Number: z.string().min(5, 'MT5 number must be at least 5 characters').max(50, 'MT5 number too long'),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per 15 minutes)
    const rateLimitResult = await strictRateLimit(request);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    // 1. Parse and validate the incoming JSON data
    const body = await request.json();

    // 2. Validate with Zod schema
    const validation = RegisterSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('Registration validation failed:', validation.error);
      return NextResponse.json(
        formatValidationError(validation.error),
        { status: 400 }
      );
    }

    const { name, email, mt5Number } = validation.data;

    // 3. Insert into Supabase
    // Note: Ensure your table columns match these keys (email, mt5_id, recruiter_name, used_code)
    const { error } = await supabase.from('recruits').insert([
      {
        email: email,
        mt5_id: mt5Number,
        recruiter_name: name, // assuming 'name' maps to 'recruiter_name'
        used_code: true,      // Defaults to true based on your flow
      },
    ]);

    if (error) {
      logger.error('Supabase Error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. Enroll new recruit into drip campaigns (server-side with service role)
    try {
      const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (adminUrl && adminKey) {
        const admin = createClient(adminUrl, adminKey);
        const campaignsToEnroll = [
          { name: 'store_reminder_30day', totalEmails: 15 },
          { name: 'inactive_checkin', totalEmails: 4 },
        ];

        for (const campaign of campaignsToEnroll) {
          const { data: existing } = await admin
            .from('email_drip_campaigns')
            .select('id')
            .eq('email', email)
            .eq('campaign_name', campaign.name)
            .single();

          if (!existing) {
            const delayDays = getDripInitialDelayDays(campaign.name);
            await admin.from('email_drip_campaigns').insert({
              email,
              source: 'recruits',
              campaign_name: campaign.name,
              email_sequence_number: 0,
              total_emails_to_send: campaign.totalEmails,
              subscribed: true,
              started_at: new Date().toISOString(),
              next_email_scheduled_at: new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000).toISOString(),
              total_sent: 0,
              total_opened: 0,
              total_clicked: 0,
            });
          }
        }
      }
    } catch (enrollErr) {
      logger.warn('Drip enrollment failed:', enrollErr);
    }

    // 5. Return success
    logger.log(`Registration successful for email: ${email}`);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    logger.error('Registration Server Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}