import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { getGeneration } from "@/src/lib/services/generations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/generations/{id}:
 *   get:
 *     summary: Get a specific generation with all outputs
 *     tags: [Generations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Generation data with outputs
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await getGeneration(user.id, id);
    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
