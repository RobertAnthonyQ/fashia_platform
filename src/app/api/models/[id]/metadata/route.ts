import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import type { Json } from "@/src/types/database";

export async function PUT(
  req: Request,
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

    // Verify ownership
    const { data: model, error: fetchError } = await supabase
      .from("fashion_models")
      .select("id, user_id, is_preset")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !model) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (model.is_preset) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const metadata = body.metadata;

    if (!metadata || typeof metadata !== "object") {
      return NextResponse.json(
        { error: "Validation error: metadata must be an object" },
        { status: 400 },
      );
    }

    // Build full_description from metadata if it exists
    const fullDescription =
      typeof metadata.full_description === "string"
        ? metadata.full_description
        : undefined;

    const { data: updated, error: updateError } = await supabase
      .from("fashion_models")
      .update({
        metadata: metadata as unknown as Json,
        ...(fullDescription ? { description: fullDescription } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update metadata" },
        { status: 500 },
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
