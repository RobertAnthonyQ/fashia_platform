import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { generateModelProfile } from "@/src/lib/ai/generate-model-profile";
import type { Json } from "@/src/types/database";

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

    // Fetch the model
    const { data: model, error: fetchError } = await supabase
      .from("fashion_models")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // Generate profile with Gemini
    const profile = await generateModelProfile({
      name: model.name,
      gender: model.gender,
      age: model.age ?? undefined,
      country: model.country ?? undefined,
      style: model.style ?? undefined,
    });

    // Save metadata
    const { data: updated, error: updateError } = await supabase
      .from("fashion_models")
      .update({
        metadata: profile as unknown as Json,
        description: profile.full_description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Generate profile error:", err);
    return NextResponse.json(
      { error: "Failed to generate profile" },
      { status: 500 },
    );
  }
}
