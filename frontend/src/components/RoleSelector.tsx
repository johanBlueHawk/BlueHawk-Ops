"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserRole } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { 
  Shield, Wrench, ShieldCheck, ChevronDown, Check, 
  User, Info, Lock, LogOut, ArrowRightLeft, Sparkles
} from "lucide-react";

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  userName?: string;
}

const ROLES_CONFIG: Record<UserRole, {
  label: string;
  level: string;
  email: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  desc: string;
  permissions: string[];
}> = {
  operator: {
    label: "Operador",
    level: "Nivel 1 (NOC)",
    email: "operador@bluehawk.tech",
    name: "Marcos Diaz",
    icon: Shield,
    color: "text-blue-600",
    badgeBg: "bg-blue-50",
    badgeBorder: "border-blue-200",
    badgeText: "text-blue-700",
    desc: "Monitoreo 24/7 de telemetría y triaje. Puede abrir tickets de incidente en Zammad.",
    permissions: ["Monitoreo de red", "Abrir tickets en Zammad", "Exportar reportes PDF"],
  },
  technician: {
    label: "Técnico",
    level: "Nivel 2 (Soporte & Campo)",
    email: "tecnico@bluehawk.tech",
    name: "Carlos Gomez",
    icon: Wrench,
    color: "text-emerald-600",
    badgeBg: "bg-emerald-50",
    badgeBorder: "border-emerald-200",
    badgeText: "text-emerald-700",
    desc: "Intervención física y lógica. Firma resoluciones de inventario y sincroniza sondas.",
    permissions: ["Todo lo de Operador", "Firmar resoluciones de drift", "Sincronizar inventario"],
  },
  admin: {
    label: "Administrador",
    level: "Nivel 3 (Gobernanza)",
    email: "admin@bluehawk.tech",
    name: "Johan Vasquez",
    icon: ShieldCheck,
    color: "text-amber-600",
    badgeBg: "bg-amber-50",
    badgeBorder: "border-amber-200",
    badgeText: "text-amber-700",
    desc: "Control total. Configura clientes, credenciales de sondas y parámetros del sistema.",
    permissions: ["Acceso total", "Gestionar clientes y sedes", "Configurar credenciales"],
  },
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  currentRole,
  onRoleChange,
  userName,
}) => {
  const router = useRouter();
  const { user, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.full_name || userName || "Usuario";
  const displayEmail = user?.email || ROLES_CONFIG[currentRole].email;
  const config = ROLES_CONFIG[currentRole];
  const Icon = config.icon;

  const handleSwitchAccount = async (targetRole: UserRole) => {
    const targetConfig = ROLES_CONFIG[targetRole];
    try {
      setIsSwitching(true);
      await login(targetConfig.email, "BlueHawk2026!");
      onRoleChange(targetRole);
    } catch (err) {
      console.warn("Direct login failed, switching simulated role:", err);
      onRoleChange(targetRole);
    } finally {
      setIsSwitching(false);
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push("/login");
  };

  return (
    <div className="relative font-mono text-xs" ref={containerRef}>
      {/* Trigger Button (Apple Pill style) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs hover:bg-slate-50 transition-colors"
        title="Perfil de usuario y control de sesión"
      >
        <div className={`flex h-5 w-5 items-center justify-center rounded-lg ${config.badgeBg} ${config.badgeBorder} border`}>
          <Icon className={`h-3 w-3 ${config.color}`} />
        </div>

        <div className="flex items-center gap-1.5 text-left">
          <span className="font-semibold text-slate-800 hidden sm:inline">{displayName}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${config.badgeBg} ${config.badgeBorder} ${config.badgeText} border`}>
            {config.label}
          </span>
        </div>

        <ChevronDown className="h-3 w-3 text-slate-400" />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl bg-white p-3 shadow-[0_12px_36px_rgba(15,23,42,0.14)] border border-slate-200/80"
          >
            {/* Active User Card Header */}
            <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${config.badgeBg} ${config.badgeBorder} border`}>
                  <Icon className={`h-4.5 w-4.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs truncate">{displayName}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${config.badgeBg} ${config.badgeBorder} ${config.badgeText} border shrink-0`}>
                      {config.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">{displayEmail}</span>
                </div>
              </div>
            </div>

            {/* Switch Account / Role Section */}
            <div className="px-2 py-1 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Cambiar de Cuenta (1-Clic)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">RBAC Activo</span>
            </div>

            <div className="space-y-1">
              {(Object.keys(ROLES_CONFIG) as UserRole[]).map((roleKey) => {
                const rConfig = ROLES_CONFIG[roleKey];
                const RIcon = rConfig.icon;
                const isSelected = currentRole === roleKey;

                return (
                  <button
                    key={roleKey}
                    onClick={() => handleSwitchAccount(roleKey)}
                    disabled={isSwitching}
                    className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 ${
                      isSelected 
                        ? "bg-slate-100/80 border border-slate-200" 
                        : "hover:bg-slate-50"
                    } ${isSwitching ? "opacity-50 cursor-wait" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${rConfig.badgeBg} ${rConfig.badgeBorder} border`}>
                      <RIcon className={`h-3.5 w-3.5 ${rConfig.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          {rConfig.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          {rConfig.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {rConfig.email}
                      </p>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Logout Action */}
            <div className="mt-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent transition-all font-semibold text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
