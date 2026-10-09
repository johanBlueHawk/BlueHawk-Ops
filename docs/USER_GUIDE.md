# USER_GUIDE.md — Manual Operativo de Blue Hawk Ops (BHOps)
> **Centro de Operaciones de Red (NOC) — Blue Hawk Technologies**  
> **Plataforma:** Blue Hawk Ops Console v2.4  
> **Destinatarios:** Operadores NOC (L1), Técnicos de Infraestructura (L2), Administradores de Red (L3)  
> **Última Actualización:** Marzo 2026  

---

## 🧭 1. Introducción y Acceso al Sistema

Blue Hawk Ops es la consola operacional centralizada de Blue Hawk Technologies para supervisar la salud de red, correlacionar inventario físico contra telemetría en vivo, diagnosticar fallas con runbooks estandarizados y gestionar tickets de soporte con Zammad.

### 1.1. Inicio de Sesión
1. Abra el portal seguro en su navegador: `http://localhost:3000/login` o la URL institucional designada por el NOC.
2. Ingrese con sus credenciales institucionales:
   - **Operador NOC (L1):** `operador@bluehawk.tech`
   - **Técnico de Soporte (L2):** `tecnico@bluehawk.tech`
   - **Administrador (L3):** `admin@bluehawk.tech`
3. Al autenticarse, el backend expedirá un token criptográfico JWT que viaja en la cabecera `Authorization: Bearer <token>`.

---

## 🏢 2. Selección de Cliente y Sede de Red

En la barra superior de la consola:
1. **Selector de Organización:** Haga click en el menú desplegable de clientes para alternar entre organizaciones gestionadas (ej. *Edificio Blue Hawk*, *OVA*, *Sancha*, *Troncone*, *Belén*).
2. Los datos de topología, activos, discrepancias e integraciones se actualizarán automáticamente aislando estrictamente la información de cada cliente.
3. El indicador del rol activo se muestra en la esquina superior derecha (`Operador NOC`, `Técnico L2` o `Admin L3`).

---

## 📊 3. Panel General (Overview) y Telemetría

La pestaña principal proporciona una vista panorámica instantánea del estado de la sede:
* **Métricas Principales:** Total de dispositivos descubiertos, gateways en línea, switches de distribución, puntos de acceso Wi-Fi y clientes concurrentes en la red.
* **Índice de Salud de Infraestructura:** Porcentaje de dispositivos en línea vs caídos.
* **Alertas Activas:** Indicador de discrepancias de inventario que requieren atención inmediata del equipo técnico.

---

## 🌐 4. Topología de Red, Runbooks Operativos y Ticketing

La pestaña **Topología** renderiza el árbol jerárquico de conectividad física basado en enlaces troncales (puertos trunk) y telemetría LLDP del controlador UniFi.

### 4.1. Navegación del Árbol de Red
* Los nodos se organizan jerárquicamente desde el **Gateway perimetral** hacia los **Switches de agregación**, los **Switches de acceso** y los **Puntos de Acceso (APs)**.
* Cada nodo muestra su nombre, modelo, IP de gestión asignada y estado en vivo (`ONLINE` o `OFFLINE`).

### 4.2. Inspección de Nodo y Runbook de Diagnóstico
Haga click sobre cualquier nodo para desplegar el **Panel Lateral de Diagnóstico Operativo (Inspection Drawer)**:
1. **Ficha Técnica & Ubicación Física:** Muestra el Código de Activo de BlueHawk Inventory, la ubicación física en rack/piso, la dirección MAC y el puerto trunk padre.
2. **Runbook de Emergencia:**
   - **Gateways (RB-01):** Procedimiento para caídas de enlace WAN Claro FO (puerto SFP+ 11, verificación de alarma en ONT, circuito `CL-9812-BH`, teléfono del NOC Claro `809-220-1111`).
   - **Switches (RB-02):** Diagnóstico de consumo PoE, chequeo de errores CRC en trunks y aislamiento de loops STP.
   - **Puntos de Acceso (RB-03):** Saturación de clientes, negociación Gigabit/2.5G con el switch y canales DFS Wi-Fi.
