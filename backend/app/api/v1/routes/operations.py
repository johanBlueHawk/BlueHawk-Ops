from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict
from datetime import datetime, timezone

from app.persistence.database import get_db
from app.persistence.models.entities import (
    Organization, Site, ClientIntegration, Asset, NetworkDevice, 
    DeviceObservation, IntegrationRun, Discrepancy, User
)
from app.api.v1.schemas.domain import (
    OrganizationResponse, IntegrationResponse, IntegrationRunResponse,
    AssetResponse, NetworkDeviceResponse, TopologyTreeResponse, TopologyNode,
    DiscrepancyResponse, DiscrepancyResolveRequest
)
from app.api.v1.routes.auth import get_current_user
from app.core.security import decrypt_secret
from app.integrations.unifi.connector import UniFiConnector
from app.services.reconciliation import ReconciliationEngine

router = APIRouter()

async def require_technician_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Valida en servidor que el usuario autenticado por JWT tenga privilegios L2/L3."""
    if current_user.role not in ["technician", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Permiso denegado: El rol Operador (L1) solo tiene permisos de monitoreo y reporte. Esta acción de infraestructura requiere rol Técnico (L2) o Administrador (L3)."
        )
    return current_user

# --- Organizations & Sites ---
@router.get("/organizations", response_model=List[OrganizationResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Organization).order_by(Organization.name))
    return result.scalars().all()

@router.get("/organizations/{org_id}/integrations", response_model=List[IntegrationResponse])
async def list_org_integrations(
    org_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ClientIntegration).where(ClientIntegration.organization_id == org_id))
    return result.scalars().all()

@router.get("/organizations/{org_id}/sites")
async def list_org_sites(
    org_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Site).where(Site.organization_id == org_id))
    return result.scalars().all()

from app.integrations.inventory.connector import BlueHawkInventoryConnector
from app.integrations.zammad.client import ZammadClient

# --- Assets (Inventory Projection) ---
@router.get("/sites/{site_id}/assets", response_model=List[AssetResponse])
async def list_site_assets(
    site_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Asset).where(Asset.site_id == site_id).order_by(Asset.asset_code))
    return result.scalars().all()

@router.post("/sites/{site_id}/inventory/sync")
async def sync_site_inventory(
    site_id: str, 
    current_user: User = Depends(require_technician_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Sincroniza los activos físicos de BlueHawk Inventory con la sede y ejecuta la reconciliación."""

    site = (await db.execute(select(Site).where(Site.id == site_id))).scalar_one_or_none()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    connector = BlueHawkInventoryConnector()
    try:
        raw_assets = await connector.fetch_assets()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al conectar con BlueHawk Inventory: {str(e)}")

    now = datetime.now(timezone.utc)
    
    existing_assets_res = await db.execute(select(Asset))
    existing_by_code = {a.asset_code: a for a in existing_assets_res.scalars().all()}
    
    synced_count = 0
    created_count = 0
    updated_count = 0

    for item in raw_assets:
        code = item.get("asset_code")
        if not code:
            continue
        
        if code in existing_by_code:
            asset = existing_by_code[code]
            asset.site_id = site.id
            asset.vendor = item.get("vendor") or asset.vendor
            asset.model = item.get("model") or asset.model
            asset.serial_number = item.get("serial_number") or asset.serial_number
            asset.mac_address = item.get("mac_address") or asset.mac_address
            asset.category = item.get("category") or asset.category
            asset.physical_location = item.get("physical_location") or asset.physical_location
            asset.owner_or_responsible = item.get("owner_or_responsible") or asset.owner_or_responsible
            asset.status = item.get("status") or asset.status
            asset.last_synced_from_inventory = now
            updated_count += 1
        else:
            new_asset = Asset(
                site_id=site.id,
                asset_code=code,
                vendor=item.get("vendor") or "Generico",
                model=item.get("model") or "",
                serial_number=item.get("serial_number"),
                mac_address=item.get("mac_address"),
                category=item.get("category") or "Equipos",
                physical_location=item.get("physical_location") or "Sede Principal",
                owner_or_responsible=item.get("owner_or_responsible"),
                status=item.get("status", "in_use"),
                source_system="bluehawk_inventory",
                last_synced_from_inventory=now
            )
            db.add(new_asset)
            created_count += 1
        synced_count += 1

    await db.commit()

    # Reconciliación determinista en caliente contra dispositivos en red
    recon_result = await ReconciliationEngine.reconcile_site(db=db, site=site)

    return {
        "status": "success",
        "site_id": site.id,
        "site_name": site.name,
        "source": "BlueHawk Inventory",
        "total_assets_imported": synced_count,
        "created": created_count,
        "updated": updated_count,
        "reconciliation": recon_result
    }

