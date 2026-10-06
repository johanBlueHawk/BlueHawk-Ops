import httpx
from typing import List, Dict, Any, Optional
from app.integrations.unifi.base import UniFiAdapter, DiscoveredDevice

class UniFiLocalAdapter(UniFiAdapter):
    def __init__(
        self,
        base_url: str,
        secret: str,
        username: Optional[str] = None,
        site: str = "default"
    ):
        self.base_url = base_url.rstrip("/")
        self.secret = secret
        self.username = username
        self.site = site

    async def test_connection(self) -> Dict[str, Any]:
        try:
            headers = {"X-API-KEY": self.secret, "Accept": "application/json"}
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                res = await client.get(
                    f"{self.base_url}/proxy/network/api/s/{self.site}/stat/device",
                    headers=headers
                )
                if res.status_code == 200:
                    data = res.json().get("data", [])
                    return {
                        "success": True,
                        "adapter": "local_controller_api_key",
                        "message": f"Conexión exitosa a consola UniFi OS local ({len(data)} dispositivos detectados)",
                        "devices_count": len(data)
                    }

                return {
                    "success": False,
                    "adapter": "local_controller",
                    "status_code": res.status_code,
                    "message": "Error de autenticación en consola local"
                }
        except Exception as e:
            return {"success": False, "adapter": "local_controller", "error": str(e)}

    async def fetch_devices(self) -> List[DiscoveredDevice]:
        devices: List[DiscoveredDevice] = []
        headers = {"X-API-KEY": self.secret, "Accept": "application/json"}
        
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            endpoint = f"{self.base_url}/proxy/network/api/s/{self.site}/stat/device"
            resp = await client.get(endpoint, headers=headers)
            
            if resp.status_code == 200:
                raw_list = resp.json().get("data", [])
                for d in raw_list:
                    raw_type = d.get("type", "")
                    dev_type = "ap" if raw_type == "uap" else ("switch" if raw_type == "usw" else ("gateway" if raw_type in ("udm", "ugw") else "other"))
                    state = "online" if d.get("state") == 1 else "offline"
                    uplink = d.get("uplink", {})
                    devices.append(DiscoveredDevice(
                        external_id=d.get("_id") or d.get("mac"),
                        name=d.get("name") or d.get("model") or "UniFi Device",
                        device_type=dev_type,
                        platform="unifi",
                        management_ip=d.get("ip"),
                        mac_address=d.get("mac"),
                        firmware=d.get("version"),
                        status=state,
                        serial_number=d.get("serial"),
                        model=d.get("model"),
                        parent_mac=uplink.get("uplink_mac"),
                        uplink_port=uplink.get("uplink_remote_port"),
                        metrics={
                            "clients_connected": d.get("num_sta", 0),
                            "uptime": d.get("uptime", 0),
                            "model": d.get("model"),
                            "rx_bytes": d.get("rx_bytes", 0),
                            "tx_bytes": d.get("tx_bytes", 0)
                        }
                    ))
        return devices


class UniFiCloudAdapter(UniFiAdapter):
    def __init__(self, api_key: str, site_id: Optional[str] = None):
        self.base_url = "https://api.ui.com"
        self.api_key = api_key
        self.site_id = site_id

    async def test_connection(self) -> Dict[str, Any]:
        try:
            headers = {"X-API-KEY": self.api_key, "Accept": "application/json"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.base_url}/ea/sites", headers=headers)
                if res.status_code in (200, 201):
                    return {"success": True, "adapter": "site_manager_cloud", "message": "Site Manager Cloud API conectado"}
                return {"success": False, "adapter": "site_manager_cloud", "status_code": res.status_code, "message": res.text}
        except Exception as e:
            return {"success": False, "adapter": "site_manager_cloud", "error": str(e)}

    async def fetch_devices(self) -> List[DiscoveredDevice]:
        return []


class UniFiMockAdapter(UniFiAdapter):
    def __init__(self, site: str = "default"):
        self.site = site

    async def test_connection(self) -> Dict[str, Any]:
        return {"success": True, "adapter": "mock_pilot", "message": "UniFi Simulator en línea"}

    async def fetch_devices(self) -> List[DiscoveredDevice]:
        return []
