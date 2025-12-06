import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Category from "@/models/Category";

export async function GET() {
  await dbConnect();
  const cats = await Category.find().sort({ name: 1 });
  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const created = await Category.create(body);
  return NextResponse.json(created);
}
