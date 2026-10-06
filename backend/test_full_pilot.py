import asyncio
import httpx
from app.main import app

async def test_full_pilot():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("=== 1. VERIFICAR CLIENTES Y SEDES ===")
        orgs = (await client.get("/api/v1/organizations")).json()
        print(f"Total organizaciones: {len(orgs)}")
        bh_org = next(o for o in orgs if o["code"] == "BH")
        bh_id = bh_org["id"]
        print(f"Organización piloto: {bh_org['name']} (ID: {bh_id})")

        print("\n=== 2. VERIFICAR ACTIVOS PROYECTADOS DE BLUEHAWK INVENTORY ===")
        integs = (await client.get(f"/api/v1/organizations/{bh_id}/integrations")).json()
        unifi_integ = integs[0]
        unifi_id = unifi_integ["id"]
        
        # Conocer site id
        # Listamos devices para ver el site
        assets_initial = (await client.get(f"/api/v1/sites/{bh_id}/assets")).json() # bh_id != site_id, but let's query via integrations
        print(f"Conector UniFi configurado: {unifi_integ['label']} (Modelo: {unifi_integ['access_model']})")

        print("\n=== 3. DISPARAR CORRIDA DE SINCRONIZACIÓN (INTEGRATION RUN) ===")
        sync_res = (await client.post(f"/api/v1/integrations/{unifi_id}/sync")).json()
        print(f"Run ID: {sync_res['id']}")
        print(f"Estado de la corrida: {sync_res['status']}")
        print(f"Dispositivos descubiertos en UniFi: {sync_res['records_discovered']}")
        print(f"Dispositivos procesados: {sync_res['records_processed']}")
        print(f"Discrepancias detectadas: {sync_res['discrepancies_detected']}")

        print("\n=== 4. VERIFICAR CORRIDAS HISTÓRICAS AUDITABLES ===")
        runs = (await client.get(f"/api/v1/integrations/{unifi_id}/runs")).json()
        print(f"Total corridas registradas en DB: {len(runs)}")
        for r in runs:
            print(f"  * Run {r['id'][:8]} | Inicio: {r['started_at']} | Fin: {r['finished_at']} | Estado: {r['status']}")

        print("\n=== 5. VERIFICAR DISCREPANCIAS Y RECONCILIACIÓN ===")
        # Buscamos el site del edificio
        from sqlalchemy import select
        from app.persistence.database import AsyncSessionLocal
        from app.persistence.models.entities import Site
        async with AsyncSessionLocal() as session:
            site_db = (await session.execute(select(Site).where(Site.organization_id == bh_id))).scalars().first()
            site_id = site_db.id

        discrepancies = (await client.get(f"/api/v1/sites/{site_id}/discrepancies")).json()
        print(f"Discrepancias en cola de revisión para el técnico: {len(discrepancies)}")
        for d in discrepancies:
            print(f"  ! Tipo: {d['discrepancy_type']} | Estado: {d['status']} | Detalle: {d['details_json']}")

        # Probar resolución humana de discrepancia
        if discrepancies:
            disc_to_resolve = discrepancies[0]
            resolve_res = (await client.post(
                f"/api/v1/discrepancies/{disc_to_resolve['id']}/resolve",
                json={
                    "resolution_notes": "Equipo verificado en Piso 2 por técnico Johan. Procederemos a crearlo en BlueHawk Inventory.",
                    "resolved_by": "Johan Vasquez",
                    "status": "resolved"
                }
            )).json()
            print(f"\nDiscrepancia {resolve_res['id'][:8]} resuelta por: {resolve_res['resolved_by']}")
            print(f"Notas de resolución: {resolve_res['resolution_notes']}")

        print("\n=== 6. VERIFICAR OBSERVACIONES HISTÓRICAS DE DISPOSITIVOS ===")
        devs = (await client.get(f"/api/v1/sites/{site_id}/devices")).json()
        print(f"Total dispositivos de red con estado operativo y frescura: {len(devs)}")
        for dev in devs:
            obs = (await client.get(f"/api/v1/devices/{dev['id']}/observations")).json()
            print(f"  * Dispositivo: {dev['name']} ({dev['device_type']}) | IP: {dev['management_ip']} | MAC: {dev['mac_address']} | Frescura: {dev['freshness_status']} | Observaciones guardadas: {len(obs)}")

if __name__ == "__main__":
    asyncio.run(test_full_pilot())
