from typing import Optional
from app.integrations.unifi.base import UniFiAdapter
from app.integrations.unifi.adapters import UniFiLocalAdapter, UniFiCloudAdapter, UniFiMockAdapter

class UniFiConnector:
    """
    Vendor Connector for UniFi.
    Dispatches to the correct underlying adapter based on access_model.
    """
    def __init__(
        self,
        access_model: str, # "local_controller", "site_manager_cloud", "mock"
        base_url: str,
        secret: str,
        username: Optional[str] = None,
        site: str = "default"
    ):
        self.access_model = access_model.lower()
        if "mock" in self.access_model or "mock" in base_url.lower() or not secret:
            self.adapter: UniFiAdapter = UniFiMockAdapter(site=site)
        elif self.access_model == "site_manager_cloud":
            self.adapter: UniFiAdapter = UniFiCloudAdapter(api_key=secret, site_id=site)
        else:
            # Default to local controller
            self.adapter: UniFiAdapter = UniFiLocalAdapter(
                base_url=base_url,
                secret=secret,
                username=username,
                site=site
            )

    async def test_connection(self):
        return await self.adapter.test_connection()

    async def fetch_devices(self):
        return await self.adapter.fetch_devices()
