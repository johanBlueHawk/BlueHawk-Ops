"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, Network, Layers, BarChart3, Radio, 
  BookOpen, ShieldCheck, ChevronLeft, ChevronRight, RefreshCw, 
  Users, LogOut, Building2, ChevronDown, Check, Shield, Wrench,
  PanelLeftClose, PanelLeftOpen, HelpCircle, Activity, Sparkles, User
} from "lucide-react";
import { Organization, UserRole } from "@/types";
import { useAuth } from "@/context/AuthContext";

export type NavTab = "overview" | "topology" | "reconciliation" | "reports" | "connectors";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingDiscrepancies: number;
  probesCount: number;
  organizations: Organization[];
  selectedOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
  onOpenUserManagement?: () => void;
  onOpenCompliance?: () => void;
  onOpenDocumentation?: () => void;
  onSyncAll?: () => void;
  isSyncingAll?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingDiscrepancies,
  probesCount,
  organizations,
  selectedOrg,
  onSelectOrg,
  userRole,
  userName,
  userEmail,
  onOpenUserManagement,
  onOpenCompliance,
  onOpenDocumentation,
  onSyncAll,
  isSyncingAll,
  isCollapsed,
  onToggleCollapse,
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const orgMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target as Node)) {
        setShowOrgDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const displayName = user?.full_name || userName || "Operador";
  const displayEmail = user?.email || userEmail || "";

  const roleLabel = 
    userRole === "admin" ? "Administrador (L3)" :
    userRole === "technician" ? "Técnico (L2)" : "Operador (L1)";

  const roleBadgeColor =
    userRole === "admin" ? "bg-amber-400/20 text-amber-300 border-amber-400/40" :
    userRole === "technician" ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/40" :
    "bg-sky-400/20 text-sky-300 border-sky-400/40";

  const navItems = [
    {
      id: "overview" as NavTab,
      label: "Panel General",
      shortLabel: "Panel",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "topology" as NavTab,
      label: "Topología Física",
      shortLabel: "Topología",
      icon: Network,
      badge: null,
    },
    {
      id: "reconciliation" as NavTab,
      label: "Reconciliación",
      shortLabel: "Inventario",
      icon: Layers,
      badge: pendingDiscrepancies > 0 ? {
        count: pendingDiscrepancies,
        color: "bg-amber-400 text-slate-950 font-black",
      } : null,
    },
    {
      id: "reports" as NavTab,
      label: "Reportes SLA",
      shortLabel: "Reportes",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "connectors" as NavTab,
      label: "Monitor de Sondas",
      shortLabel: "Sondas",
      icon: Radio,
      badge: {
        count: probesCount,
        color: "bg-slate-800 text-slate-300 border border-slate-700 font-bold",
      },
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#0b1329] text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 select-none ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* 1. Header & Brand */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between gap-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative h-8 w-28 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Blue Hawk Technologies"
                  fill
                  className="object-contain object-left brightness-125"
                  priority
                />
              </div>
              <span className="font-mono text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                Ops v2.4
              </span>
            </div>
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 font-bold font-mono text-sm shadow-xs">
              BH
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Client / Organization Switcher */}
        <div className="mt-3 relative" ref={orgMenuRef}>
          {!isCollapsed ? (
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-left transition-all font-mono text-xs text-slate-200 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 shrink-0 border border-blue-500/30">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <div className="truncate">
                  <span className="text-[9px] text-slate-400 block font-semibold leading-tight">SEDE ACTIVA:</span>
                  <span className="font-bold text-white text-xs truncate block">{selectedOrg?.name || "Seleccionar Sede"}</span>
                </div>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showOrgDropdown ? "rotate-180" : ""}`} />
            </button>
          ) : (
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              title={`Sede: ${selectedOrg?.name || "Seleccionar"}`}
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-blue-400 hover:border-blue-500/50 hover:bg-slate-800 transition-colors"
            >
              <Building2 className="h-4 w-4" />
            </button>
          )}

          {/* Org Selector Dropdown */}
          <AnimatePresence>
            {showOrgDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                className={`absolute z-50 mt-1 w-60 rounded-2xl bg-[#0f172a] border border-slate-700 p-1.5 shadow-2xl font-mono text-xs ${
                  isCollapsed ? "left-14 top-0" : "left-0 top-full"
                }`}
              >
                <div className="px-2.5 py-1 text-[9px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800 mb-1">
                  Sedes & Clientes Multi-Tenant
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {organizations.map((org) => {
                    const isSelected = org.id === selectedOrg?.id;
                    return (
                      <button
                        key={org.id}
                        onClick={() => {
                          onSelectOrg(org);
                          setShowOrgDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                          isSelected 
                            ? "bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30" 
                            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">[{org.code}]</span>
                          <span className="truncate">{org.name}</span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Middle Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {!isCollapsed && (
            <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Consola Operativa
            </span>
          )}

          <nav className="space-y-1 font-mono text-xs">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all group ${
                    isActive
                      ? "bg-[#162347] text-white border-2 border-amber-400 font-bold shadow-md shadow-blue-950/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200"
                    }`} />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {item.badge && (
                    !isCollapsed ? (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full leading-none shrink-0 ${item.badge.color}`}>
                        {item.badge.count}
                      </span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-amber-400 absolute right-2 top-2 animate-pulse" />
                    )
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Fast Action: Network Sync */}
        {onSyncAll && (
          <div className="pt-2">
            {!isCollapsed ? (
              <button
                onClick={onSyncAll}
                disabled={isSyncingAll || userRole === "operator"}
                className={`w-full flex items-center justify-center gap-2 p-2 rounded-xl font-mono text-xs font-bold transition-all border ${
                  userRole === "operator"
                    ? "bg-slate-900/50 text-slate-500 border-slate-800 cursor-not-allowed"
                    : "bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30 hover:border-blue-500/60 active:scale-98 shadow-xs"
                }`}
                title={userRole === "operator" ? "Requiere rol Técnico o Admin" : "Lanzar sondeo UniFi"}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncingAll ? "animate-spin text-blue-400" : ""}`} />
                <span>{isSyncingAll ? "Sondeando Red..." : "Sondear UniFi"}</span>
              </button>
            ) : (
              <button
                onClick={onSyncAll}
                disabled={isSyncingAll || userRole === "operator"}
                title="Sondear Red UniFi"
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncingAll ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer: Docs, Compliance & User Profile */}
      <div className="p-3 border-t border-slate-800/80 space-y-1.5 font-mono text-xs">
        {/* Quick Docs & Compliance Action Buttons */}
        <div className="space-y-0.5">
          {onOpenDocumentation && (
            <button
              onClick={onOpenDocumentation}
              title="Manual Operativo NOC"
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <BookOpen className="h-4 w-4 text-indigo-400 shrink-0" />
              {!isCollapsed && <span className="text-[11px] font-medium">Manual Operativo</span>}
            </button>
          )}

          {onOpenCompliance && (
            <button
              onClick={onOpenCompliance}
              title="Gobernanza & Cumplimiento Legal"
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
              {!isCollapsed && <span className="text-[11px] font-medium">Gobernanza & Legal</span>}
            </button>
          )}
        </div>

        {/* User Profile Card */}
        <div className="relative pt-1 border-t border-slate-800/60" ref={userMenuRef}>
          {!isCollapsed ? (
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 font-bold border border-slate-700 shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <span className="font-bold text-white text-xs block truncate leading-tight">{displayName}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold inline-block mt-0.5 ${roleBadgeColor}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showUserDropdown ? "rotate-180" : ""}`} />
            </button>
          ) : (
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              title={`${displayName} (${roleLabel})`}
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition-colors font-bold"
            >
              {displayName.charAt(0).toUpperCase()}
            </button>
          )}

          {/* User Popover Dropdown */}
          <AnimatePresence>
            {showUserDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                className={`absolute z-50 rounded-2xl bg-[#0f172a] border border-slate-700 p-2 shadow-2xl font-mono text-xs w-60 ${
                  isCollapsed ? "left-14 bottom-2" : "left-0 bottom-full mb-1.5"
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 mb-2">
                  <span className="font-bold text-white block truncate">{displayName}</span>
                  <span className="text-[10px] text-slate-400 block truncate">{displayEmail}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold inline-block mt-1 ${roleBadgeColor}`}>
                    {roleLabel}
                  </span>
                </div>

                {userRole === "admin" && onOpenUserManagement && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenUserManagement();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-slate-300 hover:bg-amber-400/10 hover:text-amber-300 transition-colors font-medium text-xs mb-1"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-400" />
                      <span>Gestión de Usuarios</span>
                    </div>
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 rounded font-bold">
                      Admin
                    </span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium text-xs border-t border-slate-800 pt-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
};
