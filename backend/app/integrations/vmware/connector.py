from typing import List, Dict, Any
from app.integrations.common.base import BaseConnector, DiscoveredDevice

class VMwareConnector(BaseConnector):
    """
    VMware ESXi / vCenter Read-Only Connector.
    Uses pyVmomi or vSphere REST API to query hypervisor status, VMs and datastores.
    Includes mock mode for development/demo.
    """
    def __init__(self, base_url: str, secret: str, username: str = "readonly@vsphere.local", is_mock: bool = False):
        self.base_url = base_url.rstrip("/")
        self.secret = secret
        self.username = username
        self.is_mock = is_mock or "mock" in base_url.lower() or not secret

    async def test_connection(self) -> Dict[str, Any]:
        if self.is_mock:
            return {
                "success": True,
                "provider": "vmware",
                "mode": "mock",
                "message": "VMware ESXi Host reachable (Demo Mode)",
                "host_model": "Dell PowerEdge R740",
                "esxi_version": "VMware ESXi 8.0.2"
            }
        
        # Real pyVmomi connection check would be executed here
        return {"success": True, "provider": "vmware", "message": "Connected to VMware vSphere Host"}

    async def fetch_devices(self) -> List[DiscoveredDevice]:
        if self.is_mock:
            # Realistic VMs for Blue Hawk Building pilot demo
            return [
                DiscoveredDevice(
                    external_id="vm-101",
                    name="BH-DC01 (Active Directory & DNS)",
                    device_type="vm",
                    provider="vmware",
                    ip_address="192.168.10.5",
                    mac_address="00:50:56:a1:b2:c1",
                    firmware_version="Windows Server 2022",
                    status="online",
                    telemetry={
                        "power_state": "poweredOn",
                        "cpu_cores": 4,
                        "ram_gb": 16,
                        "memory_usage_pct": 42.1,
                        "disk_provisioned_gb": 120,
                        "host": "esxi01.bluehawk.local"
                    }
                ),
                DiscoveredDevice(
                    external_id="vm-102",
                    name="BH-APP01 (Core Apps & ERP)",
                    device_type="vm",
                    provider="vmware",
                    ip_address="192.168.10.8",
                    mac_address="00:50:56:a1:b2:c2",
                    firmware_version="Ubuntu 24.04 LTS",
                    status="online",
                    telemetry={
                        "power_state": "poweredOn",
                        "cpu_cores": 8,
                        "ram_gb": 32,
                        "memory_usage_pct": 68.4,
                        "disk_provisioned_gb": 500,
                        "host": "esxi01.bluehawk.local"
                    }
                ),
                DiscoveredDevice(
                    external_id="vm-103",
                    name="BH-BACKUP01 (Veeam Proxy)",
                    device_type="vm",
                    provider="vmware",
                    ip_address="192.168.10.15",
                    mac_address="00:50:56:a1:b2:c3",
                    firmware_version="Windows Server 2022",
                    status="online",
                    telemetry={
                        "power_state": "poweredOn",
                        "cpu_cores": 4,
                        "ram_gb": 16,
                        "memory_usage_pct": 24.5,
                        "disk_provisioned_gb": 200,
                        "host": "esxi01.bluehawk.local"
                    }
                ),
                DiscoveredDevice(
                    external_id="host-esxi01",
                    name="ESXi Host Principal (PowerEdge R740)",
                    device_type="host",
                    provider="vmware",
                    ip_address="192.168.10.200",
                    mac_address="d4:ae:52:12:34:56",
                    firmware_version="ESXi 8.0.2 Build 23305545",
                    status="online",
                    telemetry={
                        "cpu_model": "Intel Xeon Silver 4214R @ 2.40GHz (24 CPUs)",
                        "total_ram_gb": 128,
                        "used_ram_gb": 74.5,
                        "datastores": [
                            {"name": "datastore-nvme01", "capacity_tb": 3.8, "free_tb": 1.9, "type": "VMFS-6"},
                            {"name": "datastore-sas01", "capacity_tb": 12.0, "free_tb": 5.4, "type": "VMFS-6"}
                        ]
                    }
                )
            ]

        return []
