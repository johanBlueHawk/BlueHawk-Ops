"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, X, FileText, Lock, Network, Key, 
  ExternalLink, CheckCircle2, AlertTriangle, Layers, Server, Shield
} from "lucide-react";

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"governance" | "rbac" | "connectors" | "privacy">("governance");

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
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    Gobernanza, Políticas & Cumplimiento
                  </h3>
                  <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                    POLITICS.MD v2.4
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Blue Hawk Technologies • WDBTECHNOLOGY, S.R.L. • Confidencial
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
              onClick={() => setActiveTab("governance")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "governance"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Gobernanza & Autoridad</span>
            </button>
            <button
              onClick={() => setActiveTab("rbac")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "rbac"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Matriz RBAC</span>
            </button>
            <button
              onClick={() => setActiveTab("connectors")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "connectors"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Network className="h-3.5 w-3.5" />
              <span>Matriz de Interconexión</span>
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === "privacy"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Privacidad & Zero-DPI</span>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-7 space-y-6 text-sm text-slate-700 leading-relaxed">
            {activeTab === "governance" && (
              <div className="space-y-5">
                <div className="rounded-2xl bg-blue-50/60 border border-blue-200/80 p-5">
                  <h4 className="text-base font-bold text-blue-900 mb-1">
                    Principio de Autoridad de Configuración del Fabricante
                  </h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Las consolas oficiales de los fabricantes (UniFi Site Manager / Controller, VMware vSphere Client, FortiOS GUI, Synology DSM, Kerio WebAdmin) continúan siendo la <strong>única autoridad de configuración activa</strong>. Blue Hawk Ops centraliza la telemetría y reconciliación técnica sin reemplazar ni sobreescribir las configuraciones de origen.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">1. Delimitación de Responsabilidad Humana</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Toda toma de decisiones operativas (reemplazo de hardware, cambio de topología física o resolución de discrepancias de inventario) requiere validación de un técnico calificado de Blue Hawk. Las alertas del sistema son herramientas analíticas de apoyo.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">2. Aislamiento Estricto Multi-Tenant</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    La información de red, direcciones IP, topología, inventario y registros de incidencias de un cliente (ej. OVA) se encuentra <strong>estrictamente segregada criptográfica y lógicamente</strong> de cualquier otra organización (ej. Sancha o Troncone).
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 font-mono text-xs">
                  <div className="font-bold text-slate-800 mb-1">Cero Comercialización o Telemetría Invasiva:</div>
                  <p className="text-slate-600 text-[11px]">
                    Los datos de telemetría jamás se comparten con terceros, no se venden y no se emplean para el entrenamiento de modelos de IA externos.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "rbac" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Blue Hawk Ops implementa una arquitectura <strong>Zero Client Trust</strong>. El backend valida cada solicitud contra tokens JWT criptográficos, rechazando de raíz cualquier manipulación de cabeceras cliente.
                </p>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="p-3 font-bold">Capacidad / Acción</th>
                        <th className="p-3 font-bold text-sky-700">Operador (L1)</th>
                        <th className="p-3 font-bold text-blue-700">Técnico (L2)</th>
                        <th className="p-3 font-bold text-indigo-700">Admin (L3)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Visualizar Dashboard & Topología</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Permitido</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Permitido</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Permitido</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">Apertura de Tickets en Zammad</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Permitido</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Permitido</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Permitido</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Sondeo Manual UniFi (Network Sync)</td>
                        <td className="p-3 text-red-600 font-bold">❌ 403 Bloqueado</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Permitido</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Permitido</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">Sincronización con BlueHawk Inventory</td>
                        <td className="p-3 text-red-600 font-bold">❌ 403 Bloqueado</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Permitido</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Permitido</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Firma y Resolución de Discrepancias</td>
                        <td className="p-3 text-red-600 font-bold">❌ 403 Bloqueado</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Firma Digital</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Firma Digital</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">Gestión de Usuarios y Credenciales</td>
                        <td className="p-3 text-red-600 font-bold">❌ Sin Acceso</td>
                        <td className="p-3 text-red-600 font-bold">❌ Sin Acceso</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Exclusivo L3</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Cifrado de Secretos Fernet (AES-CBC)</td>
                        <td className="p-3 text-red-600 font-bold">❌ Sin Acceso</td>
                        <td className="p-3 text-red-600 font-bold">❌ Sin Acceso</td>
                        <td className="p-3 text-emerald-600 font-bold">✅ Exclusivo L3</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "connectors" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Matriz de comunicación con plataformas externas. Todo el tráfico se realiza mediante canales seguros y credenciales de mínimo privilegio.
                </p>

                <div className="space-y-3 font-mono text-xs">
                  {/* UniFi */}
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-sky-700">1. UniFi Network Controller</span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">HTTPS 443/8443</span>
                    </div>
                    <div className="mt-2 text-slate-600 space-y-1 text-[11px]">
                      <div><strong>Autenticación:</strong> API Key (`X-API-KEY`) o Sesión Local OS</div>
                      <div><strong>Alcance:</strong> Strict Read-Only (`Viewer`). Cero mutaciones de WiFi o VLANs.</div>
                      <div><strong>Datos Ingeridos:</strong> MACs, puertos uplink trunk, IPs de gestión, estados PoE.</div>
                    </div>
                  </div>

                  {/* Inventory */}
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-amber-700">2. BlueHawk Inventory API</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">HTTPS REST API</span>
                    </div>
                    <div className="mt-2 text-slate-600 space-y-1 text-[11px]">
                      <div><strong>Autenticación:</strong> Bearer Token (JWT 8h de vida)</div>
                      <div><strong>Alcance:</strong> Read-Only Assets. Deduplicación determinista en memoria.</div>
                      <div><strong>Datos Ingeridos:</strong> Códigos de activo, ubicación en rack/piso, responsable, serial.</div>
                    </div>
                  </div>

                  {/* Zammad */}
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-indigo-700">3. Zammad Helpdesk (support.bluehawktech.com)</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">HTTPS REST API</span>
                    </div>
                    <div className="mt-2 text-slate-600 space-y-1 text-[11px]">
                      <div><strong>Autenticación:</strong> HTTP Token (`Token token=...`) con scope `ticket.agent`</div>
                      <div><strong>Alcance:</strong> Creación de tickets de soporte y vinculación en BD.</div>
                      <div><strong>Datos Emitidos:</strong> Runbook de soporte, discrepancia, IP, MAC y firma del operador.</div>
                    </div>
                  </div>

                  {/* Synology */}
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-emerald-700">4. Synology DSM / UNAS</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">SNMPv3 UDP 161 (AuthPriv)</span>
                    </div>
                    <div className="mt-2 text-slate-600 space-y-1 text-[11px]">
                      <div><strong>Autenticación:</strong> Usuario SNMPv3, Auth SHA-256, Privacidad AES</div>
                      <div><strong>Alcance:</strong> MIBs Oficiales (SYNOLOGY-SYSTEM, SYNOLOGY-DISK, SYNOLOGY-RAID).</div>
                      <div><strong>Garantía:</strong> Sin acceso a datos de archivos o carpetas compartidas.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-5">
                  <h4 className="text-base font-bold text-emerald-900 mb-1">
                    Garantía de Cero Inspección Profunda (Zero DPI)
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Blue Hawk Ops opera exclusivamente a nivel de metadatos de infraestructura física y lógica (Capas L2 y L3 de OSI: MAC, IP de gestión, enlace switch). <strong>No realizamos captura de paquetes, análisis de contenido (payload), ni inspección de paquetes en tránsito.</strong>
                  </p>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Inviolabilidad de la Navegación:</strong> La consola jamás registra historiales web, búsquedas, correos electrónicos ni mensajería de empleados de los clientes.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Cifrado de Secretos en Reposo:</strong> Todas las credenciales almacenadas en base de datos están cifradas mediante <strong>AES-128-CBC con HMAC-SHA256 (Fernet)</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Cumplimiento Legal:</strong> Alineado a normativas de telecomunicaciones de la República Dominicana y directrices ISO/IEC 27001 para protección de infraestructura crítica.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-7 py-4 border-t border-slate-100 bg-slate-50/70 text-xs font-mono">
            <span className="text-slate-500">Documento de Referencia: docs/POLITICS.md</span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-xs"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
