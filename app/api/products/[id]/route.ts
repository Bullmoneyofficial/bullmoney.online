import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// PUT: Update a product
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const id = params.id;

  // MAP: Frontend (camelCase) -> DB (snake_case)
  const payload = {
    name: body.name,
    description: body.description,
    price: body.price,
    category: body.category,
    image_url: body.imageUrl,
    buy_url: body.buyUrl,
    visible: body.visible,
  };

  // Update where _id matches
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("_id", id) 
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return formatted response
  const formatted = {
    ...data,
    id: data._id,
    imageUrl: data.image_url,
    buyUrl: data.buy_url,
  };

  return NextResponse.json(formatted);
}

// DELETE: Remove a product
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Product deleted successfully" });
}