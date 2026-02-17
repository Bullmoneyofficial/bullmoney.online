import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeEmail(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .trim()
    .toLowerCase();
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

async function isAdminAuthorized(request: NextRequest): Promise<boolean> {
  const adminEmail = normalizeEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL);
  const configuredSecret = String(process.env.ADMIN_API_TOKEN || "").trim();

  const authEmail = normalizeEmail(request.headers.get("x-admin-email"));
  const authToken = String(request.headers.get("x-admin-token") || "").trim();

  if (!adminEmail || !authEmail) return false;
  if (authEmail !== adminEmail) return false;

  // If no server-side admin token is configured, fall back to email-only auth
  // (this matches other existing admin endpoints in this codebase).
  if (!configuredSecret) return true;

  // If a secret token is configured, allow it as an auth mechanism (legacy).
  if (configuredSecret && authToken === configuredSecret) return true;

  // Otherwise, prefer verifying a Supabase session access token.
  if (authToken) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: userData } = await supabase.auth.getUser(authToken);
      const tokenEmail = normalizeEmail(userData?.user?.email);
      if (tokenEmail && tokenEmail === adminEmail) return true;
    } catch {
      // fallthrough
    }
  }

  // In environments where a secret is configured, require either the secret or a valid Supabase token.
  return false;
}

async function upsertPrimaryProductImage(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  productId: string,
  imageUrl: string,
  altText: string
) {
  if (!imageUrl) return;

  const { data: existing } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("is_primary", true)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("product_images")
      .update({ url: imageUrl, alt_text: altText, sort_order: 0, is_primary: true })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        url: imageUrl,
        alt_text: altText,
        sort_order: 0,
        is_primary: true,
      });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload, imageUrl } = await request.json();
    if (!payload?.name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: inserted, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error || !inserted?.id) {
      return NextResponse.json(
        { error: "Create product failed", details: error?.message },
        { status: 500 }
      );
    }

    if (imageUrl) {
      await upsertPrimaryProductImage(supabase, inserted.id, imageUrl, payload.name);
    }

    return NextResponse.json({ id: inserted.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server error", details: error?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, payload, imageUrl } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: updated, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("id")
      .single();

    if (error || !updated?.id) {
      return NextResponse.json(
        { error: "Update product failed", details: error?.message },
        { status: 500 }
      );
    }

    if (imageUrl) {
      await upsertPrimaryProductImage(supabase, updated.id, imageUrl, payload?.name || "");
    }

    return NextResponse.json({ id: updated.id });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server error", details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    await supabase.from("product_images").delete().eq("product_id", id);
    await supabase.from("product_media").delete().eq("product_id", id);
    await supabase.from("variants").delete().eq("product_id", id);

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      return NextResponse.json(
        { error: "Delete product failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server error", details: error?.message },
      { status: 500 }
    );
  }
}
