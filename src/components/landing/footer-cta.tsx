// TODO: Copy footer-cta code from v0
"use client";

import { motion } from "framer-motion";

export function FooterCTA() {
  return (
    <section id="cta" className="py-24 md:py-32 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-100 text-balance">
            Escala tu estética.
          </h2>
          <p className="text-zinc-400 mt-4 max-w-md mx-auto leading-relaxed">
            Únete a cientos de marcas de moda que ya usan Fashia para crear
            contenido impactante a gran escala.
          </p>
          <div className="mt-10">
            <a
              href="/login"
              className="inline-block border border-zinc-100 text-zinc-100 font-semibold px-8 py-3.5 rounded-full text-base hover:bg-zinc-100 hover:text-[#050505] transition-colors"
            >
              Comienza Gratis
            </a>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="mt-24 border-t border-white/10 pt-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm font-bold tracking-tight text-zinc-500">
            FASHIA
          </span>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Privacidad
            </a>
            <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Términos
            </a>
            <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Contacto
            </a>
          </div>
          <span className="text-xs text-zinc-600">
            {`\u00A9 ${new Date().getFullYear()} Fashia. Todos los derechos reservados.`}
          </span>
        </div>
      </footer>
    </section>
  );
}
