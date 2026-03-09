import { createClient } from "@/src/lib/supabase/server";
import type { UpdateProfileInput } from "@/src/lib/validations/profiles";

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { data, error };
}

import type { Json } from "@/src/types/database";

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const supabase = await createClient();
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.full_name !== undefined) updateData.full_name = input.full_name;
  if (input.country !== undefined) updateData.country = input.country;
  if (input.company_name !== undefined)
    updateData.company_name = input.company_name;
  if (input.metadata !== undefined)
    updateData.metadata = input.metadata as Json;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  return { data, error };
}

export async function getCreditsBalance(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  return { data: data?.credits ?? 0, error };
}
