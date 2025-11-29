"""
Fixtures para tests de integración E2E.
Estos fixtures usan base de datos real y autenticación completa.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db import Base, get_db
from app.config import settings


# Base de datos de test en memoria (SQLite para tests rápidos)
# SQLite no soporta schemas, así que removemos el schema de todas las tablas
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}  # Solo para SQLite
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Remover schemas de las tablas para compatibilidad con SQLite
for table in Base.metadata.tables.values():
    table.schema = None


@pytest.fixture(scope="function")
def db_session():
    """
    Crea una sesión de base de datos limpia para cada test.
    Crea todas las tablas antes del test y las elimina después.
    """
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Eliminar todas las tablas después del test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Cliente de test con base de datos real.
    Override de la dependencia get_db para usar db_session de test.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # Session ya se cierra en db_session fixture

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Datos de un usuario de prueba"""
    return {
        "email": "testuser@studyforge.com",
        "username": "testuser",
        "password": "SecurePassword123!"
    }


@pytest.fixture
def authenticated_client(client, test_user_data):
    """
    Cliente autenticado con token válido.
    Registra un usuario y retorna cliente con headers de autenticación.
    """
    # Registrar usuario
    register_response = client.post("/auth/register", json=test_user_data)
    assert register_response.status_code == 201

    # Login
    login_response = client.post("/auth/login", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"]
    })
    assert login_response.status_code == 200

    token_data = login_response.json()
    access_token = token_data["access_token"]

    # Retornar cliente con headers de autorización
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {access_token}"
    }

    return client


@pytest.fixture
def sample_text_file():
    """Contenido de un archivo de texto de prueba"""
    return (
        "test_document.txt",
        b"Este es un documento de prueba sobre matematicas. "
        b"Contiene informacion sobre calculo diferencial e integral. "
        b"El teorema fundamental del calculo establece la relacion entre "
        b"la derivacion y la integracion. "
        b"Las derivadas miden tasas de cambio instantaneas. "
        b"Las integrales calculan areas bajo curvas. " * 10,
        "text/plain"
    )


@pytest.fixture
def sample_pdf_content():
    """Contenido de PDF válido para tests"""
    # PDF mínimo válido
    return (
        "test_document.pdf",
        b"%PDF-1.4\n%fake pdf content for testing purposes only\n"
        b"Este es contenido de un PDF de prueba sobre fisica. " * 50,
        "application/pdf"
    )
