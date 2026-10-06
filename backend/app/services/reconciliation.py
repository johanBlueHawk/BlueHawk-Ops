from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from datetime import datetime, timezone

from app.persistence.models.entities import (
    Asset, NetworkDevice, Discrepancy, DeviceObservation, IntegrationRun, Site
)
from app.integrations.unifi.base import DiscoveredDevice, normalize_mac

class ReconciliationEngine:
    @staticmethod
    async def reconcile_run(
        db: AsyncSession,
        site: Site,
        run: IntegrationRun,
        discovered_devices: List[DiscoveredDevice]
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        
        assets_res = await db.execute(select(Asset).where(Asset.site_id == site.id))
        existing_assets = {a.id: a for a in assets_res.scalars().all()}
        
        assets_by_mac = {normalize_mac(a.mac_address): a for a in existing_assets.values() if a.mac_address}
        assets_by_serial = {a.serial_number.strip().lower(): a for a in existing_assets.values() if a.serial_number}

        devices_res = await db.execute(select(NetworkDevice).where(NetworkDevice.site_id == site.id))
        existing_devices = {d.external_id: d for d in devices_res.scalars().all()}

        processed_count = 0
        discrepancies_count = 0

        for disc in discovered_devices:
            processed_count += 1
            matched_asset: Asset = None

            # 1. Existing mapping
            net_dev = existing_devices.get(disc.external_id)
            if net_dev and net_dev.asset_id and net_dev.asset_id in existing_assets:
                matched_asset = existing_assets[net_dev.asset_id]

            # 2. Exact MAC
            if not matched_asset and disc.mac_address:
                norm_mac = normalize_mac(disc.mac_address)
                if norm_mac in assets_by_mac:
                    matched_asset = assets_by_mac[norm_mac]

            # 3. Exact Serial
            if not matched_asset and disc.serial_number:
                clean_serial = disc.serial_number.strip().lower()
                if clean_serial in assets_by_serial:
                    matched_asset = assets_by_serial[clean_serial]

            # Persist / Update NetworkDevice
            if net_dev:
                net_dev.name = disc.name
                net_dev.management_ip = disc.management_ip
                net_dev.mac_address = disc.mac_address
                net_dev.firmware = disc.firmware
                net_dev.model = disc.model
                net_dev.parent_mac = disc.parent_mac
                net_dev.uplink_port = disc.uplink_port
                net_dev.status = disc.status
                net_dev.observed_at = disc.observed_at
                net_dev.synced_at = now
                net_dev.freshness_status = "fresh"
                net_dev.source_run_id = run.id
                if matched_asset and not net_dev.asset_id:
                    net_dev.asset_id = matched_asset.id
            else:
                net_dev = NetworkDevice(
                    site_id=site.id,
                    integration_id=run.integration_id,
                    asset_id=matched_asset.id if matched_asset else None,
                    platform=disc.platform,
                    external_id=disc.external_id,
                    name=disc.name,
                    device_type=disc.device_type,
                    management_ip=disc.management_ip,
                    mac_address=disc.mac_address,
                    firmware=disc.firmware,
                    model=disc.model,
                    parent_mac=disc.parent_mac,
                    uplink_port=disc.uplink_port,
                    status=disc.status,
                    source_platform=disc.platform,
                    source_run_id=run.id,
                    observed_at=disc.observed_at,
                    synced_at=now,
                    freshness_status="fresh"
                )
                db.add(net_dev)
                await db.flush()
                existing_devices[disc.external_id] = net_dev

            # Persist Observation
            obs = DeviceObservation(
                network_device_id=net_dev.id,
                source_run_id=run.id,
                observed_at=disc.observed_at,
                connectivity=disc.status,
                metrics_json=disc.metrics
            )
            db.add(obs)

            # Check Discrepancies
            if not matched_asset:
                discrepancies_count += 1
                disc_res = await db.execute(select(Discrepancy).where(
                    Discrepancy.site_id == site.id,
                    Discrepancy.network_device_id == net_dev.id,
                    Discrepancy.discrepancy_type == "uncataloged_device",
                    Discrepancy.status == "pending"
                ))
                if not disc_res.scalar_one_or_none():
                    new_disc = Discrepancy(
                        site_id=site.id,
                        network_device_id=net_dev.id,
                        discrepancy_type="uncataloged_device",
                        status="pending",
                        details_json={
                            "discovered_name": disc.name,
                            "ip": disc.management_ip,
                            "mac": disc.mac_address,
                            "model": disc.model,
                            "parent_mac": disc.parent_mac,
                            "uplink_port": disc.uplink_port,
                            "reason": "Dispositivo detectado en red sin correlación en BlueHawk Inventory"
                        }
                    )
                    db.add(new_disc)
            else:
                # Auto-resolve any previous pending uncataloged_device discrepancy if now matched
                prev_disc_res = await db.execute(select(Discrepancy).where(
                    Discrepancy.site_id == site.id,
                    Discrepancy.network_device_id == net_dev.id,
                    Discrepancy.discrepancy_type == "uncataloged_device",
                    Discrepancy.status == "pending"
                ))
                for prev in prev_disc_res.scalars().all():
                    prev.status = "resolved"
                    prev.resolved_by = "Sistema (Match Automático con Inventario)"
                    prev.resolution_notes = f"Correlacionado con activo físico {matched_asset.asset_code} en {matched_asset.physical_location}"
                    prev.resolved_at = now

        # Detect Assets registered in BlueHawk Inventory that are MISSING from network (Inventory Drift)
        discovered_macs = {normalize_mac(d.mac_address) for d in discovered_devices if d.mac_address}
        for asset in existing_assets.values():
            if asset.mac_address and normalize_mac(asset.mac_address) not in discovered_macs:
                discrepancies_count += 1
                drift_disc = (await db.execute(select(Discrepancy).where(
                    Discrepancy.site_id == site.id,
                    Discrepancy.asset_id == asset.id,
                    Discrepancy.discrepancy_type == "missing_from_network",
                    Discrepancy.status == "pending"
                ))).scalar_one_or_none()

                if not drift_disc:
                    new_drift = Discrepancy(
                        site_id=site.id,
                        asset_id=asset.id,
                        discrepancy_type="missing_from_network",
                        status="pending",
                        details_json={
                            "asset_code": asset.asset_code,
                            "discovered_name": f"{asset.vendor} {asset.model or asset.category}",
                            "mac": asset.mac_address,
                            "physical_location": asset.physical_location,
                            "reason": f"Activo físico '{asset.asset_code}' en {asset.physical_location} no responde en red viva UniFi (posible apagado, falla de enlace o desconexión física)"
                        }
                    )
                    db.add(new_drift)

        run.finished_at = datetime.now(timezone.utc)
        run.status = "success"
        run.records_discovered = len(discovered_devices)
        run.records_processed = processed_count
        run.discrepancies_detected = discrepancies_count

        await db.commit()
        return {
            "run_id": run.id,
            "status": "success",
            "discovered": len(discovered_devices),
            "processed": processed_count,
            "discrepancies": discrepancies_count
        }

    @staticmethod
    async def reconcile_site(
        db: AsyncSession,
        site: Site
    ) -> Dict[str, Any]:
        """
        Reconcilia los activos físicos existentes contra los dispositivos de red de la sede.
        Se ejecuta tras una sincronización con BlueHawk Inventory para actualizar drift y matches.
        """
        now = datetime.now(timezone.utc)
        
        assets_res = await db.execute(select(Asset).where(Asset.site_id == site.id))
        existing_assets = {a.id: a for a in assets_res.scalars().all()}
        
        assets_by_mac = {normalize_mac(a.mac_address): a for a in existing_assets.values() if a.mac_address}
        assets_by_serial = {a.serial_number.strip().lower(): a for a in existing_assets.values() if a.serial_number}

        devices_res = await db.execute(select(NetworkDevice).where(NetworkDevice.site_id == site.id))
        devices = devices_res.scalars().all()

        matched_count = 0
        discrepancies_count = 0

        # 1. Matching de dispositivos en red contra inventario
        for net_dev in devices:
            matched_asset = None
            if net_dev.mac_address:
                norm_mac = normalize_mac(net_dev.mac_address)
                if norm_mac in assets_by_mac:
                    matched_asset = assets_by_mac[norm_mac]

            if not matched_asset and net_dev.external_id:
                clean_ext = net_dev.external_id.strip().lower()
                if clean_ext in assets_by_serial:
                    matched_asset = assets_by_serial[clean_ext]

            if matched_asset:
                net_dev.asset_id = matched_asset.id
                matched_count += 1
                
                # Auto-resolver discrepancia uncataloged_device previa
                prev_disc_res = await db.execute(select(Discrepancy).where(
                    Discrepancy.site_id == site.id,
                    Discrepancy.network_device_id == net_dev.id,
                    Discrepancy.discrepancy_type == "uncataloged_device",
                    Discrepancy.status == "pending"
                ))
                for prev in prev_disc_res.scalars().all():
                    prev.status = "resolved"
                    prev.resolved_by = "Sistema (Sincronización BlueHawk Inventory)"
                    prev.resolution_notes = f"Correlacionado con activo {matched_asset.asset_code} en {matched_asset.physical_location}"
                    prev.resolved_at = now
            else:
                existing_disc = (await db.execute(select(Discrepancy).where(
                    Discrepancy.site_id == site.id,
                    Discrepancy.network_device_id == net_dev.id,
                    Discrepancy.discrepancy_type == "uncataloged_device",
                    Discrepancy.status == "pending"
                ))).scalar_one_or_none()
                if not existing_disc:
                    new_disc = Discrepancy(
                        site_id=site.id,
                        network_device_id=net_dev.id,
                        discrepancy_type="uncataloged_device",
                        status="pending",
                        details_json={
                            "discovered_name": net_dev.name,
                            "ip": net_dev.management_ip,
                            "mac": net_dev.mac_address,
                            "model": net_dev.model,
                            "reason": "Dispositivo detectado en red sin correlación en BlueHawk Inventory"
                        }
                    )
                    db.add(new_disc)
                    discrepancies_count += 1

        # 2. Detección de Drift: Activos en inventario con MAC no observados en red viva
        discovered_macs = {normalize_mac(d.mac_address) for d in devices if d.mac_address}
        for asset in existing_assets.values():
            if asset.mac_address and normalize_mac(asset.mac_address) not in discovered_macs:
                discrepancies_count += 1
                drift_disc = (await db.execute(select(Discrepancy).where(
                    Discrepancy.site_id == site.id,
                    Discrepancy.asset_id == asset.id,
                    Discrepancy.discrepancy_type == "missing_from_network",
                    Discrepancy.status == "pending"
                ))).scalar_one_or_none()

                if not drift_disc:
                    new_drift = Discrepancy(
                        site_id=site.id,
                        asset_id=asset.id,
                        discrepancy_type="missing_from_network",
                        status="pending",
                        details_json={
                            "asset_code": asset.asset_code,
                            "discovered_name": f"{asset.vendor} {asset.model or asset.category}",
                            "mac": asset.mac_address,
                            "physical_location": asset.physical_location,
                            "reason": f"Activo físico '{asset.asset_code}' en {asset.physical_location} no responde en red viva UniFi (posible apagado o desconexión física)"
                        }
                    )
                    db.add(new_drift)
            elif asset.mac_address and normalize_mac(asset.mac_address) in discovered_macs:
                # Auto-resolver si el activo volvió a aparecer en red
                drift_discs = (await db.execute(select(Discrepancy).where(
                    Discrepancy.site_id == site.id,
                    Discrepancy.asset_id == asset.id,
                    Discrepancy.discrepancy_type == "missing_from_network",
                    Discrepancy.status == "pending"
                ))).scalars().all()
                for d in drift_discs:
                    d.status = "resolved"
                    d.resolved_by = "Sistema (Detección en Red)"
                    d.resolution_notes = "Equipo detectado activo en red viva"
                    d.resolved_at = now

        await db.commit()
        return {
            "status": "success",
            "matched_devices": matched_count,
            "discrepancies": discrepancies_count
        }
