# POLITICS.md — Marco de Gobernanza, Seguridad, RBAC e Interconexión de Plataformas
> **Entidad Operativa:** Blue Hawk Technologies / WDBTECHNOLOGY, S.R.L.  
> **Plataforma:** Blue Hawk Ops (BHOps) — Centro de Operaciones de Red (NOC)  
> **Ámbito de Aplicación:** Gestión Multi-Tenant, Auditoría de Infraestructura y Reconciliación de Activos  
> **Clasificación del Documento:** Confidencial / Normativa Interna y Cumplimiento de Clientes  
> **Versión Oficial:** 2.4.0 (Marzo 2026)  

---

## 🏛️ 1. Misión, Filosofía y Límites Operativos

Blue Hawk Ops es el núcleo centralizado de telemetría, visibilidad y reconciliación técnica desarrollado para monitorear y custodiar la infraestructura de red, cómputo y almacenamiento de los clientes gestionados por Blue Hawk Technologies (incluyendo Sedes Centrales, OVA, Sancha, Troncone, Belén y futuras organizaciones incorporadas).

### 1.1. Principio de Autoridad de Configuración
* **Las consolas oficiales de los fabricantes continúan siendo la única autoridad de configuración activa:**
  - *UniFi Site Manager / Controller:* Autoridad sobre SSIDs, VLANs, potencias de radio y asignación de puertos.
  - *FortiOS GUI / CLI:* Autoridad sobre políticas de firewall, inspección perimetral y túneles VPN IPsec.
  - *Synology DSM:* Autoridad sobre particionamiento RAID, permisos SMB/NFS y políticas de snapshots.
  - *Proxmox VE / VMware vSphere:* Autoridad sobre ciclo de vida de VMs, almacenamiento virtual y clústeres.
* Blue Hawk Ops opera bajo el paradigma de **Sonda Pasiva y Reconciliación Inteligente**. No ejecuta mutaciones arbitrarias en las configuraciones de red de los fabricantes, garantizando estabilidad operativa de grado bancario/empresarial.

### 1.2. Delimitación de Responsabilidad y Criterio Humano
* Las alertas de discrepancia, detección de drift y árboles de topología son herramientas analíticas de apoyo para el NOC.
* Toda intervención física en racks, desconexión de enlaces troncales o sustitución de hardware debe ser validada por un **Técnico L2** o **Administrador L3** según los procedimientos operativos estándar (SOP).

---

## 👥 2. Matriz de Control de Acceso Basado en Roles (RBAC)

Blue Hawk Ops implementa una arquitectura **Zero Client Trust**. El backend valida criptográficamente cada petición mediante tokens JWT firmados con algoritmo HS256 y expiración forzada. Las cabeceras enviadas por el navegador (tales como `X-User-Role`) son descartadas; el servidor extrae la identidad y el rol directamente del token de sesión verificado en base de datos.

| Dimensión Operativa | Operador NOC (L1) | Técnico de Soporte (L2) | Administrador de Plataforma (L3) |
| :--- | :---: | :---: | :---: |
| **Identidad Típica** | `operador@bluehawk.tech` | `tecnico@bluehawk.tech` | `admin@bluehawk.tech` |
| **Visualización de Dashboard y Métricas** | ✅ Lectura Total | ✅ Lectura Total | ✅ Control Total |
| **Inspección de Topología y Runbooks** | ✅ Lectura de Runbooks | ✅ Lectura de Runbooks | ✅ Edición y Auditoría |
| **Apertura de Tickets en Zammad** | ✅ Permitido | ✅ Permitido | ✅ Permitido |
| **Sondeo Manual de Controladores (UniFi)** | ❌ 403 Forbidden | ✅ Permitido | ✅ Permitido |
| **Sincronización con BlueHawk Inventory** | ❌ 403 Forbidden | ✅ Permitido | ✅ Permitido |
| **Firma y Resolución de Discrepancias** | ❌ 403 Forbidden | ✅ Permitido (Firma Digital) | ✅ Permitido (Firma Digital) |
| **Gestión de Cuentas y Contraseñas de Usuarios**| ❌ Sin Acceso | ❌ Sin Acceso | ✅ CRUD Completo |
| **Aprovisionamiento de Sedes y Clientes** | ❌ Sin Acceso | ❌ Sin Acceso | ✅ CRUD Completo |
| **Rotación de Secretos Criptográficos (Fernet)** | ❌ Sin Acceso | ❌ Sin Acceso | ✅ Exclusivo L3 |

