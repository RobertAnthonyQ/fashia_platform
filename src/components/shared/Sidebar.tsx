"use client";

import Link from "next/link";
import { Layers, Users, Image, Zap, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProfile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  credits: number | null;
}

interface SidebarProps {
  activePath: string;
  profile?: SidebarProfile;
}

const navItems = [
  { href: "/studio", icon: Layers, label: "Studio" },
  { href: "/models", icon: Users, label: "Models" },
  { href: "/gallery", icon: Image, label: "Gallery" },
  { href: "/credits", icon: Zap, label: "Credits" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ activePath, profile }: SidebarProps) {
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (profile?.email?.[0]?.toUpperCase() ?? "U");

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-[#27272A] bg-[#09090B] md:flex">
      {/* Logo: Fash(white) i(white) •(green dot) a(white) */}
      <div className="flex h-16 items-center gap-0.5 px-6">
        <span className="text-xl font-bold font-heading text-[#FAFAFA]">
          Fash
        </span>
        <span className="text-xl font-bold font-heading text-[#FAFAFA]">i</span>
        <span className="mx-px inline-block h-[5px] w-[5px] rounded-full bg-[#BEFF00]" />
        <span className="text-xl font-bold font-heading text-[#FAFAFA]">a</span>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-[#27272A]" />

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = activePath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors",
                isActive
                  ? "bg-[#BEFF00]/8 text-[#BEFF00] font-medium"
                  : "text-[#71717A] hover:bg-[#27272A] hover:text-[#A1A1AA]",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Section */}
      <div className="flex flex-col gap-3 p-4">
        {/* Credit Badge */}
        <div className="flex h-9 items-center gap-1.5 rounded-lg bg-[#18181B] px-3">
          <span className="text-[13px] text-[#BEFF00]">⚡</span>
          <span className="text-[13px] font-medium text-[#FAFAFA]">
            {profile?.credits ?? 0} credits
          </span>
          <div className="flex-1" />
          <span className="rounded bg-[#BEFF00] px-1.5 py-0.5 text-[10px] font-bold text-[#09090B]">
            PRO
          </span>
        </div>

        {/* User Row */}
        <div className="flex h-10 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3F3F46]">
            <span className="text-xs font-medium text-[#A1A1AA]">
              {initials}
            </span>
          </div>
          <div className="flex flex-col gap-px overflow-hidden">
            <span className="truncate text-[13px] font-medium text-[#FAFAFA]">
              {profile?.full_name ?? "User"}
            </span>
            <span className="truncate text-[11px] text-[#71717A]">
              {profile?.email}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Divider */}
      <div className="h-px w-full bg-[#27272A]" />
    </aside>
  );
}
