import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalleryPageClient } from "@/src/components/gallery/GalleryPageClient";

export default async function GalleryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [outputsRes, modelsRes] = await Promise.all([
    supabase
      .from("generated_outputs")
      .select("*, generations!inner(user_id, model_id, garment_id, status)", {
        count: "exact",
      })
      .eq("generations.user_id", user.id)
      .eq("generations.status", "completed")
      .order("created_at", { ascending: false })
      .range(0, 19),
    supabase
      .from("fashion_models")
      .select("id, name")
      .or(`user_id.eq.${user.id},is_preset.eq.true`),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outputs = (outputsRes.data ?? []) as any[];

  return (
    <GalleryPageClient
      initialOutputs={outputs}
      totalCount={outputsRes.count ?? 0}
      models={modelsRes.data ?? []}
    />
  );
}
