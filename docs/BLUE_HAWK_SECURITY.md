# BLUE_HAWK_SECURITY.md — Estándar de Ciberseguridad, Aislamiento y Protección de Red
> **Plataforma:** Blue Hawk Ops — Centro de Operaciones e Infraestructura  
> **Organización:** Blue Hawk Technologies / WDBTECHNOLOGY, S.R.L.  
> **Ámbito:** Seguridad de Backend (FastAPI), Aislamiento Multi-Cliente y Custodia de Credenciales de Red  
> **Versión:** 1.0.0 (Adaptado a Blue Hawk Ops)  

---

## 🧭 1. Principios No Negociables de Operaciones e Infraestructura

En la administración de infraestructura de clientes (UniFi, VMware, FortiGate, Synology, Hikvision), un fallo de seguridad puede comprometer la red corporativa de múltiples empresas.

1. **Solo Lectura Estricto (*Strict Read-Only Enforcement*):**
   * Ningún conector de Blue Hawk Ops tiene permisos de escritura en producción.
   * La plataforma utiliza credenciales de mínimo privilegio creadas específicamente para auditoría y telemetría.
   * Prohibido cualquier endpoint que permita reiniciar puertos, cambiar VLANs o alterar reglas de firewall de manera automática.

2. **Cero Confianza en el Cliente (*Zero Client Trust* & DevTools Defense):**
   * El navegador es hostil. La pertenencia de un técnico a una organización (`OVA`, `Sancha`, etc.) o sus permisos no se validan en React/Next.js, sino mediante firma criptográfica de JWT y comprobación directa en PostgreSQL en cada request de `/api/v1/...`.
   * Si un técnico altera el estado del cliente en React DevTools, el backend responde de inmediato con `403 Forbidden`.

3. **Cero Fuga de Credenciales de Fabricante (*Secret Isolation*):**
   * **El frontend JAMÁS recibe tokens de UniFi, contraseñas de VMware ni API Keys de FortiGate.**
   * Las credenciales viven cifradas en la base de datos (AES-256) y solo el worker interno de Python las descifra en memoria para hacer el pull de datos.

4. **Sanitización de Datos de Red y Cero Telemetría Externa (*Zero-Leakage*):**
   * Cualquier asistente inteligente o generador de resúmenes opera sobre datos redactados (subredes RFC 1918 y MACs protegidas). No se envían credenciales ni secretos a APIs externas de IA.

---

## 🔒 2. Custodia y Cifrado de Credenciales Multi-Cliente

Cada cliente (`Blue Hawk`, `OVA`, `Sancha`, etc.) tiene sus propias conexiones. El almacenamiento de las credenciales en la tabla `client_integrations` se rige por:

- **Algoritmo de Cifrado en Reposo:** Cifrado simétrico autenticado **AES-256-GCM** utilizando la librería `cryptography` de Python (`Fernet` o primitivas AES-GCM).
- **Inyección de Clave Maestra:** La clave de descifrado (`ENCRYPTION_MASTER_KEY`) se carga exclusivamente mediante variable de entorno del backend en el contenedor seguro de Proxmox/Docker. **Nunca se commitea en git ni se expone por endpoints REST.**
- **Rotación de Credenciales:** La plataforma admite actualización de API Keys sin interrupción del servicio mediante un endpoint administrativo dedicado `PATCH /api/v1/integrations/{id}/credentials`.

---

## 🛡️ 3. Aislamiento Multi-Cliente y Multi-Tenant Estricto

Para garantizar que los técnicos solo vean los clientes y sedes autorizados:

1. **Filtro Obligatorio de Tenant a Nivel Repositorio:**
   * Toda consulta SQL en SQLAlchemy debe incluir de forma obligatoria el filtro por `organization_id`:
     ```python
     # Correcto
     stmt = select(NetworkDevice).where(
         NetworkDevice.site_id == site_id,
         NetworkDevice.organization_id == current_user.active_org_id
     )
     ```
   * Prohibido crear consultas genéricas de dispositivos sin validar la autorización de la organización actual del usuario.

2. **Esquema de Tokens JWT:**
   * **Access Token:** Vigencia de **15 minutos**.
   * **Refresh Token:** Vigencia de **7 días** con rotación obligatoria de un solo uso (*One-Time Use*). Si se detecta un intento de reúso de refresh token, se revocan de inmediato todas las sesiones del usuario.
   * **Bloqueo por Fuerza Bruta:** 5 intentos fallidos consecutivos bloquean el acceso durante 30 minutos.

---

## 🌐 4. Seguridad de Red y Encabezados HTTP (NOC Production Hardening)

El reverse proxy (Nginx / Caddy en el host Proxmox) debe aplicar los siguientes encabezados de seguridad:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

- **Restricción CORS Estricta:** El backend FastAPI solo responderá a peticiones que provengan del host del dashboard (`http://localhost:3000` en desarrollo o la IP/dominio interno del contenedor de Blue Hawk Ops en producción).

---

## 🤖 5. Límites y Seguridad en Asistentes Inteligentes (Agentes)

1. **Mandatorio: Humano en el Ciclo (*Human-in-the-Loop*):**
   * Ningún agente de IA puede ejecutar acciones destructivas ni modificar el estado de un dispositivo.
   * La IA únicamente asiste en:
     * Redacción de borradores de causas raíz (RCA) para incidencias.
     * Comparación semántica de modelos de equipos para la cola de reconciliación de inventario.
     * Generación de resúmenes ejecutivos semanales de salud.
2. **Aprobación Obligatoria:** Toda sugerencia de la IA debe contar con un botón explícito de *"Aprobar y Guardar"* por parte de un técnico de Blue Hawk.
