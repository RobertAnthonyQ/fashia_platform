import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { StudioWizard } from "@/src/components/studio/StudioWizard";

export default async function StudioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [modelsRes, garmentsRes] = await Promise.all([
    supabase
      .from("fashion_models")
      .select("*")
      .or(`user_id.eq.${user.id},is_preset.eq.true`)
      .order("created_at", { ascending: false }),
    supabase
      .from("garments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <StudioWizard
      models={modelsRes.data ?? []}
      garments={garmentsRes.data ?? []}
    />
  );
}
