import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { listModels, createModel } from "@/src/lib/services/fashion-models";
import { createFashionModelSchema } from "@/src/lib/validations/fashion-models";
import { generateModelProfile } from "@/src/lib/ai/generate-model-profile";
import type { Json } from "@/src/types/database";

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

    // 1. Create the model in DB
    const { data, error } = await createModel(user.id, parsed.data);
    if (error || !data) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // 2. Generate AI profile in the background (don't block response if it fails)
    try {
      const profile = await generateModelProfile({
        name: data.name,
        gender: data.gender,
        age: data.age ?? undefined,
        country: data.country ?? undefined,
        style: data.style ?? undefined,
      });

      await supabase
        .from("fashion_models")
        .update({
          metadata: profile as unknown as Json,
          description: profile.full_description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .eq("user_id", user.id);

      // Return model with metadata included
      const { data: updated } = await supabase
        .from("fashion_models")
        .select("*")
        .eq("id", data.id)
        .single();

      return NextResponse.json(updated ?? data, { status: 201 });
    } catch (aiError) {
      console.error("AI profile generation failed:", aiError);
      // Still return the created model even if AI fails
      return NextResponse.json(data, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
