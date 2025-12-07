import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Category deleted" });
}