import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHome } from "@/src/components/shared/DashboardHome";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    { count: modelCount },
    { count: garmentCount },
    { data: recentOutputs },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("fashion_models")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("garments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("generated_outputs")
      .select("*, generations!inner(user_id)")
      .eq("generations.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const photoCount = recentOutputs?.length ?? 0;

  return (
    <DashboardHome
      profile={profile}
      modelCount={modelCount ?? 0}
      garmentCount={garmentCount ?? 0}
      photoCount={photoCount}
      recentOutputs={recentOutputs ?? []}
    />
  );
}