---

## 🔌 3. Matriz de Interconexión con Plataformas Externas

Blue Hawk Ops interactúa con sistemas de terceros mediante protocolos estandarizados de telecomunicaciones y cifrado en tránsito TLS 1.3 / DTLS / SSH. A continuación se desglosan los conectores y sus alcances de seguridad:

```
┌─────────────────┐       HTTPS / REST API        ┌────────────────────────┐
│  Blue Hawk Ops  │ ────────────────────────────► │ BlueHawk Inventory     │
│  Backend Core   │ ◄───────────────────────────  │ (Gestión de Activos)   │
└────────┬────────┘                               └────────────────────────┘
         │
         │                HTTPS / REST API        ┌────────────────────────┐
         ├──────────────────────────────────────► │ Zammad Helpdesk        │
         │ ◄───────────────────────────  │ (support.bluehawktech) │
         │                                        └────────────────────────┘
         │
         │                HTTPS / WSS (Local/WAN) ┌────────────────────────┐
         ├──────────────────────────────────────► │ UniFi Network OS       │
         │ ◄───────────────────────────  │ (Site Controller)      │
         │                                        └────────────────────────┘
         │
         │                SNMPv3 (UDP 161)        ┌────────────────────────┐
         ├──────────────────────────────────────► │ Synology DSM           │
         │ ◄───────────────────────────  │ (Almacenamiento & NAS) │
         │                                        └────────────────────────┘
         │
         │                REST API HTTPS          ┌────────────────────────┐
         └──────────────────────────────────────► │ FortiOS / Proxmox VE   │
           ◄───────────────────────────  │ (Perímetro / Cómputo)  │
                                                  └────────────────────────┘
```

| Plataforma Externa | Protocolo / Puerto | Mecanismo de Autenticación | Alcance / Permiso (Scope) | Datos Ingeridos (Ingress) | Datos Emitidos (Egress) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UniFi Network** | HTTPS 443 / 8443 | API Key (`X-API-KEY`) o Sesión Local UniFi OS | Strict Read-Only (`Viewer`) | Topología de enlaces trunk, MACs de switches/APs, IPs de gestión, estado PoE, puertos uplink. | Ninguno (Sin comandos de reconfiguración). |
| **BlueHawk Inventory** | HTTPS 443 | Bearer Token (JWT 8 horas) / Consulta | Read-Only Assets (`/assets`) | Código de activo, ubicación en rack/piso, responsable, número de serie, MAC normalizada. | Ninguno (El inventario físico es fuente de verdad inmutable). |
| **Zammad Helpdesk** | HTTPS 443 (`support.bluehawktech.com`)| HTTP Token (`Token token=...`) | Agente NOC (`ticket.agent`) | Identificador de ticket creado, estado del caso, enlace web de seguimiento. | Título de alerta, resumen de drift de hardware, runbook de soporte, operador reportante. |
| **Synology DSM** | SNMPv3 UDP 161 (LAN/VPN) | SNMPv3 AuthPriv (SHA-256 + AES) | Read-Only MIB (OID 1.3.6.1.4.1.6574) | Salud SMART de discos, temperatura de bahías, estado de volumen RAID, uptime. | Ninguno (Consultas SNMP pasivas UDP). |
| **Fortinet FortiOS** | HTTPS 443 / 8443 | REST API Token | Read-Only Admin Profile | Estado de túneles IPsec multisede, consumo de ancho de banda WAN Claro, latencia a gateway. | Ninguno (Cero manipulación de access-lists o NAT). |
| **Proxmox VE / vSphere**| HTTPS 8006 / 443 | PVE Token (`PVEAuditor`) / ReadOnly | Auditoría de Virtualización | Conteo de VMs activas/detenidas, uso global de RAM/CPU, timestamp de respaldos PBS. | Ninguno (Sin inicio/parada de máquinas). |

