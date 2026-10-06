# BLUE_HAWK_DESIGN.md — Estándar de Diseño y Experiencia de Usuario (UI/UX)
> **Blue Hawk Ops — Plataforma Unificada de Operaciones, Redes e Infraestructura**  
> **Identidad Corporativa:** Blue Hawk Technologies / WDBTECHNOLOGY, S.R.L.  
> **Inspiración:** Apple Human Interface Guidelines (HIG), macOS Sequoia & Fluid Operations UI  
> **Ámbito:** Frontend Web (Next.js 15, React 19, Tailwind CSS, Framer Motion)  
> **Versión:** 1.0.0 (Adaptado para Blue Hawk Ops)  

---

## 🧭 1. Manifiesto: Claridad Operativa y Estética de Grado NOC

En operaciones de infraestructura de IT, el desorden visual cuesta tiempo y genera errores. Blue Hawk Ops fusiona la sobriedad y refinamiento de **Apple HIG** con la densidad de información que requiere un Centro de Operaciones de Red (NOC):

> *"Una interfaz de operaciones no debe sentirse como una consola vieja y tosca de los años 2000. Debe sentirse viva, fluida, instantánea y con una jerarquía visual tan clara que un técnico detecte una anomalía en menos de dos segundos."*

---

## 🎨 2. Paleta de Identidad Blue Hawk Technologies

### 2.1. Tokens de Color Corporativos
- **Blue Hawk Deep Navy (Fondo Maestro):** `#060b18` (Fondo primario nocturno) y `#0b1329` (Fondo de tarjetas elevadas).
- **Hawk Electric Sky (Acento de Marca):** `#0ea5e9` a `#38bdf8` (Gradientes sutiles en estados activos, indicadores de foco e insignias clave).
- **Superficie de Cristal Esmerilado:** `rgba(15, 23, 42, 0.72)` combinado con `backdrop-blur-xl`.
- **Luz Especular Superior de Apple:**
  ```css
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 12px 32px -8px rgba(0, 0, 0, 0.4);
  ```

### 2.2. Semáforo Operativo de Salud (Normativo)
- **Operativo / Online / Healthy:** `#10b981` (Emerald 500) con halo sutil `rgba(16, 185, 129, 0.15)`.
- **Alerta / Warning / Degraded:** `#f59e0b` (Amber 500) con halo `rgba(245, 158, 11, 0.15)`.
- **Crítico / Offline / Down:** `#ef4444` (Red 500) con halo `rgba(239, 68, 68, 0.18)`.
- **Desconocido / Stale Data:** `#64748b` (Slate 500).

---

## 📐 3. Los 6 Principios de Interfaz para Blue Hawk Ops

### 3.1. Cero Bordes Visibles (Zero Visible Borders)
No utilizar bordes sólidos pesados de `1px` en tablas o paneles.
- La separación se logra mediante elevación de tono de fondo (`bg-slate-900/60` sobre `bg-slate-950`), la **luz especular superior** (`inset 0 1px 0 ...`) y aros semitransparentes sutiles: `ring-1 ring-white/10`.

### 3.2. Jerarquía de Esquinas Squircle
- **Barra de Navegación / Selector de Clientes Flotante:** `rounded-full` (píldora flotante) o `rounded-[28px]`.
- **Tarjetas de Servicios y Métricas (UniFi, VMware, Synology, etc.):** `rounded-[20px]`.
- **Botones de Acción, Filtros de Tabla y Buscadores:** `rounded-[12px]`.
- **Insignias de Estado (Badges, Chips de MAC/IP):** `rounded-full`.

### 3.3. Tipografía con Kerning Negativo (Negative Tracking)
- **Fuentes:** Geist Sans, Inter Tight o SF Pro Display.
- Títulos principales (`text-2xl`, `text-3xl`) con tracking cerrado: `tracking-[-0.03em]`.
- Identificadores técnicos (MAC, IPs, Serials, UUIDs, Códigos de Activo) en fuente monoespaciada limpia (`font-mono text-xs text-sky-400`).

### 3.4. Micro-interacciones con Física de Resortes (Spring Physics)
Toda interacción en el dashboard utiliza `framer-motion`:
- **Hover en Tarjetas:** Elevación leve (`y: -2px`, escala `1.005`).
- **Botones al presionar:** Contracción elástica natural (`scale: 0.97`).
- **Transición de Pestañas de Cliente:** Transición suave con animación de indicador compartido (`layoutId="activeTab"`).

