import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { generateFaceImage } from "@/src/lib/ai/generate-face";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the model with metadata
    const { data: model, error: fetchError } = await supabase
      .from("fashion_models")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const metadata = model.metadata as Record<string, unknown> | null;
    const fullDescription =
      metadata?.full_description as string | undefined ??
      model.description ??
      "";

    if (!fullDescription) {
      return NextResponse.json(
        { error: "Generate profile first before generating a face" },
        { status: 400 },
      );
    }

    // Generate face image
    const { buffer, mimeType } = await generateFaceImage({
      fullDescription,
      name: model.name,
      gender: model.gender,
    });

    // Upload to Supabase Storage
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const filePath = `${user.id}/${Date.now()}_face.${ext}`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("model-refs")
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 },
      );
    }

    // Build internal proxy URL
    const proxyUrl = `/api/storage/model-refs/${filePath}`;

    // Update model with face URL
    const { data: updated, error: updateError } = await supabase
      .from("fashion_models")
      .update({
        ref_face_url: proxyUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to save face URL" },
        { status: 500 },
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Generate face error:", err);
    return NextResponse.json(
      { error: "Failed to generate face" },
      { status: 500 },
    );
  }
}
