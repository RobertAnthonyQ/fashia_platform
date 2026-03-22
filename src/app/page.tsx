import { Navbar } from "@/src/components/landing/navbar";
import { HeroSection } from "@/src/components/landing/hero-section";
import { PipelineSection } from "@/src/components/landing/pipeline-section";
import { BentoFeatures } from "@/src/components/landing/bento-features";
import { CategoryPlayground } from "@/src/components/landing/category-playground";
import { StickyScrollSection } from "@/src/components/landing/sticky-scroll-section";
import { TestimonialsSection } from "@/src/components/landing/testimonials-section";
import { FooterCTA } from "@/src/components/landing/footer-cta";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <Navbar />
      <HeroSection />
      <PipelineSection />
      <BentoFeatures />
      <CategoryPlayground />
      <StickyScrollSection />
      <TestimonialsSection />
      <FooterCTA />
    </main>
  );
}
