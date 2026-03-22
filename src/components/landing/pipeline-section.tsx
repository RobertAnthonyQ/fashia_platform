// TODO: Copy pipeline-section code from v0
"use client";

import { motion } from "framer-motion";
import { ArrowRight, Upload, Sparkles, PlayCircle } from "lucide-react";

const steps = [
  {
    label: "Imagen Original",
    description: "Sube tu foto de producto o toma de estudio",
    icon: Upload,
    image: "/images/tshirt-raw.webp",
    imageAlt: "Camiseta básica en percha",
  },
  {
    label: "Generación IA",
    description: "Nuestra IA la coloca en un modelo de moda realista",
    icon: Sparkles,
    image: "/images/tshirt-model.webp",
    imageAlt: "Camiseta en modelo de moda",
  },
  {
    label: "Video en Movimiento",
    description: "Genera contenido de video listo para campaña al instante",
    icon: PlayCircle,
    image: "/images/tshirt-video.mp4",
    imageAlt: "Campaña de video de moda",
    isVideo: true,
  },
];

export function PipelineSection() {
  return (
    <section id="pipeline" className="py-24 md:py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[#CCFF00] text-sm font-semibold tracking-widest uppercase">
            Cómo Funciona
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-zinc-100 mt-3">
            El Flujo de Trabajo de Fashia
          </h2>
          <p className="text-zinc-400 mt-4 max-w-md mx-auto leading-relaxed">
            Tres pasos. Cero estudios. Posibilidades infinitas.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-6 lg:gap-0">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-col lg:flex-row items-center flex-1">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="bg-zinc-900/50 border border-white/10 rounded-xl p-5 flex-1 w-full max-w-sm"
              >
                <div className="relative overflow-hidden rounded-lg aspect-[4/5]">
                  {step.isVideo ? (
                    <video
                      src={step.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src={step.image || "/placeholder.svg"}
                      alt={step.imageAlt}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                  {step.isVideo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="bg-black/40 backdrop-blur-sm rounded-full p-4">
                        <PlayCircle size={48} className="text-zinc-100" />
                      </div>
                      {/* Video player bar */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#CCFF00]" />
                        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-[#CCFF00] rounded-full" />
                        </div>
                        <span className="text-xs text-zinc-400">0:12 / 0:30</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#CCFF00]/10 flex items-center justify-center">
                    <step.icon size={20} className="text-[#CCFF00]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{step.label}</h3>
                    <p className="text-xs text-zinc-500">{step.description}</p>
                  </div>
                </div>
              </motion.div>

              {/* Arrow connector */}
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.2 + 0.3 }}
                  className="flex items-center justify-center px-4 py-4 lg:py-0"
                >
                  <ArrowRight size={24} className="text-[#CCFF00]/50 rotate-90 lg:rotate-0" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
