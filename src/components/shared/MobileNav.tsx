"use client";

import Link from "next/link";
import { Sparkles, Users, Image, Zap, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  activePath: string;
}

const navItems = [
  { href: "/studio", icon: Sparkles, label: "Studio" },
  { href: "/models", icon: Users, label: "Models" },
  { href: "/gallery", icon: Image, label: "Gallery" },
  { href: "/credits", icon: Zap, label: "Credits" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileNav({ activePath }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = activePath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 text-xs",
                isActive ? "text-[#BEFF00]" : "text-zinc-500",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
