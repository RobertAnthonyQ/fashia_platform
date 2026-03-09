import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { listModels, createModel } from "@/src/lib/services/fashion-models";
import { createFashionModelSchema } from "@/src/lib/validations/fashion-models";

/**
 * @swagger
 * /api/models:
 *   get:
 *     summary: List user's fashion models and presets
 *     tags: [Models]
 *     responses:
 *       200:
 *         description: List of models
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

    const { data, error } = await listModels(user.id);
    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/models:
 *   post:
 *     summary: Create a new fashion model
 *     tags: [Models]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, gender]
 *             properties:
 *               name:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, non_binary]
 *               country:
 *                 type: string
 *               age:
 *                 type: integer
 *               style:
 *                 type: string
 *               ref_face_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created model
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createFashionModelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await createModel(user.id, parsed.data);
    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
