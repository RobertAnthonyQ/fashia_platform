import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

/**
 * Proxy endpoint to serve Supabase Storage files.
 * Usage: /api/storage/model-refs/userId/filename.png
 * Uses admin client to bypass RLS on storage buckets.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    if (!path || path.length < 2) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const bucket = path[0];
    const filePath = path.slice(1).join("/");

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (error || !data) {
      console.error("Storage download error:", error);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const contentType = data.type || "image/png";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Storage proxy error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
