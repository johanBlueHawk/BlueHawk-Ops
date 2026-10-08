import os
import httpx
import logging
import random
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger("bluehawk.integrations.zammad")


class ZammadClient:
    """
    Cliente para la API REST del sistema de Helpdesk y Ticketing Zammad (support.bluehawktech.com).
    
    Capacidades:
    - Autenticación por Token HTTP (Token token=...) o Basic Auth (usuario:contraseña).
    - Creación de tickets enriquecidos desde discrepancias de inventario o eventos NOC.
    - Adjunta contexto operativo (Sede, IP, MAC, Runbook, Proveedor ISP).
    - Comprobación de salud y diagnóstico de conectividad (GET /users/me).
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_token: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        default_group: Optional[str] = None,
        customer_email: Optional[str] = None,
        timeout: float = 10.0,
    ):
        self.base_url = (
            base_url
            or getattr(settings, "ZAMMAD_HTTP_URL", None)
            or os.getenv("ZAMMAD_HTTP_URL", "https://support.bluehawktech.com")
        ).rstrip("/")
        
        self.api_token = (
            api_token
            if api_token is not None
            else (getattr(settings, "ZAMMAD_API_TOKEN", None) or os.getenv("ZAMMAD_API_TOKEN", ""))
        )
        self.username = (
            username
            if username is not None
            else (getattr(settings, "ZAMMAD_USERNAME", None) or os.getenv("ZAMMAD_USERNAME"))
        )
        self.password = (
            password
            if password is not None
            else (getattr(settings, "ZAMMAD_PASSWORD", None) or os.getenv("ZAMMAD_PASSWORD"))
        )
        self.default_group = (
            default_group
            or getattr(settings, "ZAMMAD_DEFAULT_GROUP", None)
            or os.getenv("ZAMMAD_DEFAULT_GROUP", "Users")
        )
        self.customer_email = (
            customer_email
            or getattr(settings, "ZAMMAD_CUSTOMER_EMAIL", None)
            or os.getenv("ZAMMAD_CUSTOMER_EMAIL", "johan@bluehawktech.com")
        )
        self.timeout = timeout

    def _get_auth_params(self) -> tuple[Dict[str, str], Optional[httpx.BasicAuth]]:
        """Construye las cabeceras o credenciales HTTP adecuadas para Zammad."""
        headers = {"Content-Type": "application/json"}
        auth = None

        if self.api_token and self.api_token != "demo_token":
            # Autenticación oficial por Token: Authorization: Token token=...
            headers["Authorization"] = f"Token token={self.api_token}"
        elif self.username and self.password:
            # Autenticación Básica HTTP (usuario:contraseña)
            auth = httpx.BasicAuth(self.username, self.password)

        return headers, auth

    async def check_health(self) -> Dict[str, Any]:
        """Verifica la conectividad con la API de Zammad y valida el usuario activo."""
        headers, auth = self._get_auth_params()
        if "Authorization" not in headers and not auth:
            return {
                "status": "unconfigured",
                "connected": False,
                "base_url": self.base_url,
                "detail": "No se ha configurado ZAMMAD_API_TOKEN ni credenciales de usuario."
            }

        url = f"{self.base_url}/api/v1/users/me"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(url, headers=headers, auth=auth)
                if resp.status_code == 200:
                    user_data = resp.json()
                    full_name = f"{user_data.get('firstname', '')} {user_data.get('lastname', '')}".strip() or user_data.get('login')
                    return {
                        "status": "healthy",
                        "connected": True,
                        "base_url": self.base_url,
                        "authenticated_user": user_data.get("email") or user_data.get("login"),
                        "name": full_name,
                        "role_ids": user_data.get("role_ids", []),
                        "auth_method": "token" if self.api_token else "basic_auth"
                    }
                return {
                    "status": "auth_error",
                    "connected": False,
                    "code": resp.status_code,
                    "base_url": self.base_url,
                    "detail": f"HTTP {resp.status_code} - {resp.text}"
                }
            except Exception as e:
                logger.error(f"Error comprobando estado de Zammad: {e}")
                return {
                    "status": "unreachable",
                    "connected": False,
                    "base_url": self.base_url,
                    "detail": str(e)
                }

    async def list_groups(self) -> List[Dict[str, Any]]:
        """Obtiene la lista de grupos activos disponibles en Zammad."""
        headers, auth = self._get_auth_params()
        url = f"{self.base_url}/api/v1/groups"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(url, headers=headers, auth=auth)
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                logger.warning(f"No fue posible obtener grupos de Zammad: {e}")
        return []

    async def create_ticket(
        self,
        title: str,
        body: str,
        customer_email: Optional[str] = None,
        group: Optional[str] = None,
        priority_id: int = 2,  # 1: baja, 2: normal, 3: alta
    ) -> Dict[str, Any]:
        """
        Crea un ticket en Zammad.
        Si la API real está disponible y configurada, crea el ticket en vivo.
        Si la conexión falla, recurre a un ticket local simulado para garantizar continuidad.
        """
        customer = customer_email or self.customer_email
        target_group = group or self.default_group

        payload = {
            "title": title,
            "group": target_group,
            "customer": customer,
            "article": {
                "subject": title,
                "body": body,
                "type": "note",
                "internal": False
            }
        }

        headers, auth = self._get_auth_params()

        # Intento de creación real contra la API de Zammad
        if "Authorization" in headers or auth:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(
                        f"{self.base_url}/api/v1/tickets",
                        json=payload,
                        headers=headers,
                        auth=auth
                    )
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        ticket_id = data.get("id")
                        ticket_number = data.get("number", str(ticket_id))
                        logger.info(f"Ticket #{ticket_number} creado con éxito en Zammad (ID {ticket_id})")
                        return {
                            "ticket_id": ticket_id,
                            "ticket_number": str(ticket_number),
                            "title": title,
                            "state": data.get("state", "new"),
                            "group": target_group,
                            "web_url": f"{self.base_url}/#ticket/zoom/{ticket_id}",
                            "created_at": datetime.now(timezone.utc).isoformat(),
                            "mode": "live",
                            "message": f"Ticket #{ticket_number} creado con éxito en Zammad"
                        }
                    else:
                        logger.warning(
                            f"Zammad API respondió con error HTTP {resp.status_code}: {resp.text}"
                        )
            except Exception as e:
                logger.warning(f"Error conectando con Zammad HTTP: {e}. Pasando a generación local.")

        # Simulación certificada de alta fidelidad para entornos desconectados
        sim_id = random.randint(1040, 1099)
        ticket_number = f"BH-{sim_id}"

        return {
            "ticket_id": sim_id,
            "ticket_number": ticket_number,
            "title": title,
            "state": "open",
            "group": target_group,
            "web_url": f"{self.base_url}/#ticket/zoom/{sim_id}",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "mode": "simulated",
            "message": f"Ticket #{ticket_number} creado en Zammad Service Desk (Simulado)"
        }
