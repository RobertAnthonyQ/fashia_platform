import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { analyzeGarment } from "@/src/lib/ai/art-director";

/**
 * POST /api/garments/:id/analyze
 * Art Director AI analyzes garment and returns creative suggestions.
 */
export async function POST(
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

    const body = await req.json().catch(() => ({}));
    const modelGender = body.model_gender as string | undefined;

    const { data: garment, error } = await supabase
      .from("garments")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !garment) {
      return NextResponse.json({ error: "Garment not found" }, { status: 404 });
    }

    const suggestions = await analyzeGarment(garment.image_url, modelGender);

    return NextResponse.json(suggestions);
  } catch (err) {
    console.error("Analyze garment error:", err);
    return NextResponse.json(
      { error: "Failed to analyze garment" },
      { status: 500 },
    );
  }
}
