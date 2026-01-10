import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("shop_hero").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map snake_case -> camelCase for the frontend
  const formatted = data.map((h) => ({
    ...h,
    primaryCtaLabel: h.primary_cta_label,
    secondaryCtaLabel: h.secondary_cta_label,
    featuredTitle: h.featured_title,
    featuredSubtitle: h.featured_subtitle,
    featuredPriceLabel: h.featured_price_label,
    featuredTagLabel: h.featured_tag_label,
    featuredNote: h.featured_note,
    featuredImageUrl: h.featured_image_url,
  }));

  return NextResponse.json(formatted);
}

export async function PUT(req: Request) {
  const body = await req.json();

  // Map camelCase -> snake_case for DB
  const payload = {
    badge: body.badge,
    title: body.title,
    subtitle: body.subtitle,
    primary_cta_label: body.primaryCtaLabel,
    secondary_cta_label: body.secondaryCtaLabel,
    featured_title: body.featuredTitle,
    featured_subtitle: body.featuredSubtitle,
    featured_price_label: body.featuredPriceLabel,
    featured_tag_label: body.featuredTagLabel,
    featured_note: body.featuredNote,
    featured_image_url: body.featuredImageUrl,
  };

  // We update the singleton row where id is TRUE
  const { data, error } = await supabase
    .from("shop_hero")
    .update(payload)
    .eq("id", true) 
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}