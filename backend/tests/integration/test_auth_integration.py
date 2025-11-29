"""
Tests de integración E2E para flujo de autenticación.
Verifica el flujo completo: Registro → Login → Perfil → Logout
"""
import pytest
from fastapi.testclient import TestClient


class TestAuthenticationFlow:
    """Suite de tests para flujo completo de autenticación"""

    def test_complete_auth_flow(self, client, test_user_data):
        """
        Test E2E completo del flujo de autenticación:
        1. Registrar usuario
        2. Login con credenciales
        3. Obtener perfil con token
        4. Verificar datos del usuario
        """
        # 1. Registrar nuevo usuario
        register_response = client.post("/auth/register", json=test_user_data)

        assert register_response.status_code == 201
        user_data = register_response.json()
        assert user_data["email"] == test_user_data["email"]
        assert user_data["username"] == test_user_data["username"]
        assert "id" in user_data
        assert "password" not in user_data  # No debe exponer password

        # 2. Login con credenciales correctas
        login_response = client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })

        assert login_response.status_code == 200
        token_data = login_response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"

        # 3. Obtener perfil del usuario autenticado
        access_token = token_data["access_token"]
        profile_response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert profile_response.status_code == 200
        profile = profile_response.json()
        assert profile["email"] == test_user_data["email"]
        assert profile["username"] == test_user_data["username"]
        assert profile["is_active"] is True
        assert "storage_quota_bytes" in profile
        assert "storage_used_bytes" in profile

    def test_register_duplicate_email_fails(self, client, test_user_data):
        """Debe fallar al registrar email duplicado"""
        # Primer registro exitoso
        response1 = client.post("/auth/register", json=test_user_data)
        assert response1.status_code == 201

        # Segundo registro con mismo email debe fallar
        response2 = client.post("/auth/register", json=test_user_data)
        assert response2.status_code == 400
        # Mensaje puede estar en español o inglés
        detail = response2.json()["detail"].lower()
        assert "already" in detail or "ya está registrado" in detail or "registrado" in detail

    def test_login_with_wrong_password_fails(self, client, test_user_data):
        """Debe fallar login con contraseña incorrecta"""
        # Registrar usuario
        client.post("/auth/register", json=test_user_data)

        # Intentar login con contraseña incorrecta
        login_response = client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": "WrongPassword123!"
        })

        assert login_response.status_code == 401
        # Mensaje puede estar en español o inglés
        detail = login_response.json()["detail"].lower()
        assert "invalid" in detail or "inválidas" in detail or "credenciales" in detail

    def test_login_with_nonexistent_email_fails(self, client):
        """Debe fallar login con email no registrado"""
        login_response = client.post("/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        })

        assert login_response.status_code == 401

    def test_access_protected_route_without_token_fails(self, client):
        """Debe denegar acceso a rutas protegidas sin token"""
        response = client.get("/auth/me")
        # Puede ser 401 (Unauthorized) o 403 (Forbidden) dependiendo de la implementación
        assert response.status_code in [401, 403]

    def test_access_protected_route_with_invalid_token_fails(self, client):
        """Debe denegar acceso con token inválido"""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 401

    def test_register_with_weak_password_fails(self, client):
        """Debe rechazar contraseñas débiles (solo valida longitud mínima por ahora)"""
        weak_passwords = [
            "short",    # 5 chars - Muy corta (min=8)
            "1234567",  # 7 chars - Muy corta (min=8)
        ]

        for weak_pass in weak_passwords:
            response = client.post("/auth/register", json={
                "email": f"test_{weak_pass}@example.com",
                "username": f"user_{weak_pass}",
                "password": weak_pass
            })

            # Debe fallar validación (422) o regla de negocio (400)
            assert response.status_code in [400, 422], \
                f"Password '{weak_pass}' debería ser rechazada (muy corta)"

    def test_register_with_invalid_email_fails(self, client):
        """Debe rechazar emails inválidos"""
        invalid_emails = [
            "not-an-email",
            "@example.com",
            "user@",
            "user space@example.com",
        ]

        for invalid_email in invalid_emails:
            response = client.post("/auth/register", json={
                "email": invalid_email,
                "username": "testuser",
                "password": "ValidPassword123!"
            })

            # Pydantic valida antes de llegar al router
            assert response.status_code == 422, \
                f"Email '{invalid_email}' debería ser rechazado"
