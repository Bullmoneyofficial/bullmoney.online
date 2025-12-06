import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Ca from "@/models/Category";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  await Category.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
