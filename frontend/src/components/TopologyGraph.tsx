"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Network, Wifi, Server, Cpu, ChevronRight, ChevronDown, 
  CheckCircle2, Radio, Cable, ShieldCheck, MapPin, 
  BookOpen, PhoneCall, Copy, Check, X, FileText, ArrowUpRight,
  Ticket, ExternalLink, Loader2
} from "lucide-react";
import { TopologyNode } from "@/types";
import { API_BASE } from "@/config/api";

interface TopologyGraphProps {
  roots: TopologyNode[];
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({ roots }) => {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [copied, setCopied] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<{ number: string; url: string } | null>(null);

  const handleCopyParams = (node: TopologyNode) => {
    const text = `DISPOSITIVO: ${node.name}\nMODELO: ${node.model || "N/A"}\nIP: ${node.ip || "DHCP"}\nMAC: ${node.mac}\nACTIVO: ${node.asset_code || "Sin catalogar"}\nUBICACIÓN: ${node.physical_location || "N/A"}\nPUERTO TRUNK: ${node.uplink_port || "Principal"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateNodeTicket = async (node: TopologyNode) => {
    try {
      setCreatingTicket(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("bhops_access_token") : null;
      const res = await fetch(`${API_BASE}/nodes/${node.id}/create-ticket`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedTicket({
          number: data.ticket?.ticket_number || data.ticket?.ticket_id,
          url: data.ticket?.web_url || "#"
        });
      }
    } catch (e) {
      console.error("Error creating Zammad ticket:", e);
    } finally {
      setCreatingTicket(false);
    }
  };

  return (
    <div className="relative">
      <div className="apple-card p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-sky-50 text-sky-600 ring-1 ring-sky-500/15">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                Topología Física & Contexto Operativo de Soporte
                <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-2 py-0.5 rounded-full border border-blue-200">
                  Click en un nodo para abrir Runbook
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Correlación por puertos trunk de UniFi Network vinculados a ubicaciones físicas en rack y runbooks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Trunk Links Activos
            </span>
          </div>
        </div>

        {/* Nodes tree */}
        <div className="mt-5 space-y-3">
          {roots.length === 0 ? (
            <div className="rounded-[16px] bg-slate-50/80 p-8 text-center text-sm text-slate-400">
              No se han descubierto nodos de red para esta sede.
            </div>
          ) : (
            roots.map((root) => (
              <TopologyTreeNode 
                key={root.id} 
                node={root} 
                depth={0} 
                isLast={false} 
                onSelectNode={(node) => setSelectedNode(node)}
                isSelected={selectedNode?.id === root.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Slide-over Support Context & Runbook Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/30 backdrop-blur-xs p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 overflow-y-auto max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-500/15">
                    {selectedNode.device_type === "gateway" ? (
                      <Radio className="h-5 w-5" />
                    ) : selectedNode.device_type === "switch" ? (
                      <Server className="h-5 w-5" />
                    ) : (
                      <Wifi className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">
                      {selectedNode.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-slate-500 uppercase">
                        {selectedNode.device_type} • {selectedNode.model || "Modelo UniFi"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ONLINE
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNode(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="mt-5 space-y-5">
                {/* 1. Physical Location & Inventory Card */}
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    <MapPin className="h-4 w-4 text-sky-600" />
                    <span>Ubicación Física & Inventario (BlueHawk Inventory)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px]">CÓDIGO ACTIVO:</span>
                      <strong className="text-blue-700 font-bold">
                        {selectedNode.asset_code || "Sin catalogar en inventario"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">UBICACIÓN EN RACK / PISO:</span>
                      <strong className="text-slate-900 font-semibold">
                        {selectedNode.physical_location || "No especificada"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">DIRECCIÓN IP:</span>
                      <strong className="text-slate-800">{selectedNode.ip || "DHCP"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">MAC ADDRESS:</span>
                      <strong className="text-slate-800">{selectedNode.mac}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. ISP Circuit Info (if Gateway) */}
                {selectedNode.isp_circuit && (
                  <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-1.5">
                      <PhoneCall className="h-4 w-4 text-blue-600" />
                      <span>Circuito de Proveedor de Internet (ISP)</span>
                    </div>
                    <p className="font-mono text-xs text-blue-800 leading-relaxed">
                      {selectedNode.isp_circuit}
                    </p>
                  </div>
                )}

                {/* 3. Operational Runbook */}
                <div className="rounded-xl bg-amber-50/50 p-4 border border-amber-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
                    <BookOpen className="h-4 w-4 text-amber-600" />
                    <span>Runbook de Soporte & Procedimiento de Falla</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {selectedNode.runbook_summary || "Verificar conectividad básica, estado de PoE y revisar puertos trunk en switch core."}
                  </p>
                </div>

                {/* Uplink Info */}
                {selectedNode.uplink_port && (
                  <div className="flex items-center justify-between text-xs font-mono text-slate-600 bg-slate-100/60 p-3 rounded-lg border border-slate-200">
                    <span>Enlace Troncal Físico:</span>
                    <strong className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      Puerto Trunk #{selectedNode.uplink_port}
                    </strong>
                  </div>
                )}

                {/* Zammad Ticket Action / Status Banner */}
                <div className="pt-1">
                  {createdTicket ? (
                    <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-200 p-2.5 font-mono text-xs text-indigo-900">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-indigo-600" />
                        <span>Ticket Zammad: <strong>#{createdTicket.number}</strong> (Abierto)</span>
                      </div>
                      <a
                        href={createdTicket.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 underline hover:text-indigo-900"
                      >
                        <span>Abrir Ticket</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCreateNodeTicket(selectedNode)}
                      disabled={creatingTicket}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-mono text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {creatingTicket ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <Ticket className="h-4 w-4 text-indigo-200" />
                      )}
                      <span>{creatingTicket ? "Abriendo Ticket en Zammad..." : "Abrir Ticket de Incidente en Zammad"}</span>
                    </button>
                  )}
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleCopyParams(selectedNode)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-400" />}
                    <span>{copied ? "¡Copiado!" : "Copiar Ficha"}</span>
                  </button>

                  <button
                    onClick={() => { setSelectedNode(null); setCreatedTicket(null); }}
                    className="rounded-lg bg-slate-900 px-4 py-1.5 font-mono text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface NodeProps {
  node: TopologyNode;
  depth: number;
  isLast: boolean;
  onSelectNode: (node: TopologyNode) => void;
  isSelected: boolean;
}

const TopologyTreeNode: React.FC<NodeProps> = ({ 
  node, 
  depth, 
  onSelectNode,
  isSelected 
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const isGateway = node.device_type.toLowerCase() === "gateway";
  const isSwitch = node.device_type.toLowerCase() === "switch";
  const isAp = node.device_type.toLowerCase() === "ap";

  const getDeviceIcon = () => {
    if (isGateway) return <Radio className="h-4 w-4 text-sky-600" />;
    if (isSwitch) return <Server className="h-4 w-4 text-indigo-600" />;
    if (isAp) return <Wifi className="h-4 w-4 text-emerald-600" />;
    return <Cpu className="h-4 w-4 text-slate-600" />;
  };

  const getIconWrapperClass = () => {
    if (isGateway) return "bg-sky-50 text-sky-600 ring-1 ring-sky-500/15";
    if (isSwitch) return "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/15";
    if (isAp) return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/15";
    return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  };

  const getDeviceBadgeClass = () => {
    if (isGateway) return "bg-sky-50 text-sky-700 ring-1 ring-sky-500/20";
    if (isSwitch) return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20";
    if (isAp) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20";
    return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  };

  return (
    <div className="relative">
      <motion.div
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={() => onSelectNode(node)}
        className={`flex flex-wrap items-center justify-between gap-3 p-3.5 transition-all cursor-pointer ${
          isSelected
            ? "rounded-[18px] bg-blue-50/80 ring-2 ring-blue-500 shadow-md"
            : depth === 0
            ? "rounded-[18px] bg-gradient-to-r from-sky-50/40 via-white to-white ring-1 ring-sky-300/40 shadow-xs hover:ring-sky-400"
            : depth === 1
            ? "rounded-[16px] bg-white ring-1 ring-slate-900/5 shadow-2xs hover:shadow-xs hover:ring-slate-300"
            : "rounded-[14px] bg-slate-50/70 hover:bg-white ring-1 ring-slate-900/5 transition-colors"
        }`}
        style={{ marginLeft: `${depth * 28}px` }}
      >
        {/* Left Side: Expand button + Icon + Name + Tags */}
        <div className="flex items-center gap-3 min-w-[260px]">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
              title={expanded ? "Colapsar rama" : "Expandir rama"}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            </div>
          )}

          <div
            className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${getIconWrapperClass()}`}
          >
            {getDeviceIcon()}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 tracking-tight">
                {node.name}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${getDeviceBadgeClass()}`}
              >
                {node.device_type}
              </span>
              {node.asset_code && (
                <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 font-mono text-[9px] text-blue-700 font-bold">
                  {node.asset_code}
                </span>
              )}
            </div>
            {node.physical_location && (
              <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-slate-400" /> {node.physical_location}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Network Info + Uplink Port + Active Status Pill */}
        <div className="flex items-center gap-3 font-mono text-xs text-slate-500">
          <div className="flex items-center gap-1.5 bg-slate-100/60 px-2.5 py-1 rounded-full ring-1 ring-slate-200/50">
            <span className="text-[10px] text-slate-400">IP:</span>
            <span className="text-slate-800 font-semibold">{node.ip || "DHCP"}</span>
          </div>

          {node.uplink_port && (
            <span className="flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-500/20">
              <Cable className="h-3 w-3 text-sky-600" />
              Puerto {node.uplink_port}
            </span>
          )}

          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ACTIVO
          </span>
        </div>
      </motion.div>

      {/* Children tree */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-2 border-l border-slate-200/80 pl-2"
            style={{ marginLeft: `${depth * 28 + 14}px` }}
          >
            {node.children.map((child, idx) => (
              <TopologyTreeNode
                key={child.id}
                node={child}
                depth={0}
                isLast={idx === node.children.length - 1}
                onSelectNode={onSelectNode}
                isSelected={isSelected}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
