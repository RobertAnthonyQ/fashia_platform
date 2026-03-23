import { createAdminClient } from "@/src/lib/supabase/admin";
import { generateFashionPhoto } from "@/src/lib/ai/generate-photo";

/**
 * Process a pending generation: generate image, upload, update DB.
 * Runs entirely with admin client — no user auth needed.
 * Can be called directly from any server-side code (no HTTP roundtrip).
 */
export async function processGeneration(generationId: string) {
  const admin = createAdminClient();

  // Fetch generation with model and garment data
  const { data: gen, error: fetchError } = await admin
    .from("generations")
    .select(
      "*, fashion_models(id, name, gender, description, ref_face_url, metadata), garments(id, image_url, description)",
    )
    .eq("id", generationId)
    .single();

  if (fetchError || !gen) {
    throw new Error("Generation not found");
  }

  const userId = gen.user_id;

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

  // Build accessory string from arrays + custom fields
  const accessoryParts: string[] = [];
  if (Array.isArray(config.calzado)) accessoryParts.push(...config.calzado);
  if (config.custom_calzado) accessoryParts.push(config.custom_calzado);
  if (Array.isArray(config.accesorios)) accessoryParts.push(...config.accesorios);
  if (config.custom_accesorios) accessoryParts.push(config.custom_accesorios);
  if (Array.isArray(config.complementos)) accessoryParts.push(...config.complementos);
  if (config.custom_complementos) accessoryParts.push(config.custom_complementos);

  const accessorySet = accessoryParts.length > 0
    ? accessoryParts.join(", ")
    : "minimal complementary accessories";

  const location = config.custom_location || config.location || "professional photography studio with clean white backdrop";
  const pose = config.custom_pose || config.pose || "standing in a natural confident pose";
  const lighting = config.custom_lighting || config.lighting || "professional studio lighting with soft shadows";

  // Generate the photo with art director selections
  const { buffer, mimeType, prompt } = await generateFashionPhoto({
    modelName: model.name,
    modelGender: model.gender,
    modelDescription,
    refFaceUrl: model.ref_face_url,
    garmentImageUrl: garment.image_url,
    garmentDescription: config.garment_description ?? garment.description ?? "the garment shown in the reference image",
    accessorySet,
    location,
    pose,
    lighting,
    customPrompt: config.custom_prompt as string | undefined,
    imageModel: (config.image_model as "gemini-3-pro-image-preview" | "gemini-2.5-flash-image") ?? "gemini-2.5-flash-image",
  });

  // Upload to storage
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const filePath = `${userId}/${generationId}/${Date.now()}_output.${ext}`;

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
    throw new Error("Upload failed");
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

  return { status: "completed" };
}

/**
 * Fire-and-forget wrapper: runs processGeneration and handles errors
 * (marks generation as failed + refunds credits on error).
 */
export function fireProcessGeneration(generationId: string) {
  processGeneration(generationId).catch(async (err) => {
    console.error("Generation processing error:", err);
    const admin = createAdminClient();

    await admin
      .from("generations")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", generationId);

    try {
      const { data: failedGen } = await admin
        .from("generations")
        .select("user_id, config")
        .eq("id", generationId)
        .single();

      if (failedGen) {
        const failedConfig = (failedGen.config as Record<string, string>) ?? {};
        const refundAmount = failedConfig.image_model === "gemini-3-pro-image-preview" ? 10 : 5;
        await admin.rpc("refund_credits", {
          p_user_id: failedGen.user_id,
          p_amount: refundAmount,
          p_generation_id: generationId,
        });
      }
    } catch {
      console.error("Failed to refund credits");
    }
  });
}
