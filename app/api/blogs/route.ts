import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import Post from "@/models/Posts";
import { requireAdmin } from "@/lib/auth";
import { standardRateLimit } from "@/lib/rateLimit";
import { BlogPostSchema, formatValidationError } from "@/lib/validation";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await standardRateLimit(request);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    await dbConnect();
    // Sort by newest first (-1)
    const posts = await Post.find().sort({ createdAt: -1 });
    return NextResponse.json(posts);
  } catch (error: any) {
    logger.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // Apply rate limiting
    const rateLimitResult = await standardRateLimit(request);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    await dbConnect();
    const body = await request.json();

    // Validate input with Zod schema
    const validation = BlogPostSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Blog post validation failed:", validation.error);
      return NextResponse.json(formatValidationError(validation.error), {
        status: 400,
      });
    }

    // Mongoose will validate the data against the PostSchema automatically
    const createdPost = await Post.create(validation.data);

    logger.log(`Blog post created: ${createdPost._id}`);
    return NextResponse.json(createdPost, { status: 201 });
  } catch (error: any) {
    logger.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post", message: error.message },
      { status: 500 }
    );
  }
}