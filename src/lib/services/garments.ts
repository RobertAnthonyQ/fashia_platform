import { createClient } from "@/src/lib/supabase/server";
import type { Json } from "@/src/types/database";

export async function listGarments(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("garments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getGarment(userId: string, garmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("garments")
    .select("*")
    .eq("id", garmentId)
    .eq("user_id", userId)
    .single();

  return { data, error };
}

export async function createGarment(
  userId: string,
  imageUrl: string,
  description?: string,
  analysis?: Json,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("garments")
    .insert({
      user_id: userId,
      image_url: imageUrl,
      description: description ?? null,
      analysis: analysis ?? null,
    })
    .select()
    .single();

  return { data, error };
}

export async function deleteGarment(userId: string, garmentId: string) {
  const supabase = await createClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("garments")
    .select("id, user_id")
    .eq("id", garmentId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !existing) {
    return { data: null, error: fetchError ?? new Error("Not found") };
  }

  const { error } = await supabase
    .from("garments")
    .delete()
    .eq("id", garmentId)
    .eq("user_id", userId);

  return { data: { id: garmentId }, error };
}
