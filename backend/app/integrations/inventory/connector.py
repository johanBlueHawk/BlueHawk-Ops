import os
import sqlite3
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.integrations.unifi.base import normalize_mac

class BlueHawkInventoryConnector:
    """
    Conector con BlueHawk Inventory (Sistema de Control de Activos Tecnológicos).
    Soporta:
    1. API REST HTTP (para despliegues con Docker o servidores separados).
    2. Conexión directa a SQLite/BD (para entornos locales o servidor compartido).
    """

    def __init__(self, api_url: Optional[str] = None, token: Optional[str] = None, db_path: Optional[str] = None):
        self.api_url = api_url or os.getenv("INVENTORY_API_URL")
        self.token = token or os.getenv("INVENTORY_API_TOKEN")
        
        candidate_paths = [
            os.getenv("INVENTORY_DB_PATH"),
            os.path.abspath(os.path.join(os.getcwd(), "..", "bluehawk-inventory", "backend", "bluehawk.db")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "bluehawk-inventory", "backend", "bluehawk.db")),
            r"C:\Users\johan\Documents\Blue Hawk\bluehawk-inventory\backend\bluehawk.db",
        ]
        self.db_path = None
        for cp in candidate_paths:
            if cp and os.path.exists(cp):
                self.db_path = cp
                break

    async def fetch_assets(self) -> List[Dict[str, Any]]:
        """Extrae los activos físicos normalizados de BlueHawk Inventory."""
        if self.api_url:
            try:
                return await self._fetch_from_api()
            except Exception as e:
                if self.db_path and os.path.exists(self.db_path):
                    return self._fetch_from_sqlite()
                raise e
        
        if self.db_path and os.path.exists(self.db_path):
            return self._fetch_from_sqlite()
        
        raise FileNotFoundError("No se encontró la base de datos de BlueHawk Inventory (bluehawk.db) ni se configuró INVENTORY_API_URL.")

    async def _fetch_from_api(self) -> List[Dict[str, Any]]:
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        base = self.api_url.rstrip('/')
        if not base.endswith("/api/v1"):
            base = f"{base}/api/v1"
        url = f"{base}/assets/?limit=500"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            
            assets = []
            for item in data:
                mac = item.get("mac_address")
                norm_mac = normalize_mac(mac) if mac else None
                loc = item.get("location")
                loc_path = loc.get("full_path") if isinstance(loc, dict) else str(loc or "Sede Principal")
                cat = item.get("category")
                cat_name = cat.get("name") if isinstance(cat, dict) else str(cat or "Equipos")
                
                assets.append({
                    "asset_code": item.get("internal_code"),
                    "name": item.get("name"),
                    "vendor": item.get("brand") or "Generico",
                    "model": item.get("model") or "",
                    "serial_number": item.get("serial_number"),
                    "mac_address": norm_mac,
                    "category": cat_name,
                    "physical_location": loc_path,
                    "owner_or_responsible": item.get("assigned_to"),
                    "status": item.get("status", "in_use"),
                    "source_system": "bluehawk_inventory"
                })
            return assets

    def _fetch_from_sqlite(self) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        query = """
            SELECT 
                a.internal_code,
                a.name,
                a.brand,
                a.model,
                a.serial_number,
                a.mac_address,
                c.name as category_name,
                l.full_path as location_path,
                a.assigned_to,
                a.status
            FROM assets a
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN locations l ON a.location_id = l.id
        """
        cur.execute(query)
        rows = cur.fetchall()
        conn.close()

        assets = []
        for r in rows:
            code, name, brand, model, serial, mac, cat_name, loc_path, assigned, status = r
            norm_mac = normalize_mac(mac) if mac else None
            assets.append({
                "asset_code": code,
                "name": name,
                "vendor": brand or "Generico",
                "model": model or "",
                "serial_number": serial,
                "mac_address": norm_mac,
                "category": cat_name or "Equipos",
                "physical_location": loc_path or "Sede Principal",
                "owner_or_responsible": assigned,
                "status": status or "in_use",
                "source_system": "bluehawk_inventory"
            })
        return assets
