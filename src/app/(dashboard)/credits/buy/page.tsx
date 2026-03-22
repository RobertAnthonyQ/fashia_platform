import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreditPricing } from "@/src/components/credits/CreditPricing";

export default async function BuyCreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <CreditPricing />;
}
