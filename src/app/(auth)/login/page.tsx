"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/src/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      router.push("/studio");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#09090B]">
      {/* Left Panel — 55% */}
      <div className="flex w-full md:w-[55%] flex-col items-center justify-center px-6 md:px-10">
        <div className="w-full max-w-[360px] space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-0 h-16 px-10">
            <span className="text-[22px] font-bold font-heading text-[#FAFAFA]">
              Fash
            </span>
            <span className="text-[22px] font-bold font-heading text-[#FAFAFA]">
              i
            </span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#BEFF00] mx-px" />
            <span className="text-[22px] font-bold font-heading text-[#FAFAFA]">
              a
            </span>
          </div>

          {/* Welcome */}
          <div className="flex flex-col items-center gap-5">
            <h2 className="text-[28px] font-bold text-[#FAFAFA] font-heading text-center">
              Welcome back
            </h2>
            <p className="text-sm text-[#A1A1AA] text-center">
              Sign in to your Fashia account
            </p>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#FAFAFA] h-11 text-sm font-semibold text-[#09090B] hover:bg-[#FAFAFA]/90 disabled:opacity-50 transition-colors"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-base font-bold">G</span>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-[#27272A]" />
              <span className="text-xs text-[#71717A]">or</span>
              <div className="h-px flex-1 bg-[#27272A]" />
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleEmailLogin} className="w-full space-y-4">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-[10px] border border-[#27272A] bg-[#18181B] px-4 h-11 text-sm text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#BEFF00]/50 transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-[10px] border border-[#27272A] bg-[#18181B] px-4 h-11 text-sm text-[#FAFAFA] placeholder:text-[#52525B] outline-none focus:border-[#BEFF00]/50 transition-colors"
              />

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#BEFF00] h-11 text-sm font-semibold text-[#09090B] hover:bg-[#BEFF00]/90 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign In
              </button>
            </form>

            {/* Register Link */}
            <p className="text-sm text-[#A1A1AA]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#BEFF00] hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel — 45% with fashion photo */}
      <div className="relative hidden w-[45%] md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1760512901586-f70030a53cd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzI5MTcwNTF8&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Fashion photography"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#BEFF00]/20 to-transparent" />
      </div>
    </div>
  );
}
