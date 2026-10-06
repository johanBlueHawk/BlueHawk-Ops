"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronDown, Check } from "lucide-react";
import { Organization } from "@/types";

interface ClientSelectorProps {
  organizations: Organization[];
  selectedOrg: Organization | null;
  onSelect: (org: Organization) => void;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  organizations,
  selectedOrg,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0"
        title="Cambiar sede o cliente activo"
      >
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CLIENTE:</span>
        <strong className="text-slate-900 font-bold truncate max-w-[160px]">
          {selectedOrg?.name || "Seleccionar Sede"}
        </strong>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200"
          >
            <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Cartera de Sedes & Clientes
            </div>
            <div className="space-y-1">
              {organizations.map((org) => {
                const isSelected = org.id === selectedOrg?.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => {
                      onSelect(org);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-mono text-xs transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">
                        [{org.code}]
                      </span>
                      <span>{org.name}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
