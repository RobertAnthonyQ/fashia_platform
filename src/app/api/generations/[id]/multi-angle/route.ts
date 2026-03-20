import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { debitCredits, refundCredits } from "@/src/lib/services/credits";
import { generateAngleVariation } from "@/src/lib/ai/generate-variation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/generations/:id/multi-angle
 * Body: { angles: string[], image_model?: string }
 * Generates variations from different angles based on the parent's output image.
 * Cost: 3 credits per angle.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: parentId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const angles: string[] = body.angles ?? [];
    const imageModel = body.image_model ?? "gemini-2.5-flash-image";

    if (angles.length === 0) {
      return NextResponse.json({ error: "Select at least one angle" }, { status: 400 });
    }

    // Get parent generation with outputs
    const { data: parent, error: parentError } = await admin
      .from("generations")
      .select("*, generated_outputs(*)")
      .eq("id", parentId)
      .eq("user_id", user.id)
      .single();

    if (parentError || !parent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const outputs = parent.generated_outputs as Array<{ image_url: string | null }>;
    const sourceImageUrl = outputs?.[0]?.image_url;
    if (!sourceImageUrl) {
      return NextResponse.json({ error: "No source image found" }, { status: 400 });
    }

    // Cost: 3 credits per angle
    const totalCost = angles.length * 3;
    const { data: ok, error: creditError } = await debitCredits(
      user.id,
      totalCost,
      "generation",
      `Multi-angle (${angles.length} angles)`,
    );
    if (creditError || !ok) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // Create child generation record
    const { data: gen, error: genError } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        model_id: parent.model_id,
        garment_id: parent.garment_id,
        config: parent.config,
        output_type: "image",
        credits_used: totalCost,
        prompt_used: `Multi-angle: ${angles.join(", ")}`,
        parent_id: parentId,
        status: "processing",
        ai_model_used: imageModel,
      })
      .select()
      .single();

    if (genError || !gen) {
      await refundCredits(user.id, totalCost, parentId);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // Process each angle (fire-and-forget)
    processAngles(gen.id, user.id, sourceImageUrl, angles, imageModel).catch(
      (err) => console.error("Multi-angle processing error:", err),
    );

    return NextResponse.json(gen, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function processAngles(
  generationId: string,
  userId: string,
  sourceImageUrl: string,
  angles: string[],
  imageModel: string,
) {
  const admin = createAdminClient();

  try {
    for (const angle of angles) {
      console.log(`[multi-angle] Generating angle: ${angle}`);
      const { buffer, mimeType } = await generateAngleVariation(
        sourceImageUrl,
        angle,
        imageModel,
      );

      const ext = mimeType.includes("png") ? "png" : "jpg";
      const filePath = `${userId}/${generationId}/${Date.now()}_${angle}.${ext}`;

      await admin.storage.from("outputs").upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

      const outputUrl = `/api/storage/outputs/${filePath}`;

      await admin.from("generated_outputs").insert({
        generation_id: generationId,
        image_url: outputUrl,
        media_type: "image",
        angle,
      });
    }

    await admin
      .from("generations")
      .update({ status: "completed" })
      .eq("id", generationId);

    console.log(`[multi-angle] All ${angles.length} angles completed`);
  } catch (err) {
    console.error("[multi-angle] Failed:", err);
    await admin
      .from("generations")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", generationId);
  }
}
