"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

interface DashboardShellProps {
  children: React.ReactNode;
  profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    credits: number | null;
  };
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Sidebar activePath={pathname} profile={profile} />
      <main className="min-h-screen pb-16 md:pb-0 md:ml-[240px]">
        {children}
      </main>
      <MobileNav activePath={pathname} />
    </div>
  );
}
