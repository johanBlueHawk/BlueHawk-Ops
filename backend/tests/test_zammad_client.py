import asyncio
import httpx
from app.integrations.zammad.client import ZammadClient

def test_zammad_token_auth_header():
    client = ZammadClient(api_token="test_token_123")
    headers, auth = client._get_auth_params()
    assert headers["Authorization"] == "Token token=test_token_123"
    assert auth is None

def test_zammad_basic_auth_fallback():
    client = ZammadClient(api_token="", username="johan@bluehawktech.com", password="password123")
    headers, auth = client._get_auth_params()
    assert "Authorization" not in headers
    assert isinstance(auth, httpx.BasicAuth)

def test_zammad_ticket_simulation_on_offline():
    client = ZammadClient(api_token="demo_token")
    ticket = asyncio.run(client.create_ticket(
        title="Test Incident",
        body="Test Body",
        group="Users"
    ))
    assert ticket["mode"] == "simulated"
    assert ticket["group"] == "Users"
    assert "ticket_number" in ticket

if __name__ == "__main__":
    test_zammad_token_auth_header()
    test_zammad_basic_auth_fallback()
    test_zammad_ticket_simulation_on_offline()
    print("All Zammad unit tests passed!")
