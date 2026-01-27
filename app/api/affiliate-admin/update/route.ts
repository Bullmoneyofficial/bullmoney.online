import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_AFFILIATE_ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, updates, adminEmail } = body || {};

    if (!adminEmail || !ADMIN_EMAILS.includes(String(adminEmail).toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!id || !updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Missing update payload" }, { status: 400 });
    }

    // Never allow password updates from this endpoint
    if ("password" in updates) {
      delete updates.password;
    }

    const supabase = createServerSupabase();
    const { error } = await supabase.from("recruits").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error.details, hint: error.hint },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
