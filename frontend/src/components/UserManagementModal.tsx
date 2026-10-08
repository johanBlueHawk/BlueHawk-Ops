"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserPlus, KeyRound, Shield, Wrench, ShieldCheck, 
  X, Check, Copy, AlertCircle, Loader2, RefreshCw, Mail, 
  User as UserIcon, Lock, CheckCircle2
} from "lucide-react";
import { User, UserRole } from "@/types";
import { API_BASE } from "@/config/api";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create User State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("operator");
  const [createCustomPassword, setCreateCustomPassword] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Password Result Modal (shows generated/reset password for admin to copy)
  const [passwordResult, setPasswordResult] = useState<{
    userName: string;
    email: string;
    tempPass: string;
    title: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al cargar el directorio de usuarios.");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Error al consultar usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      setSubmittingCreate(true);
      setError(null);
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: createEmail,
          full_name: createName,
          role: createRole,
          password: createCustomPassword.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al crear el usuario.");
      }

      const result = await res.json();
      setShowCreateModal(false);
      setCreateEmail("");
      setCreateName("");
      setCreateCustomPassword("");
      await fetchUsers();

      // Show temporary password modal
      setPasswordResult({
        userName: result.user.full_name,
        email: result.user.email,
        tempPass: result.temporary_password,
        title: "Usuario Creado Exitosamente",
      });
    } catch (err: any) {
      setError(err.message || "Error al crear usuario.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!token) return;
    try {
      setActionLoadingId(user.id);
      const res = await fetch(`${API_BASE}/users/${user.id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: null }), // auto-generates secure password
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Error al restablecer la contraseña.");
      }

      const result = await res.json();
      setPasswordResult({
        userName: user.full_name,
        email: user.email,
        tempPass: result.temporary_password,
        title: "Contraseña Restablecida",
      });
    } catch (err: any) {
      alert(err.message || "Error al restablecer contraseña.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyPassword = () => {
    if (!passwordResult) return;
    navigator.clipboard.writeText(passwordResult.tempPass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return { label: "Admin L3", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: ShieldCheck };
      case "technician":
        return { label: "Técnico L2", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Wrench };
      default:
        return { label: "Operador L1", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Shield };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-4xl overflow-hidden rounded-[24px] bg-white p-6 shadow-2xl border border-slate-200/90 font-mono text-xs z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Gestión de Usuarios y Credenciales NOC
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-200">
                    Solo Administrador
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Control centralizado de identidades, roles de acceso y credenciales corporativas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#0b1329] px-3.5 py-2 font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5 text-amber-400" />
                <span>Crear Usuario</span>
              </button>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-red-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Users Table */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50">
            {loading && users.length === 0 ? (
              <div className="flex h-48 items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span>Cargando directorio de usuarios...</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-100/70 text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-3">Usuario & Identidad</th>
                    <th className="p-3">Correo Corporativo</th>
                    <th className="p-3">Nivel / Rol</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones de Credencial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map((u) => {
                    const badge = getRoleBadge(u.role);
                    const RoleIcon = badge.icon;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                              {u.full_name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{u.full_name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">ID: {u.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-mono text-slate-600">
                          {u.email}
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                            <RoleIcon className="h-3 w-3" />
                            {badge.label}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${u.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {u.is_active ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleResetPassword(u)}
                            disabled={actionLoadingId === u.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs disabled:opacity-50"
                            title="Generar nueva contraseña segura para este usuario"
                          >
                            <KeyRound className="h-3 w-3 text-amber-600" />
                            <span>{actionLoadingId === u.id ? "Generando..." : "Restablecer Contraseña"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Directorio de Autenticación Bcrypt + HS256 JWT</span>
            <span className="text-slate-600 font-bold">{users.length} Cuentas Registradas</span>
          </div>
        </motion.div>

        {/* Sub-Modal: Create User */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreateModal(false)}
                className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 font-mono text-xs z-20"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Nuevo Usuario NOC</h3>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Laura Sanchez"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Correo Corporativo</label>
                    <input
                      type="email"
                      required
                      placeholder="usuario@bluehawk.tech"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nivel de Rol (RBAC)</label>
                    <select
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as UserRole)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                    >
                      <option value="operator">Operador (Nivel 1 NOC - Monitoreo & Tickets)</option>
                      <option value="technician">Técnico (Nivel 2 - Firma de Drift & Sincronización)</option>
                      <option value="admin">Administrador (Nivel 3 - Gobernanza Total)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase">Contraseña Personalizada (Opcional)</label>
                      <span className="text-[10px] text-slate-400">Dejar en blanco para autogenerar</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Mínimo 12 caracteres (A-Z, a-z, 0-9, símbolos)"
                      value={createCustomPassword}
                      onChange={(e) => setCreateCustomPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 rounded-xl border border-slate-200 py-2 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCreate}
                      className="flex-1 rounded-xl bg-[#0b1329] py-2 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {submittingCreate ? "Creando..." : "Crear Usuario"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sub-Modal: Password Result & Copy Box */}
        <AnimatePresence>
          {passwordResult && (
            <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPasswordResult(null)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 font-mono text-xs z-30"
              >
                <div className="text-center mb-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-2.5">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{passwordResult.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Para: <strong>{passwordResult.userName}</strong> ({passwordResult.email})
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-3.5 text-white mb-4">
                  <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                    Contraseña Generada (Copia Única)
                  </span>
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-amber-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="select-all tracking-wider">{passwordResult.tempPass}</span>
                    <button
                      onClick={handleCopyPassword}
                      className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/20 transition-colors shrink-0 ml-2"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? "Copiada" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 mb-4 leading-relaxed">
                  ⚠️ <strong>Aviso de Seguridad:</strong> Por arquitectura Zero-Knowledge y hash irreversible Bcrypt, esta contraseña no se mostrará de nuevo. Entrégasela al usuario a través de un canal corporativo seguro.
                </p>

                <button
                  onClick={() => setPasswordResult(null)}
                  className="w-full rounded-xl bg-[#0b1329] py-2.5 font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  Entendido y Guardado
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
