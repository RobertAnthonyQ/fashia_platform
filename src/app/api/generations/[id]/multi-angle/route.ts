import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import {
  getGeneration,
  createGeneration,
} from "@/src/lib/services/generations";
import { debitCredits, refundCredits } from "@/src/lib/services/credits";
import type { Database } from "@/src/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/generations/{id}/multi-angle:
 *   post:
 *     summary: Create multi-angle generation (child of parent)
 *     tags: [Generations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Multi-angle generation created
 *       401:
 *         description: Unauthorized
 *       402:
 *         description: Insufficient credits
 *       404:
 *         description: Parent generation not found
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id: parentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify parent generation exists and belongs to user
    const { data: parent, error: parentError } = await getGeneration(
      user.id,
      parentId,
    );
    if (parentError || !parent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Multi-angle costs 15 credits
    const { data: ok, error: creditError } = await debitCredits(
      user.id,
      15,
      "generation",
      "Multi-angle generation (x4)",
    );
    if (creditError || !ok) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    // Create child generation with parent_id
    const { data, error } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        model_id: parent.model_id,
        garment_id: parent.garment_id,
        config: parent.config,
        output_type: parent.output_type,
        credits_used: 15,
        prompt_used: parent.prompt_used,
        parent_id: parentId,
        status: "pending" as Database["public"]["Enums"]["generation_status"],
      })
      .select()
      .single();

    if (error || !data) {
      await refundCredits(user.id, 15, parentId);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
