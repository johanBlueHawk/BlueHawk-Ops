"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, MapPin, 
  Database, RefreshCw, FileCheck, Server, Wifi, Radio,
  Filter, Check, ArrowRight, ExternalLink, Ticket, Loader2, Lock
} from "lucide-react";
import { Discrepancy, Asset, NetworkDevice, UserRole } from "@/types";
import { API_BASE } from "@/config/api";

interface InventoryReconciliationViewProps {
  discrepancies: Discrepancy[];
  assets: Asset[];
  devices: NetworkDevice[];
  onResolve: (id: string, notes: string) => Promise<void>;
  onSyncInventory?: () => Promise<void>;
  onTicketCreated?: () => Promise<void>;
  userRole?: UserRole;
}

export const InventoryReconciliationView: React.FC<InventoryReconciliationViewProps> = ({
  discrepancies,
  assets,
  devices,
  onResolve,
  onSyncInventory,
  onTicketCreated,
  userRole = "technician",
}) => {
  const [activeTab, setActiveTab] = useState<"queue" | "inventory" | "network">("queue");
  const [filterType, setFilterType] = useState<"all" | "missing_from_network" | "uncataloged_device">("all");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [creatingTicketId, setCreatingTicketId] = useState<string | null>(null);
  const [syncingInventory, setSyncingInventory] = useState(false);
  const [notes, setNotes] = useState("");

  const pendingDiscrepancies = discrepancies.filter((d) => d.status === "pending");
  const missingFromNetworkCount = pendingDiscrepancies.filter((d) => d.discrepancy_type === "missing_from_network").length;
  const uncatalogedCount = pendingDiscrepancies.filter((d) => d.discrepancy_type === "uncataloged_device").length;
  const matchedCount = devices.filter((d) => d.asset_id !== null).length;

  const filteredDiscrepancies = discrepancies.filter((d) => {
    if (filterType === "all") return true;
    return d.discrepancy_type === filterType;
  });

  const handleResolve = async (id: string) => {
    if (!notes.trim()) return;
    await onResolve(id, notes);
    setResolvingId(null);
    setNotes("");
  };

  const handleSyncInventoryClick = async () => {
    if (!onSyncInventory) return;
    try {
      setSyncingInventory(true);
      await onSyncInventory();
    } finally {
      setSyncingInventory(false);
    }
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
    <div className="space-y-6">
      {/* 1. Drift & Reconciliation KPI Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="apple-card p-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            FÍSICOS EN INVENTARIO
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">{assets.length}</div>
          <div className="text-[11px] text-slate-500">BlueHawk Inventory</div>
        </div>

        <div className="apple-card p-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700">
            MATCH CONFIRMADO
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-600">{matchedCount}</div>
          <div className="text-[11px] text-emerald-700 font-medium">Reconciliados en Rack</div>
        </div>

        <div className={`apple-card p-4 ${uncatalogedCount > 0 ? "bg-amber-50/20 border-amber-300" : ""}`}>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">
            EN RED SIN CATALOGAR
          </span>
          <div className="mt-1 text-2xl font-black text-amber-600">{uncatalogedCount}</div>
          <div className="text-[11px] text-amber-700 font-medium">Requieren Alta de Activo</div>
        </div>

        <div className={`apple-card p-4 ${missingFromNetworkCount > 0 ? "bg-red-50/20 border-red-300" : ""}`}>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700">
            DESAPARECIDOS EN RED (DRIFT)
          </span>
          <div className="mt-1 text-2xl font-black text-red-600">{missingFromNetworkCount}</div>
          <div className="text-[11px] text-red-700 font-medium">Posible Falla o Desconexión</div>
        </div>
      </div>

      {/* 2. Main Reconciliation Console */}
      <div className="apple-card p-6">
        {/* Sub-navigation & Filters */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("queue")}
              className={`rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                activeTab === "queue"
                  ? "bg-[#0b1329] text-white border border-amber-400/80 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Cola de Reconciliación ({pendingDiscrepancies.length})
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                activeTab === "inventory"
                  ? "bg-[#0b1329] text-white border border-amber-400/80 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Inventario Físico ({assets.length})
            </button>
            <button
              onClick={() => setActiveTab("network")}
              className={`rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                activeTab === "network"
                  ? "bg-[#0b1329] text-white border border-amber-400/80 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Equipos Vivos en Red ({devices.length})
            </button>

            {onSyncInventory && (
              <button
                onClick={userRole === "operator" ? undefined : handleSyncInventoryClick}
                disabled={syncingInventory || userRole === "operator"}
                title={userRole === "operator" ? "La sincronización física requiere rol Técnico o Admin" : undefined}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-mono font-bold transition-all ${
                  userRole === "operator"
                    ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white shadow-2xs hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                }`}
              >
                {userRole === "operator" ? (
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <RefreshCw className={`h-3.5 w-3.5 ${syncingInventory ? "animate-spin" : ""}`} />
                )}
                <span>
                  {userRole === "operator" 
                    ? "Sincronización (Técnico / Admin)" 
                    : (syncingInventory ? "Sincronizando..." : "Sincronizar con BlueHawk Inventory")}
                </span>
              </button>
            )}
          </div>

          {activeTab === "queue" && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 font-mono text-[11px]">
              <button
                onClick={() => setFilterType("all")}
                className={`rounded-lg px-2.5 py-1 ${filterType === "all" ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-500"}`}
              >
                Todas ({discrepancies.length})
              </button>
              <button
                onClick={() => setFilterType("missing_from_network")}
                className={`rounded-lg px-2.5 py-1 ${filterType === "missing_from_network" ? "bg-red-50 text-red-700 font-bold" : "text-slate-500"}`}
              >
                Drift / Desconectados ({missingFromNetworkCount})
              </button>
              <button
                onClick={() => setFilterType("uncataloged_device")}
                className={`rounded-lg px-2.5 py-1 ${filterType === "uncataloged_device" ? "bg-amber-50 text-amber-700 font-bold" : "text-slate-500"}`}
              >
                Sin Catalogar ({uncatalogedCount})
              </button>
            </div>
          )}
        </div>

        {/* View Content */}
        <div className="mt-5">
          {/* TAB 1: QUEUE */}
          {activeTab === "queue" && (
            <div className="space-y-3">
              {filteredDiscrepancies.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                  <p className="mt-2 text-sm font-bold text-slate-800">
                    Cero Discrepancias Pendientes
                  </p>
                  <p className="text-xs text-slate-500">
                    Todo el hardware detectado en la red coincide exactamente con BlueHawk Inventory.
                  </p>
                </div>
              ) : (
                filteredDiscrepancies.map((disc) => {
                  const isPending = disc.status === "pending";
                  const details = disc.details_json || {};
                  const isDrift = disc.discrepancy_type === "missing_from_network";

                  return (
                    <div
                      key={disc.id}
                      className={`rounded-2xl p-4 border transition-all ${
                        isPending
                          ? isDrift
                            ? "bg-red-50/30 border-red-200 shadow-2xs"
                            : "bg-amber-50/30 border-amber-200 shadow-2xs"
                          : "bg-slate-50/50 border-slate-200 opacity-70"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex-1 min-w-[280px]">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {details.discovered_name || "Dispositivo"}
                            </span>
                            {details.asset_code && (
                              <span className="font-mono text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                                {details.asset_code}
                              </span>
                            )}
                            <span
                              className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                isDrift
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {isDrift ? "DRIFT: DESAPARECIDO EN RED" : "NO REGISTRADO EN INVENTARIO"}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-xs text-slate-500">
                            {details.mac && <span>MAC: <strong className="text-slate-800">{details.mac}</strong></span>}
                            {details.ip && <span>• IP: <strong className="text-slate-800">{details.ip}</strong></span>}
                            {details.physical_location && (
                              <span>• Ubicación: <strong className="text-slate-800">{details.physical_location}</strong></span>
                            )}
                            <span>• Detectado: {new Date(disc.detected_at).toLocaleTimeString()}</span>
                          </div>

                          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-sans">
                            {details.reason}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {details.zammad_ticket ? (
                            <a
                              href={details.zammad_ticket.web_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 font-mono text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
                            >
                              <Ticket className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Zammad #{details.zammad_ticket.ticket_number}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : isPending ? (
                            <button
                              onClick={() => handleCreateTicket(disc.id)}
                              disabled={creatingTicketId === disc.id}
                              className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 font-mono text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                            >
                              {creatingTicketId === disc.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                              ) : (
                                <Ticket className="h-3.5 w-3.5 text-indigo-600" />
                              )}
                              <span>Abrir Ticket</span>
                            </button>
                          ) : null}

                          {isPending ? (
                            userRole === "operator" ? (
                              <span
                                title="El rol Operador puede abrir tickets en Zammad pero la firma y resolución requiere rol Técnico o Admin"
                                className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 font-mono text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 cursor-not-allowed"
                              >
                                <Lock className="h-3 w-3 text-slate-400" />
                                <span>Firma de Técnico Requerida</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => setResolvingId(resolvingId === disc.id ? null : disc.id)}
                                className="rounded-xl bg-blue-600 px-4 py-2 font-mono text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-2xs"
                              >
                                {resolvingId === disc.id ? "Cancelar" : "Revisar & Firmar"}
                              </button>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                              <CheckCircle2 className="h-4 w-4" /> Validado: {disc.resolved_by}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inline Form */}
                      <AnimatePresence>
                        {resolvingId === disc.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3.5 border-t border-slate-200 pt-3"
                          >
                            <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1">
                              Nota de Auditoría Técnica (Inmutable):
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder={
                                  isDrift
                                    ? "Ej: Se confirmó corte eléctrico en Rack Bodega. Equipo reenergizado..."
                                    : "Ej: Verificado físicamente en Rack Piso 2. Asociado a activo BH-SW-04..."
                                }
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-sans shadow-2xs"
                              />
                              <button
                                onClick={() => handleResolve(disc.id)}
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-mono text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs"
                              >
                                <FileCheck className="h-4 w-4" />
                                <span>Firmar Auditoría</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: PHYSICAL INVENTORY */}
          {activeTab === "inventory" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase">
                    <th className="pb-2.5">Código Activo</th>
                    <th className="pb-2.5">Categoría</th>
                    <th className="pb-2.5">Fabricante / Modelo</th>
                    <th className="pb-2.5">MAC Registrada</th>
                    <th className="pb-2.5">Ubicación Física (Rack / Piso)</th>
                    <th className="pb-2.5 text-right">Estado Inventario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-bold text-blue-700">{asset.asset_code}</td>
                      <td className="py-3 uppercase text-slate-500 text-[10px]">{asset.category}</td>
                      <td className="py-3 font-semibold text-slate-900">{asset.vendor} {asset.model}</td>
                      <td className="py-3 text-slate-600">{asset.mac_address || "—"}</td>
                      <td className="py-3 text-slate-800 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{asset.physical_location || "No especificada"}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                          {asset.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: NETWORK DETECTED */}
          {activeTab === "network" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase">
                    <th className="pb-2.5">Dispositivo</th>
                    <th className="pb-2.5">Tipo</th>
                    <th className="pb-2.5">Dirección IPv4</th>
                    <th className="pb-2.5">Hardware MAC</th>
                    <th className="pb-2.5">Correlación con Inventario</th>
                    <th className="pb-2.5 text-right">Estado Red</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {devices.map((dev) => (
                    <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-bold text-slate-900">{dev.name}</td>
                      <td className="py-3 uppercase text-slate-500 text-[10px]">{dev.device_type}</td>
                      <td className="py-3 text-sky-700 font-bold">{dev.management_ip || "DHCP"}</td>
                      <td className="py-3 text-slate-600">{dev.mac_address}</td>
                      <td className="py-3">
                        {dev.asset_id ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Reconciliado con Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                            <AlertTriangle className="h-3.5 w-3.5" /> Sin Catalogar
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          {dev.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
