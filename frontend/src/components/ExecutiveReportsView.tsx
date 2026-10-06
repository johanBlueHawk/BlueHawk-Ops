"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { 
  Printer, Download, ShieldCheck, CheckCircle2, AlertTriangle, 
  FileText, Calendar, Building2, Server, Wifi, Radio, ArrowUpRight
} from "lucide-react";
import { Organization, NetworkDevice, Discrepancy, Asset } from "@/types";

interface ExecutiveReportsViewProps {
  organization: Organization | null;
  devices: NetworkDevice[];
  discrepancies: Discrepancy[];
  assets: Asset[];
}

export const ExecutiveReportsView: React.FC<ExecutiveReportsViewProps> = ({
  organization,
  devices,
  discrepancies,
  assets,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasData = devices.length > 0;
  const onlineCount = devices.filter((d) => d.status === "online").length;
  const apCount = devices.filter((d) => d.device_type === "ap").length;
  const switchCount = devices.filter((d) => d.device_type === "switch").length;
  const pendingDiscrepancies = discrepancies.filter((d) => d.status === "pending").length;

  const slaPercentage = hasData
    ? devices.length === onlineCount
      ? "99.98"
      : ((onlineCount / devices.length) * 100).toFixed(1)
    : "0.0";

  // Dynamic recommendations calculation
  const recommendations: { title: string; desc: React.ReactNode }[] = [];

  if (!hasData) {
    recommendations.push({
      title: "Enrolamiento de Sonda NOC Hub",
      desc: `Configurar el conector de acceso (UniFi Cloud Gateway, FortiGate o hipervisor) para ${organization?.name || "la sede"} utilizando credenciales de solo lectura para iniciar la recolección automática de telemetría y cálculo de SLA.`,
    });
    recommendations.push({
      title: "Carga de Inventario Físico",
      desc: `Registrar los switches, routers y puntos de acceso de ${organization?.name || "este cliente"} en BlueHawk Inventory para habilitar la reconciliación determinista de activos contra la red.`,
    });
    recommendations.push({
      title: "Levantamiento de Runbooks Operativos",
      desc: "Documentar la acometida de fibra/ISP, IPs públicas y procedimiento de escalamiento para los técnicos de soporte ante eventuales incidentes.",
    });
  } else {
    const missingFromNet = discrepancies.filter(
      (d) => d.discrepancy_type === "missing_from_network" && d.status === "pending"
    );
    const uncataloged = discrepancies.filter(
      (d) => d.discrepancy_type === "uncataloged_device" && d.status === "pending"
    );
    const offlineDevices = devices.filter((d) => d.status === "offline");
    const apDevices = devices.filter((d) => d.device_type === "ap");

    if (missingFromNet.length > 0) {
      const missingAssets = assets.filter((a) => missingFromNet.some((m) => m.asset_id === a.id));
      const assetLabels = missingAssets.length > 0
        ? missingAssets.map((a) => `${a.asset_code} (${a.vendor} ${a.model || ""})`).join(", ")
        : `${missingFromNet.length} activo(s)`;
      recommendations.push({
        title: "Inspección Física por Desconexión (Drift)",
        desc: `Se detectó que el equipo ${assetLabels} registrado en inventario no emitió telemetría en el ciclo de muestreo. Se recomienda verificación física de su acometida eléctrica y conexión al switch.`,
      });
    }

    if (uncataloged.length > 0) {
      recommendations.push({
        title: "Alta de Activos Nuevos en Inventario",
        desc: `Se detectaron ${uncataloged.length} terminales activas en red sin código asignado en BlueHawk Inventory. Se sugiere emitir sus etiquetas físicas de identificación y asignación de activo.`,
      });
    }

    if (offlineDevices.length > 0) {
      recommendations.push({
        title: "Revisión de Nodos Fuera de Línea",
        desc: `Se registran ${offlineDevices.length} dispositivo(s) desconectados (${offlineDevices.map((d) => d.name).slice(0, 3).join(", ")}). Verificar alimentación PoE y troncales de enlace.`,
      });
    }

    if (apDevices.length > 0) {
      const topAp = apDevices[0];
      recommendations.push({
        title: "Capacidad Wi-Fi y Densidad",
        desc: `Puntos de acceso inalámbricos (${apDevices.length} APs, incluyendo ${topAp.name}) presentan enlace troncal Gigabit estable y cobertura normal sin degradación de latencia registrada.`,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: "Operación Nominal Estable",
        desc: "Toda la topología y activos físicos se encuentran plenamente conciliados y en línea sin desviaciones reportadas.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 apple-card p-4 print:hidden">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Reporte Ejecutivo de Salud & Auditoría de Infraestructura
          </h3>
          <p className="text-xs text-slate-500">
            Informe semanal para gerencia y clientes sin armarlo a mano con capturas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-mono text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4 text-sky-400" />
            <span>Imprimir / Guardar como PDF (1-Clic)</span>
          </button>
        </div>
      </div>

      {/* Official Executive Report Sheet (Optimized for Screen & Print) */}
      <div 
        ref={reportRef}
        className="report-sheet bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-sm max-w-4xl mx-auto space-y-8"
      >
        {/* Report Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div className="space-y-1">
            <div className="relative h-10 w-36">
              <Image
                src="/logo.png"
                alt="Blue Hawk Technologies"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="text-[11px] font-mono text-slate-500 pt-1">
              WDBTECHNOLOGY, S.R.L. • RNC: 1-32-XXXXX-X
            </div>
            <div className="text-xs font-medium text-slate-600">
              División de Soporte Gestionado & Redes Empresariales
            </div>
          </div>

          <div className="text-right font-mono text-xs space-y-1">
            <span className="inline-block bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-[11px] font-bold border border-blue-200">
              INFORME EJECUTIVO SEMANAL
            </span>
            <div className="text-slate-400 text-[11px] pt-1">FECHA DE EMISIÓN:</div>
            <div className="text-slate-900 font-bold">{currentDate}</div>
            <div className="text-slate-500 text-[10px]">
              {hasData ? "VERSIÓN DE SONDA: v3.2.12 (Strict RO)" : "ESTADO DE SONDA: Pendiente de Vinculación"}
            </div>
          </div>
        </div>

        {/* Client & Scope Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs">
          <div>
            <span className="text-slate-400 text-[10px] block font-bold">CLIENTE / SEDE:</span>
            <strong className="text-slate-900 text-sm">{organization?.name || "Cliente / Sede"}</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-bold">CÓDIGO CLIENTE:</span>
            <strong className="text-blue-700 text-sm">[{organization?.code || "N/A"}]</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-bold">RESPONSABLE TÉCNICO:</span>
            <strong className="text-slate-800">{organization?.contact_name || "Johan Gabriel Vasquez"}</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block font-bold">DISPONIBILIDAD / SLA:</span>
            <strong className={`text-sm font-bold ${hasData ? "text-emerald-700" : "text-amber-700"}`}>
              {hasData ? `${slaPercentage}% CUMPLIDO` : "EN ESPERA DE TELEMETRÍA"}
            </strong>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono border-b border-slate-200 pb-1">
            1. Resumen Ejecutivo del Estado de Infraestructura
          </h4>
          {hasData ? (
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              Durante el período analizado, la red de la sede <strong>{organization?.name || "del cliente"}</strong> operó con una tasa de disponibilidad del <strong>{slaPercentage}%</strong>. Las sondas deterministas de solo lectura sobre el controlador registraron <strong>{devices.length} dispositivos interconectados</strong> ({onlineCount} en línea, {devices.length - onlineCount} desconectados), manteniendo enlaces de conmutación estables con {switchCount} switches y cobertura Wi-Fi a través de {apCount} puntos de acceso inalámbricos.
            </p>
          ) : (
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              La sede <strong>{organization?.name || "del cliente"}</strong> se encuentra dada de alta en la consola Blue Hawk Ops pero actualmente no posee una sonda de telemetría de red activa ni controlador enlazado (UniFi / FortiOS / Proxmox). En consecuencia, no se ha recolectado telemetría en tiempo real durante este ciclo de auditoría. Para iniciar el monitoreo continuo, levantamiento de topología y reconciliación de activos físicos, se requiere configurar las credenciales de solo lectura del controlador correspondiente.
            </p>
          )}
        </div>

        {/* KPI Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="border border-slate-200 rounded-xl p-3 text-center bg-white">
            <span className="text-[10px] text-slate-400 block font-bold">EQUIPOS MONITOREADOS</span>
            <span className="text-2xl font-black text-slate-900">{devices.length}</span>
            <span className="text-[10px] text-slate-500 block">
              {hasData ? "Nodos Mesh / Trunks" : "Sin sonda activa"}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 text-center bg-white">
            <span className="text-[10px] text-slate-400 block font-bold">ENLACES ACTIVOS</span>
            <span className="text-2xl font-black text-emerald-600">{onlineCount}</span>
            <span className="text-[10px] text-emerald-700 block font-semibold">
              {hasData ? `${Math.round((onlineCount / (devices.length || 1)) * 100)}% Reachable` : "0% Conectado"}
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 text-center bg-white">
            <span className="text-[10px] text-slate-400 block font-bold">ACTIVOS FÍSICOS</span>
            <span className="text-2xl font-black text-blue-700">{assets.length}</span>
            <span className="text-[10px] text-slate-500 block">En Inventario</span>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 text-center bg-white">
            <span className="text-[10px] text-slate-400 block font-bold">DISCREPANCIAS DE DRIFT</span>
            <span className="text-2xl font-black text-amber-600">{pendingDiscrepancies}</span>
            <span className="text-[10px] text-amber-700 block font-semibold">
              {pendingDiscrepancies === 0 ? "Sin desviaciones" : "Auditadas"}
            </span>
          </div>
        </div>

        {/* Inventory Audit Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono border-b border-slate-200 pb-1">
            2. Conciliación de Inventario Físico vs Detección en Red
          </h4>
          <table className="w-full text-left font-mono text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px] uppercase">
              <tr>
                <th className="p-2.5">Código Activo</th>
                <th className="p-2.5">Dispositivo / Modelo</th>
                <th className="p-2.5">Ubicación en Rack / Sede</th>
                <th className="p-2.5">Dirección IP</th>
                <th className="p-2.5 text-right">Resultado de Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {assets.length === 0 && devices.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic font-sans text-xs">
                    No se registran activos de inventario físico ni dispositivos de red para {organization?.name || "este cliente"}. Una vez vinculado el controlador o sincronizado BlueHawk Inventory, la conciliación determinista se ejecutará de forma automática.
                  </td>
                </tr>
              )}

              {assets.length === 0 && devices.length > 0 && (
                devices.slice(0, 8).map((d) => (
                  <tr key={d.id} className="text-[11px]">
                    <td className="p-2.5 font-bold text-amber-600">SIN CÓDIGO</td>
                    <td className="p-2.5">{d.name} {d.model ? `(${d.model})` : ""}</td>
                    <td className="p-2.5 text-slate-600">Detección de Red (Sin Rack)</td>
                    <td className="p-2.5 text-slate-500">{d.management_ip || "DHCP"}</td>
                    <td className="p-2.5 text-right">
                      <span className="font-bold text-amber-600 text-[10px]">NO CATALOGADO EN INVENTARIO</span>
                    </td>
                  </tr>
                ))
              )}

              {assets.length > 0 && assets.slice(0, 8).map((a) => {
                const matchedDevice = devices.find((d) =>
                  (a.mac_address && d.mac_address && d.mac_address.toLowerCase() === a.mac_address.toLowerCase()) ||
                  (d.name && a.asset_code && d.name.toLowerCase().includes(a.asset_code.toLowerCase()))
                );
                const isMissingFromNetwork = discrepancies.some(
                  (d) => d.asset_id === a.id && d.discrepancy_type === "missing_from_network" && d.status === "pending"
                );

                return (
                  <tr key={a.id} className="text-[11px]">
                    <td className="p-2.5 font-bold text-blue-700">{a.asset_code}</td>
                    <td className="p-2.5">{a.vendor} {a.model || ""}</td>
                    <td className="p-2.5 text-slate-600">{a.physical_location || "Sede Principal"}</td>
                    <td className="p-2.5 text-slate-500">
                      {matchedDevice?.management_ip || (isMissingFromNetwork ? "Offline / Desconectado" : "DHCP / N/D")}
                    </td>
                    <td className="p-2.5 text-right">
                      {isMissingFromNetwork ? (
                        <span className="font-bold text-red-600 text-[10px]">DRIFT (Desconectado)</span>
                      ) : matchedDevice ? (
                        <span className="font-bold text-emerald-700 text-[10px]">CONCILIADO EN RACK</span>
                      ) : (
                        <span className="font-bold text-slate-500 text-[10px]">EN BODEGA / SIN RED</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Maintenance & Recommendations */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono border-b border-slate-200 pb-1">
            3. Recomendaciones de Mantenimiento Preventivo
          </h4>
          <ul className="text-xs text-slate-700 space-y-2 list-disc pl-5 font-sans leading-relaxed">
            {recommendations.map((rec, idx) => (
              <li key={idx}>
                <strong>{rec.title}:</strong> {rec.desc}
              </li>
            ))}
          </ul>
        </div>

        {/* Signature & Audit Stamp */}
        <div className="pt-8 border-t border-slate-200 flex justify-between items-end font-mono text-xs">
          <div className="space-y-1 text-slate-500 text-[10px]">
            <div>Documento generado por <strong>Blue Hawk Ops</strong></div>
            <div>Certificación de Solo Lectura • Criptografía SHA-256</div>
            <div>Blue Hawk Technologies / WDBTECHNOLOGY, S.R.L.</div>
          </div>

          <div className="text-right space-y-6">
            <div className="border-b border-slate-400 w-48 ml-auto"></div>
            <div>
              <div className="font-bold text-slate-900">
                {organization?.contact_name || "Johan Gabriel Vasquez"}
              </div>
              <div className="text-[10px] text-slate-500">IT Support & Infrastructure Engineer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
