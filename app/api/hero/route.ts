import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 60;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("shop_hero")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({}, { headers: CACHE_HEADERS });
    }

    // Map snake_case -> camelCase for the frontend
    const formatted = {
      ...data,
      primaryCtaLabel: data.primary_cta_label,
      secondaryCtaLabel: data.secondary_cta_label,
      featuredTitle: data.featured_title,
      featuredSubtitle: data.featured_subtitle,
      featuredPriceLabel: data.featured_price_label,
      featuredTagLabel: data.featured_tag_label,
      featuredNote: data.featured_note,
      featuredImageUrl: data.featured_image_url,
    };

    return NextResponse.json(formatted, { headers: CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch hero" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
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
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update hero" },
      { status: 500 }
    );
  }
}