import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { ModelsPageClient } from "@/src/components/models/ModelsPageClient";

export default async function ModelsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: userModels }, { data: presetModels }] = await Promise.all([
    supabase
      .from("fashion_models")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_preset", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("fashion_models")
      .select("*")
      .eq("is_preset", true)
      .order("name"),
  ]);

  return (
    <ModelsPageClient
      userModels={userModels ?? []}
      presetModels={presetModels ?? []}
    />
  );
}
