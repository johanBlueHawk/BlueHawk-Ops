"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AlertOctagon, RotateCcw, LayoutDashboard, Terminal } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to audit logger without leaking internals to UI
    console.error("Operational exception caught by boundary:", error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between p-6">
      {/* Top NOC Header */}
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/70 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xs max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="relative h-7 w-26">
            <Image
              src="/logo.png"
              alt="Blue Hawk Technologies"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
            Blue Hawk Ops
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-amber-600">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <span>Aislamiento de Excepción Activo</span>
        </div>
      </header>

      {/* Main Apple HIG Hero Card */}
      <main className="max-w-xl mx-auto w-full my-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative overflow-hidden rounded-[24px] bg-white p-8 text-center shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_20px_48px_-12px_rgba(15,23,42,0.08)] border border-slate-200/80"
          style={{
            boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 1), 0 20px 48px -12px rgba(15, 23, 42, 0.08)",
          }}
        >
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-red-500/10 blur-3xl" />

          {/* Icon Badge */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-200 text-red-600 mb-5 shadow-2xs">
            <AlertOctagon className="h-7 w-7" />
          </div>

          {/* Error Tag */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] font-semibold text-slate-600 mb-3">
            <Terminal className="h-3 w-3 text-slate-500" />
            <span>EXCEPCIÓN AISLADA — CERO FUGA DE DATOS</span>
          </div>

          <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-900 sm:text-3xl">
            Interrupción de Telemetría
          </h1>

          <p className="mt-2.5 text-sm font-normal text-slate-500 leading-relaxed max-w-md mx-auto">
            Ocurrió una excepción inesperada durante la carga de componentes. El estado fue aislado de forma segura.
          </p>

          {/* Security & Metadata Shield Notice (per SECURITY_GENERAL.md 3.2) */}
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 text-left font-mono text-[11px] text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span>Código de Diagnóstico:</span>
              <strong className="text-slate-800">{error.digest ? `DIGEST-${error.digest.slice(0, 8)}` : "OP-SYS-FAILSAFE"}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Protección de Stack Trace:</span>
              <strong className="text-emerald-700 font-semibold">Sellada por Seguridad</strong>
            </div>
          </div>

          {/* Action CTAs with Spring Physics */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              onClick={() => reset()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b1329] px-5 py-2.5 font-mono text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              <span>Reintentar Operación</span>
            </motion.button>

            <Link href="/" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-5 py-2.5 font-mono text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-slate-600" />
                <span>Consola Principal</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center font-mono text-[11px] text-slate-400 py-2">
        Blue Hawk Technologies — Centro de Operaciones & NOC © 2026
      </footer>
    </div>
  );
}
