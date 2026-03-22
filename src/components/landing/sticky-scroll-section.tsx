// TODO: Copy sticky-scroll-section code from v0
"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const contexts = [
  {
    label: "Calle Urbana",
    description: "Sneaker en movimiento sobre concreto",
    image: "/images/sneaker-urban.webp",
  },
  {
    label: "Macro en Estudio",
    description: "Primer plano extremo de textura y detalle",
    image: "/images/sneaker-macro.webp",
  },
  {
    label: "Estilo de Vida",
    description: "Producto en un entorno natural de estilo de vida",
    image: "/images/sneaker-lifestyle.webp",
  },
  {
    label: "Ángulo Dinámico",
    description: "Perspectiva e iluminación dramática",
    image: "/images/sneaker-angle.webp",
  },
];

export function StickyScrollSection() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[#CCFF00] text-sm font-semibold tracking-widest uppercase">
            Consistencia Garantizada
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-zinc-100 mt-3 text-balance">
            Un Producto, Ángulos Infinitos
          </h2>
          <p className="text-zinc-400 mt-4 max-w-lg mx-auto leading-relaxed">
            Tu producto se mantiene perfecto. Solo el mundo a su alrededor cambia.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Sticky source */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-zinc-900/50 border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lock size={14} className="text-[#CCFF00]" />
                <span className="text-xs font-semibold text-[#CCFF00] uppercase tracking-wider">
                  Tu Archivo Fuente
                </span>
              </div>
              <div className="overflow-hidden rounded-lg">
                <img
                  src="/images/sneaker-source.webp"
                  alt="Archivo fuente del producto sneaker blanco"
                  className="w-full aspect-square object-cover rounded-lg"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-3 text-center">
                La imagen original del producto permanece sin cambios
              </p>
            </motion.div>
          </div>

          {/* Right Column - Scrollable results */}
          <div className="flex flex-col gap-6">
            {contexts.map((ctx, i) => (
              <motion.div
                key={ctx.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-[#CCFF00]/30 transition-colors"
              >
                <div className="overflow-hidden">
                  <img
                    src={ctx.image || "/placeholder.svg"}
                    alt={ctx.description}
                    className="w-full aspect-video object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-zinc-100">{ctx.label}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{ctx.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
