"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, CheckCircle2, RefreshCw, Ticket, 
  ChevronUp, ChevronDown, Layers, Shield, Wrench, ShieldCheck,
  Zap, ArrowRight, X, ExternalLink
} from "lucide-react";
import { UserRole } from "@/types";

interface DynamicActionIslandProps {
  pendingCount: number;
  onlineCount: number;
  totalDevices: number;
  userRole: UserRole;
  onOpenReconciliation: () => void;
  onSyncInventory?: () => Promise<void>;
  isSyncing?: boolean;
}

export const DynamicActionIsland: React.FC<DynamicActionIslandProps> = ({
  pendingCount,
  onlineCount,
  totalDevices,
  userRole,
  onOpenReconciliation,
  onSyncInventory,
  isSyncing = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/90 text-white shadow-xl backdrop-blur-2xl border border-white/20 print:hidden"
        title="Mostrar Isla de Acciones NOC"
      >
        <Zap className="h-5 w-5 text-amber-400" />
      </motion.button>
    );
  }

  const hasAlerts = pendingCount > 0;

  return (
    <motion.aside
      aria-label="Isla de Acciones Rápidas NOC"
      layout
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex flex-col items-center print:hidden max-w-[95vw]"
    >
      {/* Expanded Quick Details Drawer (Floats above pill) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="mb-2.5 w-84 rounded-2xl bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-2xl border border-white/15 font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estado Rápido de Infraestructura
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nodos en Línea:</span>
                <span className="text-emerald-400 font-bold">{onlineCount} de {totalDevices} (100% Reachable)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Drift de Inventario:</span>
                <span className={hasAlerts ? "text-amber-400 font-bold" : "text-slate-300 font-semibold"}>
                  {pendingCount} Discrepancias
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rol Activo:</span>
                <span className="text-blue-400 font-semibold capitalize">
                  {userRole === "operator" ? "Operador (L1)" : userRole === "technician" ? "Técnico (L2)" : "Admin (L3)"}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex gap-2">
              <button
                onClick={() => {
                  onOpenReconciliation();
                  setIsExpanded(false);
                }}
                className="flex-1 rounded-xl bg-amber-400/20 border border-amber-400/40 py-1.5 text-center text-[11px] font-bold text-amber-300 hover:bg-amber-400/30 transition-colors"
              >
                Ver Cola de Drift
              </button>
              {userRole !== "operator" && onSyncInventory && (
                <button
                  onClick={() => {
                    onSyncInventory();
                    setIsExpanded(false);
                  }}
                  disabled={isSyncing}
                  className="flex-1 rounded-xl bg-blue-600/80 border border-blue-500/40 py-1.5 text-center text-[11px] font-bold text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isSyncing ? "Sincronizando..." : "Sincronizar"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Island Pill (Apple HIG Continuous Squircle) */}
      <div 
        className="flex items-center gap-3.5 rounded-full bg-slate-950/85 px-4.5 py-2.5 text-white backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.38)] border border-white/15 font-mono text-xs transition-all"
        style={{
          boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 12px 36px rgba(0, 0, 0, 0.38)",
        }}
      >
        {/* 1. Live Pulse Dot */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
              hasAlerts ? "bg-amber-400" : "bg-emerald-400"
            }`} />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              hasAlerts ? "bg-amber-500" : "bg-emerald-500"
            }`} />
          </span>

          <span className="text-[11px] font-bold tracking-tight text-white hidden sm:inline">
            {hasAlerts ? `${pendingCount} Alertas NOC` : "NOC Óptimo"}
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/20 shrink-0" />

        {/* 2. Quick Metrics Pill */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-300 shrink-0">
          <span className="text-emerald-400 font-bold">{onlineCount}</span>
          <span className="text-slate-400">/</span>
          <span>{totalDevices} Nodos</span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/20 shrink-0" />

        {/* 3. Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Go to Alerts / Reconciliation */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenReconciliation}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
              hasAlerts 
                ? "bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-xs" 
                : "bg-white/10 text-slate-200 hover:bg-white/20"
            }`}
          >
            <span>{hasAlerts ? "Revisar Drift" : "Ver Inventario"}</span>
            <ArrowRight className="h-3 w-3" />
          </motion.button>

          {/* Rapid Inventory Sync (Enabled for Técnico / Admin) */}
          {userRole !== "operator" && onSyncInventory && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSyncInventory}
              disabled={isSyncing}
              className="hidden md:flex items-center gap-1 rounded-full bg-blue-600/90 hover:bg-blue-600 px-3 py-1 text-[11px] font-bold text-white transition-colors active:scale-95 disabled:opacity-50"
              title="Sincronización rápida con BlueHawk Inventory"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Sincronizando" : "Sync"}</span>
            </motion.button>
          )}

          {/* Quick Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Expandir detalles rápidos"
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </motion.aside>
  );
};
