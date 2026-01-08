import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { error, data } = await supabase
      .from("product_categories")
      .delete()
      .eq("id", params.id)
      .select();

    if (error) {
      logger.error("Supabase error deleting category:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    logger.log(`Category deleted: ${params.id}`);
    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    logger.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category", message: error.message },
      { status: 500 }
    );
  }
}
