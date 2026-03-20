"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/src/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Zap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/src/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface SettingsPageClientProps {
  profile: Profile;
}

export function SettingsPageClient({ profile }: SettingsPageClientProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [companyName, setCompanyName] = useState(profile.company_name ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName.trim() || undefined,
        company_name: companyName.trim() || undefined,
        country: country.trim() || undefined,
      }),
    });

    setSaving(false);
    if (res.ok) {
      toast.success("Profile updated");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Failed to update profile");
    }
  }

  return (
    <div className="space-y-6 p-6 md:p-10 max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account" />

      {/* Profile form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-sm font-medium text-zinc-200 mb-4">Profile</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Email</Label>
            <Input
              value={profile.email}
              disabled
              className="border-zinc-700 bg-zinc-800 text-zinc-500 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-zinc-400 text-xs">
              Full Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-zinc-400 text-xs">
              Company Name
            </Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Fashia Inc."
              className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-zinc-400 text-xs">
              Country
            </Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Spain"
              className="border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg"
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="bg-[#BEFF00] text-black hover:bg-[#BEFF00]/90 font-semibold rounded-lg"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </form>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Plan section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-sm font-medium text-zinc-200 mb-3">Plan</h3>
        <div className="flex items-center gap-3">
          <Badge
            variant="secondary"
            className="bg-zinc-800 text-zinc-300 capitalize"
          >
            <Zap className="mr-1 h-3 w-3" />
            {profile.plan ?? "free"} plan
          </Badge>
          <span className="text-sm text-zinc-400">
            {profile.credits ?? 0} credits remaining
          </span>
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Danger zone */}
      <div className="rounded-xl border border-red-900/50 bg-red-950/10 p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-medium text-red-400">Danger Zone</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          Deleting your account will permanently remove all your data, models,
          garments, and generated photos.
        </p>
        <Button
          variant="outline"
          className="border-red-800 text-red-400 hover:bg-red-900/20"
          disabled
        >
          Delete Account (Coming Soon)
        </Button>
      </div>
    </div>
  );
}
