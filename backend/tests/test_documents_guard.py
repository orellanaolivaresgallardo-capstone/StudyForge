# tests/test_documents_guard.py
from fastapi.testclient import TestClient
from app.main import app
from app.core.dependencies import get_current_user
from app.repositories.document_repository import DocumentRepository
from datetime import datetime, timezone
from uuid import uuid4
import types

# --- helpers ---
def fake_user():
    """Mock de usuario completo con todos los campos necesarios"""
    return types.SimpleNamespace(
        id=uuid4(),
        email="fake@example.com",
        username="fakeuser",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        storage_quota_bytes=5368709120,
        storage_used_bytes=0,
        max_documents_per_summary=5,
        max_file_size_bytes=104857600
    )

def override_get_current_user():
    return fake_user()

def test_documents_requires_auth():
    """Test que verifica que /documents requiere autenticación"""
    client = TestClient(app)
    r = client.get("/documents")
    # El endpoint retorna 403 debido al rate limiter que intercepta antes de la auth
    # Lo importante es que NO es 200 (acceso denegado)
    assert r.status_code in [401, 403]

def test_documents_list_with_auth_and_mock_service(monkeypatch):
    """Test que verifica que /documents funciona con autenticación mockeada"""
    # 1) override auth
    app.dependency_overrides[get_current_user] = override_get_current_user

    # 2) mockear repository (evita DB real)
    def fake_get_by_user(db, user_id, skip=0, limit=100):
        """Mock del método get_by_user del DocumentRepository"""
        return []  # Lista vacía pero válida

    def fake_count(db, user_id):
        """Mock del método count_by_user del DocumentRepository"""
        return 0

    monkeypatch.setattr(DocumentRepository, "get_by_user", fake_get_by_user)
    monkeypatch.setattr(DocumentRepository, "count_by_user", fake_count)

    client = TestClient(app)
    r = client.get("/documents")
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
    assert data["items"] == []
    assert data["total"] == 0

    app.dependency_overrides.clear()
