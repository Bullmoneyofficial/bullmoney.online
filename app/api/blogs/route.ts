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
    const rateLimitResult = await standardRateLimit(request, 10);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const db = await dbConnect();
    const postsCollection = db.collection("posts");
    const posts = await postsCollection.find().sort({ createdAt: -1 }).toArray();
    return NextResponse.json(posts);
  } catch (error: any) {
    if (error.message === "Rate limit exceeded") {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
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
    const authResult = await requireAdmin(request);
    if (!authResult.authorized) {
      return authResult.response;
    }

    // Apply rate limiting
    const rateLimitResult = await standardRateLimit(request, 10);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const db = await dbConnect();
    const body = await request.json();

    // Validate input with Zod schema
    const validation = BlogPostSchema.safeParse(body);
    if (!validation.success) {
      logger.warn("Blog post validation failed:", validation.error);
      return NextResponse.json(formatValidationError(validation.error), {
        status: 400,
      });
    }

    // Insert into MongoDB
    const postsCollection = db.collection("posts");
    const result = await postsCollection.insertOne({
      ...validation.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createdPost = await postsCollection.findOne({ _id: result.insertedId });
    logger.info(`Blog post created: ${result.insertedId}`);
    return NextResponse.json(createdPost, { status: 201 });
  } catch (error: any) {
    if (error.message === "Rate limit exceeded") {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
    logger.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post", message: error.message },
      { status: 500 }
    );
  }
}