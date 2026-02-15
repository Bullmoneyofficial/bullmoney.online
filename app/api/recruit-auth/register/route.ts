import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { encryptValue } from '@/lib/crypto-encryption';
import { sendEmail } from '@/lib/email-service';
import { welcomeEmail, affiliateSignupNotificationEmail } from '@/lib/email-templates';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const mt5Id = String(body?.mt5_id || body?.mt5Number || '').trim();
    const referralCode = String(body?.referred_by_code || body?.referralCode || '').trim();
    const referralAttribution = body?.referral_attribution && typeof body.referral_attribution === 'object'
      ? body.referral_attribution
      : null;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from('recruits')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const encryptedPassword = encryptValue(password);

    const insertPayload: Record<string, any> = {
      email,
      password_hash: passwordHash,
      password: encryptedPassword,
      referred_by_code: referralCode || null,
      used_code: true,
    };

    if (referralAttribution && referralCode) {
      const trackingNote = {
        tracked_at: new Date().toISOString(),
        affiliate_id: referralAttribution.affiliate_id || null,
        affiliate_name: referralAttribution.affiliate_name || null,
        affiliate_email: referralAttribution.affiliate_email || null,
        affiliate_code: referralAttribution.affiliate_code || referralCode,
        source: referralAttribution.source || null,
        medium: referralAttribution.medium || null,
        campaign: referralAttribution.campaign || null,
      };

      insertPayload.notes = `[ReferralAttribution] ${JSON.stringify(trackingNote)}`;
    }

    if (mt5Id) insertPayload.mt5_id = mt5Id;

    const { data: recruit, error } = await supabase
      .from('recruits')
      .insert([insertPayload])
      .select('id, email, mt5_id, is_vip')
      .single();

    if (error || !recruit) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create recruit' }, { status: 500 });
    }

    // ----------------------------------------------------------------------
    // EMAILS
    // - Always: welcome email to the new user
    // - If affiliate attribution exists (QR/link): notify admin + affiliate
    // Email failures should NOT block signup.
    // ----------------------------------------------------------------------
    try {
      const { subject, html } = welcomeEmail(email);
      await sendEmail({
        to: email,
        subject,
        html,
      });
    } catch (err) {
      console.error('[RecruitAuth] Welcome email failed:', err);
    }

    // Only send admin/affiliate notifications when the signup came with explicit attribution
    // (QR/referral link flow sets referral_attribution; manual typed codes do not.)
    const hasAttribution = Boolean(referralAttribution && (referralAttribution.affiliate_code || referralAttribution.affiliate_email || referralAttribution.affiliate_id));
    if (hasAttribution) {
      const ADMIN_NOTIFY_EMAIL = 'bullmoneytraders@gmail.com';
      const attribAffiliateCode = String(referralAttribution?.affiliate_code || '').trim();
      const attribAffiliateEmailRaw = String(referralAttribution?.affiliate_email || '').trim().toLowerCase();
      const attribAffiliateName = String(referralAttribution?.affiliate_name || '').trim();
      const attribSource = String(referralAttribution?.source || '').trim();
      const attribMedium = String(referralAttribution?.medium || '').trim();
      const attribCampaign = String(referralAttribution?.campaign || '').trim();

      // Attempt to resolve affiliate email from DB if missing (using affiliate_code)
      let resolvedAffiliateEmail = attribAffiliateEmailRaw;
      if (!resolvedAffiliateEmail && attribAffiliateCode) {
        try {
          const { data: affiliateRow } = await supabase
            .from('recruits')
            .select('email')
            .ilike('affiliate_code', attribAffiliateCode)
            .maybeSingle();
          const candidate = String((affiliateRow as any)?.email || '').trim().toLowerCase();
          if (candidate) resolvedAffiliateEmail = candidate;
        } catch (err) {
          console.warn('[RecruitAuth] Could not resolve affiliate email from code:', err);
        }
      }

      const notifyVars = {
        newUserEmail: email,
        mt5Id: mt5Id || recruit.mt5_id || null,
        referralCode: referralCode || null,
        affiliateCode: attribAffiliateCode || null,
        affiliateEmail: resolvedAffiliateEmail || null,
        affiliateName: attribAffiliateName || null,
        source: attribSource || null,
        medium: attribMedium || null,
        campaign: attribCampaign || null,
      };

      // Admin notify
      try {
        const { subject, html } = affiliateSignupNotificationEmail(notifyVars);
        await sendEmail({
          to: ADMIN_NOTIFY_EMAIL,
          subject,
          html,
          attachments: false,
        });
      } catch (err) {
        console.error('[RecruitAuth] Admin affiliate-signup notify failed:', err);
      }

      // Affiliate notify (separate send to avoid exposing admin email)
      if (resolvedAffiliateEmail && resolvedAffiliateEmail !== email) {
        try {
          const { subject, html } = affiliateSignupNotificationEmail(notifyVars);
          await sendEmail({
            to: resolvedAffiliateEmail,
            subject,
            html,
            attachments: false,
          });
        } catch (err) {
          console.error('[RecruitAuth] Affiliate signup notify failed:', err);
        }
      }
    }

    return NextResponse.json({ success: true, recruit });
  } catch (error) {
    console.error('[RecruitAuth] Register error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