---

## 🔒 4. Política de Privacidad y Garantía de Tráfico No Invasivo (Zero DPI)

Blue Hawk Technologies mantiene un compromiso irrestricto con la privacidad de las comunicaciones de los usuarios de nuestros clientes.

1. **Cero Inspección Profunda de Paquetes (Non-Invasive DPI):**
   * Blue Hawk Ops **no** realiza captura de paquetes, análisis de contenido (payload), ni inspección de paquetes en tránsito.
   * La telemetría capturada se restringe estrictamente a capas de enlace y red (L2/L3 de OSI): Direcciones MAC, Direcciones IP de gestión de hardware propio, identificadores de puertos switch y estadísticas agregadas de volumen (Mbps).
2. **Inviolabilidad de la Navegación y Comunicaciones:**
   * La plataforma jamás registra historiales de navegación web, consultas DNS de empleados, credenciales de usuarios finales, contenido de correos electrónicos ni mensajería.
3. **Aislamiento Criptográfico Multi-Tenant:**
   * La base de datos de Blue Hawk Ops segrega rígidamente los activos por clave foránea de Organización (`organization_id`). Los datos de una empresa son estrictamente inaccesibles para los operadores asignados a otra.
   * Los secretos de conexión (contraseñas de controladores, tokens de API) se almacenan en reposo cifrados mediante **AES-128 en modo CBC con HMAC-SHA256 (Fernet Criptográfico)**. Ningún secreto se almacena en texto claro.

---

## 📋 5. Protocolo de Gestión de Discrepancias y Drift de Hardware

Cuando el Motor de Reconciliación Determinista de Ops detecta una divergencia entre el inventario físico y la red en vivo:

1. **Drift de Hardware Ausente (`missing_from_network`):**
   - Un activo catalogado en BlueHawk Inventory no presenta actividad en la red UniFi en un rango de tolerancia de 15 minutos.
   - El sistema genera una discrepancia de prioridad ALTA (Prioridad Zammad 3).
   - Acciones permitidas: Apertura automática o manual de ticket en Zammad, verificación de acometida eléctrica por técnico de campo.
2. **Dispositivo No Catalogado (`uncataloged_device`):**
   - Se detecta un dispositivo de infraestructura transmitiendo en switches troncales que no cuenta con ficha en BlueHawk Inventory.
   - El sistema genera una discrepancia de prioridad MEDIA (Prioridad Zammad 2).
   - Acciones requeridas: Registro del equipo en inventario o aislamiento de puerto en caso de conexión clandestina.
3. **Resolución y Firma de Incidencias:**
   - La resolución de discrepancias en la plataforma requiere que un **Técnico L2 o Admin L3** firme la acción con notas técnicas explicativas.
   - La plataforma estampa en base de datos el nombre completo y rol verificado del usuario autenticado, imposibilitando el repudio de la acción.

---

## ⚖️ 6. Cumplimiento Legal y Disposiciones Finales

* **Jurisdicción y Ley Aplicable:** El tratamiento de datos de infraestructura se rige bajo las leyes de telecomunicaciones y protección de datos comerciales vigentes en la República Dominicana y estándares internacionales de ciberseguridad (ISO/IEC 27001, NIST SP 800-53).
* **Propiedad Intelectual:** Toda la propiedad del código fuente, modelos deterministas y componentes de Blue Hawk Ops corresponde en su totalidad a **Blue Hawk Technologies / WDBTECHNOLOGY, S.R.L.**
* **Canal Oficial de Cumplimiento:** Cualquier inquietud sobre seguridad, auditorías de clientes o notificación de vulnerabilidades debe dirigirse a:  
  📬 **NOC & Security Ops:** `soporte@bluehawk.tech` | `support.bluehawktech.com`
