import { createClient } from "@/src/lib/supabase/server";
import type {
  CreateFashionModelInput,
  UpdateFashionModelInput,
} from "@/src/lib/validations/fashion-models";

export async function listModels(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fashion_models")
    .select("*")
    .or(`user_id.eq.${userId},is_preset.eq.true`)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getModel(userId: string, modelId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fashion_models")
    .select("*")
    .eq("id", modelId)
    .or(`user_id.eq.${userId},is_preset.eq.true`)
    .single();

  return { data, error };
}

export async function createModel(
  userId: string,
  input: CreateFashionModelInput,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fashion_models")
    .insert({
      ...input,
      user_id: userId,
      is_preset: false,
    })
    .select()
    .single();

  return { data, error };
}

export async function updateModel(
  userId: string,
  modelId: string,
  input: UpdateFashionModelInput,
) {
  const supabase = await createClient();

  // Verify ownership and not preset
  const { data: existing, error: fetchError } = await supabase
    .from("fashion_models")
    .select("id, is_preset, user_id")
    .eq("id", modelId)
    .single();

  if (fetchError || !existing) {
    return { data: null, error: fetchError ?? new Error("Not found") };
  }

  if (existing.user_id !== userId || existing.is_preset) {
    return { data: null, error: new Error("Not found") };
  }

  const { data, error } = await supabase
    .from("fashion_models")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", modelId)
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
}

export async function deleteModel(userId: string, modelId: string) {
  const supabase = await createClient();

  // Verify ownership and not preset
  const { data: existing, error: fetchError } = await supabase
    .from("fashion_models")
    .select("id, is_preset, user_id")
    .eq("id", modelId)
    .single();

  if (fetchError || !existing) {
    return { data: null, error: fetchError ?? new Error("Not found") };
  }

  if (existing.user_id !== userId || existing.is_preset) {
    return { data: null, error: new Error("Not found") };
  }

  const { error } = await supabase
    .from("fashion_models")
    .delete()
    .eq("id", modelId)
    .eq("user_id", userId);

  return { data: { id: modelId }, error };
}

export async function listPresets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fashion_models")
    .select("*")
    .eq("is_preset", true)
    .order("name");

  return { data, error };
}
