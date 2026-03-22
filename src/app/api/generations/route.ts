import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import {
  listGenerations,
  createGeneration,
} from "@/src/lib/services/generations";
import { debitCredits } from "@/src/lib/services/credits";
import {
  createGenerationSchema,
  generationFiltersSchema,
} from "@/src/lib/validations/generations";

/**
 * @swagger
 * /api/generations:
 *   get:
 *     summary: List user's generations with optional filters
 *     tags: [Generations]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *       - in: query
 *         name: garment_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: model_id
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
 *         description: Paginated list of generations
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

    const searchParams = Object.fromEntries(req.nextUrl.searchParams);
    const parsed = generationFiltersSchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error, count, page, limit } = await listGenerations(
      user.id,
      parsed.data,
    );
    if (error) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ data, total: count, page, limit });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/generations:
 *   post:
 *     summary: Create a new generation (debits credits)
 *     tags: [Generations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [model_id, garment_id]
 *             properties:
 *               model_id:
 *                 type: string
 *               garment_id:
 *                 type: string
 *               config:
 *                 type: object
 *               output_type:
 *                 type: string
 *                 enum: [image, video]
 *     responses:
 *       201:
 *         description: Generation created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       402:
 *         description: Insufficient credits
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
    const parsed = createGenerationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Determine credit cost based on model
    const imageModel = parsed.data.config?.image_model ?? "gemini-2.5-flash-image";
    const creditCost = imageModel === "gemini-3-pro-image-preview" ? 10 : 5;

    const { data: ok, error: creditError } = await debitCredits(
      user.id,
      creditCost,
      "generation",
      `Photo generation (${imageModel === "gemini-3-pro-image-preview" ? "Pro" : "Flash"})`,
    );
    if (creditError || !ok) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    const { data, error } = await createGeneration(user.id, parsed.data, creditCost);
    if (error) {
      await supabase.rpc("refund_credits", {
        p_user_id: user.id,
        p_amount: creditCost,
        p_generation_id: "",
      });
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // Trigger generation processing asynchronously
    // We fire-and-forget so the client can start polling immediately
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const cookieHeader = req.headers.get("cookie") ?? "";
    fetch(`${baseUrl}/api/generations/${data!.id}/process`, {
      method: "POST",
      headers: { cookie: cookieHeader },
    }).catch((err) => {
      console.error("Failed to trigger generation process:", err);
    });

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
