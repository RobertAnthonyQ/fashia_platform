import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { listPresets } from "@/src/lib/services/fashion-models";

/**
 * @swagger
 * /api/models/presets:
 *   get:
 *     summary: List preset fashion models
 *     tags: [Models]
 *     responses:
 *       200:
 *         description: List of preset models
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await listPresets();
    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
