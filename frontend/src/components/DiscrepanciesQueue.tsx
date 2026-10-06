"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, ShieldAlert, AlertTriangle, FileCheck, 
  ChevronRight, Check, X, Filter, Ticket, ExternalLink, Loader2, Lock
} from "lucide-react";
import { Discrepancy, UserRole } from "@/types";
import { API_BASE } from "@/config/api";

interface DiscrepanciesQueueProps {
  discrepancies: Discrepancy[];
  onResolve: (id: string, notes: string) => Promise<void>;
  onTicketCreated?: () => Promise<void>;
  userRole?: UserRole;
}

export const DiscrepanciesQueue: React.FC<DiscrepanciesQueueProps> = ({
  discrepancies,
  onResolve,
  onTicketCreated,
  userRole = "technician",
}) => {
  const [viewMode, setViewMode] = useState<"pending" | "resolved">("pending");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [creatingTicketId, setCreatingTicketId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const pendingList = discrepancies.filter((d) => d.status === "pending");
  const resolvedList = discrepancies.filter((d) => d.status === "resolved");

  const displayedList = viewMode === "pending" ? pendingList : resolvedList;

  const handleResolve = async (id: string) => {
    if (!notes.trim()) return;
    await onResolve(id, notes);
    setResolvingId(null);
    setNotes("");
  };

  const handleCreateTicket = async (id: string) => {
    try {
      setCreatingTicketId(id);
      const token = typeof window !== "undefined" ? localStorage.getItem("bhops_access_token") : null;
      const res = await fetch(`${API_BASE}/discrepancies/${id}/create-ticket`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok && onTicketCreated) {
        await onTicketCreated();
      }
    } catch (e) {
      console.error("Error creating Zammad ticket:", e);
    } finally {
      setCreatingTicketId(null);
    }
  };

  return (
    <div className="apple-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-500/20">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Cola de Reconciliación
            </h3>
            <p className="text-[11px] text-slate-400">
              Drift y discrepancias con inventario
            </p>
          </div>
        </div>

        {/* Pending vs Resolved Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg font-mono text-[10px]">
          <button
            onClick={() => { setViewMode("pending"); setResolvingId(null); }}
            className={`px-2.5 py-1 rounded-md font-bold transition-all ${
              viewMode === "pending"
                ? "bg-amber-500 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pendientes ({pendingList.length})
          </button>
          <button
            onClick={() => { setViewMode("resolved"); setResolvingId(null); }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              viewMode === "resolved"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Resueltas ({resolvedList.length})
          </button>
        </div>
      </div>

      {/* Compact Scrollable List (Fixed Max Height) */}
      <div className="mt-3.5 space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {displayedList.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-400 font-mono">
            {viewMode === "pending" ? (
              <div className="space-y-1">
                <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
                <p className="font-bold text-slate-800">Cero discrepancias pendientes</p>
                <p className="text-[11px] text-slate-400">Todo el hardware está reconciliado.</p>
              </div>
            ) : (
              <p>No hay registros resueltos aún.</p>
            )}
          </div>
        ) : (
          displayedList.map((disc) => {
            const isPending = disc.status === "pending";
            const details = disc.details_json || {};
            const isDrift = disc.discrepancy_type === "missing_from_network";
            const ticket = details.zammad_ticket;

            return (
              <div
                key={disc.id}
                className={`rounded-xl p-3 border transition-all text-xs ${
                  isPending
                    ? isDrift
                      ? "bg-red-50/40 border-red-200"
                      : "bg-amber-50/40 border-amber-200"
                    : "bg-slate-50/70 border-slate-200/80"
                }`}
              >
                {/* Compact Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 truncate">
                        {details.discovered_name || "Equipo Desconocido"}
                      </span>
                      {details.model && (
                        <span className="font-mono text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-semibold">
                          {details.model}
                        </span>
                      )}
                      <span
                        className={`font-mono text-[8px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          isDrift
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {isDrift ? "DRIFT: AUSENTE" : "NO CATALOGADO"}
                      </span>

                      {ticket && (
                        <span className="font-mono text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200 font-bold flex items-center gap-1">
                          <Ticket className="h-2.5 w-2.5 text-indigo-600" />
                          <span>Zammad #{ticket.ticket_number}</span>
                        </span>
                      )}
                    </div>

                    {/* Single-line Monospace Coordinates */}
                    <div className="mt-1 font-mono text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                      {details.ip && <span>{details.ip}</span>}
                      {details.ip && details.mac && <span>•</span>}
                      {details.mac && <span className="text-slate-600">{details.mac}</span>}
                      {details.physical_location && (
                        <>
                          <span>•</span>
                          <span className="text-slate-700 font-sans font-medium">{details.physical_location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Button */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {isPending ? (
                      <button
                        onClick={() => setResolvingId(resolvingId === disc.id ? null : disc.id)}
                        className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition-all shadow-2xs ${
                          resolvingId === disc.id
                            ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {resolvingId === disc.id ? "Cerrar" : "Revisar"}
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Resuelto
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Expandable Resolution & Zammad Ticketing Panel */}
                <AnimatePresence>
                  {resolvingId === disc.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-2.5"
                    >
                      <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                        {details.reason}
                      </p>

                      {/* Zammad Ticket Status or Action */}
                      <div className="pt-0.5">
                        {ticket ? (
                          <div className="flex items-center justify-between rounded-lg bg-indigo-50/70 border border-indigo-200 p-2 font-mono text-[11px] text-indigo-900">
                            <div className="flex items-center gap-1.5">
                              <Ticket className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Ticket en Zammad: <strong>#{ticket.ticket_number}</strong> ({ticket.state})</span>
                            </div>
                            <a
                              href={ticket.web_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-600 underline hover:text-indigo-800 font-bold flex items-center gap-0.5"
                            >
                              <span>Ver Ticket</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCreateTicket(disc.id)}
                            disabled={creatingTicketId === disc.id}
                            className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 font-mono text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors active:scale-95 disabled:opacity-50"
                          >
                            {creatingTicketId === disc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                            ) : (
                              <Ticket className="h-3.5 w-3.5 text-indigo-600" />
                            )}
                            <span>{creatingTicketId === disc.id ? "Creando en Zammad..." : "Abrir Ticket en Zammad"}</span>
                          </button>
                        )}
                      </div>

                      {/* Manual Resolution Input or Operator Lock Notice */}
                      {userRole === "operator" ? (
                        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[10px] text-amber-800 font-mono">
                          <Lock className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>Firma de resolución restringida: Requiere rol Técnico o Admin.</span>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            placeholder="Nota técnica (ej: Verificado en Rack Piso 2)..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-sans"
                          />
                          <button
                            onClick={() => handleResolve(disc.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 font-mono text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                          >
                            <FileCheck className="h-3 w-3" />
                            <span>Firmar</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
