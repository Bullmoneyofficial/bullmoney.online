import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Post from "@/models/Posts";
import { requireAdmin } from "@/lib/auth";
import { UpdateBlogPostSchema, formatValidationError, MongoIdSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const authError = await requireAdmin(request);
    if (authError) return authError;

    await dbConnect();
    const body = await request.json();
    const { id } = params;

    // Validate MongoDB ID format
    const idValidation = MongoIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid post ID format" },
        { status: 400 }
      );
    }

    // Remove _id from body to avoid immutable field error
    const { _id, ...updateData } = body;

    // Validate update data
    const validation = UpdateBlogPostSchema.safeParse(updateData);
    if (!validation.success) {
      logger.warn("Blog post update validation failed:", validation.error);
      return NextResponse.json(formatValidationError(validation.error), {
        status: 400,
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(id, validation.data, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validators
    });

    if (!updatedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    logger.log(`Blog post updated: ${id}`);
    return NextResponse.json(updatedPost);
  } catch (error: any) {
    logger.error("Failed to update post:", error);
    return NextResponse.json(
      { error: "Failed to update post", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const authError = await requireAdmin(request);
    if (authError) return authError;

    await dbConnect();
    const { id } = params;

    // Validate MongoDB ID format
    const idValidation = MongoIdSchema.safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid post ID format" },
        { status: 400 }
      );
    }

    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    logger.log(`Blog post deleted: ${id}`);
    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error: any) {
    logger.error("Failed to delete post:", error);
    return NextResponse.json(
      { error: "Failed to delete post", message: error.message },
      { status: 500 }
    );
  }
}