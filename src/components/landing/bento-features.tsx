// TODO: Copy bento-features code from v0
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, ImageIcon, ChevronDown } from "lucide-react";

const avatars = [
  { id: 1, label: "Modelo A", color: "bg-amber-700" },
  { id: 2, label: "Modelo B", color: "bg-stone-800" },
  { id: 3, label: "Modelo C", color: "bg-rose-200" },
  { id: 4, label: "Modelo D", color: "bg-amber-500" },
];

const scenes = ["París", "Estudio", "Desierto"];

export function BentoFeatures() {
  const [activeAvatar, setActiveAvatar] = useState(1);
  const [activeScene, setActiveScene] = useState("Estudio");
  const [sceneOpen, setSceneOpen] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <section id="features" className="py-24 md:py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[#CCFF00] text-sm font-semibold tracking-widest uppercase">
            Características
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-zinc-100 mt-3">
            Diseñado para Escalar
          </h2>
          <p className="text-zinc-400 mt-4 max-w-md mx-auto leading-relaxed">
            Herramientas de IA potentes diseñadas para equipos de moda que se mueven rápido.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 - Virtual Try-On (spans 2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 bg-zinc-900/50 border border-white/10 rounded-xl p-6 hover:border-[#CCFF00]/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={16} className="text-[#CCFF00]" />
              <h3 className="text-sm font-semibold text-zinc-100">Prueba Virtual</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Arrastra el deslizador para comparar maniquí vs. modelo humano real
            </p>

            {/* Comparison Slider */}
            <div className="relative overflow-hidden rounded-lg aspect-[16/9] select-none">
              <img
                src="/images/tryon-human.webp"
                alt="Modelo humano con atuendo"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src="/images/tryon-mannequin.webp"
                  alt="Maniquí con atuendo"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ minWidth: `${10000 / sliderPos}%` }}
                />
              </div>
              {/* Slider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#CCFF00]"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#CCFF00] rounded-full flex items-center justify-center">
                  <span className="text-black text-xs font-bold">{"<>"}</span>
                </div>
              </div>
              {/* Input range */}
              <input
                type="range"
                min={5}
                max={95}
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                aria-label="Comparar maniquí y modelo humano"
              />
              {/* Labels */}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-xs text-zinc-300 px-2.5 py-1 rounded-full">
                Maniquí
              </div>
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-xs text-zinc-300 px-2.5 py-1 rounded-full">
                Modelo Real
              </div>
            </div>
          </motion.div>

          {/* Card 2 - Model Diversity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 hover:border-[#CCFF00]/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-[#CCFF00]" />
              <h3 className="text-sm font-semibold text-zinc-100">Diversidad de Modelos</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Un atuendo, cada modelo. Haz clic en un avatar para cambiar.
            </p>

            <div className="overflow-hidden rounded-lg aspect-square mb-4 relative">
              <img
                src="/images/diversity-outfit.webp"
                alt="Atuendo de moda"
                className="w-full h-full object-cover"
              />
              {/* Simulated model overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 text-xs text-zinc-300 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                Modelo {String.fromCharCode(64 + activeAvatar)}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {avatars.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setActiveAvatar(av.id)}
                  className={`w-10 h-10 rounded-full ${av.color} transition-all ${
                    activeAvatar === av.id
                      ? "ring-2 ring-[#CCFF00] ring-offset-2 ring-offset-[#050505] scale-110"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Seleccionar ${av.label}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Card 3 - Background Swap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 hover:border-[#CCFF00]/50 transition-colors md:col-span-3"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon size={16} className="text-[#CCFF00]" />
                  <h3 className="text-sm font-semibold text-zinc-100">Cambio de Fondo</h3>
                </div>
                <p className="text-xs text-zinc-500 mb-4">
                  Coloca tu producto en cualquier escena. París, estudio, desierto -- tú decides.
                </p>

                {/* Scene selector dropdown */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setSceneOpen(!sceneOpen)}
                    className="flex items-center gap-2 bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-300 hover:border-white/20 transition-colors"
                  >
                    Seleccionar Escena: {activeScene}
                    <ChevronDown
                      size={14}
                      className={`text-zinc-500 transition-transform ${sceneOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {sceneOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-white/10 rounded-lg overflow-hidden z-10 min-w-full">
                      {scenes.map((scene) => (
                        <button
                          key={scene}
                          type="button"
                          onClick={() => {
                            setActiveScene(scene);
                            setSceneOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            activeScene === scene
                              ? "text-[#CCFF00] bg-[#CCFF00]/5"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                          }`}
                        >
                          {scene}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="flex-1 w-full">
                <div className="relative overflow-hidden rounded-lg aspect-video">
                  <img
                    src="/images/bg-paris.webp"
                    alt={`Fondo de escena ${activeScene}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-xs text-zinc-300 px-2.5 py-1 rounded-full">
                    Escena: {activeScene}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
