import Link from "next/link";
import { ArrowRight, Sparkles, Zap, ImageIcon, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <span className="text-xl font-bold tracking-tight font-heading">
          FASH<span className="text-[#BEFF00]">IA</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold bg-[#BEFF00] text-black px-4 py-2 rounded-lg hover:bg-[#BEFF00]/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 mb-8 text-sm text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-[#BEFF00]" />
          AI-powered fashion photography
        </div>
        <h1 className="text-5xl md:text-7xl font-bold font-heading leading-[1.1] tracking-tight mb-6">
          Generate stunning{" "}
          <span className="text-[#BEFF00]">fashion photos</span> in seconds
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Upload your garments, pick an AI model, and get professional fashion
          photos — no studio, no photographer required.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 bg-[#BEFF00] text-black font-semibold px-8 py-3.5 rounded-lg hover:bg-[#BEFF00]/90 transition-colors text-base"
          >
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 border border-zinc-700 text-zinc-300 font-medium px-8 py-3.5 rounded-lg hover:border-zinc-500 hover:text-white transition-colors text-base"
          >
            View demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: ImageIcon,
              title: "Photorealistic results",
              description:
                "Gemini-powered generation produces editorial-quality images that look like real studio shoots.",
            },
            {
              icon: Users,
              title: "Diverse AI models",
              description:
                "Choose from preset models or create custom ones with specific gender, age, style, and aesthetic.",
            },
            {
              icon: Zap,
              title: "Multi-angle in one click",
              description:
                "Generate front, back, and side views of any outfit with a single multi-angle generation.",
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-[#BEFF00]/10 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-[#BEFF00]" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
          Ready to transform your brand?
        </h2>
        <p className="text-zinc-400 mb-8">
          Join fashion brands already generating photos with FASHIA.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-[#BEFF00] text-black font-semibold px-8 py-3.5 rounded-lg hover:bg-[#BEFF00]/90 transition-colors"
        >
          Get started free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 max-w-7xl mx-auto flex items-center justify-between text-sm text-zinc-500">
        <span>
          FASH<span className="text-[#BEFF00]">IA</span>
        </span>
        <span>© 2026 FASHIA. All rights reserved.</span>
      </footer>
    </div>
  );
}
