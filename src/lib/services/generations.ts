import { createClient } from "@/src/lib/supabase/server";
import type {
  CreateGenerationInput,
  GenerationFilters,
} from "@/src/lib/validations/generations";
import type { Database } from "@/src/types/database";

type GenerationStatus = Database["public"]["Enums"]["generation_status"];

export async function listGenerations(
  userId: string,
  filters?: GenerationFilters,
) {
  const supabase = await createClient();
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("generations")
    .select("*, fashion_models(name), garments(image_url, description)", {
      count: "exact",
    })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.garment_id) {
    query = query.eq("garment_id", filters.garment_id);
  }
  if (filters?.model_id) {
    query = query.eq("model_id", filters.model_id);
  }

  const { data, error, count } = await query;

  return { data, error, count, page, limit };
}

export async function getGeneration(userId: string, generationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .select(
      "*, generated_outputs(*), fashion_models(name, ref_face_url), garments(image_url, description)",
    )
    .eq("id", generationId)
    .eq("user_id", userId)
    .single();

  return { data, error };
}

export async function createGeneration(
  userId: string,
  input: CreateGenerationInput,
  creditCost: number = 5,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: userId,
      model_id: input.model_id,
      garment_id: input.garment_id,
      config:
        input.config as unknown as Database["public"]["Tables"]["generations"]["Insert"]["config"],
      output_type: input.output_type,
      credits_used: creditCost,
      prompt_used: "",
      status: "pending" as GenerationStatus,
    })
    .select()
    .single();

  return { data, error };
}

export async function updateGenerationStatus(
  generationId: string,
  status: GenerationStatus,
  errorMessage?: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .update({
      status,
      error_message: errorMessage ?? null,
    })
    .eq("id", generationId)
    .select()
    .single();

  return { data, error };
}

export async function getGenerationsByGarment(
  userId: string,
  garmentId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .eq("garment_id", garmentId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getGenerationsByModel(userId: string, modelId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .eq("model_id", modelId)
    .order("created_at", { ascending: false });

  return { data, error };
}
