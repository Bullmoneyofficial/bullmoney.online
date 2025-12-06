import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Hero from "@/models/Hero";

// Add this line to stop the build from crashing
export const dynamic = "force-dynamic";

export async function GET() {
  await dbConnect();
  let hero = await Hero.findOne();
  if (!hero) hero = await Hero.create({});
  return NextResponse.json(hero);
}

export async function PUT(req: Request) {
  await dbConnect();
  const body = await req.json();
  const hero = await Hero.findOneAndUpdate({}, body, {
    new: true,
    upsert: true,
  });
  return NextResponse.json(hero);
}