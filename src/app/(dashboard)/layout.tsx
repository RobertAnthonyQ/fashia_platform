import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { DashboardShell } from "@/src/components/shared/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <DashboardShell
      profile={{
        full_name: profile?.full_name ?? null,
        email: user.email ?? "",
        avatar_url: profile?.avatar_url ?? null,
        credits: profile?.credits ?? 0,
      }}
    >
      {children}
    </DashboardShell>
  );
}
