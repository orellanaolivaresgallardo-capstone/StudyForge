# Documentación de Testing - StudyForge

## 📋 Tabla de Contenidos

### General
1. [Visión General](#visión-general)
2. [Filosofía de Testing](#filosofía-de-testing)

### Backend (Python/FastAPI)
3. [Backend: Estructura de Tests](#backend-estructura-de-tests)
4. [Backend: Configuración del Entorno](#backend-configuración-del-entorno)
5. [Backend: Ejecutar Tests](#backend-ejecutar-tests)
6. [Backend: Escribir Tests](#backend-escribir-tests)
7. [Backend: Fixtures Compartidas](#backend-fixtures-compartidas)
8. [Backend: Cobertura de Código](#backend-cobertura-de-código)
9. [Backend: Best Practices](#backend-best-practices)

### Frontend (React/TypeScript)
10. [Frontend: Estructura de Tests](#frontend-estructura-de-tests)
11. [Frontend: Configuración del Entorno](#frontend-configuración-del-entorno)
12. [Frontend: Ejecutar Tests](#frontend-ejecutar-tests)
13. [Frontend: Escribir Tests](#frontend-escribir-tests)
14. [Frontend: Mocking y Test Utils](#frontend-mocking-y-test-utils)
15. [Frontend: Cobertura de Código](#frontend-cobertura-de-código)
16. [Frontend: Best Practices](#frontend-best-practices)

### CI/CD
17. [Integración Continua](#integración-continua)
18. [Comandos de Referencia Rápida](#comandos-de-referencia-rápida)

---

## Visión General

StudyForge implementa una estrategia de testing completa tanto en **backend** como en **frontend**:

### Backend Stack
- **pytest**: Framework principal de testing
- **pytest-asyncio**: Soporte para tests asíncronos
- **pytest-cov**: Medición de cobertura de código
- **unittest.mock**: Mocking y stubbing
- **FastAPI TestClient**: Cliente de pruebas para endpoints HTTP

Tests para todas las capas de la arquitectura:
- **Routers** (endpoints HTTP)
- **Services** (lógica de negocio)
- **Repositories** (acceso a datos)
- **Core** (seguridad, validación, logging)

### Frontend Stack
- **Vitest**: Framework de testing moderno (compatible con Vite)
- **React Testing Library**: Testing de componentes React
- **@testing-library/user-event**: Simulación de interacciones de usuario
- **@testing-library/jest-dom**: Matchers personalizados para DOM
- **axios-mock-adapter**: Mocking de peticiones HTTP
- **MSW (Mock Service Worker)**: Mocking avanzado de APIs

Tests para:
- **Componentes UI** (LoadingSpinner, Modal, Toast, EmptyState)
- **Componentes de Features** (QuizCard, QuotaWidget)
- **Context/Estado** (AuthContext)
- **Servicios API** (auth, documents, summaries, quizzes, etc.)
- **Utilidades** (errorHandler)
- **Rutas Protegidas** (ProtectedRoute)

---

## Filosofía de Testing

### Principios

1. **Test-Driven Quality**: Cada funcionalidad debe tener tests que validen su comportamiento
2. **Isolation**: Los tests deben ser independientes y no depender de estado compartido
3. **Fast Feedback**: Los tests deben ejecutarse rápidamente para facilitar el desarrollo
4. **Readable Tests**: Los tests deben ser fáciles de leer y entender
5. **Coverage**: Objetivo de >90% de cobertura en módulos críticos

### Pirámide de Testing

```
        /\
       /  \      E2E Tests (Futuro)
      /    \     - Tests end-to-end completos
     /------\
    /        \   Integration Tests
   /          \  - Tests de flujos completos
  /------------\
 /              \ Unit Tests
/________________\- Tests de componentes aislados
```

Actualmente el proyecto se enfoca en **tests unitarios** con algunos **tests de integración** para flujos críticos.

---

## Backend: Estructura de Tests

### Organización de Directorios

```
backend/
├── tests/
│   ├── conftest.py              # Fixtures compartidas globales
│   ├── pytest.ini               # Configuración de pytest (en backend/)
│   │
│   ├── unit/                    # Tests unitarios
│   │   ├── test_core/           # Tests de módulos core
│   │   │   ├── test_security.py        # Hashing, JWT, autenticación
│   │   │   ├── test_file_validator.py  # Validación de archivos
│   │   │   ├── test_logging.py         # Sistema de logging
│   │   │   └── test_dependencies.py    # Dependencias FastAPI
│   │   │
│   │   ├── test_routers/        # Tests de endpoints HTTP
│   │   │   ├── test_auth_router.py
│   │   │   ├── test_documents_router.py
│   │   │   ├── test_summaries_router.py
│   │   │   ├── test_quizzes_router.py
│   │   │   ├── test_quiz_attempts_router.py
│   │   │   ├── test_study_spaces_router.py
│   │   │   └── test_stats_router.py
│   │   │
│   │   ├── test_services/       # Tests de lógica de negocio
│   │   │   ├── test_auth_service.py
│   │   │   ├── test_file_processor.py
│   │   │   ├── test_openai_service.py
│   │   │   ├── test_summary_service.py
│   │   │   ├── test_quiz_service.py
│   │   │   ├── test_study_space_service.py
│   │   │   └── test_deletion_service.py
│   │   │
│   │   └── test_repositories/   # Tests de acceso a datos
│   │       ├── test_user_repository.py
│   │       ├── test_document_repository.py
│   │       ├── test_summary_repository.py
│   │       ├── test_quiz_repository.py
│   │       ├── test_quiz_attempt_repository.py
│   │       └── test_study_space_repository.py
│   │
│   ├── integration/             # Tests de integración
│   │   └── test_study_spaces_integration.py
│   │
│   └── test_*.py                # Tests específicos de funcionalidades
│       ├── test_auth_me.py
│       ├── test_rate_limiter.py
│       ├── test_documents_guard.py
│       └── test_topic_cleanup.py
```

### Convenciones de Nombres

- **Archivos**: `test_<module_name>.py`
- **Clases**: `Test<FeatureName>` (opcional, usualmente no se usan)
- **Funciones**: `test_<feature>_<scenario>()`

**Ejemplos:**
```python
# ✅ Buenos nombres de tests
def test_hash_password_returns_string()
def test_register_duplicate_email()
def test_create_summary_with_invalid_expertise_level()

# ❌ Malos nombres
def test1()
def test_user()
def test()
```

---

## Backend: Configuración del Entorno

### 1. Instalar Dependencias

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

Las dependencias de testing ya están incluidas en `requirements.txt`:

```txt
# Testing
pytest==8.3.4
pytest-asyncio==0.25.2
pytest-cov==6.0.0
```

### 2. Configuración de pytest

El archivo `backend/pytest.ini` contiene la configuración de pytest:

```ini
[pytest]
pythonpath = .
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

# Coverage settings
addopts =
    -v
    --strict-markers
    --tb=short

# Asyncio configuration
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function

# Warnings
filterwarnings =
    ignore::sqlalchemy.exc.MovedIn20Warning
    ignore::pydantic.warnings.PydanticDeprecatedSince20
```

**Explicación:**
- `pythonpath = .`: Permite importar módulos desde `app/`
- `testpaths = tests`: Directorio donde buscar tests
- `asyncio_mode = auto`: Detecta automáticamente tests async
- `--strict-markers`: Falla si se usan markers no declarados
- `--tb=short`: Tracebacks cortos para mejor legibilidad

---

## Backend: Ejecutar Tests

### Comandos Básicos

```bash
# Ejecutar todos los tests
cd backend
pytest

# Ejecutar con verbose
pytest -v

# Ejecutar tests específicos
pytest tests/unit/test_core/test_security.py
pytest tests/unit/test_routers/

# Ejecutar un test específico
pytest tests/unit/test_core/test_security.py::test_hash_password_returns_string

# Ejecutar tests que coincidan con un patrón
pytest -k "auth"
pytest -k "test_register"
```

### Tests con Cobertura

```bash
# Ejecutar con reporte de cobertura
pytest --cov=app --cov-report=term-missing

# Generar reporte HTML
pytest --cov=app --cov-report=html

# Ver reporte HTML
# El reporte se genera en htmlcov/index.html
```

### Opciones Útiles

```bash
# Detener en el primer fallo
pytest -x

# Mostrar print statements
pytest -s

# Ejecutar tests en paralelo (requiere pytest-xdist)
pytest -n auto

# Ejecutar solo tests que fallaron la última vez
pytest --lf

# Modo verbose con salida completa
pytest -vv

# Ejecutar tests marcados
pytest -m "slow"  # Requiere markers declarados
```

---

## Backend: Escribir Tests

### 1. Tests Unitarios de Funciones Puras

**Ejemplo: Testing de funciones de seguridad**

```python
# tests/unit/test_core/test_security.py
from app.core.security import hash_password, verify_password

def test_hash_password_returns_string():
    """Hash debe retornar un string"""
    hashed = hash_password("mypassword123")

    assert isinstance(hashed, str)
    assert len(hashed) > 50

def test_verify_password_correct():
    """Verificar password correcto retorna True"""
    password = "mypassword123"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True
```

### 2. Tests con Mocking

**Ejemplo: Testing de routers con servicios mockeados**

```python
# tests/unit/test_routers/test_auth_router.py
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def fake_user():
    user = Mock()
    user.id = uuid4()
    user.email = "test@example.com"
    user.username = "testuser"
    return user

@patch('app.routers.auth.AuthService.register')
def test_register_success(mock_register, client, fake_user):
    """Debe registrar usuario exitosamente"""
    mock_register.return_value = fake_user

    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "SecurePass123!"
    }

    response = client.post("/auth/register", json=user_data)

    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"
    mock_register.assert_called_once()
```

### 3. Tests Asíncronos

**Ejemplo: Testing de servicios async**

```python
# tests/unit/test_services/test_summary_service.py
import pytest
from unittest.mock import AsyncMock, Mock

@pytest.mark.asyncio
async def test_create_summary_async():
    """Test de servicio asíncrono"""
    mock_repo = Mock()
    mock_repo.create = AsyncMock(return_value=fake_summary)

    service = SummaryService()
    result = await service.create_summary(user_id, document_ids)

    assert result.id == fake_summary.id
    mock_repo.create.assert_called_once()
```

### 4. Tests de Repositorios (con DB Mock)

**Ejemplo: Testing de QuizAttemptRepository**

```python
# tests/unit/test_repositories/test_quiz_attempt_repository.py
from app.repositories.quiz_attempt_repository import QuizAttemptRepository

def test_randomize_options_structure():
    """Verifica estructura de salida correcta"""
    questions = [
        {
            "question": "What is 2+2?",
            "options": {
                "correct": "4",
                "semi-correct": "3",
                "incorrect1": "5",
                "incorrect2": "6"
            },
            "explanation": "Basic math"
        }
    ]

    correct_answers, randomized_questions = \
        QuizAttemptRepository._randomize_options(questions)

    assert len(correct_answers) == 1
    assert correct_answers[0] in ['A', 'B', 'C', 'D']
    assert len(randomized_questions[0]['options']) == 4
```

### 5. Tests de Validación (Pydantic)

```python
def test_register_invalid_email(client):
    """Debe fallar con email inválido"""
    user_data = {
        "email": "not-an-email",
        "username": "testuser",
        "password": "SecurePass123!"
    }

    response = client.post("/auth/register", json=user_data)

    # Pydantic valida antes de llegar al router
    assert response.status_code == 422
    assert "email" in response.json()["detail"][0]["loc"]
```

---

## Backend: Fixtures Compartidas

### Fixtures en conftest.py

El archivo `tests/conftest.py` contiene fixtures compartidas por todos los tests:

```python
# tests/conftest.py
import pytest
from uuid import uuid4
from unittest.mock import Mock
from datetime import datetime

@pytest.fixture
def fake_user():
    """Usuario fake con cuota de almacenamiento"""
    user = Mock()
    user.id = uuid4()
    user.email = "test@studyforge.com"
    user.storage_quota_bytes = 10_000_000  # 10 MB
    user.storage_used_bytes = 0
    user.max_file_size_bytes = 5_000_000  # 5 MB
    return user

@pytest.fixture
def fake_document(fake_user):
    """Documento fake con texto extraído"""
    doc = Mock()
    doc.id = uuid4()
    doc.user_id = fake_user.id
    doc.title = "Test Document"
    doc.file_name = "test.pdf"
    doc.file_type = "pdf"
    doc.file_size_bytes = 1024
    doc.extracted_text = "This is extracted text. " * 10
    doc.created_at = datetime.now()
    doc.updated_at = datetime.now()
    doc.study_spaces = []
    return doc

@pytest.fixture
def fake_study_space(fake_user):
    """Study space fake con relaciones vacías"""
    space = Mock()
    space.id = uuid4()
    space.user_id = fake_user.id
    space.name = "Test Space"
    space.description = "Test description"
    space.color = "#8B5CF6"
    space.created_at = datetime.now()
    space.updated_at = datetime.now()
    space.documents = []
    space.summaries = []
    return space

@pytest.fixture
def fake_summary(fake_user, fake_study_space):
    """Resumen fake con JSONB content y denormalized fields"""
    summary = Mock()
    summary.id = uuid4()
    summary.user_id = fake_user.id
    summary.document_id = uuid4()  # Nullable FK (can be None if document deleted)
    summary.study_space_id = fake_study_space.id  # Required FK (NOT NULL, CASCADE)
    summary.title = "Test Summary"
    summary.content = {
        "summary": "Test summary content",
        "full_data": {"title": "Test", "summary": "..."}
    }
    summary.expertise_level = "medio"
    summary.topics = ["test", "topic"]
    summary.key_concepts = [
        {"concept": "Test", "definition": "A test concept"}
    ]
    # Denormalized cache fields (preservación histórica)
    summary.source_document_title = "Test Document"
    summary.source_document_filename = "test.pdf"
    summary.document_state = "active_in_space"  # Estados: 'active_in_space' | 'removed_from_space' | 'permanently_deleted'
    summary.created_at = datetime.now()
    summary.updated_at = datetime.now()
    summary.study_space = fake_study_space
    return summary

@pytest.fixture
def fake_quiz(fake_user, fake_study_space):
    """Quiz fake con preguntas y source tracking"""
    quiz = Mock()
    quiz.id = uuid4()
    quiz.user_id = fake_user.id
    quiz.study_space_id = fake_study_space.id  # Required FK (NOT NULL, CASCADE)
    quiz.source_type = "study_space"  # 'document' | 'summary' | 'study_space'
    quiz.title = "Test Quiz"
    quiz.difficulty_level = 3
    quiz.questions = [
        {
            "question": "Test question?",
            "options": {
                "correct": "A",
                "semi-correct": "B",
                "incorrect1": "C",
                "incorrect2": "D"
            },
            "explanation": "Test explanation"
        }
    ]
    # Source tracking fields (nullable, SET NULL on delete)
    quiz.source_document_id = None
    quiz.source_summary_id = None
    # Denormalized cache fields (JSONB)
    quiz.source_names = {"space": "Test Space"}
    quiz.source_metadata = {"summary_count": 0}
    quiz.created_at = datetime.now()
    quiz.study_space = fake_study_space
    return quiz

@pytest.fixture
def fake_db():
    """Mock de database session"""
    db = Mock()
    db.commit = Mock()
    db.refresh = Mock()
    return db
```

### Usar Fixtures en Tests

```python
def test_create_document(fake_user, fake_db):
    """Test usando fixtures compartidas"""
    service = DocumentService()
    doc = service.create_document(fake_user.id, "test.pdf", fake_db)

    assert doc.user_id == fake_user.id
    fake_db.commit.assert_called_once()
```

### Fixtures Locales

También puedes crear fixtures específicas para un archivo de tests:

```python
# tests/unit/test_routers/test_auth_router.py

@pytest.fixture
def client():
    """Cliente de prueba (fixture local)"""
    return TestClient(app)
```

---

## Backend: Cobertura de Código

### Estado Actual de Cobertura

Según los commits recientes, se ha logrado una cobertura excelente:

| Módulo | Cobertura Anterior | Cobertura Actual |
|--------|-------------------|------------------|
| `documents router` | 33% | **99%** |
| `auth router` | 80% | **100%** |
| `security (core)` | 59% | **100%** |
| `file_validator` | 50% | **100%** |
| `quiz_attempt_repository` | - | **Mejorado (24 tests)** |
| **Core module** | - | **100%** |

### Medir Cobertura

```bash
# Reporte en terminal
pytest --cov=app --cov-report=term-missing

# Generar HTML
pytest --cov=app --cov-report=html
open htmlcov/index.html  # Mac
start htmlcov/index.html  # Windows

# Fallar si cobertura es menor a 90%
pytest --cov=app --cov-fail-under=90
```

### Interpretar Reportes

```bash
pytest --cov=app --cov-report=term-missing
```

**Salida esperada:**
```
Name                                Stmts   Miss  Cover   Missing
-----------------------------------------------------------------
app/core/security.py                   45      0   100%
app/core/file_validator.py             32      0   100%
app/routers/auth.py                    78      0   100%
app/routers/documents.py               92      1    99%   145
app/services/auth_service.py          105     12    89%   78-82, 95-102
-----------------------------------------------------------------
TOTAL                                1247     45    96%
```

- **Stmts**: Número de líneas de código
- **Miss**: Líneas no cubiertas
- **Cover**: Porcentaje de cobertura
- **Missing**: Números de línea no cubiertos

### Objetivos de Cobertura

- **Módulos Core**: 100% (seguridad, validación)
- **Routers**: >95% (todos los endpoints críticos)
- **Services**: >90% (lógica de negocio)
- **Repositories**: >85% (métodos CRUD principales)
- **Total del proyecto**: >90%

---

## Backend: Best Practices

### 1. Nombres Descriptivos

```python
# ✅ Buen nombre
def test_create_summary_raises_error_when_quota_exceeded():
    pass

# ❌ Mal nombre
def test_summary_error():
    pass
```

### 2. Arrange-Act-Assert (AAA Pattern)

```python
def test_verify_password_correct():
    # Arrange
    password = "mypassword123"
    hashed = hash_password(password)

    # Act
    result = verify_password(password, hashed)

    # Assert
    assert result is True
```

### 3. Un Test, Un Concepto

```python
# ✅ Tests separados
def test_hash_password_returns_string():
    assert isinstance(hash_password("pass"), str)

def test_hash_password_not_equal_to_input():
    assert hash_password("pass") != "pass"

# ❌ Test que valida múltiples cosas
def test_hash_password():
    hashed = hash_password("pass")
    assert isinstance(hashed, str)
    assert hashed != "pass"
    assert len(hashed) > 50
    # ... más assertions
```

### 4. Mocking Efectivo

```python
# ✅ Mock solo dependencias externas
@patch('app.routers.auth.AuthService.register')
def test_register(mock_register, client):
    mock_register.return_value = fake_user
    response = client.post("/auth/register", json=data)
    assert response.status_code == 201

# ❌ No mockear el código que estás testeando
@patch('app.core.security.hash_password')
def test_hash_password(mock_hash):
    # Esto no tiene sentido - estás mockeando lo que quieres testear
    pass
```

### 5. Tests Independientes

```python
# ✅ Tests independientes
def test_a():
    user = create_test_user()
    assert user.email == "test@example.com"

def test_b():
    user = create_test_user()
    assert user.is_active is True

# ❌ Tests que dependen de estado compartido
shared_user = None

def test_a():
    global shared_user
    shared_user = create_test_user()

def test_b():
    # Depende de que test_a se ejecute primero
    assert shared_user.is_active is True
```

### 6. Testing de Excepciones

```python
import pytest

def test_register_raises_error_duplicate_email():
    """Test que verifica que se lanza una excepción"""
    with pytest.raises(HTTPException) as exc_info:
        service.register(email="existing@example.com", ...)

    assert exc_info.value.status_code == 400
    assert "already registered" in str(exc_info.value.detail)
```

### 7. Parametrización de Tests

```python
@pytest.mark.parametrize("password,expected", [
    ("short", False),
    ("NoNumber!", False),
    ("nonumber123", False),
    ("ValidPass123!", True),
])
def test_password_validation(password, expected):
    result = is_valid_password(password)
    assert result == expected
```

### 8. Docstrings en Tests

```python
def test_create_summary_with_multiple_documents():
    """
    Verifica que se puede crear un resumen combinando
    múltiples documentos del mismo usuario.

    Caso de prueba:
    - Usuario con 3 documentos
    - Todos los documentos tienen texto extraído
    - Se genera un resumen de nivel 'medio'
    """
    # ... test code
```

---

## Frontend: Estructura de Tests

### Organización de Directorios

```
frontend/
├── tests/
│   ├── test/
│   │   └── setup.ts             # Configuración global de tests
│   │
│   └── unit/                    # Tests unitarios
│       ├── components/          # Tests de componentes
│       │   ├── ui/              # Componentes UI reutilizables
│       │   │   ├── LoadingSpinner.test.tsx
│       │   │   ├── Toast.test.tsx
│       │   │   ├── Modal.test.tsx
│       │   │   └── EmptyState.test.tsx
│       │   │
│       │   ├── auth/            # Componentes de autenticación
│       │   │   └── ProtectedRoute.test.tsx
│       │   │
│       │   └── features/        # Componentes de features
│       │       ├── QuizCard.test.tsx
│       │       └── QuotaWidget.test.tsx
│       │
│       ├── context/             # Tests de Context API
│       │   └── AuthContext.test.tsx
│       │
│       ├── services/            # Tests de servicios
│       │   └── api/             # Tests de API clients
│       │       ├── client.test.ts
│       │       ├── auth.api.test.ts
│       │       ├── documents.api.test.ts
│       │       ├── summaries.api.test.ts
│       │       ├── quizzes.api.test.ts
│       │       ├── quiz-attempts.api.test.ts
│       │       └── study-spaces.api.test.ts
│       │
│       └── utils/               # Tests de utilidades
│           └── errorHandler.test.ts
│
├── vitest.config.ts             # Configuración de Vitest
└── package.json                 # Scripts de testing
```

### Convenciones de Nombres

- **Archivos**: `<ComponentName>.test.tsx` o `<module>.test.ts`
- **Suites**: `describe('<ComponentName>')`
- **Tests**: `it('debe comportarse de cierta manera')`

**Ejemplos:**
```typescript
// ✅ Buenos nombres
describe('LoadingSpinner', () => {
  it('debe renderizar el spinner')
  it('debe usar tamaño medium por defecto')
  it('debe mostrar mensaje cuando se proporciona')
})

// ❌ Malos nombres
describe('Test1', () => {
  it('works')
  it('test')
})
```

---

## Frontend: Configuración del Entorno

### 1. Instalar Dependencias

```bash
cd frontend
pnpm install
```

Las dependencias de testing ya están incluidas en `package.json`:

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@vitest/coverage-v8": "^4.0.14",
    "@vitest/ui": "^4.0.14",
    "axios-mock-adapter": "^2.1.0",
    "jsdom": "^27.2.0",
    "msw": "^2.12.3",
    "vitest": "^4.0.14"
  }
}
```

### 2. Configuración de Vitest

El archivo `vitest.config.ts` contiene la configuración:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      all: true,
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Explicación:**
- `globals: true`: Permite usar `describe`, `it`, `expect` sin importarlos
- `environment: 'jsdom'`: Simula el DOM del navegador
- `setupFiles`: Archivo de setup que se ejecuta antes de cada test
- `coverage`: Configuración de cobertura con umbrales del 70%
- `alias '@'`: Permite imports como `@/components/...`

### 3. Archivo de Setup (tests/test/setup.ts)

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
})

// Mock window.matchMedia (required for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return [] }
  unobserve() {}
} as any
```

Este archivo:
- Importa matchers de `@testing-library/jest-dom`
- Limpia el DOM después de cada test
- Limpia localStorage y sessionStorage
- Mockea APIs del navegador que no existen en jsdom

---

## Frontend: Ejecutar Tests

### Scripts Disponibles

```bash
# Ejecutar tests en modo watch
pnpm test

# Ejecutar tests una vez (CI)
pnpm test:run

# Ejecutar con interfaz UI
pnpm test:ui

# Ejecutar con reporte de cobertura
pnpm test:coverage
```

### Comandos Vitest Útiles

```bash
# Modo watch (por defecto)
vitest

# Ejecutar una vez y salir
vitest run

# Ejecutar solo archivos que cambiaron
vitest --changed

# Ejecutar tests que coincidan con un patrón
vitest AuthContext

# Ejecutar con UI interactiva
vitest --ui

# Ver cobertura en browser
vitest --coverage --ui

# Modo verbose
vitest --reporter=verbose

# Solo tests relacionados con archivos cambiados (git)
vitest --related

# Actualizar snapshots (si se usan)
vitest -u
```

### Opciones de Cobertura

```bash
# Generar reporte de cobertura
pnpm test:coverage

# El reporte HTML se genera en coverage/
# Abrir con navegador
open coverage/index.html  # Mac
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

---

## Frontend: Escribir Tests

### 1. Tests de Componentes UI

**Ejemplo: Testing de LoadingSpinner**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

describe('LoadingSpinner', () => {
  describe('Renderizado básico', () => {
    it('debe renderizar el spinner', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('debe usar tamaño medium por defecto', () => {
      const { container } = render(<LoadingSpinner />)

      const spinner = container.querySelector('.h-12.w-12')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Props', () => {
    it('debe mostrar mensaje cuando se proporciona', () => {
      render(<LoadingSpinner message="Cargando datos..." />)

      expect(screen.getByText('Cargando datos...')).toBeInTheDocument()
    })

    it('debe aplicar tamaño correcto', () => {
      const { container } = render(<LoadingSpinner size="lg" />)

      const spinner = container.querySelector('.h-16.w-16')
      expect(spinner).toBeInTheDocument()
    })
  })
})
```

### 2. Tests de Context/Hooks

**Ejemplo: Testing de AuthContext**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import * as apiModule from '@/services/api'

// Mock del módulo de API
vi.mock('@/services/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getToken: vi.fn(),
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(apiModule.getToken).mockReturnValue(null)
  })

  it('debe lanzar error cuando se usa fuera de AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })

  it('debe funcionar correctamente dentro de AuthProvider', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  describe('login', () => {
    it('debe hacer login correctamente', async () => {
      const mockToken = { access_token: 'fake-token', token_type: 'bearer' }
      const mockUser = { id: 1, email: 'test@example.com', username: 'test' }

      vi.mocked(apiModule.login).mockResolvedValue(mockToken)
      vi.mocked(apiModule.getCurrentUser).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(apiModule.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })
  })
})
```

### 3. Tests de Rutas Protegidas

**Ejemplo: Testing de ProtectedRoute**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import * as AuthContext from '@/context/AuthContext'

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('ProtectedRoute', () => {
  const renderWithRouter = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={component} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    )
  }

  it('debe mostrar loading cuando isLoading=true', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('debe renderizar contenido cuando está autenticado', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 1, email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
```

### 4. Tests de Servicios API

**Ejemplo: Testing de API Client**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, clearToken } from '@/services/api/client'

describe('API Client - Token Management', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('getToken', () => {
    it('debe retornar token de localStorage si existe', () => {
      localStorage.setItem('sf_token', 'token-from-local')
      expect(getToken()).toBe('token-from-local')
    })

    it('debe priorizar localStorage sobre sessionStorage', () => {
      localStorage.setItem('sf_token', 'token-from-local')
      sessionStorage.setItem('sf_token', 'token-from-session')
      expect(getToken()).toBe('token-from-local')
    })

    it('debe retornar null cuando no hay token', () => {
      expect(getToken()).toBeNull()
    })
  })

  describe('setToken', () => {
    it('debe guardar token en localStorage cuando remember=true', () => {
      setToken('my-token', true)

      expect(localStorage.getItem('sf_token')).toBe('my-token')
      expect(sessionStorage.getItem('sf_token')).toBeNull()
    })

    it('debe guardar token en sessionStorage cuando remember=false', () => {
      setToken('my-token', false)

      expect(sessionStorage.getItem('sf_token')).toBe('my-token')
      expect(localStorage.getItem('sf_token')).toBeNull()
    })
  })

  describe('clearToken', () => {
    it('debe limpiar ambos storages', () => {
      localStorage.setItem('sf_token', 'token-local')
      sessionStorage.setItem('sf_token', 'token-session')

      clearToken()

      expect(localStorage.getItem('sf_token')).toBeNull()
      expect(sessionStorage.getItem('sf_token')).toBeNull()
    })
  })
})
```

### 5. Tests con User Interactions

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from '@/components/ui/Modal'

describe('Modal - User Interactions', () => {
  it('debe cerrar modal al hacer click en botón cerrar', async () => {
    const user = userEvent.setup()
    const onCloseMock = vi.fn()

    render(
      <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    )

    const closeButton = screen.getByRole('button', { name: /cerrar/i })
    await user.click(closeButton)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it('debe cerrar modal al presionar Escape', async () => {
    const user = userEvent.setup()
    const onCloseMock = vi.fn()

    render(
      <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    )

    await user.keyboard('{Escape}')

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})
```

---

## Frontend: Mocking y Test Utils

### 1. Mocking de Módulos con vi.mock()

```typescript
// Mockear módulo completo
vi.mock('@/services/api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUser: vi.fn(),
}))

// Usar mocks
import * as api from '@/services/api'

vi.mocked(api.login).mockResolvedValue({ access_token: 'fake-token' })
```

### 2. Mocking de Axios con axios-mock-adapter

```typescript
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const mockAxios = new MockAdapter(axios)

// Mock GET request
mockAxios.onGet('/api/users').reply(200, { users: [] })

// Mock POST request
mockAxios.onPost('/api/login').reply(200, { token: 'fake-token' })

// Reset mocks
mockAxios.reset()
```

### 3. Mocking con MSW (Mock Service Worker)

```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

// Definir handlers
const handlers = [
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json({ users: [] }))
  }),

  rest.post('/api/login', (req, res, ctx) => {
    return res(ctx.json({ access_token: 'fake-token' }))
  }),
]

// Setup server
const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### 4. Custom Render Function

```typescript
// tests/utils/test-utils.tsx
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'

export function renderWithProviders(
  ui: React.ReactElement,
  options = {}
) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>,
    options
  )
}

// Uso
import { renderWithProviders } from '@/tests/utils/test-utils'

renderWithProviders(<MyComponent />)
```

### 5. Queries Personalizadas

```typescript
// Buscar por texto parcial
screen.getByText(/parcial/i)

// Buscar por role
screen.getByRole('button', { name: /enviar/i })

// Buscar por label
screen.getByLabelText('Email')

// Buscar por placeholder
screen.getByPlaceholderText('Ingresa tu email')

// Buscar por test-id
screen.getByTestId('submit-button')

// Query vs Get vs Find
screen.getByText('Hello')    // Lanza error si no existe
screen.queryByText('Hello')  // Retorna null si no existe
screen.findByText('Hello')   // Async, espera a que aparezca
```

---

## Frontend: Cobertura de Código

### Estado Actual

El proyecto frontend tiene 18 archivos de test cubriendo:

- **Componentes UI**: 4 tests (LoadingSpinner, Toast, Modal, EmptyState)
- **Componentes Features**: 2 tests (QuizCard, QuotaWidget)
- **Context**: 1 test (AuthContext - 474 líneas, muy completo)
- **Servicios API**: 6 tests (client, auth, documents, summaries, quizzes, quiz-attempts, study-spaces)
- **Auth**: 1 test (ProtectedRoute)
- **Utils**: 1 test (errorHandler)

### Medir Cobertura

```bash
# Generar reporte de cobertura
cd frontend
pnpm test:coverage

# Ver reporte HTML
open coverage/index.html
```

### Interpretar Reportes

Vitest genera reportes en múltiples formatos:

1. **Terminal (text)**: Reporte en consola
2. **HTML**: Navegable en browser
3. **LCOV**: Para herramientas de CI/CD

**Ejemplo de salida:**
```
 % Coverage report from v8
----------------------------|---------|----------|---------|---------|
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
All files                   |   72.45 |    68.23 |   75.89 |   72.45 |
 components/ui              |   95.12 |    92.31 |   100   |   95.12 |
  LoadingSpinner.tsx        |   100   |    100   |   100   |   100   |
  Modal.tsx                 |   92.50 |    87.50 |   100   |   92.50 |
 context                    |   88.24 |    82.35 |   90.91 |   88.24 |
  AuthContext.tsx           |   88.24 |    82.35 |   90.91 |   88.24 |
 services/api               |   65.22 |    55.56 |   70.00 |   65.22 |
  client.ts                 |   100   |    100   |   100   |   100   |
  auth.api.ts               |   80.00 |    75.00 |   85.71 |   80.00 |
----------------------------|---------|----------|---------|---------|
```

### Objetivos de Cobertura

Según `vitest.config.ts`, los umbrales mínimos son:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

**Objetivos recomendados por tipo:**
- **Componentes UI críticos**: >90%
- **Context/Estado**: >85%
- **Servicios API**: >80%
- **Utils/Helpers**: >90%
- **Total del proyecto**: >75%

### Excluir Archivos de Cobertura

Ya configurado en `vitest.config.ts`:
```typescript
coverage: {
  exclude: [
    'node_modules/',
    'tests/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/dist/**',
    'src/main.tsx',
    'src/vite-env.d.ts',
  ]
}
```

---

## Frontend: Best Practices

### 1. Queries Semánticas

```typescript
// ✅ Usar queries semánticas (por orden de prioridad)
screen.getByRole('button', { name: /enviar/i })
screen.getByLabelText('Email')
screen.getByPlaceholderText('Buscar...')
screen.getByText('Iniciar sesión')

// ❌ Evitar queries frágiles
screen.getByTestId('submit-btn')
container.querySelector('.submit-button')
```

### 2. Esperar Cambios Asíncronos

```typescript
// ✅ Usar waitFor para cambios asíncronos
await waitFor(() => {
  expect(screen.getByText('Datos cargados')).toBeInTheDocument()
})

// ✅ Usar findBy para elementos que aparecen después
const element = await screen.findByText('Nuevo mensaje')

// ❌ No usar delays arbitrarios
await new Promise(resolve => setTimeout(resolve, 1000))
```

### 3. User Events vs FireEvent

```typescript
// ✅ Usar @testing-library/user-event (simula comportamiento real)
import userEvent from '@testing-library/user-event'

const user = userEvent.setup()
await user.click(button)
await user.type(input, 'texto')

// ❌ Evitar fireEvent (muy bajo nivel)
import { fireEvent } from '@testing-library/react'
fireEvent.click(button)
```

### 4. Cleanup Automático

```typescript
// ✅ Cleanup automático (configurado en setup.ts)
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
})

// No necesitas llamar cleanup() manualmente en cada test
```

### 5. Testing de Errores de Console

```typescript
// ✅ Suprimir console.error esperado
it('debe lanzar error', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  expect(() => {
    renderHook(() => useAuth())
  }).toThrow('useAuth must be used within an AuthProvider')

  consoleSpy.mockRestore()
})
```

### 6. Arrange-Act-Assert (AAA)

```typescript
it('debe actualizar el contador al hacer click', async () => {
  // Arrange
  const user = userEvent.setup()
  render(<Counter />)

  // Act
  const button = screen.getByRole('button', { name: /incrementar/i })
  await user.click(button)

  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

### 7. Tests Descriptivos

```typescript
// ✅ Nombres descriptivos que explican el comportamiento
describe('Modal', () => {
  it('debe cerrar modal al hacer click en botón cerrar')
  it('debe cerrar modal al presionar Escape')
  it('debe prevenir scroll del body cuando está abierto')
  it('debe enfocar primer elemento focusable al abrir')
})

// ❌ Nombres vagos
describe('Modal', () => {
  it('works')
  it('closes')
  it('test 1')
})
```

### 8. No Testear Detalles de Implementación

```typescript
// ✅ Testear comportamiento del usuario
it('debe mostrar mensaje de error al enviar sin email', async () => {
  const user = userEvent.setup()
  render(<LoginForm />)

  await user.click(screen.getByRole('button', { name: /enviar/i }))

  expect(screen.getByText('Email es requerido')).toBeInTheDocument()
})

// ❌ Testear state interno
it('debe establecer emailError en true', () => {
  // No testear implementación interna
})
```

---

## Integración Continua

### Configuración de CI/CD (Próximamente)

**Archivo `.github/workflows/tests.yml`** (ejemplo para backend y frontend):

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    name: Backend Tests (Python)
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: studyforge_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.14'

      - name: Cache Python dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('backend/requirements.txt') }}

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Run backend tests with coverage
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=term --cov-fail-under=90
        env:
          DATABASE_URL: postgresql+psycopg://postgres:testpass@localhost/studyforge_test
          SECRET_KEY: test-secret-key
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Upload backend coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
          flags: backend
          fail_ci_if_error: true

  frontend-tests:
    name: Frontend Tests (React/TypeScript)
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '24'
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install dependencies
        run: |
          cd frontend
          pnpm install --frozen-lockfile

      - name: Run frontend tests with coverage
        run: |
          cd frontend
          pnpm test:coverage
        env:
          CI: true

      - name: Upload frontend coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./frontend/coverage/lcov.info
          flags: frontend
          fail_ci_if_error: true

      - name: Upload coverage report as artifact
        uses: actions/upload-artifact@v3
        with:
          name: frontend-coverage
          path: frontend/coverage/
```

### Pre-commit Hooks (Recomendado)

**Archivo `.pre-commit-config.yaml`**:

```yaml
repos:
  - repo: local
    hooks:
      - id: backend-tests
        name: Backend Tests (pytest)
        entry: bash -c 'cd backend && pytest --maxfail=1'
        language: system
        pass_filenames: false
        always_run: true

      - id: frontend-tests
        name: Frontend Tests (vitest)
        entry: bash -c 'cd frontend && pnpm test:run'
        language: system
        pass_filenames: false
        always_run: true
```

---

## Comandos de Referencia Rápida

### Backend (pytest)

```bash
cd backend

# Ejecutar todos los tests
pytest

# Tests con cobertura
pytest --cov=app --cov-report=term-missing

# Tests específicos
pytest tests/unit/test_core/
pytest tests/unit/test_routers/test_auth_router.py
pytest -k "auth"

# Verbose + mostrar prints
pytest -vv -s

# Detener en primer fallo
pytest -x

# Solo tests que fallaron
pytest --lf

# Generar HTML de cobertura
pytest --cov=app --cov-report=html
```

### Frontend (vitest)

```bash
cd frontend

# Ejecutar en modo watch
pnpm test

# Ejecutar una vez (CI)
pnpm test:run

# Con UI interactiva
pnpm test:ui

# Con cobertura
pnpm test:coverage

# Ejecutar test específico
vitest AuthContext

# Solo archivos cambiados
vitest --changed

# Ver cobertura en browser
vitest --coverage --ui
```

### Ambos (desde raíz del proyecto)

```bash
# Ejecutar backend tests
cd backend && pytest

# Ejecutar frontend tests
cd frontend && pnpm test:run

# Ejecutar ambos secuencialmente
cd backend && pytest && cd ../frontend && pnpm test:run
```

---

## Recursos Adicionales

### Documentación Oficial - Backend

- [Pytest Documentation](https://docs.pytest.org/)
- [Pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [Pytest-cov](https://pytest-cov.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [unittest.mock](https://docs.python.org/3/library/unittest.mock.html)

### Documentación Oficial - Frontend

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Axios Mock Adapter](https://github.com/ctimmerm/axios-mock-adapter)

### Recursos del Proyecto

- [Arquitectura](./ARCHITECTURE.md)
- [API Endpoints](./API.md)
- [Seguridad](./SECURITY.md)
- [Base de Datos](./DATABASE.md)

---

## Contribuir con Tests

### Checklist para Nuevos Tests - Backend

- [ ] Tests unitarios para nueva funcionalidad
- [ ] Tests de casos de error (validación, excepciones)
- [ ] Tests de edge cases (valores límite, null, etc.)
- [ ] Mocking de dependencias externas (DB, APIs)
- [ ] Docstrings descriptivos
- [ ] Nombres de tests claros y descriptivos (test_<feature>_<scenario>)
- [ ] Cobertura >90% en código nuevo
- [ ] Tests pasan localmente: `pytest`
- [ ] No hay warnings de pytest

### Checklist para Nuevos Tests - Frontend

- [ ] Tests unitarios para componentes y funciones
- [ ] Tests de interacciones de usuario (click, type, etc.)
- [ ] Tests de casos de error (formularios inválidos, API errors)
- [ ] Mocking de APIs y contextos externos
- [ ] Queries semánticas (getByRole, getByLabelText)
- [ ] Nombres descriptivos (debe + comportamiento esperado)
- [ ] Cobertura >70% en código nuevo (>90% en críticos)
- [ ] Tests pasan localmente: `pnpm test:run`
- [ ] No testear detalles de implementación (state interno)

---

---

## Resumen Ejecutivo

### Backend
- **Framework**: pytest + pytest-asyncio + pytest-cov
- **Tests**: 31 archivos
- **Cobertura**: ~96% (Core: 100%, Auth: 100%, Documents: 99%)
- **Comando**: `cd backend && pytest --cov=app`

### Frontend
- **Framework**: Vitest + React Testing Library
- **Tests**: 18 archivos
- **Cobertura**: Objetivo 70% (críticos >90%)
- **Comando**: `cd frontend && pnpm test:coverage`

### Ejecución Completa

```bash
# Backend
cd backend && pytest --cov=app --cov-report=term

# Frontend
cd frontend && pnpm test:coverage

# Ambos
cd backend && pytest && cd ../frontend && pnpm test:run
```

---

**Última actualización**: Noviembre 2025
**Cobertura Backend**: ~96% (Core: 100%, Auth: 100%, Documents: 99%)
**Cobertura Frontend**: Objetivo 70%+ (18 archivos de test)
**Total de tests**: 49 archivos (31 backend + 18 frontend)
