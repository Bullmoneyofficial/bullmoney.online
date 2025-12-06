import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Post from "@/models/Posts";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = params;

    // Remove _id from body to avoid immutable field error
    const { _id, ...updateData } = body;

    const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated document
    });

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const { id } = params;

    await Post.findByIdAndDelete(id);

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}