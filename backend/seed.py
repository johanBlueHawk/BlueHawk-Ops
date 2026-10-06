import asyncio
from app.persistence.database import AsyncSessionLocal, engine, Base
from app.persistence.models.entities import Organization, Site, ClientIntegration, Asset
from app.core.security import encrypt_secret

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        print("Poblando clientes y proyecciones de activos iniciales...")
        
        # 1. Edificio Blue Hawk (Sede Piloto)
        bh_org = Organization(
            name="Edificio Blue Hawk",
            code="BH",
            status="active",
            contact_name="Johan Gabriel Vasquez",
            contact_email="it@bluehawktechnologies.com",
            notes="Sede corporativa central y piloto inicial"
        )
        session.add(bh_org)
        await session.flush()

        bh_site = Site(
            organization_id=bh_org.id,
            name="Edificio Central",
            address="Av. Winston Churchill #109, Santo Domingo"
        )
        session.add(bh_site)
        await session.flush()

        # Activos pre-existentes en BlueHawk Inventory (proyección)
        # Nota: Dejamos a propósito el U6-Pro sin catalogar en el inventario para que el sync genere una discrepancia real
        assets_seed = [
            Asset(
                site_id=bh_site.id,
                asset_code="BHT-UAP-001",
                category="access_point",
                vendor="Ubiquiti",
                model="UAP-AC-Pro",
                serial_number="BHT-UAP-001",
                mac_address="74:83:c2:11:22:33",
                physical_location="Lobby Entrada Principal",
                owner_or_responsible="Operaciones",
                status="in_use",
                source_system="inventory"
            ),
            Asset(
                site_id=bh_site.id,
                asset_code="BHT-USW-003",
                category="switch",
                vendor="Ubiquiti",
                model="USW-24-PoE",
                serial_number="BHT-USW-003",
                mac_address="74:83:c2:77:88:99",
                physical_location="Rack Servidores Piso 1",
                owner_or_responsible="Infraestructura",
                status="in_use",
                source_system="inventory"
            ),
            Asset(
                site_id=bh_site.id,
                asset_code="BHT-UDM-004",
                category="gateway",
                vendor="Ubiquiti",
                model="UDM-Pro",
                serial_number="BHT-UDM-004",
                mac_address="74:83:c2:aa:bb:cc",
                physical_location="Rack Servidores Piso 1",
                owner_or_responsible="Infraestructura",
                status="in_use",
                source_system="inventory"
            )
        ]
        session.add_all(assets_seed)

        # Conector UniFi aislado con access_model explícito
        unifi_integ = ClientIntegration(
            organization_id=bh_org.id,
            provider="unifi",
            label="UniFi Site Manager / Controller Sede Central",
            access_model="mock", # "mock" para entorno de prueba; "local_controller" o "site_manager_cloud" en prod
            base_url="https://api.ui.com/mock-bh",
            auth_type="api_key",
            encrypted_secret=encrypt_secret("bh_unifi_pilot_key_12345"),
            site_identifier="default",
            health_status="unknown"
        )
        session.add(unifi_integ)

        # 2. Clientes adicionales
        other_clients = [
            ("OVA", "OVA", "Cliente Retail"),
            ("Sancha", "SAN", "Centro Médico"),
            ("Troncone", "TRON", "Distribuidora Industrial"),
            ("Belén", "BEL", "Colegio / Campus Educativo")
        ]
        for name, code, note in other_clients:
            org = Organization(name=name, code=code, status="active", notes=note)
            session.add(org)
            await session.flush()
            site = Site(organization_id=org.id, name=f"Sede Principal {name}")
            session.add(site)

        await session.commit()
        print("Base de datos inicializada con éxito!")

if __name__ == "__main__":
    asyncio.run(seed_data())
