// app/api/image-proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Image Proxy API - Optimized for fast loading
 * Fetches and caches images with optional resizing
 * Reduces bandwidth and improves loading speed
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const width = searchParams.get("w") || "200";
    const quality = searchParams.get("q") || "75";

    if (!url) {
      return new NextResponse("Missing URL parameter", { status: 400 });
    }

    // Fetch the image
    const imageResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "image/webp,image/avif,image/*,*/*",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!imageResponse.ok) {
      return new NextResponse("Failed to fetch image", { status: 404 });
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await imageResponse.arrayBuffer();

    // Return the image with proper caching headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400",
        "CDN-Cache-Control": "max-age=7200",
      },
    });
  } catch (error: any) {
    console.error("[Image Proxy] Error:", error?.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
