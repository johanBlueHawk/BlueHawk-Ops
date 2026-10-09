"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, X, Network, FileCheck, Ticket, Activity, 
  HelpCircle, CheckCircle2, ChevronRight, Copy, Terminal, ExternalLink
} from "lucide-react";

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"quickstart" | "topology" | "reconciliation" | "probes">("quickstart");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Manual de Operación NOC
                  </h3>
                  <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                    USER_GUIDE.MD v2.4
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Guía paso a paso para Operadores (L1), Técnicos (L2) y Administradores (L3)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 px-7 py-2.5 border-b border-slate-100 bg-white font-mono text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab("quickstart")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "quickstart"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Guía Rápida & Acceso</span>
            </button>
            <button
              onClick={() => setActiveTab("topology")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "topology"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>Topología & Runbooks</span>
            </button>
            <button
              onClick={() => setActiveTab("reconciliation")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "reconciliation"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>Reconciliación & Zammad</span>
            </button>
            <button
              onClick={() => setActiveTab("probes")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "probes"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Sondas & Telemetría</span>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-7 space-y-6 text-sm text-slate-700 leading-relaxed">
            {activeTab === "quickstart" && (
              <div className="space-y-5">
                <div className="rounded-2xl bg-indigo-50/60 border border-indigo-200/80 p-5">
                  <h4 className="text-base font-bold text-indigo-900 mb-1">
                    Flujo de Trabajo Diario en el NOC
                  </h4>
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    Blue Hawk Ops centraliza la visibilidad de sedes multicliente. Su objetivo diario es monitorizar la salud de enlaces, atender discrepancias de hardware detectadas por el motor determinista y escalar incidencias a Zammad con contexto técnico completo.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-sky-700 block mb-1">Paso 1: Selección de Sede</span>
                    <p className="text-slate-600 text-[11px]">
                      Use el selector de clientes superior para elegir la organización y sede a supervisar.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-blue-700 block mb-1">Paso 2: Cola de Reconciliación</span>
                    <p className="text-slate-600 text-[11px]">
                      Revise anomalías de drift (equipos caídos de red o dispositivos no catalogados).
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="font-bold text-indigo-700 block mb-1">Paso 3: Apertura en Zammad</span>
                    <p className="text-slate-600 text-[11px]">
                      Abra un ticket directo hacia soporte con el runbook operativo ya inyectado.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 font-mono text-xs space-y-2">
                  <span className="font-bold text-slate-900 block">Credenciales de Acceso NOC:</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-600">
                    <div>• <strong>Operador L1:</strong> operador@bluehawk.tech</div>
                    <div>• <strong>Técnico L2:</strong> tecnico@bluehawk.tech</div>
                    <div>• <strong>Admin L3:</strong> admin@bluehawk.tech</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "topology" && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">
                    Navegación del Árbol de Conectividad & Runbooks
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    La pestaña <strong>Topología</strong> representa la estructura real de red, conectada desde el gateway perimetral hacia switches de distribución, switches de acceso y puntos de acceso Wi-Fi.
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 text-blue-800 font-bold mb-1">
                      <Terminal className="h-4 w-4" />
                      <span>RB-01: Caída de WAN / Enlace Claro FO</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Verificar puerto SFP+ 11 del Gateway. Ping a 10.0.0.1 y 1.1.1.1. Si ONT Claro está en alarma roja, reportar circuito CL-9812-BH al NOC Claro (809-220-1111). NO REINICIAR GATEWAY EN HORARIO LABORAL.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 text-indigo-800 font-bold mb-1">
                      <Terminal className="h-4 w-4" />
                      <span>RB-02: Diagnóstico de Switch & Consumo PoE</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Verificar potencia global PoE en switch. Confirmar que el puerto uplink troncal no presente errores CRC. En caso de loop STP, aislar puertos de acceso.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold mb-1">
                      <Terminal className="h-4 w-4" />
                      <span>RB-03: Incidencia Wi-Fi / AP Degradado</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Verificar saturación de clientes concurrentes. Comprobar negociación Gigabit/2.5G con el switch PoE. Si hay interferencia de radar, validar canal DFS 52-64.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3.5 text-xs text-blue-900 font-mono">
                  <strong>💡 Tip Operativo:</strong> Al hacer click sobre cualquier nodo de red, se abrirá el cajón lateral con su ficha técnica, ubicación física en rack y el botón directo para copiar sus parámetros o abrir un ticket formal en Zammad.
                </div>
              </div>
            )}

            {activeTab === "reconciliation" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  El motor de reconciliación determinista cruza los activos físicos de <strong>BlueHawk Inventory</strong> con la red activa de <strong>UniFi Network</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50/50">
                    <span className="font-bold text-red-800 block mb-1">DRIFT: AUSENTE (`missing_from_network`)</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      El hardware está registrado en el inventario físico pero no responde en la red UniFi. Indica posible corte eléctrico, falla de cableado o desconexión física. Prioridad Alta en Zammad.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                    <span className="font-bold text-amber-800 block mb-1">NO CATALOGADO (`uncataloged_device`)</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      El equipo fue detectado en la red física pero no tiene registro en BlueHawk Inventory. Requiere catalogación por el técnico o aislamiento de puerto.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 font-mono text-xs space-y-2">
                  <span className="font-bold text-slate-900 block">Flujo de Resolución:</span>
                  <div className="space-y-1 text-slate-600 text-[11px]">
                    <div>1. <strong>Abrir Ticket en Zammad:</strong> Haga click en "Revisar" → "Abrir Ticket en Zammad". El ticket se creará instantáneamente con el número enlazado.</div>
                    <div>2. <strong>Inspección Física:</strong> El técnico en campo verifica rack, alimentación y conexionado.</div>
                    <div>3. <strong>Firma de Cierre:</strong> El técnico ingresa su nota justificativa y presiona "Firmar". La acción queda auditada permanentemente.</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "probes" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Supervisión del estado de salud de los conectores en la pestaña <strong>Conectores</strong>:
                </p>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <strong className="text-slate-900">UniFi Network:</strong>
                      <span className="text-slate-500 text-[11px] ml-2">Sondeo de topología y estado de dispositivos.</span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">OPERATIVO</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <strong className="text-slate-900">BlueHawk Inventory:</strong>
                      <span className="text-slate-500 text-[11px] ml-2">Sonda directa a /health del API de inventario.</span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">OPERATIVO (API REST)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <strong className="text-slate-900">Zammad Helpdesk:</strong>
                      <span className="text-slate-500 text-[11px] ml-2">Sonda de autenticación con support.bluehawktech.com.</span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">OPERATIVO (API REST)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <strong className="text-slate-900">Synology NAS (SNMPv3):</strong>
                      <span className="text-slate-500 text-[11px] ml-2">Sonda de salud de discos y volumen RAID (UDP 161).</span>
                    </div>
                    <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">PLANIFICADO</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 font-mono">
                  Presione el botón <strong>"Actualizar Sondas"</strong> en cualquier momento para verificar la latencia y disponibilidad de toda la cadena de servicios.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-slate-50/70 text-xs font-mono">
            <span className="text-slate-500">Documento de Referencia: docs/USER_GUIDE.md</span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-xs"
            >
              Cerrar Guía
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