### 3.5. Búsqueda y Filtrado Instantáneo (<5ms)
Un técnico no debe esperar llamadas al servidor para buscar una dirección MAC o un nombre de VM:
- Se implementa filtrado difuso instantáneo en el cliente (usando `@leeoniya/ufuzzy` o `Fuse.js`) sobre el dataset cargado de la sede.

### 3.6. Indicador Obligatorio de Frescura de Datos (Freshness Badge)
Todo bloque que consuma datos de fabricantes (UniFi, VMware, FortiGate) debe mostrar visiblemente su marca de tiempo y su estado de frescura:
- 🟢 *Sincronizado hace 2 min (Fresh)*
- 🟡 *Sincronizado hace 45 min (Delayed)*
- 🔴 *Error de enlace — Mostrando caché de hace 3 horas (Stale)*

---

## 🧩 4. Recetas de Componentes Esenciales

### 4.1. Selector de Clientes Dinámico Flotante (`ClientSelectorPill.tsx`)
Permite cambiar instantáneamente entre **Edificio Blue Hawk**, **OVA**, **Sancha**, **Troncone**, **Belén**:

```tsx
import React from "react";
import { motion } from "framer-motion";
import { Building2, ChevronDown, Check } from "lucide-react";

interface Client {
  id: string;
  name: string;
  code: string;
  alertsCount: number;
}

interface ClientSelectorProps {
  clients: Client[];
  activeClient: Client;
  onSelect: (client: Client) => void;
}

export const ClientSelectorPill: React.FC<ClientSelectorProps> = ({
  clients,
  activeClient,
  onSelect,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-full bg-slate-900/80 px-4 py-2 text-sm 
                   font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_20px_-6px_rgba(0,0,0,0.5)] 
                   ring-1 ring-white/10 backdrop-blur-xl"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        <span className="tracking-tight">{activeClient.name}</span>
        {activeClient.alertsCount > 0 && (
          <span className="flex h-5 items-center rounded-full bg-red-500/20 px-2 text-[10px] font-bold text-red-400 ring-1 ring-red-500/30">
            {activeClient.alertsCount}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </motion.button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6 }}
          className="absolute left-0 top-12 z-50 w-64 overflow-hidden rounded-[20px] bg-slate-950/90 
                     p-1.5 shadow-[0_20px_48px_rgba(0,0,0,0.7)] ring-1 ring-white/10 backdrop-blur-2xl"
        >
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Organizaciones / Clientes
          </div>
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSelect(c);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-[12px] px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/60"
            >
              <span>{c.name}</span>
              {c.id === activeClient.id && (
                <Check className="h-4 w-4 text-sky-400" />
              )}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};
```

---

### 4.2. Tarjeta de Servicio Conectado (`ServiceTelemetryCard.tsx`)
Muestra la salud del conector (UniFi, VMware, Synology, FortiGate) con estilo Apple:

```tsx
import React from "react";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";

interface ServiceTelemetryCardProps {
  provider: "unifi" | "vmware" | "synology" | "fortigate" | "hikvision";
  label: string;
  status: "healthy" | "warning" | "down";
  lastSync: string;
  metrics: { label: string; value: string | number }[];
  children?: React.ReactNode;
}

export const ServiceTelemetryCard: React.FC<ServiceTelemetryCardProps> = ({
  provider,
  label,
  status,
  lastSync,
  metrics,
  children,
}) => {
  const statusColors = {
    healthy: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
    warning: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
    down: "text-red-400 bg-red-500/10 ring-red-500/20",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative overflow-hidden rounded-[20px] bg-slate-900/50 p-6 text-white 
                 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_12px_32px_-8px_rgba(0,0,0,0.5)] 
                 ring-1 ring-white/10 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400">
            {provider.toUpperCase()} CONNECTOR
          </span>
          <h3 className="text-xl font-bold tracking-[-0.02em] text-white">
            {label}
          </h3>
        </div>

        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusColors[status]}`}
        >
          <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
          {status.toUpperCase()}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {metrics.map((m, idx) => (
          <div key={idx} className="rounded-[14px] bg-slate-950/40 p-3 ring-1 ring-white/5">
            <div className="text-[11px] font-medium text-slate-400">{m.label}</div>
            <div className="mt-1 text-lg font-bold tracking-tight text-white">{m.value}</div>
          </div>
        ))}
      </div>

      {children && <div className="mt-4">{children}</div>}

      <div className="mt-5 border-t border-white/5 pt-3 text-[11px] text-slate-400">
        Última sincronización: <span className="text-slate-300">{lastSync}</span>
      </div>
    </motion.div>
  );
};
```
