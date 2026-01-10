import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth";
import { lenientRateLimit, standardRateLimit } from "@/lib/rateLimit";
import { CategorySchema, formatValidationError } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Apply lenient rate limiting for public endpoint
    const rateLimitResult = await lenientRateLimit(request);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      logger.error("Error fetching categories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ensure _id exists for frontend compatibility
    const formatted = data.map((c) => ({
      ...c,
      _id: c.id,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    logger.error("Error in GET /api/categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (!authResult.authorized && authResult.response) return authResult.response;

    // Apply rate limiting
    const rateLimitResult = await standardRateLimit(request);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validation = CategorySchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Category validation failed:", validation.error);
      return NextResponse.json(formatValidationError(validation.error), {
        status: 400,
      });
    }

    const { data, error } = await supabase
      .from("product_categories")
      .insert({ name: validation.data.name })
      .select()
      .single();

    if (error) {
      logger.error("Supabase error creating category:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.log(`Category created: ${data.id}`);
    return NextResponse.json({ ...data, _id: data.id }, { status: 201 });
  } catch (error: any) {
    logger.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category", message: error.message },
      { status: 500 }
    );
  }
}
