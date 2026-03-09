import { createClient } from "@/src/lib/supabase/server";
import type { Database } from "@/src/types/database";

type MediaType = Database["public"]["Enums"]["media_type"];

interface CreateOutputInput {
  image_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  media_type?: MediaType;
  angle?: string;
  duration_seconds?: number;
  metadata?: Record<string, unknown>;
}

export async function listOutputsByGeneration(generationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_outputs")
    .select("*")
    .eq("generation_id", generationId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function createOutput(
  generationId: string,
  input: CreateOutputInput,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_outputs")
    .insert({
      generation_id: generationId,
      image_url: input.image_url ?? null,
      video_url: input.video_url ?? null,
      thumbnail_url: input.thumbnail_url ?? null,
      media_type: input.media_type ?? "image",
      angle: input.angle ?? null,
      duration_seconds: input.duration_seconds ?? null,
      metadata:
        (input.metadata as Database["public"]["Tables"]["generated_outputs"]["Insert"]["metadata"]) ??
        null,
    })
    .select()
    .single();

  return { data, error };
}

export async function toggleFavorite(userId: string, outputId: string) {
  const supabase = await createClient();

  // Verify ownership through generation
  const { data: output, error: fetchError } = await supabase
    .from("generated_outputs")
    .select("id, is_favorite, generation_id, generations!inner(user_id)")
    .eq("id", outputId)
    .single();

  if (fetchError || !output) {
    return { data: null, error: fetchError ?? new Error("Not found") };
  }

  const generation = output.generations as unknown as { user_id: string };
  if (generation.user_id !== userId) {
    return { data: null, error: new Error("Not found") };
  }

  const { data, error } = await supabase
    .from("generated_outputs")
    .update({ is_favorite: !output.is_favorite })
    .eq("id", outputId)
    .select()
    .single();

  return { data, error };
}

export async function setFavorite(
  userId: string,
  outputId: string,
  isFavorite: boolean,
) {
  const supabase = await createClient();

  // Verify ownership through generation
  const { data: output, error: fetchError } = await supabase
    .from("generated_outputs")
    .select("id, generation_id, generations!inner(user_id)")
    .eq("id", outputId)
    .single();

  if (fetchError || !output) {
    return { data: null, error: fetchError ?? new Error("Not found") };
  }

  const generation = output.generations as unknown as { user_id: string };
  if (generation.user_id !== userId) {
    return { data: null, error: new Error("Not found") };
  }

  const { data, error } = await supabase
    .from("generated_outputs")
    .update({ is_favorite: isFavorite })
    .eq("id", outputId)
    .select()
    .single();

  return { data, error };
}

export async function listFavorites(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_outputs")
    .select("*, generations!inner(user_id, garment_id, model_id)")
    .eq("generations.user_id", userId)
    .eq("is_favorite", true)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function deleteOutput(userId: string, outputId: string) {
  const supabase = await createClient();

  // Verify ownership through generation
  const { data: output, error: fetchError } = await supabase
    .from("generated_outputs")
    .select("id, generation_id, generations!inner(user_id)")
    .eq("id", outputId)
    .single();

  if (fetchError || !output) {
    return { data: null, error: fetchError ?? new Error("Not found") };
  }

  const generation = output.generations as unknown as { user_id: string };
  if (generation.user_id !== userId) {
    return { data: null, error: new Error("Not found") };
  }

  const { error } = await supabase
    .from("generated_outputs")
    .delete()
    .eq("id", outputId);

  return { data: { id: outputId }, error };
}
