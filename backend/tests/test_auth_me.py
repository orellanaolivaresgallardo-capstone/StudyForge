# tests/test_auth_me.py
import types
from datetime import datetime, timezone
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app
from app.core.dependencies import get_current_user

def fake_user():
    # Emula un objeto User completo con todos los campos requeridos por UserDetailResponse
    return types.SimpleNamespace(
        id=uuid4(),
        email="fake@example.com",
        username="fakeuser",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        storage_quota_bytes=5368709120,  # 5GB default
        storage_used_bytes=0,
        max_documents_per_summary=5,
        max_file_size_bytes=104857600  # 100MB default
    )

def override_get_current_user():
    return fake_user()

def test_auth_me_ok():
    app.dependency_overrides[get_current_user] = override_get_current_user
    client = TestClient(app)

    resp = client.get("/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "fake@example.com"
    assert data["username"] == "fakeuser"
    assert data["is_active"] is True
    assert data["storage_quota_bytes"] == 5368709120

    app.dependency_overrides.clear()

def test_auth_me_unauthorized():
    # Sin override → debe pedir token (401 o 403 si el rate limiter intercepta primero)
    client = TestClient(app)
    resp = client.get("/auth/me")
    assert resp.status_code in [401, 403]
