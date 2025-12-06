import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import BlogHero from "@/models/BlogHero";

// Add this line here as well
export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();
  // Find the single hero document, or create a default one if it doesn't exist
  let hero = await BlogHero.findOne();
  if (!hero) hero = await BlogHero.create({});
  return NextResponse.json(hero);
}

export async function PUT(req: Request) {
  await dbConnect();
  const body = await req.json();
  
  // Update the single hero document
  const hero = await BlogHero.findOneAndUpdate({}, body, {
    new: true,
    upsert: true, // Create if not exists
  });
  
  return NextResponse.json(hero);
}