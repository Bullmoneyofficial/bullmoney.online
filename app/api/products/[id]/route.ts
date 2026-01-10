import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth";
import { UpdateProductSchema, formatValidationError } from "@/lib/validation";
import { logger } from "@/lib/logger";

// PUT: Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (!authResult.authorized && authResult.response) return authResult.response;

    const body = await request.json();
    const id = params.id;

    // Validate update data
    const validation = UpdateProductSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Product update validation failed:", validation.error);
      return NextResponse.json(formatValidationError(validation.error), {
        status: 400,
      });
    }

    const validatedData = validation.data;

    // MAP: Frontend (camelCase) -> DB (snake_case)
    const payload: any = {};
    if (validatedData.name !== undefined) payload.name = validatedData.name;
    if (validatedData.description !== undefined)
      payload.description = validatedData.description;
    if (validatedData.price !== undefined) payload.price = validatedData.price;
    if (validatedData.category !== undefined)
      payload.category = validatedData.category;
    if (validatedData.imageUrl !== undefined)
      payload.image_url = validatedData.imageUrl;
    if (validatedData.buyUrl !== undefined)
      payload.buy_url = validatedData.buyUrl;
    if (validatedData.visible !== undefined)
      payload.visible = validatedData.visible;

    // Update where _id matches
    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("_id", id)
      .select()
      .single();

    if (error) {
      logger.error("Supabase error updating product:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Return formatted response
    const formatted = {
      ...data,
      id: data._id,
      imageUrl: data.image_url,
      buyUrl: data.buy_url,
    };

    logger.log(`Product updated: ${id}`);
    return NextResponse.json(formatted);
  } catch (error: any) {
    logger.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remove a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request);
    if (!authResult.authorized && authResult.response) return authResult.response;

    const id = params.id;

    const { error, data } = await supabase
      .from("products")
      .delete()
      .eq("_id", id)
      .select();

    if (error) {
      logger.error("Supabase error deleting product:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    logger.log(`Product deleted: ${id}`);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    logger.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product", message: error.message },
      { status: 500 }
    );
  }
}
