# tests/test_documents_guard.py
from fastapi.testclient import TestClient
from app.main import app
from app.core.deps import get_current_user
from app.services.document_service import DocumentService
import types

# --- helpers ---
def fake_user():
    return types.SimpleNamespace(id=1, email="fake@example.com")

def override_get_current_user():
    return fake_user()

def test_documents_requires_auth():
    client = TestClient(app)
    r = client.get("/documents")
    assert r.status_code == 401  # sin token ni override

def test_documents_list_with_auth_and_mock_service(monkeypatch):
    # 1) override auth
    app.dependency_overrides[get_current_user] = override_get_current_user

    # 2) mockear servicio (evita DB real)
    def fake_list(self, db, owner_id: int):
        assert owner_id == 1
        return {"items": [{"id": 10, "title": "demo", "description": None}]}

    monkeypatch.setattr(DocumentService, "list", fake_list)

    client = TestClient(app)
    r = client.get("/documents", headers={"Authorization": "Bearer fake"})
    assert r.status_code == 200
    assert r.json() == {"items": [{"id": 10, "title": "demo", "description": None}]}

    app.dependency_overrides.clear()
