# tests/test_auth_me.py
import types
from fastapi.testclient import TestClient
from app.main import app
from app.core.dependencies import get_current_user

def fake_user():
    # emula un objeto con las attrs mínimas
    return types.SimpleNamespace(id=123, email="fake@example.com", created_at=None)

def override_get_current_user():
    return fake_user()

def test_auth_me_ok():
    app.dependency_overrides[get_current_user] = override_get_current_user
    client = TestClient(app)

    resp = client.get("/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == 123
    assert data["email"] == "fake@example.com"

    app.dependency_overrides.clear()

def test_auth_me_unauthorized():
    # Sin override → debe pedir token (401)
    client = TestClient(app)
    resp = client.get("/auth/me")
    assert resp.status_code == 401
