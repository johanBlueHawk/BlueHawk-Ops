import os
import sqlite3
import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from app.integrations.unifi.base import normalize_mac
from app.core.config import settings

logger = logging.getLogger("bluehawk.integrations.inventory")


class InventoryError(Exception):
    """Excepción base para integraciones con BlueHawk Inventory."""
    pass


class InventoryAuthError(InventoryError):
    """Falla de autenticación o token expirado/rechazado en BlueHawk Inventory."""
    pass


class InventoryConnectionError(InventoryError):
    """Error de conexión de red o HTTP no satisfactorio con BlueHawk Inventory."""
    pass


class InventoryConfigurationError(InventoryError):
    """Configuración incompleta o credenciales faltantes para BlueHawk Inventory."""
    pass


class BlueHawkInventoryConnector:
    """
    Conector de producción con BlueHawk Inventory (Sistema de Control de Activos Tecnológicos).
    
    Capacidades:
    1. Autenticación Dinámica: Autentica vía POST /auth/login con username y password, 
       manteniendo el token en memoria con tiempo de vida (8 horas en producción).
    2. Manejo de 401 & Renovación Automática: Si una consulta falla con 401 Unauthorized, 
       invalida el token en memoria, repite el login y reintenta la consulta una vez.
    3. Paginación y Deduplicación: Itera en bloques (limit=500, skip=0, sort_by=date_asc) 
       y deduplica por 'id' para garantizar consistencia.
    4. Diagnóstico de Salud (Health Check): Endpoint /health sin autenticación para 
       validar disponibilidad y latencia del servicio.
    5. Normalización Determinista: Mapea categorías, ubicaciones completas (full_path), 
       direcciones MAC normalizadas y códigos de activos al esquema de Blue Hawk Ops.
    6. Seguridad Zero-Leakage: Nunca imprime contraseñas ni tokens en registros o logs.
    7. Fallback Local: Soporte para SQLite local si no hay credenciales de red (modo offline dev).
    """

    def __init__(
        self,
        api_url: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        token: Optional[str] = None,
        db_path: Optional[str] = None,
        timeout: float = 30.0,
    ):
        raw_url = (
            api_url
            or getattr(settings, "INVENTORY_API_URL", None)
            or os.getenv("INVENTORY_API_URL")
            or "https://inventory.bluehawktech.com/api/v1"
        )
        self.api_url = raw_url.rstrip("/")
        # Asegurar que apunte a /api/v1
        if not self.api_url.endswith("/api/v1") and not "/api/" in self.api_url:
            self.api_url = f"{self.api_url}/api/v1"

        self.username = (
            username
            or getattr(settings, "INVENTORY_USERNAME", None)
            or os.getenv("INVENTORY_USERNAME")
        )
        self.password = (
            password
            or getattr(settings, "INVENTORY_PASSWORD", None)
            or os.getenv("INVENTORY_PASSWORD")
        )
        self.static_token = (
            token
            or getattr(settings, "INVENTORY_API_TOKEN", None)
            or os.getenv("INVENTORY_API_TOKEN")
        )
        self.timeout = timeout

        # Token en memoria (duración 480 min = 8h en prod)
        self._cached_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None

        # Fallback local sqlite path
        self.db_path = (
            db_path
            or getattr(settings, "INVENTORY_DB_PATH", None)
            or os.getenv("INVENTORY_DB_PATH")
        )
        if not self.db_path:
            candidate_paths = [
                os.path.abspath(os.path.join(os.getcwd(), "..", "bluehawk-inventory", "backend", "bluehawk.db")),
                os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "bluehawk-inventory", "backend", "bluehawk.db")),
                r"C:\Users\johan\Documents\Blue Hawk\bluehawk-inventory\backend\bluehawk.db",
            ]
            for cp in candidate_paths:
                if cp and os.path.exists(cp):
                    self.db_path = cp
                    break

    async def check_health(self) -> Dict[str, Any]:
        """
        Verifica el estado de salud de BlueHawk Inventory (GET /health).
        No requiere autenticación.
        """
        url = f"{self.api_url}/health"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json()
                return {
                    "status": data.get("status", "healthy"),
                    "version": data.get("version"),
                    "api_url": self.api_url,
                    "connected": True,
                }
            except httpx.HTTPStatusError as e:
                logger.error(f"Health check a BlueHawk Inventory falló con código HTTP {e.response.status_code}")
                return {
                    "status": "error",
                    "code": e.response.status_code,
                    "api_url": self.api_url,
                    "connected": False,
                    "detail": f"HTTP {e.response.status_code}",
                }
            except Exception as e:
                logger.error(f"No fue posible conectar con BlueHawk Inventory en /health: {str(e)}")
                return {
                    "status": "unreachable",
                    "api_url": self.api_url,
                    "connected": False,
                    "detail": str(e),
                }

    async def _get_access_token(self, force_refresh: bool = False) -> str:
        """
        Obtiene un token de acceso válido.
        Reutiliza el token de memoria si no ha expirado, o realiza login dinámico vía POST /auth/login.
        """
        # Si se especificó un token estático manual, tiene prioridad
        if self.static_token:
            return self.static_token

        # Comprobar token en memoria
        now = datetime.now(timezone.utc)
        if not force_refresh and self._cached_token and self._token_expires_at:
            if now < self._token_expires_at:
                return self._cached_token

        # Validar presencia de credenciales para login
        if not self.username or not self.password:
            raise InventoryConfigurationError(
                "Faltan las credenciales para conectar con BlueHawk Inventory. "
                "Configure INVENTORY_USERNAME y INVENTORY_PASSWORD (o INVENTORY_API_TOKEN) en el backend de Ops."
            )

        login_url = f"{self.api_url}/auth/login"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.post(
                    login_url,
                    json={
                        "username": self.username,
                        "password": self.password,
                    },
                    headers={"Content-Type": "application/json"},
                )
            except httpx.RequestError as exc:
                raise InventoryConnectionError(
                    f"Falla de red al intentar autenticar con BlueHawk Inventory en {self.api_url}: {str(exc)}"
                )

            if resp.status_code in (401, 403):
                raise InventoryAuthError(
                    f"Credenciales no válidas para BlueHawk Inventory (usuario: '{self.username}'). "
                    "Verifique el usuario y la contraseña configurados."
                )
            elif resp.status_code != 200:
                raise InventoryConnectionError(
                    f"Error de autenticación en BlueHawk Inventory: HTTP {resp.status_code} - {resp.text}"
                )

            data = resp.json()
            access_token = data.get("access_token")
            if not access_token:
                raise InventoryAuthError(
                    "La respuesta de login de BlueHawk Inventory no incluyó el campo 'access_token'."
                )

            # La duración en producción es 480 minutos (8h). Guardamos con margen de seguridad (7h 45m).
            self._cached_token = access_token
            self._token_expires_at = now + timedelta(minutes=465)
            logger.info("Token de sesión para BlueHawk Inventory obtenido y guardado en memoria.")
            return access_token

    async def fetch_assets(self) -> List[Dict[str, Any]]:
        """
        Extrae y normaliza los activos de BlueHawk Inventory.
        
        Flujo de conexión:
        1. Intenta consulta remota HTTPS vía API REST.
        2. Si no hay credenciales configuradas y existe una base de datos SQLite local,
           usa fallback local de desarrollo.
        3. Si la conexión falla con error HTTP o de red, lanza la excepción correspondiente
           para evitar corromper o vaciar el inventario de Ops.
        """
        # Si hay credenciales de API o token estático configurado
        if (self.username and self.password) or self.static_token:
            return await self._fetch_from_api()

        # Si no hay credenciales de API configuradas, comprobar fallback local de desarrollo
        if self.db_path and os.path.exists(self.db_path):
            logger.info(f"Sin credenciales de API activas. Utilizando base SQLite local como fallback: {self.db_path}")
            return self._fetch_from_sqlite()

        # Si ni la API ni el SQLite local están disponibles, alertar con instrucciones claras
        raise InventoryConfigurationError(
            "No se han configurado credenciales para BlueHawk Inventory. "
            "Configure INVENTORY_USERNAME y INVENTORY_PASSWORD en las variables de entorno de Ops "
            "con un usuario de rol 'Consulta'."
        )

    async def _fetch_from_api(self) -> List[Dict[str, Any]]:
        """
        Consulta la API REST de BlueHawk Inventory con paginación y manejo de reintento en caso de 401.
        """
        token = await self._get_access_token(force_refresh=False)
        assets_url = f"{self.api_url}/assets/"

        limit = 500
        skip = 0
        all_raw_assets: List[Dict[str, Any]] = []
        seen_ids = set()

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            while True:
                headers = {"Authorization": f"Bearer {token}"}
                params = {"skip": skip, "limit": limit, "sort_by": "date_asc"}

                try:
                    resp = await client.get(assets_url, headers=headers, params=params)
                except httpx.RequestError as exc:
                    raise InventoryConnectionError(
                        f"Falla de comunicación al consultar activos de Inventory: {str(exc)}"
                    )

                # Si recibimos 401 Unauthorized y usamos usuario/contraseña, intentamos reautenticar una sola vez
                if resp.status_code == 401 and not self.static_token:
                    logger.warning("Token expirado o rechazado por Inventory (401). Renovando token...")
                    token = await self._get_access_token(force_refresh=True)
                    headers = {"Authorization": f"Bearer {token}"}
                    try:
                        resp = await client.get(assets_url, headers=headers, params=params)
                    except httpx.RequestError as exc:
                        raise InventoryConnectionError(
                            f"Falla de comunicación al reintentar consulta de activos: {str(exc)}"
                        )

                if resp.status_code == 401:
                    raise InventoryAuthError(
                        "Acceso no autorizado a BlueHawk Inventory (401). "
                        "El usuario no tiene permisos suficientes o la sesión expiró."
                    )
                elif resp.status_code != 200:
                    raise InventoryConnectionError(
                        f"Respuesta inesperada de BlueHawk Inventory: HTTP {resp.status_code} - {resp.text}"
                    )

                page = resp.json()
                if not isinstance(page, list):
                    raise InventoryConnectionError(
                        f"Formato no compatible devuelto por Inventory: se esperaba una lista JSON, se recibió {type(page).__name__}."
                    )

                # Deduplicar por id
                for item in page:
                    item_id = item.get("id")
                    if item_id is not None:
                        if item_id in seen_ids:
                            continue
                        seen_ids.add(item_id)
                    all_raw_assets.append(item)

                # Condición de fin de paginación
                if len(page) < limit:
                    break
                skip += limit

        logger.info(f"Sincronizados {len(all_raw_assets)} activos desde la API REST de BlueHawk Inventory.")
        return [self._normalize_asset(item) for item in all_raw_assets]

    def _normalize_asset(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Transforma un registro de activo de BlueHawk Inventory al modelo normalizado de Blue Hawk Ops."""
        internal_code = item.get("internal_code")
        if not internal_code and item.get("id") is not None:
            internal_code = f"BH-INV-{item['id']}"

        mac = item.get("mac_address")
        norm_mac = normalize_mac(mac) if mac else None

        loc = item.get("location")
        loc_path = loc.get("full_path") if isinstance(loc, dict) else str(loc or "Sede Principal")

        cat = item.get("category")
        cat_name = cat.get("name") if isinstance(cat, dict) else str(cat or "Equipos")

        raw_status = str(item.get("status") or "in_use")
        status_map = {
            "Activo": "in_use",
            "En Uso": "in_use",
            "in_use": "in_use",
            "En Préstamo": "in_use",
            "Mantenimiento": "maintenance",
            "Baja": "decommissioned",
            "Disponible": "available",
        }
        norm_status = status_map.get(raw_status, "in_use")

        return {
            "inventory_id": item.get("id"),
            "asset_code": internal_code,
            "name": item.get("name") or internal_code or "Activo Sin Nombre",
            "vendor": item.get("brand") or "Generico",
            "model": item.get("model") or "",
            "serial_number": item.get("serial_number"),
            "mac_address": norm_mac,
            "category": cat_name,
            "physical_location": loc_path,
            "owner_or_responsible": item.get("assigned_to"),
            "status": norm_status,
            "source_system": "bluehawk_inventory",
            "description": item.get("description"),
            "purchase_date": item.get("purchase_date"),
            "warranty_expiry": item.get("warranty_expiry"),
        }

    def _fetch_from_sqlite(self) -> List[Dict[str, Any]]:
        """Extrae activos desde la base SQLite local en entornos de prueba o desarrollo desconectado."""
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
                a.status,
                a.id
            FROM assets a
            LEFT JOIN categories c ON a.category_id = c.id
            LEFT JOIN locations l ON a.location_id = l.id
        """
        cur.execute(query)
        rows = cur.fetchall()
        conn.close()

        assets = []
        for r in rows:
            code, name, brand, model, serial, mac, cat_name, loc_path, assigned, status, item_id = r
            norm_mac = normalize_mac(mac) if mac else None
            assets.append({
                "inventory_id": item_id,
                "asset_code": code or f"BH-INV-{item_id}",
                "name": name or code or "Activo",
                "vendor": brand or "Generico",
                "model": model or "",
                "serial_number": serial,
                "mac_address": norm_mac,
                "category": cat_name or "Equipos",
                "physical_location": loc_path or "Sede Principal",
                "owner_or_responsible": assigned,
                "status": status or "in_use",
                "source_system": "bluehawk_inventory",
            })
        return assets

    async def get_asset_by_code(self, internal_code: str) -> Optional[Dict[str, Any]]:
        """Busca un activo específico por su código interno (e.g. BH-2026-0001)."""
        token = await self._get_access_token()
        url = f"{self.api_url}/assets/code/{internal_code}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return self._normalize_asset(resp.json())

    async def check_serial_exists(self, serial_number: str) -> bool:
        """Verifica si un número de serie existe en el inventario."""
        token = await self._get_access_token()
        url = f"{self.api_url}/assets/check-serial/{serial_number}"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
            if resp.status_code == 200:
                data = resp.json()
                return data.get("exists", False)
            return False