@router.get("/integrations/inventory/health")
async def check_inventory_health(current_user: User = Depends(get_current_user)):
    """Verifica la conectividad y estado de salud del servicio BlueHawk Inventory."""
    connector = BlueHawkInventoryConnector()
    return await connector.check_health()

@router.get("/integrations/zammad/health")
async def check_zammad_health(current_user: User = Depends(get_current_user)):
    """Verifica la conectividad y estado de autenticación con Zammad Helpdesk."""
    client = ZammadClient()
    return await client.check_health()

# --- Integration Runs & Synchronization ---
@router.post("/integrations/{integration_id}/sync", response_model=IntegrationRunResponse)
async def execute_integration_sync(
    integration_id: str, 
    current_user: User = Depends(require_technician_or_admin),
    db: AsyncSession = Depends(get_db)
):
    integ = (await db.execute(select(ClientIntegration).where(ClientIntegration.id == integration_id))).scalar_one_or_none()
    if not integ:
        raise HTTPException(status_code=404, detail="Integration not found")

    site = (await db.execute(select(Site).where(Site.organization_id == integ.organization_id))).scalars().first()
    if not site:
        raise HTTPException(status_code=400, detail="Site not configured for organization")

    run = IntegrationRun(
        integration_id=integ.id,
        status="running",
        started_at=datetime.now(timezone.utc)
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    secret = decrypt_secret(integ.encrypted_secret)
    connector = UniFiConnector(
        access_model=integ.access_model,
        base_url=integ.base_url,
        secret=secret,
        username=integ.username,
        site=integ.site_identifier or "default"
    )

    try:
        discovered = await connector.fetch_devices()
        await ReconciliationEngine.reconcile_run(
            db=db,
            site=site,
            run=run,
            discovered_devices=discovered
        )
        integ.health_status = "healthy"
        integ.last_sync_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(run)
        return run
    except Exception as e:
        run.status = "failed"
        run.finished_at = datetime.now(timezone.utc)
        run.error_summary = str(e)
        integ.health_status = "down"
        await db.commit()
        await db.refresh(run)
        raise HTTPException(status_code=500, detail=f"Sync execution failed: {str(e)}")

@router.get("/integrations/{integration_id}/runs", response_model=List[IntegrationRunResponse])
async def list_integration_runs(
    integration_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(IntegrationRun)
        .where(IntegrationRun.integration_id == integration_id)
        .order_by(IntegrationRun.started_at.desc())
        .limit(20)
    )
    return result.scalars().all()

# --- Network Devices & Live Topology ---
@router.get("/sites/{site_id}/devices", response_model=List[NetworkDeviceResponse])
async def list_site_devices(
    site_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(NetworkDevice)
        .where(NetworkDevice.site_id == site_id)
        .order_by(NetworkDevice.name)
    )
    return result.scalars().all()

@router.get("/sites/{site_id}/topology", response_model=TopologyTreeResponse)
async def get_site_topology(
    site_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    devs_res = await db.execute(select(NetworkDevice).where(NetworkDevice.site_id == site_id))
    devices = devs_res.scalars().all()
    
    # Load physical assets for matching location and asset code
    assets_res = await db.execute(select(Asset).where(Asset.site_id == site_id))
    assets_by_mac = {a.mac_address.lower(): a for a in assets_res.scalars().all() if a.mac_address}

    # Build tree nodes map
    nodes_map: Dict[str, TopologyNode] = {}
    mac_to_id: Dict[str, str] = {}

    for d in devices:
        matched_asset = assets_by_mac.get(d.mac_address.lower()) if d.mac_address else None
        
        # Operational runbooks & troubleshooting templates
        runbook = None
        isp = None
        if d.device_type == "gateway":
            isp = "Claro Dominicana Fibra Óptica (Soporte NOC: 809-220-1111 | Circuito CL-9812-BH)"
            runbook = "RB-01: Caída de WAN / Enlace Principal. 1. Verificar estado de link SFP+ en puerto 11. 2. Ping a gateway 10.0.0.1 y DNS 1.1.1.1. 3. Si ONT Claro está en alarma roja, reportar circuito CL-9812-BH. NO REINICIAR GATEWAY EN HORARIO LABORAL."
        elif d.device_type == "switch":
            runbook = f"RB-02: Diagnóstico de Switch. 1. Verificar consumo PoE global. 2. Confirmar que el puerto uplink ({d.uplink_port or 'Trunk'}) no tenga errores CRC. 3. En caso de loop STP, aislar puertos de acceso."
        elif d.device_type == "ap":
            runbook = "RB-03: Incidencia Wi-Fi / AP Degradado. 1. Verificar canal RF y saturación de clientes. 2. Comprobar negociación Gigabit/2.5G con el switch PoE. 3. Si hay interferencia, validar canal DFS 52-64."

        node = TopologyNode(
            id=d.id,
            name=d.name,
            device_type=d.device_type,
            ip=d.management_ip,
            mac=d.mac_address,
            model=d.model,
            firmware=d.firmware,
            status=d.status,
            uplink_port=d.uplink_port,
            physical_location=matched_asset.physical_location if matched_asset else "Sin catalogar en inventario",
            asset_code=matched_asset.asset_code if matched_asset else None,
            runbook_summary=runbook,
            isp_circuit=isp,
            children=[]
        )
        nodes_map[d.id] = node
        if d.mac_address:
            mac_to_id[d.mac_address.lower()] = d.id

    roots: List[TopologyNode] = []

    # Connect child nodes to their parent switch/gateway
    for d in devices:
        node = nodes_map[d.id]
        if d.parent_mac and d.parent_mac.lower() in mac_to_id:
            parent_id = mac_to_id[d.parent_mac.lower()]
            if parent_id != d.id:
                nodes_map[parent_id].children.append(node)
            else:
                roots.append(node)
        else:
            # Root node (e.g. Gateway or top switch)
            roots.append(node)

    return TopologyTreeResponse(
        site_id=site_id,
        roots=roots,
        total_devices=len(devices)
    )

# --- Discrepancies Queue ---
@router.get("/sites/{site_id}/discrepancies", response_model=List[DiscrepancyResponse])
async def list_site_discrepancies(
    site_id: str, 
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Discrepancy).where(Discrepancy.site_id == site_id)
    if status:
        query = query.where(Discrepancy.status == status)
    result = await db.execute(query.order_by(Discrepancy.detected_at.desc()))
    return result.scalars().all()

@router.post("/discrepancies/{discrepancy_id}/resolve", response_model=DiscrepancyResponse)
async def resolve_discrepancy(
    discrepancy_id: str,
    payload: DiscrepancyResolveRequest,
    current_user: User = Depends(require_technician_or_admin),
    db: AsyncSession = Depends(get_db)
):
    disc = (await db.execute(select(Discrepancy).where(Discrepancy.id == discrepancy_id))).scalar_one_or_none()
    if not disc:
        raise HTTPException(status_code=404, detail="Discrepancy not found")
    
    role_label = "Administrador" if current_user.role == "admin" else "Técnico"
    disc.status = payload.status
    disc.resolution_notes = payload.resolution_notes
    disc.resolved_by = f"{current_user.full_name} ({role_label})"
    disc.resolved_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(disc)
    return disc

# --- Zammad Ticketing Integration ---
@router.post("/discrepancies/{discrepancy_id}/create-ticket")
async def create_zammad_ticket_for_discrepancy(
    discrepancy_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Crea un ticket contextualizado en Zammad para una discrepancia de inventario o red."""
    disc = (await db.execute(select(Discrepancy).where(Discrepancy.id == discrepancy_id))).scalar_one_or_none()
    if not disc:
        raise HTTPException(status_code=404, detail="Discrepancy not found")

    site = (await db.execute(select(Site).where(Site.id == disc.site_id))).scalar_one_or_none()
    site_name = site.name if site else "Sede General"

    details = disc.details_json or {}
    dev_name = details.get("discovered_name") or details.get("asset_code") or "Dispositivo"
    ip = details.get("ip") or "N/D"
    mac = details.get("mac") or "N/D"
    location = details.get("physical_location") or "Rack Principal"
    reason = details.get("reason") or "Anomalía detectada en infraestructura"

    if disc.discrepancy_type == "missing_from_network":
        title = f"[BHOps Alerta] Drift de Inventario: {dev_name} no responde en {site_name}"
        priority_id = 3
    elif disc.discrepancy_type == "uncataloged_device":
        title = f"[BHOps Alerta] Equipo No Catalogado detectado en {site_name}: {dev_name}"
        priority_id = 2
    else:
        title = f"[BHOps Alerta] Desviación técnica en {site_name}: {dev_name}"
        priority_id = 2

    body = f"""🚨 ALERTA AUTOMÁTICA DE INFRAESTRUCTURA — BLUE HAWK OPS

• Sede / Cliente: {site_name}
• Tipo de Incidente: {disc.discrepancy_type.upper().replace('_', ' ')}
• Dispositivo: {dev_name}
• Dirección IP: {ip}
• MAC Address: {mac}
• Ubicación en Rack / Piso: {location}
• Causa Detectada: {reason}
• Fecha de Detección: {disc.detected_at.strftime('%Y-%m-%d %H:%M:%S UTC')}
• Reportado por: {current_user.full_name} ({current_user.email} - Rol: {current_user.role.capitalize()})

📋 ACCIÓN DE SOPORTE SUGERIDA:
1. Inspección física de acometida eléctrica y parcheo en rack.
2. Comprobación de conectividad en puerto switch.
3. Registrar resolución o actualización en Blue Hawk Ops.

🔗 Consola Ops: http://ops.bluehawk.tech/sites/{disc.site_id}"""

    client = ZammadClient()
    ticket_info = await client.create_ticket(
        title=title,
        body=body,
        priority_id=priority_id
    )

    # Guardar referencia del ticket de Zammad dentro de details_json
    updated_details = dict(details)
    updated_details["zammad_ticket"] = ticket_info
    disc.details_json = updated_details
    await db.commit()
    await db.refresh(disc)

    return {
        "status": "success",
        "discrepancy_id": disc.id,
        "ticket": ticket_info
    }


@router.post("/nodes/{node_id}/create-ticket")
async def create_zammad_ticket_for_node(
    node_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Crea un ticket de soporte en Zammad para un nodo de red con su Runbook asociado."""
    dev = (await db.execute(select(NetworkDevice).where(NetworkDevice.id == node_id))).scalar_one_or_none()
    if not dev:
        raise HTTPException(status_code=404, detail="Network device not found")

    site = (await db.execute(select(Site).where(Site.id == dev.site_id))).scalar_one_or_none()
    site_name = site.name if site else "Sede General"

    title = f"[BHOps Soporte] Incidente en nodo {dev.name} ({dev.device_type.upper()}) - {site_name}"
    
    body = f"""🛠️ REPORTE DE INCIDENTE EN NODO DE RED — BLUE HAWK OPS

• Sede / Cliente: {site_name}
• Dispositivo: {dev.name} ({dev.model or 'Genérico'})
• Tipo de Equipo: {dev.device_type.upper()}
• Estado Actual: {dev.status.upper()}
• IP de Gestión: {dev.management_ip or 'DHCP'}
• MAC Address: {dev.mac_address or 'N/D'}
• Firmware: {dev.firmware or 'N/D'}
• Reportado por: {current_user.full_name} ({current_user.email} - Rol: {current_user.role.capitalize()})

📋 RUNBOOK OPERATIVO DE EMERGENCIA:
1. Verificar enlace troncal y consumo PoE en puerto uplink.
2. Proveedor de Conectividad (ISP): Claro Dominicana (Circuito FO-99823).
3. Contacto de averías ISP: 809-220-1111 / Soporte Empresarial.

🔗 Consola Ops: http://ops.bluehawk.tech/sites/{dev.site_id}"""

    client = ZammadClient()
    ticket_info = await client.create_ticket(
        title=title,
        body=body,
        priority_id=3 if dev.status == "offline" else 2
    )

    return {
        "status": "success",
        "device_id": dev.id,
        "ticket": ticket_info
    }
