# Blue Hawk Ops
## Presentación para Junta Directiva
Blue Hawk Technologies / WDBTECHNOLOGY, S.R.L.
Preparado por: Johan Gabriel Vasquez — IT Support & Software Developer
Septiembre 2026

---

## 1. Resumen ejecutivo

Blue Hawk Ops es una plataforma interna que centraliza la visibilidad de red, el inventario físico, el historial de incidentes, y la documentación operativa de todas las sedes que atendemos, hoy dispersos entre múltiples consolas, hojas de cálculo, y el conocimiento individual de cada técnico.

El proyecto ya cuenta con aprobación inicial de gerencia de operaciones para avanzar con una fase piloto de bajo riesgo. Esta presentación busca informar a la junta sobre el alcance, el enfoque de seguridad, y el camino de crecimiento del proyecto.

**En una frase:** convertir información técnica dispersa en visibilidad centralizada y decisiones más rápidas, sin tocar ni reemplazar las herramientas que ya usamos.

---

## 2. Contexto: el problema de negocio

Actualmente, la información técnica de las sedes de nuestros clientes vive repartida en:

- Consolas de fabricantes (UniFi Site Manager, FortiGate)
- Hojas de cálculo de inventario
- Chats internos del equipo técnico
- Conocimiento individual, no documentado, de cada técnico

**Consecuencias operativas de esta dispersión:**

| Impacto | Descripción |
|---|---|
| Tiempos de resolución más largos | Los técnicos deben consultar múltiples fuentes antes de diagnosticar un problema |
| Inventario poco confiable | No siempre coincide lo que está físicamente instalado con lo que hay registrado |
| Conocimiento no institucionalizado | La resolución de incidentes depende de la memoria de técnicos específicos |
| Reportes gerenciales manuales | Armar un reporte de estado de infraestructura toma tiempo que podría dedicarse a resolver problemas |

---

## 3. La solución propuesta

Blue Hawk Ops es una plataforma web interna que **centraliza, no reemplaza.** Se conecta a las herramientas existentes en modo de solo lectura y organiza esa información en una sola consola de trabajo para el equipo técnico y para reportes gerenciales.

**Los tres pilares del diseño:**

1. **Solo lectura, siempre.** La plataforma nunca modifica configuraciones de red en producción. Usa credenciales de mínimo privilegio contra las APIs de los fabricantes.
2. **Complementa, no reemplaza.** UniFi Controller y FortiGate siguen siendo la autoridad oficial de configuración de la infraestructura.
3. **Sin automatización autónoma.** Ninguna acción sobre la infraestructura se ejecuta sola, ni por script ni por inteligencia artificial. Toda decisión de cambio pasa por una persona.

Este enfoque conservador es intencional: el objetivo de la fase piloto es demostrar valor con el menor riesgo operativo posible antes de considerar cualquier expansión.

---

## 4. Valor esperado para la empresa

| Área de impacto | Beneficio esperado |
|---|---|
| Tiempo de diagnóstico y resolución (MTTD/MTTR) | Acceso inmediato a la topología y estado de conectividad de cada sede, sin saltar entre consolas |
| Exactitud de inventario | Vinculación automática entre dispositivos detectados en la red y el inventario físico registrado |
| Continuidad de conocimiento | Procedimientos e incidentes documentados centralmente, no dependientes de una sola persona |
| Reportes ejecutivos | Generación automática de resúmenes de salud de infraestructura, reduciendo trabajo manual |
| Escalabilidad de soporte | Base para atender más sedes/clientes sin aumentar proporcionalmente la carga operativa del equipo técnico |

---

## 5. Enfoque de riesgo y gobernanza

La junta debe tener claridad sobre lo que este proyecto **explícitamente no hace** en su fase actual:

- No altera políticas de firewall, reglas de enrutamiento, ni VLANs en producción.
- No reemplaza las consolas nativas de los fabricantes ni los sistemas de ticketing vigentes.
- No ejecuta scripts ni comandos remotos destructivos sin supervisión humana directa.
- No utiliza modelos de inteligencia artificial para modificar configuraciones de red sin autorización explícita.

Todo dato mostrado en la plataforma incluye una marca de tiempo de sincronización, de forma que el equipo siempre sepa qué tan actualizada está la información antes de tomar una decisión basada en ella.

---

## 6. Plan de implementación por fases

| Fase | Enfoque | Resultado esperado |
|---|---|---|
| Fase 0 | Cimientos de datos e infraestructura base | Esquema de base de datos y estructura de conectores lista |
| Fase 1 — Piloto | Integración de solo lectura con UniFi | Inventario dinámico de red y alertas de dispositivos caídos, en una sede |
| Fase 2 | Reportes y alertas automáticas | Resúmenes de salud semanales, sin trabajo manual |
| Fase 3 | Integración de solo lectura con FortiGate | Visibilidad de seguridad perimetral y enlaces entre sedes |
| Fase 4 (evaluación futura) | Infraestructura virtual (Proxmox/NAS) | Cuadro de mando de servidores y respaldos |

Cada fase se evalúa antes de avanzar a la siguiente. No hay compromiso de construir todas las fases si el piloto no demuestra valor suficiente.

---

## 7. Alcance del piloto (ya en marcha)

Para validar la propuesta con el menor riesgo posible, el piloto se limita deliberadamente a:

- **Una sola sede** — cliente de bajo riesgo o entorno interno.
- **Un solo fabricante** — UniFi únicamente en esta primera etapa.
- **Un usuario de API de solo lectura**, creado específicamente para este propósito.
- **Ventana de evaluación de tres semanas** antes de decidir los próximos pasos.
- **Despliegue en infraestructura interna** (contenedor Proxmox/Docker), sin exposición innecesaria a internet.

---

## 8. Recursos necesarios

Este proyecto se desarrolla con recursos ya disponibles dentro del equipo de IT Support:

- No requiere contratación adicional de personal para la fase piloto.
- No requiere licencias de software adicionales — se apoya en infraestructura y herramientas de código abierto ya evaluadas.
- El tiempo de desarrollo se integra dentro de las responsabilidades actuales del rol de soporte técnico e infraestructura.

---

## 9. Próximos pasos

1. Confirmar la sede piloto junto con gerencia de operaciones.
2. Habilitar el usuario de solo lectura correspondiente en el UniFi Controller.
3. Ejecutar la fase piloto durante tres semanas.
4. Presentar resultados y métricas concretas a la junta para decidir sobre la expansión del proyecto.

---

## 10. Conclusión

Blue Hawk Ops no representa un cambio disruptivo ni un riesgo para la infraestructura de nuestros clientes. Es una capa de visibilidad y organización construida sobre principios conservadores de seguridad, diseñada para demostrar valor de forma incremental antes de cualquier inversión mayor de tiempo o recursos.

La fase piloto actual es la oportunidad de validar esa hipótesis con datos reales, en un entorno controlado, antes de tomar decisiones sobre su expansión.
