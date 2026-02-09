import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth";
import { lenientRateLimit, standardRateLimit } from "@/lib/rateLimit";
import { ProductSchema, formatValidationError } from "@/lib/validation";
import { logger } from "@/lib/logger";

export const revalidate = 60;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

// GET: Fetch all products
export async function GET(request: NextRequest) {
  try {
    // Apply lenient rate limiting for public endpoint
    const rateLimitResult = await lenientRateLimit(request);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching products:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // MAP: DB (snake_case) -> Frontend (camelCase)
    const formatted = data.map((p) => ({
      ...p,
      id: p._id, // Map _id to id for UI compatibility
      imageUrl: p.image_url,
      buyUrl: p.buy_url,
    }));

    return NextResponse.json(formatted, { headers: CACHE_HEADERS });
  } catch (error: any) {
    logger.error("Error in GET /api/products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST: Create a new product
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
    const validation = ProductSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Product validation failed:", validation.error);
      return NextResponse.json(formatValidationError(validation.error), {
        status: 400,
      });
    }

    const validatedData = validation.data;

    // MAP: Frontend (camelCase) -> DB (snake_case)
    const payload = {
      name: validatedData.name,
      description: validatedData.description,
      price: validatedData.price,
      category: validatedData.category,
      image_url: validatedData.imageUrl,
      buy_url: validatedData.buyUrl,
      visible: validatedData.visible,
    };

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error("Supabase error creating product:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return formatted object to frontend
    const formatted = {
      ...data,
      id: data._id,
      imageUrl: data.image_url,
      buyUrl: data.buy_url,
    };

    logger.log(`Product created: ${formatted.id}`);
    return NextResponse.json(formatted, { status: 201 });
  } catch (error: any) {
    logger.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product", message: error.message },
      { status: 500 }
    );
  }
}