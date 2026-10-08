"use client";

import React, { useState } from "react";
import { 
  Wifi, Server, HardDrive, ShieldCheck, RefreshCw, 
  CheckCircle2, AlertTriangle, ShieldAlert, Cpu, 
  Activity, ExternalLink, Network, Database
} from "lucide-react";
import { ClientIntegration } from "@/types";

interface ServiceCardProps {
  integration?: ClientIntegration;
  onSync?: (id: string) => Promise<void>;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ integration, onSync }) => {
  const [syncing, setSyncing] = useState(false);

  const handleSyncClick = async () => {
    if (!integration || !onSync) return;
    setSyncing(true);
    try {
      await onSync(integration.id);
    } finally {
      setSyncing(false);
    }
  };

  // Strategic Multi-Vendor Probes
  const connectors = [
    {
      id: "unifi-live",
      provider: "unifi",
      name: "UniFi Network (Controller Sede Central)",
      status: "OPERATIVO",
      statusClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
      host: "192.168.10.1:443 (Local UniFi OS)",
      auth: "API Token (X-API-KEY / Read-Only)",
      metrics: [
        { label: "Nodos Mesh Activos", value: "10 Dispositivos" },
        { label: "Enlaces Troncales", value: "6 Trunks SFP+/PoE" },
        { label: "Clientes Concurrentes", value: "112 Dispositivos" },
        { label: "Permiso de Seguridad", value: "Strict Read-Only" }
      ],
      isLive: true,
      lastSync: integration?.last_sync_at ? new Date(integration.last_sync_at).toLocaleTimeString() : "En línea"
    },
    {
      id: "inventory-api",
      provider: "inventory",
      name: "BlueHawk Inventory (Gestión de Activos)",
      status: "OPERATIVO (API REST)",
      statusClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
      host: "inventory.bluehawktech.com/api/v1 (HTTPS)",
      auth: "Bearer Token (JWT 8h / Rol Consulta)",
      metrics: [
        { label: "Protocolo", value: "REST API HTTPS" },
        { label: "Paginación", value: "500 activos / página" },
        { label: "Reconciliación", value: "Motor Determinista Ops" },
        { label: "Seguridad", value: "Strict Read-Only" }
      ],
      isLive: false,
      lastSync: "Enlace Directo Backend"
    },
    {
      id: "fortigate-vpn",
      provider: "fortigate",
      name: "FortiOS REST API (Firewall & Perímetro)",
      status: "CONECTOR CONFIGURADO",
      statusClass: "text-blue-700 bg-blue-50 border-blue-200",
      host: "10.0.0.1 (FortiGate 60F Cluster)",
      auth: "API Key (Mínimo Privilegio / Sin Escritura)",
      metrics: [
        { label: "Túneles VPN IPsec", value: "4/4 Activos (Multisede)" },
        { label: "Consumo Enlace WAN (Claro)", value: "42 Mbps / 100 Mbps" },
        { label: "Latencia a Gateway", value: "3.2 ms" },
        { label: "Reglas de Firewall", value: "Solo Lectura / Sin Modificar" }
      ],
      isLive: false,
      lastSync: "Próxima fase (Sonda Pasiva)"
    },
    {
      id: "proxmox-vm",
      provider: "vmware",
      name: "Proxmox VE / VMware ESXi (Hipervisores)",
      status: "FASE 4: PLANIFICADO",
      statusClass: "text-slate-700 bg-slate-100 border-slate-200",
      host: "192.168.10.200 (Proxmox Cluster)",
      auth: "PVE Token (Role: PVEAuditor)",
      metrics: [
        { label: "Hipervisores Físicos", value: "2 Servidores" },
        { label: "Máquinas Virtuales (VMs)", value: "14 VMs en Ejecución" },
        { label: "Último Respaldo (PBS)", value: "Exitoso (02:00 AM)" },
        { label: "RAM Asignada", value: "78% Utilizado" }
      ],
      isLive: false,
      lastSync: "Próxima fase (Auditoría)"
    },
    {
      id: "synology-nas",
      provider: "synology",
      name: "Synology DSM / UNAS (Almacenamiento)",
      status: "FASE 4: PLANIFICADO",
      statusClass: "text-slate-700 bg-slate-100 border-slate-200",
      host: "192.168.10.250 (DS923+)",
      auth: "DSM WebAPI (Read-Only Token)",
      metrics: [
        { label: "Salud SMART Discos", value: "Normal (4/4 HDD)" },
        { label: "Retención de Snapshots", value: "30 Días Garantizados" },
        { label: "Volumen Utilizado", value: "3.8 TB / 12 TB (31%)" },
        { label: "Temperatura Array", value: "34°C Óptimo" }
      ],
      isLive: false,
      lastSync: "Próxima fase (Almacenamiento)"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {connectors.map((conn) => (
        <div key={conn.id} className="apple-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                  {conn.provider === "unifi" ? (
                    <Wifi className="h-5 w-5 text-sky-600" />
                  ) : conn.provider === "inventory" ? (
                    <Database className="h-5 w-5 text-amber-600" />
                  ) : conn.provider === "fortigate" ? (
                    <ShieldAlert className="h-5 w-5 text-blue-600" />
                  ) : conn.provider === "synology" ? (
                    <HardDrive className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Server className="h-5 w-5 text-indigo-600" />
                  )}
                </div>
                <div>
                  <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {conn.provider.toUpperCase()} • CONECTOR NOC
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    {conn.name}
                  </h4>
                </div>
              </div>

              <span className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border ${conn.statusClass}`}>
                {conn.status}
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Host / Endpoint:</span>
                <strong className="text-slate-900">{conn.host}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Autenticación:</span>
                <strong className="text-blue-700">{conn.auth}</strong>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 font-mono">
              {conn.metrics.map((m, idx) => (
                <div key={idx} className="rounded-lg bg-white border border-slate-200 p-2 text-center">
                  <div className="text-[10px] text-slate-400 font-semibold">{m.label}</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between font-mono text-xs text-slate-500">
            <span>Último Sondeo: <strong className="text-slate-700">{conn.lastSync}</strong></span>

            {conn.isLive && integration && onSync ? (
              <button
                onClick={handleSyncClick}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-2xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Sondeando..." : "Sondear Ahora"}</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Sonda Segura</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
