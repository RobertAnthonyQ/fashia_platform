import { createClient } from "@/src/lib/supabase/server";
import type { Database } from "@/src/types/database";

type CreditType = Database["public"]["Enums"]["credit_type"];

export async function getBalance(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  return { data: data?.credits ?? 0, error };
}

export async function getHistory(userId: string, page = 1, limit = 20) {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("credit_ledger")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return { data, error, count, page, limit };
}

export async function debitCredits(
  userId: string,
  amount: number,
  type: CreditType,
  description: string,
  generationId?: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("debit_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_generation_id: generationId,
  });

  return { data: data as boolean, error };
}

export async function refundCredits(
  userId: string,
  amount: number,
  generationId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("refund_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_generation_id: generationId,
  });

  return { error };
}

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditType,
  description: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
  });

  return { error };
}
