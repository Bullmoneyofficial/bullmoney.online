import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Post from "@/models/Posts";

export async function GET() {
  await dbConnect();
  // Sort by newest first (-1)
  const posts = await Post.find().sort({ createdAt: -1 });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // Mongoose will validate the data against the PostSchema automatically
    const createdPost = await Post.create(body);
    
    return NextResponse.json(createdPost, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: "Error creating post", error: error.message }, { status: 500 });
  }
}