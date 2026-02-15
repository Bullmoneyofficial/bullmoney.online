import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = "force-dynamic";

// Create Supabase client for API routes
async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // The `set` method was called from a Server Component
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          } catch {
            // The `delete` method was called from a Server Component
          }
        },
      },
    }
  );
}

// GET - Fetch affiliate dashboard content
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("affiliate_dashboard_content")
      .select("*")
      .eq("id", "main")
      .single();

    if (error) {
      // If no data found, return default structure
      if (error.code === "PGRST116") {
        return NextResponse.json({
          success: true,
          data: getDefaultContent(),
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching affiliate content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// PUT - Update affiliate dashboard content
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    
    if (!user || user.email !== adminEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("affiliate_dashboard_content")
      .upsert({
        id: "main",
        ...body,
        updated_at: new Date().toISOString(),
        updated_by: user.email,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Content updated successfully",
    });
  } catch (error) {
    console.error("Error updating affiliate content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update content" },
      { status: 500 }
    );
  }
}

// Default content structure
function getDefaultContent() {
  return {
    id: "main",
    tiers: [
      { name: "Starter", minTraders: 1, maxTraders: 4, commissionPercent: 5, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.0, color: "#000000", icon: "target", perks: ["Basic dashboard access", "Monthly payouts", "Email support"] },
      { name: "Bronze", minTraders: 5, maxTraders: 14, commissionPercent: 10, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.1, color: "#cd7f32", icon: "award", perks: ["Priority email support", "Weekly performance reports", "Custom referral link"] },
      { name: "Silver", minTraders: 15, maxTraders: 29, commissionPercent: 15, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.2, color: "#c0c0c0", icon: "star", perks: ["Telegram support", "Marketing materials", "Bi-weekly payouts"] },
      { name: "Gold", minTraders: 30, maxTraders: 49, commissionPercent: 20, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.35, color: "#ffd700", icon: "trophy", perks: ["1-on-1 support calls", "Co-branded landing pages", "Weekly payouts"] },
      { name: "Elite", minTraders: 50, maxTraders: null, commissionPercent: 25, xmRatePerLot: 11, vantageRatePerLot: 5.5, bonusMultiplier: 1.5, color: "#000000", icon: "sparkles", perks: ["Dedicated account manager", "Custom commission rates", "Instant payouts", "Exclusive bonuses"] },
    ],
    weekly_tasks: {
      Starter: [
        { title: "Repost 1 BullMoney post on your story/feed", timeMinutes: 10, whyItMatters: "Keeps your audience warm and reminds them you are active." },
        { title: "Invite 1 trader friend to register with your link", timeMinutes: 20, whyItMatters: "One direct invite each week compounds fast over time." },
      ],
      Bronze: [
        { title: "Repost 2 BullMoney posts with your own short caption", timeMinutes: 25, whyItMatters: "Personal captions convert better than plain reposts." },
        { title: "DM 3 warm contacts who trade or want to learn", timeMinutes: 35, whyItMatters: "Warm outreach usually gives the highest reply rate." },
        { title: "Follow up with last week leads", timeMinutes: 20, whyItMatters: "Most signups happen after follow-up, not first message." },
      ],
      Silver: [
        { title: "Publish 1 simple market insight post + referral CTA", timeMinutes: 45, whyItMatters: "Educational posts build trust and inbound leads." },
        { title: "Host 1 quick Q&A in Telegram/Instagram stories", timeMinutes: 30, whyItMatters: "Live interaction shortens the trust cycle." },
        { title: "Recruit 1 qualified trader and help them connect MT5", timeMinutes: 60, whyItMatters: "Activation quality matters more than raw signups." },
      ],
      Gold: [
        { title: "Post 2 educational clips (entry basics or risk tips)", timeMinutes: 90, whyItMatters: "Video content drives stronger long-term growth." },
        { title: "Run 1 small networking session with trader friends", timeMinutes: 60, whyItMatters: "Group conversations produce multiple referrals at once." },
        { title: "Review analytics tab and optimize your best channel", timeMinutes: 30, whyItMatters: "Data-led tweaks can increase conversions quickly." },
      ],
      Elite: [
        { title: "Build a weekly content sequence (3-post funnel)", timeMinutes: 90, whyItMatters: "A repeatable funnel scales without constant manual effort." },
        { title: "Mentor 1 newer affiliate and co-promote together", timeMinutes: 60, whyItMatters: "Partnership growth creates new audience overlap." },
        { title: "Audit top leads and set a next-step action for each", timeMinutes: 45, whyItMatters: "Systematic follow-up protects revenue opportunities." },
      ],
    },
    tips_title: "Tips for Success",
    tips: [
      { title: "Be Consistent", description: "Post regularly and engage with your audience daily." },
      { title: "Add Value First", description: "Share helpful trading tips before promoting your link." },
      { title: "Use Multiple Channels", description: "Spread your reach across Instagram, Telegram, YouTube, and Discord." },
      { title: "Follow Up", description: "Most signups happen after 2-3 follow-up messages." },
      { title: "Track Your Results", description: "Use the analytics tab to see what works best for you." },
    ],
    faq_items: [
      { question: "How do I get paid?", answer: "Payments are processed monthly via your preferred method (bank transfer, PayPal, crypto, or Wise)." },
      { question: "When do I get my commissions?", answer: "Commissions are calculated weekly and paid out monthly once you reach the $50 minimum threshold." },
      { question: "How are commissions calculated?", answer: "You earn a percentage of the broker rate per lot traded by your referrals. The percentage depends on your tier level." },
      { question: "Can I track my referrals?", answer: "Yes! The dashboard shows all your referrals, their trading activity, and your earnings in real-time." },
    ],
    how_to_become_affiliate: "Join BullMoney as an affiliate partner and earn commissions on every trade your referrals make.",
    welcome_message: "Welcome to the BullMoney Affiliate Program",
    welcome_subtitle: "Earn commissions by referring traders to BullMoney",
    overview_title: "Overview",
    recruits_title: "Your Recruits",
    earnings_title: "Earnings",
    analytics_title: "Analytics",
    commission_info: "Earn up to 25% commission on broker rates per lot traded by your referrals.",
    qr_section_title: "Your Referral QR Code",
    qr_section_description: "Clients can scan and auto-fill your code in pagemode.",
    referral_link_title: "Your Referral Link",
    referral_link_description: "Share this link to earn commissions on every trade your referrals make",
    payout_info: "Payouts are processed monthly for balances over $50.",
    support_email: "support@bullmoney.online",
    telegram_group_link: "https://t.me/+aKB315PRM5A2OGI0",
    staff_group_link: "https://t.me/+aKB315PRM5A2OGI0",
    custom_styles: {},
    show_qr_code: true,
    show_tasks: true,
    show_tips: true,
    show_leaderboard: false,
    show_telegram_feed: true,
  };
}
