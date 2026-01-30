import { NextRequest, NextResponse } from "next/server";

/**
 * Image Proxy API
 *
 * Proxies external images to bypass CORS restrictions.
 * Used for Observation.org photos which don't have CORS headers.
 *
 * Usage: /api/image-proxy?url=<encoded-url>
 */

// Allowed domains for security
const ALLOWED_DOMAINS = [
  "observation.org",
  "waarneming.nl",
  "inaturalist-open-data.s3.amazonaws.com",
  "static.inaturalist.org",
  "live.staticflickr.com",
];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);

    // Security check: only allow specific domains
    const isAllowed = ALLOWED_DOMAINS.some(domain =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403 }
      );
    }

    // Fetch the image
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Naturae/1.0 (https://naturae.app)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400", // Cache for 1 day
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[Image Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 }
    );
  }
}
