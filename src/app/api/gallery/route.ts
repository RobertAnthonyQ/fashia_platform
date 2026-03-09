import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

/**
 * @swagger
 * /api/gallery:
 *   get:
 *     summary: List generated outputs (gallery) with filters
 *     tags: [Gallery]
 *     parameters:
 *       - in: query
 *         name: favorite
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: model_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: garment_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated gallery outputs
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const favorite = searchParams.get("favorite");
    const modelId = searchParams.get("model_id");
    const garmentId = searchParams.get("garment_id");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const offset = (page - 1) * limit;

    let query = supabase
      .from("generated_outputs")
      .select("*, generations!inner(user_id, model_id, garment_id, status)", {
        count: "exact",
      })
      .eq("generations.user_id", user.id)
      .eq("generations.status", "completed")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (favorite === "true") {
      query = query.eq("is_favorite", true);
    }
    if (modelId) {
      query = query.eq("generations.model_id", modelId);
    }
    if (garmentId) {
      query = query.eq("generations.garment_id", garmentId);
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ data, total: count, page, limit });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
