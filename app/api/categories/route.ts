import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("product_categories")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Ensure _id exists for frontend compatibility
  const formatted = data.map(c => ({
    ...c,
    _id: c.id 
  }));

  return NextResponse.json(formatted);
}

export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("product_categories")
    .insert({ name: body.name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, _id: data.id });
}