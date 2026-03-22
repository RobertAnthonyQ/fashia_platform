// TODO: Copy hero-section code from v0
"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <img
        src="/images/hero-bg.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block text-[#CCFF00] text-sm font-semibold tracking-widest uppercase mb-6">
            Fotografía de Moda con IA
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-zinc-100 text-balance leading-[0.95]"
        >
          TU ROPA.
          <br />
          NUESTRO ESTUDIO.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-6 text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed"
        >
          Transforma fotos de tus prendas en contenido profesional de
          campaña en minutos. Sin estudio. Sin modelos. Sin espera.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="/login"
            className="bg-[#CCFF00] text-black font-semibold px-8 py-3.5 rounded-full text-base hover:scale-105 transition-transform flex items-center gap-2"
          >
            Empieza a Crear
            <ArrowRight size={18} />
          </a>
          <a
            href="#pipeline"
            className="border border-white/20 text-zinc-300 font-medium px-8 py-3.5 rounded-full text-base hover:bg-white/5 transition-colors"
          >
            Descubre Cómo Funciona
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
