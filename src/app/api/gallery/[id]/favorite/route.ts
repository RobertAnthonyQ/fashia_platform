import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { setFavorite } from "@/src/lib/services/generated-outputs";
import { toggleFavoriteSchema } from "@/src/lib/validations/generated-outputs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/gallery/{id}/favorite:
 *   put:
 *     summary: Toggle favorite status on a generated output
 *     tags: [Gallery]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_favorite]
 *             properties:
 *               is_favorite:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated output
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = toggleFavoriteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await setFavorite(
      user.id,
      id,
      parsed.data.is_favorite,
    );
    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
