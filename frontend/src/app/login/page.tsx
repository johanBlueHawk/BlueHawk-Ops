"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { 
  Shield, Wrench, ShieldCheck, Lock, Mail, Eye, EyeOff, 
  ArrowRight, Loader2, AlertCircle, Check, Terminal, Radio
} from "lucide-react";
import { UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    if (!targetEmail.trim() || !targetPass.trim()) {
      setError("Por favor ingrese su correo y contraseña.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(targetEmail, targetPass);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Error de autenticación. Credenciales inválidas.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("BlueHawk2026!");
    handleSubmit(undefined, roleEmail, "BlueHawk2026!");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between p-6">
      {/* Top Header */}
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

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>NOC Autenticación Activa</span>
        </div>
      </header>

      {/* Main Login Card (Apple HIG Specification) */}
      <main className="max-w-md mx-auto w-full my-auto py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="relative overflow-hidden rounded-[24px] bg-white p-8 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06),0_20px_48px_-12px_rgba(15,23,42,0.08)] border border-slate-200/80"
          style={{
            boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 1), 0 20px 48px -12px rgba(15, 23, 42, 0.08)",
          }}
        >
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />

          {/* Card Header */}
          <div className="text-center">
            <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-[#0b1329] text-amber-400 shadow-md mb-4 border border-slate-800">
              <Lock className="h-6 w-6" />
            </div>

            <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
              Consola Central NOC
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-normal">
              Acceso a telemetría, reconciliación y mesa de ayuda Zammad
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-medium"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span className="flex-1">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase">
                Correo Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@bluehawk.tech"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#0b1329] px-4 py-2.5 font-mono text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  <span>Verificando Credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
                </>
              )}
            </motion.button>
          </form>

          {/* Quick 1-Click Access Testing Pills */}
          <div className="mt-7 pt-5 border-t border-slate-100">
            <span className="block text-center font-mono text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2.5">
              Acceso Rápido por Rol (1-Clic)
            </span>

            <div className="grid grid-cols-1 gap-2 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@bluehawk.tech")}
                disabled={loading}
                className="flex items-center justify-between rounded-xl bg-amber-50/60 border border-amber-200/80 px-3 py-2 text-left hover:bg-amber-100/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Johan Vasquez</span>
                    <span className="text-[10px] text-slate-500">admin@bluehawk.tech</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  Admin (L3)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("tecnico@bluehawk.tech")}
                disabled={loading}
                className="flex items-center justify-between rounded-xl bg-emerald-50/60 border border-emerald-200/80 px-3 py-2 text-left hover:bg-emerald-100/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Carlos Gomez</span>
                    <span className="text-[10px] text-slate-500">tecnico@bluehawk.tech</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Técnico (L2)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("operador@bluehawk.tech")}
                disabled={loading}
                className="flex items-center justify-between rounded-xl bg-blue-50/60 border border-blue-200/80 px-3 py-2 text-left hover:bg-blue-100/70 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Marcos Diaz</span>
                    <span className="text-[10px] text-slate-500">operador@bluehawk.tech</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                  Operador (L1)
                </span>
              </button>
            </div>
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
