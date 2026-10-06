from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Organization Schemas ---
class OrganizationResponse(BaseModel):
    id: str
    name: str
    code: str
    status: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Integration & Runs Schemas ---
class IntegrationRunResponse(BaseModel):
    id: str
    integration_id: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    records_discovered: int
    records_processed: int
    discrepancies_detected: int
    error_summary: Optional[str] = None

    class Config:
        from_attributes = True

class IntegrationResponse(BaseModel):
    id: str
    organization_id: str
    provider: str
    label: str
    access_model: str
    base_url: str
    auth_type: str
    is_active: bool
    health_status: str
    last_sync_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Assets Schemas ---
class AssetResponse(BaseModel):
    id: str
    site_id: str
    asset_code: str
    category: str
    vendor: str
    model: Optional[str] = None
    serial_number: Optional[str] = None
    mac_address: Optional[str] = None
    physical_location: Optional[str] = None
    owner_or_responsible: Optional[str] = None
    status: str
    source_system: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Network Devices & Topology Schemas ---
class NetworkDeviceResponse(BaseModel):
    id: str
    site_id: str
    asset_id: Optional[str] = None
    platform: str
    external_id: str
    name: str
    device_type: str
    management_ip: Optional[str] = None
    mac_address: Optional[str] = None
    firmware: Optional[str] = None
    model: Optional[str] = None
    parent_mac: Optional[str] = None
    uplink_port: Optional[int] = None
    status: str
    source_run_id: Optional[str] = None
    observed_at: datetime
    synced_at: datetime
    freshness_status: str

    class Config:
        from_attributes = True

class TopologyNode(BaseModel):
    id: str
    name: str
    device_type: str
    ip: Optional[str] = None
    mac: Optional[str] = None
    model: Optional[str] = None
    firmware: Optional[str] = None
    status: str
    uplink_port: Optional[int] = None
    physical_location: Optional[str] = None
    asset_code: Optional[str] = None
    runbook_summary: Optional[str] = None
    isp_circuit: Optional[str] = None
    children: List["TopologyNode"] = []

class TopologyTreeResponse(BaseModel):
    site_id: str
    roots: List[TopologyNode]
    total_devices: int

# --- Discrepancies Schemas ---
class DiscrepancyResponse(BaseModel):
    id: str
    site_id: str
    asset_id: Optional[str] = None
    network_device_id: Optional[str] = None
    discrepancy_type: str
    status: str
    detected_at: datetime
    details_json: Optional[Dict[str, Any]] = None
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DiscrepancyResolveRequest(BaseModel):
    resolution_notes: str
    resolved_by: str
    status: str = "resolved"
