from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime, timezone

class DiscoveredDevice:
    """Normalized device or virtual machine representation from any vendor."""
    def __init__(
        self,
        external_id: str,
        name: str,
        device_type: str,
        provider: str,
        ip_address: str = None,
        mac_address: str = None,
        firmware_version: str = None,
        status: str = "online",
        telemetry: Dict[str, Any] = None
    ):
        self.external_id = external_id
        self.name = name
        self.device_type = device_type
        self.provider = provider
        self.ip_address = ip_address
        self.mac_address = mac_address.lower() if mac_address else None
        self.firmware_version = firmware_version
        self.status = status
        self.telemetry = telemetry or {}
        self.observed_at = datetime.now(timezone.utc)

class BaseConnector(ABC):
    """Abstract interface for all Blue Hawk Ops vendor connectors (Read-Only)."""
    
    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Verify reachability and authentication without writing anything."""
        pass

    @abstractmethod
    async def fetch_devices(self) -> List[DiscoveredDevice]:
        """Fetch all devices/VMs/nodes for the target site."""
        pass
