import asyncio
import httpx
import pytest
from app.integrations.inventory.connector import BlueHawkInventoryConnector, InventoryConnectionError


@pytest.mark.parametrize("status, expected", [
    ("Activo", "in_use"), ("Asignado", "in_use"), ("Nuevo", "available"),
    ("En almacén", "available"), ("En reparación", "maintenance"),
    ("Dañado", "damaged"), ("Perdido", "lost"),
    ("Retirado", "decommissioned"), ("Desechado", "decommissioned"),
    ("Sin clasificar", "unknown"),
])
def test_inventory_status_is_preserved_semantically(status, expected):
    connector = BlueHawkInventoryConnector(token="test-token")
    asset = connector._normalize_asset({"id": 7, "internal_code": "BH-2026-0007", "status": status})
    assert asset["status"] == expected


def mock_http(monkeypatch, handler):
    original = httpx.AsyncClient
    monkeypatch.setattr(httpx, "AsyncClient", lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs))


def test_login_token_refresh_and_normalization(monkeypatch):
    login_count = 0
    def handler(request):
        nonlocal login_count
        if request.url.path.endswith("/auth/login"):
            login_count += 1
            return httpx.Response(200, json={"access_token": f"token-{login_count}"})
        if request.headers.get("Authorization") == "Bearer token-1":
            return httpx.Response(401)
        return httpx.Response(200, json=[{
            "id": 7, "internal_code": "BH-2026-0007", "brand": "Cisco", "model": "C9300-48P",
            "status": "Retirado", "mac_address": "24-5A-4C-99-88-77",
            "category": {"name": "Switches"}, "location": {"full_path": "Blue Hawk > Piso 1"},
        }])
    mock_http(monkeypatch, handler)
    connector = BlueHawkInventoryConnector(username="reader", password="test-only")
    assets = asyncio.run(connector.fetch_assets())
    assert login_count == 2
    assert assets[0]["status"] == "decommissioned"
    assert assets[0]["mac_address"] == "24:5a:4c:99:88:77"
    assert assets[0]["physical_location"] == "Blue Hawk > Piso 1"


def test_paginated_assets_are_deduplicated(monkeypatch):
    def handler(request):
        assert request.headers["Authorization"] == "Bearer test-token"
        skip = int(request.url.params["skip"])
        page = [{"id": n, "internal_code": f"BH-2026-{n:04d}", "status": "Activo"} for n in range(500)] if skip == 0 else [{"id": 499}, {"id": 500}]
        return httpx.Response(200, json=page)
    mock_http(monkeypatch, handler)
    assets = asyncio.run(BlueHawkInventoryConnector(token="test-token").fetch_assets())
    assert len(assets) == 501


def test_outage_is_not_an_empty_inventory(monkeypatch):
    mock_http(monkeypatch, lambda request: httpx.Response(503, text="Unavailable"))
    with pytest.raises(InventoryConnectionError):
        asyncio.run(BlueHawkInventoryConnector(token="test-token").fetch_assets())
