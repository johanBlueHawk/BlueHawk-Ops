# 🦅 Blue Hawk Ops (BHOps)
### Plataforma de Observabilidad, Telemetría NOC y Reconciliación de Infraestructura
**Blue Hawk Technologies** (`WDBTECHNOLOGY, S.R.L.`)

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Apple%20HIG%20%2F%20Tailwind-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-blue?style=flat-square)](#)

---

## 📋 Descripción General

**Blue Hawk Ops** es el núcleo de operaciones y centro de control unificado (NOC) para la supervisión 24/7, auditoría de drift de inventario, telemetría multimarca y resolución de incidentes de clientes corporativos de Blue Hawk Technologies.

El sistema fusiona en tiempo real los datos físicos de **BlueHawk Inventory** con los datos lógicos descubiertos por sondas de red (UniFi Network API, MikroTik RouterOS), detectando discrepancias y orquestando tickets de soporte con la mesa de ayuda **Zammad**.

---

## 🚀 Arquitectura y Pilares del Sistema

1. **Reconciliación Determinista de Inventario:**
   - Detección automática de drift entre inventario físico registrado y topología en vivo.
   - Categorización precisa: *Dispositivo no catalogado*, *Conflicto de IP*, *Drift de Switchport/Uplink*, *MAC no registrada*.

2. **Control de Acceso por Roles (RBAC) & Cero Confianza del Cliente:**
   - **👁️ Operador (Nivel 1 NOC):** Monitoreo en vivo de telemetría, visualización de topología y apertura de tickets de incidente en Zammad. Restringido de firmar resoluciones de inventario.
   - **🛠️ Técnico (Nivel 2 Soporte):** Diagnóstico y ejecución de intervenciones, sondeos forzados y firma de resolución de discrepancias con bitácora técnica obligatoria.
   - **👑 Administrador (Nivel 3 Gobernanza):** Control maestro de clientes, sedes, credenciales cifradas y auditoría del sistema.

3. **Interoperabilidad Zammad:**
   - Apertura automática de tickets con prioridad dinámica, adjuntando diagnóstico técnico (MAC, IP, Modelo, Sede, Severidad).
   - Enlace bidireccional directo a la consola del agente en Zammad.

4. **Experiencia de Usuario Apple HIG:**
   - Estética inspirada en Apple Human Interface Guidelines: squircles continuos (`rounded-[22px]`), *negative tracking* tipográfico, physics-based springs (`framer-motion`) y la **Dynamic Action Island** flotante para acciones críticas.

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework:** Python 3.12+ / FastAPI (Asíncrono)
- **ORM / Persistencia:** SQLAlchemy 2.0 (AsyncIO) + SQLite (desarrollo) / PostgreSQL (producción)
- **Seguridad:** Cifrado simétrico AES-256 GCM (Fernet) para credenciales de sondas, Bcrypt (12 salt rounds) para contraseñas, Tokens JWT firmados (HS256).
- **Conectores:** UniFi Controller API, BlueHawk Inventory REST Connector, Zammad Helpdesk REST Client.

### Frontend
- **Framework:** Next.js 16 (App Router con Turbopack)
- **Tipado:** TypeScript 5+ (Strict mode)
- **Estilos:** Tailwind CSS 4 con tokens de diseño Apple HIG
- **Animaciones:** Framer Motion
- **Iconografía:** Lucide React

---

## ⚡ Instalación y Puesta en Marcha

### 1. Clonar el repositorio
```bash
git clone https://github.com/johanBlueHawk/BlueHawk-Ops.git
cd BlueHawk-Ops
```

### 2. Configuración del Backend
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Iniciar servidor FastAPI
uvicorn app.main:app --reload --port 8001
```
> El backend estará disponible en `http://127.0.0.1:8001` y la documentación Swagger interactiva en `http://127.0.0.1:8001/api/v1/docs`.

### 3. Configuración del Frontend
```bash
cd ../frontend
npm install
cp .env.example .env.local
npm run dev
```
> La consola web estará disponible en `http://localhost:3000`.

---

## 🔐 Cuentas de Acceso Preconfiguradas (Demo)

| Rol | Usuario | Correo | Contraseña |
| :--- | :--- | :--- | :--- |
| **Administrador (L3)** | Johan Vasquez | `admin@bluehawk.tech` | `BlueHawk2026!` |
| **Técnico (L2)** | Carlos Gomez | `tecnico@bluehawk.tech` | `BlueHawk2026!` |
| **Operador (L1)** | Marcos Diaz | `operador@bluehawk.tech` | `BlueHawk2026!` |

---

## 🛡️ Políticas de Seguridad y Cumplimiento
- **Zero-Leakage:** Las direcciones IP internas y contraseñas de sondas están ofuscadas en el frontend y cifradas en reposo.
- **Cabeceras HTTP de Seguridad:** Inyección estricta de `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `HSTS` y supresión de stack traces.
- **Trazabilidad:** Cada resolución de discrepancia almacena de forma inmutable el nombre y rol del operador/técnico firmante.

---

© 2026 **Blue Hawk Technologies** — Todos los derechos reservados.
