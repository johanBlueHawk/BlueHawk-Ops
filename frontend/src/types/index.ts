export interface Organization {
  id: string;
  name: string;
  code: string;
  status: string;
  contact_name?: string;
  contact_email?: string;
  notes?: string;
}

export interface ClientIntegration {
  id: string;
  organization_id: string;
  provider: "unifi" | "vmware" | "synology" | "fortigate";
  label: string;
  access_model: string;
  base_url: string;
  auth_type: string;
  is_active: boolean;
  health_status: "healthy" | "warning" | "down" | "unknown";
  last_sync_at?: string;
}

export interface Asset {
  id: string;
  site_id: string;
  asset_code: string;
  category: string;
  vendor: string;
  model?: string;
  serial_number?: string;
  mac_address?: string;
  physical_location?: string;
  owner_or_responsible?: string;
  status: string;
  source_system: string;
  created_at: string;
}

export interface NetworkDevice {
  id: string;
  site_id: string;
  asset_id?: string;
  platform: string;
  external_id: string;
  name: string;
  device_type: "ap" | "switch" | "gateway" | "vm" | "host" | "other";
  management_ip?: string;
  mac_address?: string;
  firmware?: string;
  model?: string;
  status: "online" | "offline" | "warning";
  freshness_status: "fresh" | "delayed" | "stale";
  observed_at: string;
  synced_at: string;
}

export interface TopologyNode {
  id: string;
  name: string;
  device_type: string;
  ip?: string;
  mac?: string;
  model?: string;
  firmware?: string;
  status: string;
  uplink_port?: number;
  physical_location?: string;
  asset_code?: string;
  runbook_summary?: string;
  isp_circuit?: string;
  children: TopologyNode[];
}

export interface TopologyTreeResponse {
  site_id: string;
  roots: TopologyNode[];
  total_devices: number;
}

export interface Discrepancy {
  id: string;
  site_id: string;
  asset_id?: string;
  network_device_id?: string;
  discrepancy_type: "uncataloged_device" | "missing_from_network" | "attribute_mismatch";
  status: "pending" | "resolved" | "ignored";
  detected_at: string;
  details_json?: Record<string, any>;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
}

export type UserRole = "operator" | "technician" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}
