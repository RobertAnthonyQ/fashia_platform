import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { generateFashionPhoto } from "@/src/lib/ai/generate-photo";

/**
 * Internal endpoint to process a pending generation.
 * Uses admin client for all DB/storage writes to bypass RLS.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: generationId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch generation with model and garment data
    const { data: gen, error: fetchError } = await admin
      .from("generations")
      .select(
        "*, fashion_models(id, name, gender, description, ref_face_url, metadata), garments(id, image_url, description)",
      )
      .eq("id", generationId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !gen) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    // Update status to processing
    await admin
      .from("generations")
      .update({ status: "processing" })
      .eq("id", generationId);

    const model = gen.fashion_models as unknown as {
      id: string;
      name: string;
      gender: string;
      description: string | null;
      ref_face_url: string | null;
      metadata: Record<string, unknown> | null;
    };

    const garment = gen.garments as unknown as {
      id: string;
      image_url: string;
      description: string | null;
    };

    const metadata = model.metadata;
    const modelDescription =
      (metadata?.full_description as string) ??
      model.description ??
      `${model.name}, ${model.gender} fashion model`;

    const config = (gen.config as Record<string, string>) ?? {};

    console.log("[process] Model:", model.name, "| ref_face_url:", model.ref_face_url);
    console.log("[process] Garment image_url:", garment.image_url);
    console.log("[process] Config keys:", Object.keys(config));

    // Generate the photo with art director selections
    const { buffer, mimeType, prompt } = await generateFashionPhoto({
      modelName: model.name,
      modelGender: model.gender,
      modelDescription,
      refFaceUrl: model.ref_face_url,
      garmentImageUrl: garment.image_url,
      garmentDescription: config.garment_description ?? garment.description ?? "the garment shown in the reference image",
      accessorySet: config.accessory_set ?? "minimal complementary accessories with appropriate footwear",
      location: config.location ?? "professional photography studio with clean white backdrop",
      pose: config.pose ?? "standing in a natural confident pose",
      lighting: config.lighting ?? "professional studio lighting with soft shadows",
      imageModel: (config.image_model as "gemini-3-pro-image-preview" | "gemini-2.5-flash-image") ?? "gemini-2.5-flash-image",
    });

    // Upload to storage
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const filePath = `${user.id}/${generationId}/${Date.now()}_output.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("outputs")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      await admin
        .from("generations")
        .update({ status: "failed", error_message: "Failed to upload generated image" })
        .eq("id", generationId);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const outputUrl = `/api/storage/outputs/${filePath}`;

    // Create output record
    const { error: outputError } = await admin
      .from("generated_outputs")
      .insert({
        generation_id: generationId,
        image_url: outputUrl,
        media_type: "image",
        angle: "front",
      });

    if (outputError) {
      console.error("Output record error:", outputError);
    }

    // Update generation to completed
    await admin
      .from("generations")
      .update({
        status: "completed",
        prompt_used: prompt,
        ai_model_used: config.image_model ?? "gemini-2.5-flash-image",
      })
      .eq("id", generationId);

    return NextResponse.json({ status: "completed" });
  } catch (err) {
    console.error("Generation processing error:", err);

    await admin
      .from("generations")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", generationId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await admin.rpc("refund_credits", {
          p_user_id: user.id,
          p_amount: 5,
          p_generation_id: generationId,
        });
      }
    } catch {
      console.error("Failed to refund credits");
    }

    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
