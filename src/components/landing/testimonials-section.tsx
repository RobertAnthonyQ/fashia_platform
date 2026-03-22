// TODO: Copy testimonials-section code from v0
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Dejamos de reservar estudios. Fashia hace en 3 minutos lo que antes nos tomaba 3 días.",
    name: "Sarah Chen",
    title: "Directora Creativa",
    company: "Atelier Studio",
  },
  {
    quote:
      "Nuestros costos de fotografía de producto bajaron un 80%. El contenido generado por IA es indistinguible de sesiones reales.",
    name: "Marcus Rivera",
    title: "Director de E-Commerce",
    company: "Luxe Collective",
  },
  {
    quote:
      "Solo la función de diversidad de modelos nos ahorró meses de casting y coordinación. Un cambio total.",
    name: "Aisha Patel",
    title: "Gerente de Marca",
    company: "NovaTrend",
  },
];

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));

  return (
    <section id="reviews" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background image */}
      <img
        src="/images/testimonial-bg.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/75" />

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-[#CCFF00] text-sm font-semibold tracking-widest uppercase">
            Marcas que Confían
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-zinc-100 mt-3">
            Lo que Dicen
          </h2>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 text-center"
            >
              <Quote size={32} className="text-[#CCFF00]/30 mx-auto mb-6" />
              <p className="text-lg md:text-xl text-zinc-200 leading-relaxed font-medium">
                {`"${testimonials[current].quote}"`}
              </p>
              <div className="mt-8">
                <p className="text-sm font-semibold text-zinc-100">
                  {testimonials[current].name}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {testimonials[current].title} @ {testimonials[current].company}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-white/20 transition-colors"
              aria-label="Testimonio anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={`dot-${testimonials[i].name}`}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    current === i ? "bg-[#CCFF00] w-6" : "bg-white/20"
                  }`}
                  aria-label={`Ir al testimonio ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-white/20 transition-colors"
              aria-label="Siguiente testimonio"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
