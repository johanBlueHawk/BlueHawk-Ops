"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { BHOpsLogo } from "@/components/BHOpsLogo";
import { 
  ShieldCheck, Lock, Mail, Eye, EyeOff, 
  ArrowRight, Loader2, AlertCircle, CheckCircle2,
  Wifi, Database, Ticket, Activity, Cpu, Sparkles, Terminal
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Password Complexity Calculator
  const getPasswordScore = (pass: string) => {
    let score = 0;
    if (pass.length >= 12) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordScore = getPasswordScore(password);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor ingrese su correo y contraseña corporativa.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Error de autenticación. Credenciales inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between p-4 sm:p-6 overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-400/5 blur-[120px]" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between border border-slate-200/80 bg-white/80 backdrop-blur-xl px-5 sm:px-7 py-3 rounded-2xl shadow-xs max-w-5xl mx-auto w-full">
        <BHOpsLogo variant="light" size="sm" />

        <div className="flex items-center gap-3 font-mono text-xs text-slate-600">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sondas En Línea</span>
          </div>
          <span className="text-[11px] text-slate-400">v1.0.0</span>
        </div>
      </header>

      {/* Main Command Center Layout */}
      <main className="relative z-10 max-w-4xl mx-auto w-full my-auto py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          className="grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-[28px] bg-white border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(11,19,41,0.08),0_0_1px_1px_rgba(255,255,255,1)]"
        >
          {/* Left Column: Authentic Brand Authentication Form (7 cols) */}
          <div className="p-7 sm:p-10 md:col-span-7 flex flex-col justify-between">
            <div>
              {/* Brand Header */}
              <div className="flex items-center gap-2 mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/70 w-fit px-2.5 py-1 rounded-md">
                <Terminal className="h-3 w-3" />
                <span>Portal de Misión Crítica • NOC</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.03em] text-[#0b1329]">
                Blue Hawk Ops
              </h1>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-sans">
                Consola centralizada de telemetría de red, reconciliación física de activos e incidentes de soporte.
              </p>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mt-4 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span className="flex-1">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Correo Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operador@bluehawk.tech"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/15 transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
                      Contraseña
                    </label>
                    {password && (
                      <span className="font-mono text-[10px] text-slate-400">
                        {passwordScore >= 4 ? (
                          <span className="text-emerald-600 font-bold">Complejidad Alta</span>
                        ) : passwordScore >= 3 ? (
                          <span className="text-amber-600 font-bold">Media</span>
                        ) : (
                          <span className="text-red-500 font-bold">Baja</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-500/15 transition-all font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Micro-Entropy Password Meter */}
                  {password && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            passwordScore >= level
                              ? passwordScore >= 4
                                ? "bg-emerald-500"
                                : passwordScore >= 3
                                ? "bg-amber-400"
                                : "bg-red-400"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#0b1329] px-4 py-3 font-mono text-xs font-bold text-white shadow-md hover:bg-slate-900 border-2 border-amber-400/80 transition-all disabled:opacity-60 group cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                      <span>Validando Credenciales NOC...</span>
                    </>
                  ) : (
                    <>
                      <span>Autenticar en Consola NOC</span>
                      <ArrowRight className="h-3.5 w-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>
            </div>

            {/* Enterprise Security Compliance Notice */}
            <div className="mt-8 pt-5 border-t border-slate-100 font-mono text-[11px] text-slate-500 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Estándar NIST SP 800-63B. Cifrado AES-256 en reposo. Sesión con tokens criptográficos JWT y control estricto de roles (RBAC).
              </p>
            </div>
          </div>

          {/* Right Column: Live NOC Operational Infrastructure Preview (5 cols) */}
          <div className="bg-gradient-to-br from-[#0b1329] via-[#0e1738] to-[#121c42] p-7 sm:p-9 md:col-span-5 text-white flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800">
            <div>
              {/* Live Infrastructure Tag */}
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md">
                  Infraestructura NOC
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">
                Entorno Operativo Conectado
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Plataforma unificada para la supervisión y control del ecosistema tecnológico Blue Hawk:
              </p>

              {/* Status Nodes Ticker */}
              <div className="mt-5 space-y-3 font-mono text-xs">
                {/* 1. UniFi */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-3.5 w-3.5 text-sky-400" />
                      <span className="font-bold text-slate-200">UniFi Network Core</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                      RO
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>192.168.10.1:443</span>
                    <span className="text-slate-300 font-bold">10 Dispositivos</span>
                  </div>
                </div>

                {/* 2. Inventory */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-bold text-slate-200">BlueHawk Inventory</span>
                    </div>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-bold">
                      REST
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>inventory.bluehawktech.com</span>
                    <span className="text-slate-300 font-bold">28 Activos</span>
                  </div>
                </div>

                {/* 3. Zammad */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="font-bold text-slate-200">Zammad Helpdesk</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                      TOKEN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>support.bluehawktech.com</span>
                    <span className="text-slate-300 font-bold">Grupo Users</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Operations Info */}
            <div className="mt-6 pt-4 border-t border-white/10 font-mono text-[10px] text-slate-400 leading-snug">
              <span>Auditoría estricta activa. Todos los accesos quedan registrados en el log determinista del NOC.</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center font-mono text-[11px] text-slate-400 py-2">
        Blue Hawk Technologies — Centro de Operaciones & NOC © 2026
      </footer>
    </div>
  );
}
