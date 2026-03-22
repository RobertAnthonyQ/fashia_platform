// TODO: Copy navbar code from v0
"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Producto", href: "#pipeline" },
  { label: "Características", href: "#features" },
  { label: "Reseñas", href: "#reviews" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#050505]/70 border-b border-white/10">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <a href="#" className="font-display text-xl font-bold tracking-tight text-zinc-100">
          FASHIA
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/login"
            className="bg-[#CCFF00] text-black text-sm font-semibold px-5 py-2 rounded-full hover:scale-105 transition-transform"
          >
            Comenzar
          </a>
        </div>

        <button
          type="button"
          className="md:hidden text-zinc-100"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-[#050505]/95 backdrop-blur-md"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/login"
                className="bg-[#CCFF00] text-black text-sm font-semibold px-5 py-2.5 rounded-full text-center hover:scale-105 transition-transform"
                onClick={() => setMobileOpen(false)}
              >
                Comenzar
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
