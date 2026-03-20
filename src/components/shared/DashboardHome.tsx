"use client";

import Link from "next/link";
import Image from "next/image";
import type { Database } from "@/src/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface DashboardHomeProps {
  profile: Profile | null;
  modelCount: number;
  garmentCount: number;
  photoCount: number;
  recentOutputs: Array<{
    id: string;
    image_url: string | null;
    thumbnail_url: string | null;
  }>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHome({
  profile,
  modelCount,
  garmentCount,
  photoCount,
  recentOutputs,
}: DashboardHomeProps) {
  const greeting = getGreeting();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const credits = profile?.credits ?? 0;

  const stats = [
    { label: "Models", value: modelCount },
    { label: "Garments", value: garmentCount },
    { label: "Photos", value: photoCount },
    { label: "Credits", value: credits, isCredits: true },
  ];

  return (
    <div className="flex flex-col py-6 px-4 sm:py-9 sm:px-10 gap-5 sm:gap-7 max-w-[900px]">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-[26px] font-bold text-[#FAFAFA]">
          {greeting}, {firstName} ✦
        </h1>
        <p className="text-[14px] text-[#71717A]">
          Here&apos;s what&apos;s happening with your account.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-1 rounded-xl p-3 sm:p-5 h-20 sm:h-24"
            style={{
              backgroundColor: "#18181B",
              border: stat.isCredits
                ? "1px solid #BEFF0033"
                : "1px solid #27272A",
            }}
          >
            <span
              className="font-heading text-[24px] sm:text-[32px] font-bold leading-tight"
              style={{ color: stat.isCredits ? "#BEFF00" : "#FAFAFA" }}
            >
              {stat.value}
            </span>
            <span className="text-[12px] text-[#71717A]">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Recent Generations */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[16px] font-semibold text-[#FAFAFA]">
            Recent Generations
          </h2>
          <Link
            href="/gallery"
            className="text-[13px] text-[#71717A] hover:text-[#A1A1AA] transition-colors"
          >
            View all →
          </Link>
        </div>

        {recentOutputs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {recentOutputs.slice(0, 3).map((output) => (
              <div
                key={output.id}
                className="relative h-[200px] rounded-xl overflow-hidden bg-[#18181B]"
              >
                {(output.thumbnail_url ?? output.image_url) ? (
                  <Image
                    src={(output.thumbnail_url ?? output.image_url)!}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#52525B] text-[13px]">
                    No preview
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] rounded-xl bg-[#18181B] border border-[#27272A] text-[#52525B] text-[13px]">
            No generations yet
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-[16px] font-semibold text-[#FAFAFA]">
          Quick Actions
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/studio"
            className="flex items-center justify-center h-11 px-5 rounded-[10px] bg-[#BEFF00] text-[#09090B] text-[14px] font-semibold hover:opacity-90 transition-opacity"
          >
            ✨ New Session
          </Link>
          <Link
            href="/studio"
            className="flex items-center justify-center h-11 px-5 rounded-[10px] bg-[#18181B] border border-[#27272A] text-[#FAFAFA] text-[14px] font-medium hover:bg-[#27272A] transition-colors"
          >
            ↑ Upload Garment
          </Link>
        </div>
      </div>
    </div>
  );
}
