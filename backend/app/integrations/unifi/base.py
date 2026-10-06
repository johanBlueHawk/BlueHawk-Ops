import re
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

def normalize_mac(mac: Optional[str]) -> Optional[str]:
    if not mac:
        return None
    cleaned = re.sub(r'[^a-fA-F0-9]', '', mac).lower()
    if len(cleaned) != 12:
        return mac.lower()
    return ':'.join(cleaned[i:i+2] for i in range(0, 12, 2))

class DiscoveredDevice:
    """Normalized payload extracted from a network vendor."""
    def __init__(
        self,
        external_id: str,
        name: str,
        device_type: str,
        platform: str,
        management_ip: Optional[str] = None,
        mac_address: Optional[str] = None,
        firmware: Optional[str] = None,
        status: str = "online",
        serial_number: Optional[str] = None,
        model: Optional[str] = None,
        parent_mac: Optional[str] = None,
        uplink_port: Optional[int] = None,
        metrics: Optional[Dict[str, Any]] = None
    ):
        self.external_id = str(external_id)
        self.name = name
        self.device_type = device_type
        self.platform = platform
        self.management_ip = management_ip
        self.mac_address = normalize_mac(mac_address)
        self.firmware = firmware
        self.status = status
        self.serial_number = serial_number
        self.model = model
        self.parent_mac = normalize_mac(parent_mac)
        self.uplink_port = uplink_port
        self.metrics = metrics or {}
        self.observed_at = datetime.now(timezone.utc)

class UniFiAdapter(ABC):
    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def fetch_devices(self) -> List[DiscoveredDevice]:
        pass
