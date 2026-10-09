"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Network, Wifi, Server, Radio, AlertTriangle, RefreshCw, 
  Search, ShieldAlert, Cpu, Terminal, ArrowUpRight, Zap, 
  CheckCircle2, Clock, Filter, Activity, BarChart3, Database,
  SlidersHorizontal, CheckSquare, Layers, LayoutGrid, FileText,
  BookOpen, ShieldCheck
} from "lucide-react";
import { Organization, ClientIntegration, TopologyNode, Discrepancy, NetworkDevice, Asset, UserRole } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { ClientSelector } from "@/components/ClientSelector";
import { RoleSelector } from "@/components/RoleSelector";
import { ServiceCard } from "@/components/ServiceCard";
import { TopologyGraph } from "@/components/TopologyGraph";
import { DiscrepanciesQueue } from "@/components/DiscrepanciesQueue";
import { ObservabilityCharts } from "@/components/ObservabilityCharts";
import { InventoryReconciliationView } from "@/components/InventoryReconciliationView";
import { ExecutiveReportsView } from "@/components/ExecutiveReportsView";
import { DynamicActionIsland } from "@/components/DynamicActionIsland";
import { UserManagementModal } from "@/components/UserManagementModal";
import { ComplianceModal } from "@/components/ComplianceModal";
import { DocumentationModal } from "@/components/DocumentationModal";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { BHOpsLogo } from "@/components/BHOpsLogo";
import { API_BASE } from "@/config/api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>("technician");
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showDocumentationModal, setShowDocumentationModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [integrations, setIntegrations] = useState<ClientIntegration[]>([]);
  const [topologyRoots, setTopologyRoots] = useState<TopologyNode[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingInventory, setSyncingInventory] = useState(false);

  // Restore sidebar collapse state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bhops_sidebar_collapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("bhops_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  // Sync role with logged-in user and enforce authentication
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (user) {
      setUserRole(user.role);
    }
  }, [user, isLoading, router]);

  // Load Organizations
  useEffect(() => {
    if (!user) return;
    async function loadOrgs() {
      try {
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/organizations`, { headers });
        if (res.ok) {
          const data: Organization[] = await res.json();
          setOrganizations(data);
          const bh = data.find((o) => o.code === "BH") || data[0];
          setSelectedOrg(bh || null);
        }
      } catch (err) {
        console.error("Error loading organizations:", err);
      }
    }
    loadOrgs();
  }, [user, token]);

  // Load Client Data
  useEffect(() => {
    if (!selectedOrg || !user) return;
    const orgId = selectedOrg.id;

    async function loadClientData(id: string) {
      try {
        const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const integRes = await fetch(`${API_BASE}/organizations/${id}/integrations`, { headers: authHeaders });
        if (integRes.ok) {
          const integs: ClientIntegration[] = await integRes.json();
          setIntegrations(integs);
        } else {
          setIntegrations([]);
        }

        const sitesRes = await fetch(`${API_BASE}/organizations/${id}/sites`, { headers: authHeaders });
        if (sitesRes.ok) {
          const sites = await sitesRes.json();
          if (sites.length > 0) {
            const sId = sites[0].id;
            setCurrentSiteId(sId);
            
            const [topRes, discRes, devRes, assetRes] = await Promise.all([
              fetch(`${API_BASE}/sites/${sId}/topology`, { headers: authHeaders }),
              fetch(`${API_BASE}/sites/${sId}/discrepancies`, { headers: authHeaders }),
              fetch(`${API_BASE}/sites/${sId}/devices`, { headers: authHeaders }),
              fetch(`${API_BASE}/sites/${sId}/assets`, { headers: authHeaders }),
            ]);
            
            if (topRes.ok) setTopologyRoots((await topRes.json()).roots || []);
            if (discRes.ok) setDiscrepancies(await discRes.json());
            if (devRes.ok) setDevices(await devRes.json());
            if (assetRes.ok) setAssets(await assetRes.json());
          } else {
            setCurrentSiteId(null);
            setTopologyRoots([]);
            setDiscrepancies([]);
            setDevices([]);
            setAssets([]);
          }
        } else {
          setCurrentSiteId(null);
          setTopologyRoots([]);
          setDiscrepancies([]);
          setDevices([]);
          setAssets([]);
        }
      } catch (err) {
        console.error("Error loading client data:", err);
      }
    }
    loadClientData(orgId);
  }, [selectedOrg, user, token]);

  // Sync trigger
  const handleSync = async (integrationId: string) => {
    if (userRole === "operator") return;
    try {
      setSyncingAll(true);
      const res = await fetch(`${API_BASE}/integrations/${integrationId}/sync`, { 
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok && currentSiteId) {
        const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [topRes, discRes, devRes, assetRes] = await Promise.all([
          fetch(`${API_BASE}/sites/${currentSiteId}/topology`, { headers: authHeaders }),
          fetch(`${API_BASE}/sites/${currentSiteId}/discrepancies`, { headers: authHeaders }),
          fetch(`${API_BASE}/sites/${currentSiteId}/devices`, { headers: authHeaders }),
          fetch(`${API_BASE}/sites/${currentSiteId}/assets`, { headers: authHeaders }),
        ]);
        if (topRes.ok) setTopologyRoots((await topRes.json()).roots || []);
        if (discRes.ok) setDiscrepancies(await discRes.json());
        if (devRes.ok) setDevices(await devRes.json());
        if (assetRes.ok) setAssets(await assetRes.json());
      }
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleResolveDiscrepancy = async (id: string, notes: string) => {
    try {
      const roleLabel = userRole === "admin" ? "Administrador" : "Técnico";
      const resolvedBy = user ? `${user.full_name} (${roleLabel})` : `Johan Vasquez (${roleLabel})`;
      const res = await fetch(`${API_BASE}/discrepancies/${id}/resolve`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          resolution_notes: notes,
          resolved_by: resolvedBy,
          status: "resolved",
        }),
      });
      if (res.ok && currentSiteId) {
        const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const discRes = await fetch(`${API_BASE}/sites/${currentSiteId}/discrepancies`, { headers: authHeaders });
        if (discRes.ok) setDiscrepancies(await discRes.json());
      }
    } catch (e) {
      console.error("Resolve error:", e);
    }
  };

  const handleSyncInventory = async () => {
    if (!currentSiteId || userRole === "operator") return;
    try {
      setSyncingInventory(true);
      const res = await fetch(`${API_BASE}/sites/${currentSiteId}/inventory/sync`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const [topRes, discRes, devRes, assetRes] = await Promise.all([
          fetch(`${API_BASE}/sites/${currentSiteId}/topology`, { headers: authHeaders }),
          fetch(`${API_BASE}/sites/${currentSiteId}/discrepancies`, { headers: authHeaders }),
          fetch(`${API_BASE}/sites/${currentSiteId}/devices`, { headers: authHeaders }),
          fetch(`${API_BASE}/sites/${currentSiteId}/assets`, { headers: authHeaders }),
        ]);
        if (topRes.ok) setTopologyRoots((await topRes.json()).roots || []);
        if (discRes.ok) setDiscrepancies(await discRes.json());
        if (devRes.ok) setDevices(await devRes.json());
        if (assetRes.ok) setAssets(await assetRes.json());
      }
    } catch (e) {
      console.error("Inventory sync error:", e);
    } finally {
      setSyncingInventory(false);
    }
  };

  const handleRefreshDiscrepancies = async () => {
    if (!currentSiteId) return;
    try {
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const discRes = await fetch(`${API_BASE}/sites/${currentSiteId}/discrepancies`, { headers: authHeaders });
      if (discRes.ok) setDiscrepancies(await discRes.json());
    } catch (e) {
      console.error("Refresh discrepancies error:", e);
    }
  };

  // Device filtering
  const filteredDevices = devices.filter((dev) => {
    const matchesSearch = 
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dev.management_ip && dev.management_ip.includes(searchQuery)) ||
      (dev.mac_address && dev.mac_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (dev.model && dev.model.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === "all" || dev.device_type === filterType;
    return matchesSearch && matchesType;
  });

  const pendingDiscrepancies = discrepancies.filter((d) => d.status === "pending").length;
  const onlineCount = devices.filter((d) => d.status === "online").length;
  const apCount = devices.filter((d) => d.device_type === "ap").length;
  const switchCount = devices.filter((d) => d.device_type === "switch").length;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-mono">
        <BHOpsLogo variant="light" size="lg" className="mb-4" />
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Iniciando Consola Central NOC...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex">
      {/* 1. Bespoke Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingDiscrepancies={pendingDiscrepancies}
        probesCount={integrations.length}
        organizations={organizations}
        selectedOrg={selectedOrg}
        onSelectOrg={setSelectedOrg}
        userRole={userRole}
        userName={user?.full_name}
        userEmail={user?.email}
        onOpenUserManagement={() => setShowUserManagement(true)}
        onOpenCompliance={() => setShowComplianceModal(true)}
        onOpenDocumentation={() => setShowDocumentationModal(true)}
        onSyncAll={integrations.length > 0 ? () => handleSync(integrations[0].id) : undefined}
        isSyncingAll={syncingAll}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* 2. Main Content Canvas */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isSidebarCollapsed ? "ml-20" : "ml-64"}`}>
        {/* Top Command Bar & Breadcrumb */}
        <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-6 py-3 shadow-2xs print:hidden">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Active Module Title & Breadcrumbs */}
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    {activeTab === "overview" && "Panel General de Operaciones"}
                    {activeTab === "topology" && "Topología Física de Red & Runbooks"}
                    {activeTab === "reconciliation" && "Reconciliación de Activos & Drift"}
                    {activeTab === "reports" && "Reportes Ejecutivos & Auditoría"}
                    {activeTab === "connectors" && "Monitor de Sondas & Conectores"}
                  </h1>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 font-bold">
                    [{selectedOrg?.code || "BH"}] {selectedOrg?.name || "Edificio Central"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  {activeTab === "overview" && "Supervisión 24/7 de telemetría de red, switches, gateways y APs"}
                  {activeTab === "topology" && "Correlación jerárquica de puertos troncales con runbooks de emergencia"}
                  {activeTab === "reconciliation" && "Cruce determinista entre BlueHawk Inventory y la infraestructura activa"}
                  {activeTab === "reports" && "Métricas consolidadas de disponibilidad y SLA para juntas directivas"}
                  {activeTab === "connectors" && "Sondas de diagnóstico en tiempo real con UniFi, Inventory y Zammad"}
                </p>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{onlineCount}/{devices.length} Online</span>
              </span>

              {userRole !== "operator" && currentSiteId && (
                <button
                  onClick={handleSyncInventory}
                  disabled={syncingInventory}
                  title="Sincronizar activos de BlueHawk Inventory"
                  className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-100 transition-colors active:scale-95 disabled:opacity-50 shadow-2xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncingInventory ? "animate-spin text-blue-600" : "text-blue-600"}`} />
                  <span className="hidden sm:inline">{syncingInventory ? "Sincronizando..." : "Sincronizar Inventario"}</span>
                </button>
              )}
            </div>
          </div>
        </header>

      {/* 2. Unified Search & NOC Indicator Bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-2 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          {/* Search Box + Quick Filter Pills */}
          <div className="flex flex-1 items-center gap-3 max-w-3xl">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 flex-1 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-2xs">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por nombre, IPv4, MAC address, modelo o activo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full font-mono"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-700">
                  ✕
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              {["all", "switch", "ap", "gateway"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] uppercase transition-all font-mono ${
                    filterType === type
                      ? "bg-white text-blue-700 font-bold shadow-2xs border border-blue-200"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Live Network & Security Indicators */}
          <div className="flex items-center gap-4 text-slate-500">
            <span>Red: <strong className="text-slate-800">blue-hawk-mesh</strong></span>
            <span>Seguridad: <strong className="text-emerald-700 font-semibold">Strict Read-Only</strong></span>
            <span>Uptime: <strong className="text-slate-800">99.98%</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Body */}
      <main className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none">
        {/* Metric Cards Row (Overview only & print:hidden) */}
        {activeTab !== "reports" && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 font-mono print:hidden">
            {/* 1. Dispositivos en Red */}
            <div className="apple-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                <span>DISPOSITIVOS EN RED</span>
                <Database className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{devices.length}</div>
              <div className="text-[10px] text-slate-500 font-semibold">UniFi Mesh Nodos</div>
            </div>

            {/* 2. Enlaces Activos (Semántico: Salud 100%) */}
            <div className="apple-card p-4 flex flex-col justify-between border-emerald-200/80 bg-emerald-50/10">
              <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                <span>ENLACES ACTIVOS</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-600">{onlineCount}</div>
              <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>100% Reachable</span>
              </div>
            </div>

            {/* 3. Puntos de Acceso */}
            <div className="apple-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                <span>PUNTOS DE ACCESO</span>
                <Wifi className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{apCount}</div>
              <div className="text-[10px] text-slate-500 font-semibold">Wi-Fi 7 & 6 Pro</div>
            </div>

            {/* 4. Switch Trunks */}
            <div className="apple-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                <span>SWITCH TRUNKS</span>
                <Server className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{switchCount}</div>
              <div className="text-[10px] text-slate-500 font-semibold">Aggregation + PoE</div>
            </div>

            {/* 5. Activos Físicos */}
            <div className="apple-card p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                <span>ACTIVOS FÍSICOS</span>
                <Radio className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-900">{assets.length}</div>
              <div className="text-[10px] text-slate-500 font-semibold">BlueHawk Inventory</div>
            </div>

            {/* 6. Reconciliación (Semántico: Drift / Advertencia) */}
            <div className={`apple-card p-4 flex flex-col justify-between transition-all ${
              pendingDiscrepancies > 0 
                ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/20" 
                : "border-slate-200"
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={pendingDiscrepancies > 0 ? "text-amber-800" : "text-slate-400"}>
                  RECONCILIACIÓN
                </span>
                {pendingDiscrepancies > 0 ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                )}
              </div>
              <div className={`mt-2 text-2xl font-black ${
                pendingDiscrepancies > 0 ? "text-amber-600" : "text-slate-900"
              }`}>
                {pendingDiscrepancies}
              </div>
              <div className={`text-[10px] font-semibold ${
                pendingDiscrepancies > 0 ? "text-amber-700" : "text-emerald-700"
              }`}>
                {pendingDiscrepancies > 0 ? "Pendientes de Firma" : "En Regla (0 Drift)"}
              </div>
            </div>
          </div>
        )}


        {/* 4. TAB VIEWS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 3 Observability Charts */}
            <ObservabilityCharts devices={devices} discrepancies={discrepancies} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left 2 Cols: Topology Tree Preview + Live Telemetry */}
              <div className="lg:col-span-2 space-y-6">
                <TopologyGraph roots={topologyRoots} />

                {/* Device Telemetry Table */}
                <div className="apple-card p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 font-mono">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Telemetría de Dispositivos de Red (Tiempo Real)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Mostrando {filteredDevices.length} equipos detectados
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase">
                          <th className="pb-2.5">Dispositivo</th>
                          <th className="pb-2.5">Tipo</th>
                          <th className="pb-2.5">Modelo</th>
                          <th className="pb-2.5">Dirección IPv4</th>
                          <th className="pb-2.5">Hardware MAC</th>
                          <th className="pb-2.5 text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredDevices.map((dev) => (
                          <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 font-bold text-slate-900 flex items-center gap-2">
                              {dev.device_type === "ap" ? (
                                <Wifi className="h-3.5 w-3.5 text-slate-500" />
                              ) : dev.device_type === "switch" ? (
                                <Server className="h-3.5 w-3.5 text-slate-500" />
                              ) : (
                                <Radio className="h-3.5 w-3.5 text-slate-500" />
                              )}
                              <span>{dev.name}</span>
                            </td>
                            <td className="py-2.5 uppercase text-slate-500 text-[10px] font-semibold">{dev.device_type}</td>
                            <td className="py-2.5 text-slate-600">{dev.model || "—"}</td>
                            <td className="py-2.5 text-blue-600 font-bold">{dev.management_ip || "DHCP"}</td>
                            <td className="py-2.5 text-slate-500">{dev.mac_address}</td>
                            <td className="py-2.5 text-right">
                              <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                {dev.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Quick Discrepancy Queue & Baseline Box */}
              <div className="space-y-6">
                <DiscrepanciesQueue
                  discrepancies={discrepancies}
                  onResolve={handleResolveDiscrepancy}
                  onTicketCreated={handleRefreshDiscrepancies}
                  userRole={userRole}
                />

                {/* Operations & Security Baseline Box */}
                <div className="apple-card p-6 font-mono text-xs">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-blue-700 font-bold">
                    <Terminal className="h-4 w-4" />
                    <span>Estándar Operativo & Cifrado NOC Hub</span>
                  </div>
                  <div className="mt-3.5 space-y-2 text-[11px] text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Controlador Principal:</span>
                      <strong className="text-slate-900">UniFi OS (v3.2.12)</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Destino de Sonda:</span>
                      <strong className="text-blue-700 font-bold">192.168.10.1:443</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Permiso en Red:</span>
                      <strong className="text-emerald-700 font-bold">Strict Read-Only (RO)</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Cifrado de Token:</span>
                      <strong className="text-slate-900">AES-256 GCM (Fernet)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Reconciliación:</span>
                      <strong className="text-slate-900">Motor Determinista</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FULL TOPOLOGY WITH RUNBOOKS */}
        {activeTab === "topology" && (
          <TopologyGraph roots={topologyRoots} />
        )}

        {/* TAB 3: INVENTORY RECONCILIATION & DRIFT DETECTION */}
        {activeTab === "reconciliation" && (
          <InventoryReconciliationView
            discrepancies={discrepancies}
            assets={assets}
            devices={devices}
            onResolve={handleResolveDiscrepancy}
            onSyncInventory={handleSyncInventory}
            onTicketCreated={handleRefreshDiscrepancies}
            userRole={userRole}
          />
        )}

        {/* TAB 4: EXECUTIVE REPORTS (1-CLICK) */}
        {activeTab === "reports" && (
          <ExecutiveReportsView
            organization={selectedOrg}
            devices={devices}
            discrepancies={discrepancies}
            assets={assets}
          />
        )}

        {/* TAB 5: MULTI-VENDOR CONNECTORS */}
        {activeTab === "connectors" && (
          <ServiceCard integration={integrations[0]} onSync={handleSync} />
        )}
      </main>

      {/* Floating NOC Dynamic Action Island (Apple HIG Fluid Interface) */}
      <DynamicActionIsland
        pendingCount={pendingDiscrepancies}
        onlineCount={onlineCount}
        totalDevices={devices.length}
        userRole={userRole}
        onOpenReconciliation={() => setActiveTab("reconciliation")}
        onSyncInventory={handleSyncInventory}
        isSyncing={syncingInventory}
      />

      {/* Enterprise NOC Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-4 px-6 text-center text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span>© 2026 Blue Hawk Technologies • WDBTECHNOLOGY, S.R.L.</span>
          <span className="mx-2">•</span>
          <span className="text-slate-400">Plataforma NOC v2.4</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDocumentationModal(true)}
            className="hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1.5 font-semibold"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
            <span>Manual de Operación</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setShowComplianceModal(true)}
            className="hover:text-blue-600 hover:underline transition-colors flex items-center gap-1.5 font-semibold"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
            <span>Gobernanza & Cumplimiento</span>
          </button>
        </div>
      </footer>

      {/* Admin User Management Modal (Strictly Admin Access) */}
      {userRole === "admin" && (
        <UserManagementModal
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
          token={token}
        />
      )}

      {/* Compliance & Legal Governance Modal */}
      <ComplianceModal
        isOpen={showComplianceModal}
        onClose={() => setShowComplianceModal(false)}
      />

      {/* Practical Operator User Guide Modal */}
      <DocumentationModal
        isOpen={showDocumentationModal}
        onClose={() => setShowDocumentationModal(false)}
      />
      </div>
    </div>
  );
}
