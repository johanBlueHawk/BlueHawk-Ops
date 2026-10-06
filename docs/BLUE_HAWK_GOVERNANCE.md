# BLUE_HAWK_GOVERNANCE.md — Gobernanza Operativa, Términos y Confidencialidad
> **Organización:** Blue Hawk Technologies / WDBTECHNOLOGY, S.R.L.  
> **Plataforma:** Blue Hawk Ops  
> **Ámbito:** Operaciones Multi-Cliente, Custodia de Infraestructura y Responsabilidad Operativa  
> **Versión:** 1.0.0 (2026)  

---

## 📜 1. Propósito y Límites de la Plataforma

Blue Hawk Ops es una herramienta interna de gestión, telemetría y consolidación operativa para los clientes gestionados por Blue Hawk Technologies (incluyendo clientes como Edificio Blue Hawk, OVA, Sancha, Troncone, Belén y futuras incorporaciones).

### 1.1. Autoridad de Configuración (Consola del Fabricante)
- **Las consolas oficiales de los fabricantes (UniFi Site Manager / Controller, VMware vSphere Client, FortiOS GUI, Synology DSM, Kerio WebAdmin) continúan siendo la única autoridad de configuración.**
- Blue Hawk Ops centraliza la visibilidad y reconcilia activos, pero no reemplaza ni compite con las consolas nativas.

### 1.2. Delimitación de Responsabilidad Humana
- Toda toma de decisiones operativas (reemplazo de hardware, cambio de topología, resolución de incidentes o mantenimiento) requiere juicio y validación de un técnico calificado de Blue Hawk.
- Las alertas, métricas e informes generados por la plataforma son herramientas de apoyo y no eximen al equipo de soporte de los procedimientos de verificación estándar.

---

## 🛡️ 2. Confidencialidad y Segregación entre Clientes

1. **Aislamiento Total de Información:**
   * La información de red, direcciones IP, topología, inventario y registros de incidencias de un cliente (ej. OVA) es estrictamente confidencial y se encuentra aislada de la de cualquier otro cliente (ej. Sancha o Troncone).
   * Los accesos de visualización para personal del cliente (Client Viewers) quedan rígidamente confinados a su propia organización mediante control de acceso basado en roles (RBAC).

2. **Cero Comercialización o Exposición de Datos:**
   * La telemetría, configuraciones y registros de red jamás se comparten con terceros, no se utilizan para telemetría invasiva y no se emplean para entrenar modelos públicos de inteligencia artificial.

3. **Retención y Auditoría:**
   * Cada acción de sincronización, modificación de inventario o resolución de discrepancias genera una traza de auditoría con actor, marca de tiempo y estado anterior/posterior, garantizando la trazabilidad ante revisiones de la Junta Directiva o auditorías de clientes.
