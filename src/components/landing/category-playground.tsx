// TODO: Copy category-playground code from v0
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

type Category = "Vestidos" | "Sneakers" | "Trajes";

const categories: Category[] = ["Vestidos", "Sneakers", "Trajes"];

const categoryImages: Record<Category, { src: string; alt: string }[]> = {
  Vestidos: [
    { src: "/images/dress-1.webp", alt: "Vestido negro de noche en modelo" },
    { src: "/images/dress-2.webp", alt: "Vestido de cóctel rojo en modelo" },
    { src: "/images/dress-3.webp", alt: "Vestido blanco de verano en modelo" },
  ],
  Sneakers: [
    { src: "/images/sneaker-cat-1.webp", alt: "Sneakers blancos de caña alta" },
    { src: "/images/sneaker-cat-2.webp", alt: "Sneakers de running blanco y negro" },
    { src: "/images/sneaker-cat-3.webp", alt: "Sneaker retro colorido" },
  ],
  Trajes: [
    { src: "/images/suit-1.webp", alt: "Traje de negocios azul marino" },
    { src: "/images/suit-2.webp", alt: "Traje de tres piezas gris carbón" },
    { src: "/images/suit-3.webp", alt: "Esmoquin negro" },
  ],
};

export function CategoryPlayground() {
  const [active, setActive] = useState<Category>("Vestidos");
  const [loading, setLoading] = useState(false);
  const [displayedCategory, setDisplayedCategory] = useState<Category>("Vestidos");

  const handleTabChange = useCallback(
    (tab: Category) => {
      if (tab === active) return;
      setActive(tab);
      setLoading(true);
      setTimeout(() => {
        setDisplayedCategory(tab);
        setLoading(false);
      }, 1000);
    },
    [active]
  );

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-[#CCFF00] text-sm font-semibold tracking-widest uppercase">
            Explorar Categorías
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-zinc-100 mt-3">
            Zona de Pruebas Interactiva
          </h2>
          <p className="text-zinc-400 mt-4 max-w-md mx-auto leading-relaxed">
            Cambia entre categorías y observa cómo Fashia genera resultados impresionantes al instante.
          </p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleTabChange(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                active === cat
                  ? "text-[#CCFF00] border border-[#CCFF00]/50 bg-[#CCFF00]/5"
                  : "text-zinc-500 border border-white/10 hover:text-zinc-300 hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content grid */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="text-[#CCFF00] animate-spin" />
                  <span className="text-sm text-zinc-500">Generando {active}...</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={displayedCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {categoryImages[displayedCategory].map((img, i) => (
                  <motion.div
                    key={img.src}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-[#CCFF00]/30 transition-colors"
                  >
                    <img
                      src={img.src || "/placeholder.svg"}
                      alt={img.alt}
                      className="w-full aspect-[3/4] object-cover"
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
