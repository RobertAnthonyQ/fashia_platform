import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreditsPageClient } from "@/src/components/credits/CreditsPageClient";

export default async function CreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, historyRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("credits, plan")
      .eq("id", user.id)
      .single(),
    supabase
      .from("credit_ledger")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(0, 19),
  ]);

  return (
    <CreditsPageClient
      credits={profileRes.data?.credits ?? 0}
      plan={(profileRes.data?.plan as string) ?? "free"}
      initialHistory={historyRes.data ?? []}
      totalHistory={historyRes.count ?? 0}
    />
  );
}
