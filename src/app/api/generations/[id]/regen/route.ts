import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { debitCredits, refundCredits } from "@/src/lib/services/credits";
import { fireProcessGeneration } from "@/src/lib/services/process-generation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/generations/:id/regen
 * Re-generates using the same model, garment, and config. Costs 3 credits.
 * Triggers the process endpoint to do the actual generation.
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

    // Get parent generation
    const { data: parent, error: parentError } = await admin
      .from("generations")
      .select("*")
      .eq("id", parentId)
      .eq("user_id", user.id)
      .single();

    if (parentError || !parent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Re-gen costs 3 credits
    const { data: ok, error: creditError } = await debitCredits(
      user.id,
      3,
      "generation",
      "Re-generation",
    );
    if (creditError || !ok) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }

    // Create new generation with same config
    const { data: gen, error: genError } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        model_id: parent.model_id,
        garment_id: parent.garment_id,
        config: parent.config,
        output_type: parent.output_type,
        credits_used: 3,
        prompt_used: "",
        parent_id: parentId,
        status: "pending",
      })
      .select()
      .single();

    if (genError || !gen) {
      await refundCredits(user.id, 3, parentId);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // Trigger generation processing directly (no HTTP roundtrip)
    fireProcessGeneration(gen.id);

    return NextResponse.json(gen, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
