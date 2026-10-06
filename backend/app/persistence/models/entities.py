import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import relationship
from app.persistence.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    status = Column(String(20), default="active")
    contact_name = Column(String(100), nullable=True)
    contact_email = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    sites = relationship("Site", back_populates="organization", cascade="all, delete-orphan")
    integrations = relationship("ClientIntegration", back_populates="organization", cascade="all, delete-orphan")


class Site(Base):
    __tablename__ = "sites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=True)
    timezone = Column(String(50), default="America/Santo_Domingo")
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    organization = relationship("Organization", back_populates="sites")
    assets = relationship("Asset", back_populates="site", cascade="all, delete-orphan")
    network_devices = relationship("NetworkDevice", back_populates="site", cascade="all, delete-orphan")
    discrepancies = relationship("Discrepancy", back_populates="site", cascade="all, delete-orphan")


class ClientIntegration(Base):
    __tablename__ = "client_integrations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)
    label = Column(String(100), nullable=False)
    access_model = Column(String(50), default="local_controller") 
    base_url = Column(String(255), nullable=False)
    auth_type = Column(String(30), default="api_key")
    encrypted_secret = Column(Text, nullable=False)
    username = Column(String(100), nullable=True)
    site_identifier = Column(String(100), default="default")
    is_active = Column(Boolean, default=True)
    health_status = Column(String(30), default="unknown")
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    organization = relationship("Organization", back_populates="integrations")
    network_devices = relationship("NetworkDevice", back_populates="integration")
    runs = relationship("IntegrationRun", back_populates="integration", cascade="all, delete-orphan")


class IntegrationRun(Base):
    __tablename__ = "integration_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    integration_id = Column(String(36), ForeignKey("client_integrations.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime(timezone=True), default=get_utc_now)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(30), default="running")
    records_discovered = Column(Integer, default=0)
    records_processed = Column(Integer, default=0)
    discrepancies_detected = Column(Integer, default=0)
    error_summary = Column(Text, nullable=True)

    integration = relationship("ClientIntegration", back_populates="runs")
    observations = relationship("DeviceObservation", back_populates="source_run")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    asset_code = Column(String(50), nullable=False, unique=True)
    category = Column(String(50), nullable=False)
    vendor = Column(String(50), nullable=False)
    model = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)
    mac_address = Column(String(50), nullable=True, index=True)
    physical_location = Column(String(100), nullable=True)
    owner_or_responsible = Column(String(100), nullable=True)
    status = Column(String(30), default="in_use")
    source_system = Column(String(50), default="manual")
    last_synced_from_inventory = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    site = relationship("Site", back_populates="assets")
    network_device = relationship("NetworkDevice", back_populates="asset", uselist=False)
    discrepancies = relationship("Discrepancy", back_populates="asset")


class NetworkDevice(Base):
    __tablename__ = "network_devices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    integration_id = Column(String(36), ForeignKey("client_integrations.id", ondelete="SET NULL"), nullable=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    
    platform = Column(String(50), default="unifi")
    external_id = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False)
    management_ip = Column(String(50), nullable=True)
    mac_address = Column(String(50), nullable=True, index=True)
    firmware = Column(String(50), nullable=True)
    model = Column(String(50), nullable=True)
    
    # Topology Tree Links
    parent_mac = Column(String(50), nullable=True)
    uplink_port = Column(Integer, nullable=True)
    
    status = Column(String(30), default="online")
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    source_platform = Column(String(50), default="unifi")
    source_run_id = Column(String(36), nullable=True)
    observed_at = Column(DateTime(timezone=True), default=get_utc_now)
    synced_at = Column(DateTime(timezone=True), default=get_utc_now)
    freshness_status = Column(String(20), default="fresh")

    site = relationship("Site", back_populates="network_devices")
    integration = relationship("ClientIntegration", back_populates="network_devices")
    asset = relationship("Asset", back_populates="network_device")
    observations = relationship("DeviceObservation", back_populates="network_device", cascade="all, delete-orphan")
    discrepancies = relationship("Discrepancy", back_populates="network_device")


class DeviceObservation(Base):
    __tablename__ = "device_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    network_device_id = Column(String(36), ForeignKey("network_devices.id", ondelete="CASCADE"), nullable=False)
    source_run_id = Column(String(36), ForeignKey("integration_runs.id", ondelete="CASCADE"), nullable=False)
    observed_at = Column(DateTime(timezone=True), default=get_utc_now)
    connectivity = Column(String(30), default="online")
    metrics_json = Column(JSON, nullable=True)

    network_device = relationship("NetworkDevice", back_populates="observations")
    source_run = relationship("IntegrationRun", back_populates="observations")


class Discrepancy(Base):
    __tablename__ = "asset_discrepancies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    network_device_id = Column(String(36), ForeignKey("network_devices.id", ondelete="SET NULL"), nullable=True)
    discrepancy_type = Column(String(50), nullable=False)
    status = Column(String(30), default="pending")
    detected_at = Column(DateTime(timezone=True), default=get_utc_now)
    details_json = Column(JSON, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    site = relationship("Site", back_populates="discrepancies")
    asset = relationship("Asset", back_populates="discrepancies")
    network_device = relationship("NetworkDevice", back_populates="discrepancies")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, default="operator")  # "operator", "technician", "admin"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