3. **Copiar Ficha:** Copia al portapapeles todos los datos del equipo con formato legible para chats de soporte técnico o correos.
4. **Abrir Ticket de Incidente en Zammad:**
   - Un click genera un ticket formal en `support.bluehawktech.com`.
   - El ticket incluye el runbook de emergencia, la IP, la MAC, la sede y el operador reportante.
   - Al generarse, la tarjeta muestra el enlace directo al ticket en Zammad (ej. `Ticket #73009`).

---

## ⚖️ 5. Motor de Reconciliación e Inventario

La pestaña **Reconciliación** cruza la base de datos de activos físicos de **BlueHawk Inventory** con los dispositivos descubiertos en la red por **UniFi Network**.

### 5.1. Tipos de Discrepancias
* **DRIFT: AUSENTE (`missing_from_network`):**  
  Un activo físico catalogado en el inventario no se detecta en la red. Puede indicar desconexión accidental, corte de energía o robo.
* **NO CATALOGADO (`uncataloged_device`):**  
  Un dispositivo de red está activo y transmitiendo en la infraestructura pero no tiene ficha creada en BlueHawk Inventory.

### 5.2. Flujo de Trabajo con Discrepancias
1. **Sincronización Manual:**  
   Presione **Sincronizar Inventario**.  
   *Nota:* Esta acción ejecuta llamadas al API de BlueHawk Inventory y recalcula el árbol en memoria. Solo está autorizada para **Técnicos (L2)** y **Admins (L3)**.
2. **Abrir Ticket en Zammad:**  
   En la Cola de Reconciliación, haga click en **Revisar** en cualquier discrepancia y presione **Abrir Ticket en Zammad**.  
   El ticket se vincula permanentemente a la discrepancia en la base de datos.
3. **Firmar y Resolver Discrepancia:**  
   Ingrese la nota técnica de resolución (ej. *“Reemplazado cable patch en Rack Piso 2”*) y presione **Firmar**.  
   La incidencia pasa a la pestaña de **Resueltas** y queda sellada con el nombre del técnico.

---

## 🔌 6. Monitor de Sondas & Conectores Multi-Vendor (ServiceCard)

La pestaña **Conectores** muestra el estado en tiempo real de las sondas de telemetría:
* **UniFi Network:** Estado de la sesión con el controlador, nodos activos y botón para **Sondear Ahora**.
* **BlueHawk Inventory:** Validación periódica de salud (`/health`), versión del API y latencia.
* **Zammad Helpdesk:** Estado de autenticación con `support.bluehawktech.com`, agente asignado y token de API.
* **FortiGate VPN, Proxmox VE y Synology NAS:** Fichas de conectores pasivos en monitoreo o fase planificada.
* **Botón "Actualizar Sondas":** Permite forzar un test de salud inmediato hacia todos los servicios interconectados.

---

## 📑 7. Informes Ejecutivos & Reportes SLA

La pestaña **Reportes** consolida métricas listas para auditoría:
* Resumen de disponibilidad de la sede.
* Listado de incidencias resueltas vs pendientes en el mes.
* Porcentaje de cobertura de activos catalogados.
* Opción de exportación de reporte para la Junta Directiva o gerencia del cliente.

---

## 🔐 8. Gestión de Usuarios y Seguridad (Exclusivo Administrador L3)

Los usuarios con rol Administrador pueden acceder a la gestión de cuentas desde el menú superior:
1. Crear nuevos usuarios con correo institucional y asignación de rol (`Operador NOC`, `Técnico L2` o `Admin L3`).
2. Deshabilitar o reactivar cuentas de colaboradores.
3. Actualizar contraseñas seguras cumpliendo la política de complejidad mínima (8 caracteres, mayúsculas, números y símbolos especiales).
